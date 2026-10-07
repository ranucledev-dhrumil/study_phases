import './VaultBrowser.css';
import '../CloseConfirmDialog/CloseConfirmDialog.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Markdown } from 'tiptap-markdown';
import { openUrl } from '@tauri-apps/plugin-opener';

// Custom Link extension: renders data-href instead of href so Tauri's OS-level
// link interceptor (triggered by real href attributes) never fires.
const SafeLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    const { href, ...rest } = HTMLAttributes;
    return ['a', { ...rest, 'data-href': href, class: 'safe-link' }, 0];
  },
});


let openUrlCallCount = 0;
const safeOpenUrl = (url: string) => {
  openUrlCallCount++;
  console.log('openUrl called! Count:', openUrlCallCount, 'URL:', url);
  if (openUrlCallCount > 1) {
    console.log('Preventing duplicate openUrl within the same session!');
    // Reset after a short delay
    setTimeout(() => { openUrlCallCount = 0; }, 500);
    return Promise.resolve();
  }
  setTimeout(() => { openUrlCallCount = 0; }, 500);
  return openUrl(url);
};

import type { VaultItem, ContentType } from '../../types';
import { exportAsTxt } from '../../lib/exportMarkdown';
import Spinner from '../Spinner/Spinner';
import TagChipInput from '../TagChipInput/TagChipInput';

import { NoteIcon, CodeIcon, LinkIcon, ImageIcon, FileIcon } from '../Icons/Icons';

const TYPE_LABELS: Record<ContentType, string> = {
  note: 'Note',
  codeSnippet: 'Code',
  link: 'Link',
  image: 'Image',
  file: 'File',
};

function getTypeBadge(type: ContentType) {
  switch (type) {
    case 'codeSnippet':
      return { label: 'Code', icon: <CodeIcon className="vault-badge-icon" />, className: 'badge--code' };
    case 'link':
      return { label: 'Link', icon: <LinkIcon className="vault-badge-icon" />, className: 'badge--link' };
    case 'image':
      return { label: 'Image', icon: <ImageIcon className="vault-badge-icon" />, className: 'badge--image' };
    case 'file':
      return { label: 'File', icon: <FileIcon className="vault-badge-icon" />, className: 'badge--file' };
    case 'note':
    default:
      return { label: 'Note', icon: <NoteIcon className="vault-badge-icon" />, className: 'badge--note' };
  }
}

function formatDate(isoString: string) {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

  function VaultItemRenderer({ body }: { body: string }) {
    const editor = useEditor({
      editable: false,
      extensions: [
        StarterKit,
        SafeLink.configure({ openOnClick: false }),
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        Markdown,
      ],
      editorProps: {
        handleClick(_view, _pos, event) {
          const target = event.target as HTMLElement;
          const link = target.closest('a');
          if (link) {
            let href = link.getAttribute('data-href') || link.getAttribute('href');
            if (href) {
              event.preventDefault();
              event.stopPropagation();
              safeOpenUrl(formatUrl(href)).catch(console.error);
              return true;
            }
          }
          return false;
        },
      },
      content: body,
    });

  useEffect(() => {
    if (editor && (editor.storage as any).markdown.getMarkdown() !== body) {
      editor.commands.setContent(body);
    }
  }, [body, editor]);

  return <EditorContent editor={editor} />;
}

/**
 * VaultBrowser — 2-column master-detail browsing UI with search and filters (CHANGE 11 & 12).
 * Supports debounced text search, content-type filtering, tag filtering, and read-only preview.
 */
interface VaultBrowserProps {
  onEdit?: (item: VaultItem) => void;
  onViewChange?: (view: 'workspace') => void;
  onFlash?: (msg: string) => void;
}

function formatUrl(href: string): string {
  href = href.trim();
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href)) {
    return href;
  }
  if (href.includes('.') && !href.includes(' ')) {
    return 'https://' + href;
  }
  return 'https://www.google.com/search?q=' + encodeURIComponent(href);
}

