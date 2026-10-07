import './Toolbar.css';
import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import type { ContentType } from '../../types';
import TagChipInput from '../TagChipInput/TagChipInput';

import { 
  NoteIcon, CodeIcon, LinkIcon, ImageIcon, FileIcon,
  HeadingIcon, ListIcon, BoldIcon, ItalicIcon, StrikeIcon, TableIcon, ClearFormatIcon,
  AIIcon, ShareIcon, AvatarIcon, SettingsIcon
} from '../Icons/Icons';

const TYPE_LABELS: Record<ContentType, string> = {
  note: 'Note',
  codeSnippet: 'Code',
  link: 'Link',
  image: 'Image',
  file: 'File',
};

const TYPE_ICONS: Record<ContentType, React.FC<React.SVGProps<SVGSVGElement>>> = {
  note: NoteIcon,
  codeSnippet: CodeIcon,
  link: LinkIcon,
  image: ImageIcon,
  file: FileIcon,
};

interface ToolbarProps {
  editor: Editor | null;
  /** Current active tab's advisory content type */
  suggestedType?: ContentType;
  /** Fired when the user selects a new content type from the dropdown */
  onTypeChange?: (type: ContentType) => void;
  /** Fired when the user clicks Save to Vault. */
  onSaveToVault?: () => void;
  /** Fired when settings icon clicked */
  onSettingsClick: () => void;
  onNewTab?: () => void;
  onCloseTab?: () => void;
  tags?: string[];
  tagSuggestions?: string[];
  onTagsChange?: (tags: string[]) => void;
  isLinkMode?: boolean;
  isCodeMode?: boolean;
}