export default function VaultBrowser({ onEdit, onViewChange, onFlash }: VaultBrowserProps) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search and filter state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [pendingDeleteItem, setPendingDeleteItem] = useState<VaultItem | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [typeFilter, setTypeFilter] = useState<ContentType | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isExportMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportMenuOpen]);

  // 300ms debounce on searchInput → debouncedQuery
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load items from backend using search_vault_items
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invoke<VaultItem[]>('search_vault_items', {
        query: debouncedQuery,
        contentType: typeFilter ?? null,
        tag: tagFilter ?? null,
      });
      setItems(data);

      // Auto-select first result if current selection is not in results; clear if no results
      if (data.length > 0) {
        setSelectedId(prev => (prev && data.some(i => i.id === prev) ? prev : data[0].id));
      } else {
        setSelectedId(null);
      }

      // Collect all tags when query/filters are not active to populate available tags list
      if (!debouncedQuery && !typeFilter && !tagFilter) {
        const tags = Array.from(new Set(data.flatMap(i => i.tags))).sort();
        setAllTags(tags);
      }
    } catch (e) {
      console.error('[VaultBrowser] search failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, typeFilter, tagFilter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    const unlisten = listen('browser-capture-saved', () => {
      loadItems();
    });
    return () => {
      unlisten.then(f => f());
    };
  }, [loadItems]);

  const handleExport = async (format: 'md' | 'txt') => {
    if (!selectedItem) return;
    setIsExportMenuOpen(false);
    setIsExporting(true);
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { exportAsMd, exportAsTxt, sanitizeFilename } = await import('../../lib/exportMarkdown');
      const path = await save({
        defaultPath: `${sanitizeFilename(selectedItem.title)}.${format}`,
        filters: [{ name: format.toUpperCase(), extensions: [format] }]
      });
      if (path) {
        const content = format === 'md' ? exportAsMd(selectedItem.body) : exportAsTxt(selectedItem.body);
        await invoke('export_vault_item', { path, content });
        onFlash?.('Exported successfully');
      }
    } catch (e) {
      console.error('Export failed', e);
      onFlash?.(`Export failed: ${e}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTagChange = async (newTags: string[]) => {
    if (!selectedId) return;
    try {
      await invoke('update_vault_item_tags', { id: selectedId, tags: newTags });
      setItems(prev => prev.map(i => i.id === selectedId ? { ...i, tags: newTags } : i));
      
      // Also fetch and update allTags to keep autocomplete fresh
      const all: string[] = await invoke('get_all_tags');
      setAllTags(all);
    } catch (e) {
      console.error('Failed to update tags:', e);
      onFlash?.('Failed to update tags');
    }
  };

  const isFiltering = debouncedQuery !== '' || typeFilter !== null || tagFilter !== null;
  const selectedItem = items.find(i => i.id === selectedId) ?? null;

  if (isLoading && items.length === 0 && !isFiltering) {
    return (
      <div className="vault-browser vault-browser--loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="32px" />
      </div>
    );
  }

  // Entire vault is empty (unfiltered)
  if (!isLoading && items.length === 0 && !isFiltering) {
    return (
      <div className="vault-browser vault-browser--empty">
        <div className="vault-empty-card">
          <span className="vault-empty-card__icon" aria-hidden="true">📦</span>
          <h2 className="vault-empty-card__title">Your Vault is empty</h2>
          <p className="vault-empty-card__desc">
            Items saved from your workspace or captured via shortcuts will appear here permanently.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-browser">
      {/* Master List Pane */}
      <aside className="vault-list-pane">
        <div className="vault-list-pane__header">
          <span className="vault-list-pane__title">Vault Items</span>
          <span className="vault-list-pane__count">{items.length}</span>
        </div>

        {/* Search bar */}
        <div className="vault-search-bar">
          <span className="vault-search-bar__icon" aria-hidden="true">🔍</span>
          <input
            className="vault-search-input"
            type="search"
            placeholder="Search Vault…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              className="vault-search-clear"
              onClick={() => setSearchInput('')}
              title="Clear search"
              type="button"
            >
              ×
            </button>
          )}
        </div>

        {/* Content type filters */}
        <div className="vault-filter-row">
          {(['note', 'codeSnippet', 'link', 'image', 'file'] as ContentType[]).map(t => (
            <button
              key={t}
              className={`vault-filter-pill ${
                typeFilter === t ? 'vault-filter-pill--active' : ''
              }`}
              onClick={() => setTypeFilter(prev => (prev === t ? null : t))}
              type="button"
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Tag filters (if tags exist) */}
        {allTags.length > 0 && (
          <div className="vault-tag-filter-row">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`vault-filter-pill vault-filter-pill--tag ${
                  tagFilter === tag ? 'vault-filter-pill--active' : ''
                }`}
                onClick={() => setTagFilter(prev => (prev === tag ? null : tag))}
                type="button"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Items list */}
        <div className="vault-list">
          {items.length === 0 && isFiltering ? (
            <div className="vault-list-empty">
              No items match your search or filters.
            </div>
          ) : (
            <Virtuoso
              style={{ height: '100%' }}
              data={items}
              itemContent={(_, item) => {
                const badge = getTypeBadge(item.type);
                const isSelected = item.id === selectedId;
                return (
                  <div
                    className={`vault-item-card ${
                      isSelected ? 'vault-item-card--selected' : ''
                    }`}
                    onClick={() => setSelectedId(item.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select vault item: ${item.title || 'Untitled'}`}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(item.id);
                      }
                    }}
                  >
                    <div className="vault-item-card__header">
                      <span className="vault-item-card__title">
                        {item.title || 'Untitled'}
                      </span>
                      <span className={`vault-badge ${badge.className}`}>
                        {badge.icon} {badge.label}
                      </span>
                    </div>
                    <p className="vault-item-card__preview">
                      {exportAsTxt(item.body || '').slice(0, 120) || '(Empty)'}
                    </p>
                    <div className="vault-item-card__footer">
                      {item.tags.length > 0 && (
                        <div className="vault-item-card__tags">
                          {item.tags.map(t => (
                            <span key={t} className="vault-tag-pill">#{t}</span>
                          ))}
                        </div>
                      )}
                      <span className="vault-item-card__date">
                        {formatDate(item.updatedAt)}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
          )}
        </div>
      </aside>

      {/* Detail Pane */}
      <main className="vault-detail-pane">
        {selectedItem ? (
          <div className="vault-detail">
            <header className="vault-detail__header">
              <div className="vault-detail__meta-row">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`vault-badge ${getTypeBadge(selectedItem.type).className}`}>
                    {getTypeBadge(selectedItem.type).icon} {getTypeBadge(selectedItem.type).label}
                  </span>
                  <span className="vault-detail__date">
                    Saved: {formatDate(selectedItem.createdAt)}
                  </span>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <button 
                    className="toolbar__btn toolbar__btn--secondary" 
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                    onClick={() => {
                      if (onEdit && onViewChange) {
                        onEdit(selectedItem);
                        onViewChange('workspace');
                      }
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="toolbar__btn toolbar__btn--secondary" 
                    style={{ fontSize: '12px', padding: '4px 8px', color: 'var(--sb-text-secondary)' }}
                    onClick={() => setPendingDeleteItem(selectedItem)}
                  >
                    Delete
                  </button>
                  <button 
                    className="toolbar__btn toolbar__btn--secondary" 
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                    onClick={() => {
                      navigator.clipboard.writeText(selectedItem.body).catch(console.error);
                      const btn = document.activeElement as HTMLButtonElement;
                      if (btn) {
                        const old = btn.innerText;
                        btn.innerText = 'Copied!';
                        setTimeout(() => { btn.innerText = old; }, 2000);
                      }
                    }}
                  >
                    Copy Content
                  </button>
                  <div className="toolbar__overflow" ref={exportMenuRef}>
                    <button 
                      className="toolbar__btn toolbar__btn--secondary" 
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                      onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                      disabled={isExporting}
                    >
                      {isExporting ? 'Exporting...' : 'Export ▾'}
                    </button>
                    {isExportMenuOpen && (
                      <div className="toolbar__menu toolbar__overflow-menu" style={{ right: 0, left: 'auto', minWidth: '120px' }}>
                        <button className="toolbar__menu-item" onClick={() => handleExport('md')}>Export as .md</button>
                        <button className="toolbar__menu-item" onClick={() => handleExport('txt')}>Export as .txt</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <h1 className="vault-detail__title">{selectedItem.title || 'Untitled'}</h1>
              <div className="vault-detail__tags" style={{ margin: '8px 24px', maxWidth: '400px' }}>
                <TagChipInput 
                  tags={selectedItem.tags || []} 
                  suggestions={allTags}
                  onChange={handleTagChange} 
                />
              </div>
              {selectedItem.sourceUrl && (
                <div className="vault-detail__source">
                  <span>Source: </span>
                  <a href={selectedItem.sourceUrl} >
                    {selectedItem.sourceDomain || selectedItem.sourceUrl}
                  </a>
                </div>
              )}
            </header>
            <div className="vault-detail__body-wrapper">
              {selectedItem.type === 'link' ? (
                <div className="vault-detail__link-view">
                  {(selectedItem.sourceUrl || selectedItem.body?.trim()) ? (
                    <a
                        className="vault-detail__link-url"
                        href={selectedItem.sourceUrl || selectedItem.body}
                        onClick={(e) => {
                          e.preventDefault();
                          let href = selectedItem.sourceUrl || selectedItem.body;
                          if (href) {
                              safeOpenUrl(formatUrl(href)).catch(console.error);
                          }
                        }}
                      >
                      {selectedItem.sourceUrl || selectedItem.body}
                    </a>
                  ) : (
                    <p className="vault-detail__link-empty">No URL saved for this item.</p>
                  )}
                </div>
              ) : (
                <div className="vault-detail__body tiptap">
                  <VaultItemRenderer body={selectedItem.body} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="vault-detail-empty">
            {isFiltering
              ? 'No matching item selected'
              : 'Select an item to view its content'}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      {pendingDeleteItem && (
        <div
          className="dialog-overlay"
          onClick={() => setPendingDeleteItem(null)}
          aria-hidden="true"
        >
          <div
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="dialog__title" id="delete-dialog-title">
              Delete Vault Item?
            </h2>
            <p className="dialog__description">
              Are you sure you want to delete <strong className="dialog__tab-name">{pendingDeleteItem.title || 'Untitled'}</strong>? This action cannot be undone.
            </p>
            <div className="dialog__actions">
              <button
                className="dialog__btn dialog__btn--primary"
                style={{ backgroundColor: '#c5221f', color: '#fff' }}
                onClick={async () => {
                  try {
                    await invoke('delete_vault_item', { id: pendingDeleteItem.id });
                    if (selectedId === pendingDeleteItem.id) {
                      setSelectedId(null);
                    }
                    setPendingDeleteItem(null);
                    loadItems(); // refresh list
                  } catch (e) {
                    console.error('Failed to delete vault item:', e);
                  }
                }}
              >
                Delete
              </button>
              <button
                className="dialog__btn dialog__btn--ghost"
                onClick={() => setPendingDeleteItem(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