export default function Toolbar({ 
  editor, suggestedType, onTypeChange, onSaveToVault, onSettingsClick, onNewTab, onCloseTab,
  tags = [], tagSuggestions = [], onTagsChange, isLinkMode, isCodeMode
}: ToolbarProps) {
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTypeMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTypeMenuOpen]);

  useEffect(() => {
    if (!isTagMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target as Node)) {
        setIsTagMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTagMenuOpen]);

  useEffect(() => {
    if (!isOverflowOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setIsOverflowOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOverflowOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOverflowOpen]);

  const typeLabel = suggestedType ? TYPE_LABELS[suggestedType] : 'Note';
  const CurrentIcon = suggestedType ? TYPE_ICONS[suggestedType] : NoteIcon;

  const toggleLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    if (previousUrl) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('URL');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertTable = () => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const btnClass = (isActive: boolean) => 
    `toolbar__btn toolbar__btn--icon ${isActive ? 'toolbar__btn--active' : ''}`;

  return (
    <div className="toolbar" role="toolbar" aria-label="Document actions">
      
      {/* 1. Formatting Icons (Left) */}
      <div className={`toolbar__format-group ${(isLinkMode || isCodeMode) ? 'toolbar__format-group--disabled' : ''}`}>
        <div className="toolbar__overflow" ref={overflowRef}>
          <button 
            className="toolbar__btn toolbar__btn--icon" 
            onClick={() => setIsOverflowOpen(!isOverflowOpen)} 
            title="More actions"
          >
            <span style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: 1 }}>⋯</span>
          </button>
          {isOverflowOpen && (
            <div className="toolbar__menu toolbar__overflow-menu">
              <div className="toolbar__menu-label">Document</div>
              <button className="toolbar__menu-item" onClick={() => { onNewTab?.(); setIsOverflowOpen(false); }}>New Tab</button>
              <button className="toolbar__menu-item" onClick={() => { onSaveToVault?.(); setIsOverflowOpen(false); }}>Save to Vault</button>
              <button className="toolbar__menu-item" onClick={() => { onCloseTab?.(); setIsOverflowOpen(false); }}>Close Tab</button>
              
              <div className="toolbar__menu-separator" />
              
              <div className="toolbar__menu-label">Edit</div>
              <button className="toolbar__menu-item" onClick={() => { document.execCommand('undo'); setIsOverflowOpen(false); }}>Undo</button>
              <button className="toolbar__menu-item" onClick={() => { document.execCommand('redo'); setIsOverflowOpen(false); }}>Redo</button>
              <div className="toolbar__menu-separator" />
              <button className="toolbar__menu-item" onClick={() => { document.execCommand('cut'); setIsOverflowOpen(false); }}>Cut</button>
              <button className="toolbar__menu-item" onClick={() => { document.execCommand('copy'); setIsOverflowOpen(false); }}>Copy</button>
              <button className="toolbar__menu-item" onClick={() => { document.execCommand('paste'); setIsOverflowOpen(false); }}>Paste</button>
            </div>
          )}
        </div>
        <div className="toolbar__divider" />
        <button disabled={isLinkMode || isCodeMode}
          className={btnClass(editor?.isActive('heading') ?? false)}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading"
          aria-label="Heading"
        ><HeadingIcon /></button>
        <button disabled={isLinkMode || isCodeMode}
          className={btnClass(editor?.isActive('bulletList') ?? false)}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          title="List"
          aria-label="List"
        ><ListIcon /></button>
        <div className="toolbar__divider" />
        <button disabled={isLinkMode || isCodeMode}
          className={btnClass(editor?.isActive('bold') ?? false)}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Bold"
          aria-label="Bold"
        ><BoldIcon /></button>
        <button disabled={isLinkMode || isCodeMode}
          className={btnClass(editor?.isActive('italic') ?? false)}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Italic"
          aria-label="Italic"
        ><ItalicIcon /></button>
        <button disabled={isLinkMode || isCodeMode}
          className={btnClass(editor?.isActive('strike') ?? false)}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          title="Strikethrough"
          aria-label="Strikethrough"
        ><StrikeIcon /></button>
        <div className="toolbar__divider" />
        <button disabled={isLinkMode || isCodeMode}
          className={btnClass(editor?.isActive('link') ?? false)}
          onClick={toggleLink}
          title="Link"
          aria-label="Link"
        ><LinkIcon /></button>
        <button disabled={isLinkMode || isCodeMode}
          className={btnClass(editor?.isActive('table') ?? false)}
          onClick={insertTable}
          title="Table"
          aria-label="Table"
        ><TableIcon /></button>
        <div className="toolbar__divider" />
        <button 
          className="toolbar__btn toolbar__btn--icon"
          onClick={() => editor?.chain().focus().unsetAllMarks().run()}
          title="Clear Formatting"
          aria-label="Clear Formatting"
        ><ClearFormatIcon /></button>
      </div>

      <div className="toolbar__divider toolbar__divider--group" />

      {/* 2. Second Brain Controls (Middle-Right) */}
      <div className="toolbar__sb-group">
        <div className="toolbar__type-picker" ref={menuRef}>
          <button
            className="toolbar__btn toolbar__btn--secondary"
            title="Content type (suggestion)"
            aria-label={`Content type: ${typeLabel}`}
            onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
          >
            <CurrentIcon className="toolbar__btn-icon" />
            {typeLabel} &#x25BE;
          </button>
          
          {isTypeMenuOpen && (
            <div className="toolbar__menu">
              {Object.entries(TYPE_LABELS)
                .filter(([key]) => ['note', 'codeSnippet', 'link'].includes(key))
                .map(([key, label]) => {
                  const ItemIcon = TYPE_ICONS[key as ContentType];
                  return (
                    <button
                      key={key}
                      className={`toolbar__menu-item ${suggestedType === key ? 'toolbar__menu-item--active' : ''}`}
                      onClick={() => {
                        onTypeChange?.(key as ContentType);
                        setIsTypeMenuOpen(false);
                      }}
                    >
                      <ItemIcon className="toolbar__menu-icon" />
                      {label}
                    </button>
                  );
              })}
            </div>
          )}
        </div>

        <div className="toolbar__type-picker" ref={tagMenuRef}>
          <button
            className={`toolbar__btn toolbar__btn--secondary ${tags.length > 0 ? 'toolbar__btn--active' : ''}`}
            title="Edit tags"
            aria-label="Edit tags"
            onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
          >
            Tag {tags.length > 0 && `(${tags.length})`} &#x25BE;
          </button>
          
          {isTagMenuOpen && (
            <div className="toolbar__menu" style={{ width: '250px', padding: '8px', right: 0, left: 'auto' }}>
              <TagChipInput 
                tags={tags} 
                suggestions={tagSuggestions} 
                onChange={(newTags) => {
                  onTagsChange?.(newTags);
                }} 
              />
            </div>
          )}
        </div>

        <button
          className="toolbar__btn toolbar__btn--primary"
          onClick={onSaveToVault}
          disabled={!onSaveToVault}
          title="Save this workspace item to your Vault"
        >
          Save to Vault
        </button>
      </div>

      <div className="toolbar__spacer" />
      <div className="toolbar__divider toolbar__divider--group" />

      {/* 3. Utility / Settings (Far Right) */}
      <div className="toolbar__util-group">
        <button className="toolbar__btn toolbar__btn--icon" title="AI Assistant (Coming Soon)" aria-label="AI Assistant"><AIIcon /></button>
        <button className="toolbar__btn toolbar__btn--icon" title="Share (Coming Soon)" aria-label="Share"><ShareIcon /></button>
        <button className="toolbar__btn toolbar__btn--icon" title="Account (Coming Soon)" aria-label="Account"><AvatarIcon /></button>
        <button className="toolbar__btn toolbar__btn--icon" title="Settings" aria-label="Settings" onClick={onSettingsClick}><SettingsIcon /></button>
      </div>

    </div>
  );
}
