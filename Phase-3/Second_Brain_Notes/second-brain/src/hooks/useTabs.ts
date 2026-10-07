/**
 * useTabs — workspace tab state + continuous autosave (CHANGE 06) + session restore (CHANGE 07).
 *
 * Autosave strategy:
 *   - 500ms debounce on every keystroke (updateBody resets the timer each call)
 *   - Immediate flush on tab switch (debounce cancelled first → no double-write)
 *   - Immediate flush on tab close for the active tab only (non-active tabs were
 *     already flushed when they were last switched away from)
 *   - Immediate flush on document.visibilitychange → hidden (app blur/Alt-Tab-kill)
 *   - App-close interception deferred to CHANGE 09 (close-confirmation dialog)
 *
 * Session Restore strategy (CHANGE 07):
 *   - isSessionLoading: initialized true, set to false after initial open tabs query resolves.
 *     Suppresses empty-hint flash on startup.
 *   - Zero-tabs launch: if query_open_workspace_documents returns 0 open documents,
 *     silently create a single "Untitled" tab.
 *   - Cursor & Scroll: pendingRestoreRef captures active tab's selectionStart, selectionEnd,
 *     scrollTop, scrollLeft before state update; useLayoutEffect applies them to textareaRef
 *     on mount / active tab change once and immediately clears pendingRestoreRef.
 */

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { ContentType, WorkspaceDocument, VaultItem } from '../types';

const AUTOSAVE_DEBOUNCE_MS = 500;
/** Max characters shown as auto-derived tab title (matches Notepad's approximate behavior) */
const AUTO_TITLE_MAX_CHARS = 32;

export interface EditorRef {
  getCursorState: () => { selectionStart: number; selectionEnd: number; scrollTop: number; scrollLeft: number };
  setCursorState: (state: { selectionStart: number; selectionEnd: number; scrollTop: number; scrollLeft: number }) => void;
  focus: () => void;
  getMarkdown: () => string;
}

/** Helper — build the payload for save_workspace_document from the editor element. */
function buildSavePayload(
  id: string,
  body: string,
  url: string | null,
  el: EditorRef | null,
) {
  const cursor = el ? el.getCursorState() : { selectionStart: 0, selectionEnd: 0, scrollTop: 0, scrollLeft: 0 };
  return {
    payload: {
      id,
      body,
      url,
      cursorPosition: cursor.selectionStart,
      cursorSelectionStart: cursor.selectionStart,
      cursorSelectionEnd: cursor.selectionEnd,
      scrollTop: cursor.scrollTop,
      scrollLeft: cursor.scrollLeft,
    },
  };
}

export interface UseTabsReturn {
  tabs: WorkspaceDocument[];
  activeTabId: string | null;
  tabBodies: Record<string, string>;
  tabUrls: Record<string, string>;
  /** Stable ref forwarded to <EditorArea> — do not mutate directly. */
  editorRef: React.RefObject<EditorRef | null>;
  /** True while the initial session load from SQLite is in flight */
  isSessionLoading: boolean;
  loadOpenTabs: () => Promise<void>;
  createTab: () => Promise<void>;
  /** CHANGE 16: creates a tab pre-filled with captured clipboard text + detected type. */
  captureTab: (body: string, suggestedType: ContentType, title?: string, sourceVaultItemId?: string) => Promise<void>;
  openVaultItemForEdit: (item: VaultItem) => Promise<void>;
  closeTab: (id: string, reason?: 'explicit' | 'saveToVault') => Promise<void>;
  switchTab: (id: string) => Promise<void>;
  renameTab: (id: string, title: string) => Promise<void>;
  /** Synchronous — updates local state and resets the autosave debounce. */
  markDirty: (id: string) => void;
  /** Updates the displayed tab title from body content, unless the tab was manually renamed. */
  updateAutoTitle: (id: string, body: string, isCodeMode?: boolean) => void;
  updateSuggestedType: (id: string, type: ContentType) => Promise<void>;
  reorderTabs: (newTabs: WorkspaceDocument[]) => Promise<void>;
  updateTags: (id: string, tags: string[]) => Promise<void>;
  updateUrl: (id: string, url: string | null) => void;
  saveError: string | null;
  /** Set of tab IDs that have un-synced changes (dot indicator). */
  dirtyTabIds: Set<string>;
  /** Called after a successful vault save — clears dirty state and links the tab. */
  markVaultSaved: (id: string, vaultItemId: string) => void;
}

export function useTabs(): UseTabsReturn {
  const [tabs, setTabs] = useState<WorkspaceDocument[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [tabBodies, setTabBodies] = useState<Record<string, string>>({});
  const [tabUrls, setTabUrls] = useState<Record<string, string>>({});
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);
  /** IDs of tabs whose content is not yet reflected in their linked Vault item (or have no link). */
  const [dirtyTabIds, setDirtyTabIds] = useState<Set<string>>(new Set());

  // ── Stable refs ──────────────────────────────────────────────────────────
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<EditorRef | null>(null);
  const lastCaptureRef = useRef<{ body: string, time: number } | null>(null);
  /** Set of tab IDs that have been manually renamed — auto-titling is suppressed for these. */
  const manuallyRenamedRef = useRef<Set<string>>(new Set());

  // CHANGE 07: Queue cursor and scroll state restoration on startup
  const pendingRestoreRef = useRef<{
    selectionStart: number;
    selectionEnd: number;
    scrollTop: number;
    scrollLeft: number;
  } | null>(null);

  // Mirror mutable state into refs so event handlers are never stale.
  const activeTabIdRef = useRef<string | null>(null);
  const tabBodiesRef = useRef<Record<string, string>>({});
  const tabUrlsRef = useRef<Record<string, string>>({});

  useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);
  useEffect(() => { tabBodiesRef.current = tabBodies; }, [tabBodies]);
  useEffect(() => { tabUrlsRef.current = tabUrls; }, [tabUrls]);

  const [saveError, setSaveError] = useState<string | null>(null);
  const consecutiveSaveErrorsRef = useRef<number>(0);

  // Helper to process save success/failure (CHANGE 21)
  const handleSaveResult = useCallback(async (promise: Promise<unknown>, source: string) => {
    try {
      await promise;
      if (consecutiveSaveErrorsRef.current > 0) {
        consecutiveSaveErrorsRef.current = 0;
        setSaveError(null);
      }
    } catch (e) {
      console.error(`[useTabs] save error (${source}):`, e);
      consecutiveSaveErrorsRef.current += 1;
      if (consecutiveSaveErrorsRef.current >= 3) {
        setSaveError('⚠ Autosave failed — content is still in memory.');
      }
      throw e; // re-throw so callers can abort operations if needed
    }
  }, []);

  // After activeTabId state change, apply any pending cursor/scroll restore to the editor.
  useLayoutEffect(() => {
    if (pendingRestoreRef.current === null) return;
    const el = editorRef.current;
    if (!el) return;

    const { selectionStart, selectionEnd, scrollTop, scrollLeft } = pendingRestoreRef.current;
    pendingRestoreRef.current = null; // clear immediately

    el.focus();
    el.setCursorState({ selectionStart, selectionEnd, scrollTop, scrollLeft });
  }, [activeTabId]);

  // ── visibilitychange flush ────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) return;
      const id = activeTabIdRef.current;
      if (!id) return;

      // Cancel any pending debounce — this flush supersedes it.
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      handleSaveResult(
        invoke(
          'save_workspace_document',
          buildSavePayload(id, tabBodiesRef.current[id] ?? '', tabUrlsRef.current[id] ?? null, editorRef.current),
        ),
        'visibilitychange flush'
      ).catch(() => {}); // Error already logged/handled
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleSaveResult]); // handleSaveResult is stable

  // ── Tab lifecycle ─────────────────────────────────────────────────────────

  const loadOpenTabs = useCallback(async () => {
    setIsSessionLoading(true);
    try {
      const docs = await invoke<WorkspaceDocument[]>('open_workspace_documents');

      if (docs.length === 0) {
        // Zero-tabs launch: auto-create one fresh Untitled tab
        const doc = await invoke<WorkspaceDocument>('new_workspace_document', {
          title: 'Untitled',
        });
        setTabs([{ ...doc, isActive: true }]);
        setActiveTabId(doc.id);
        setTabBodies({ [doc.id]: '' });
      } else {
        setTabs(docs);
        const active = docs.find(d => d.isActive) ?? docs[0] ?? null;
        setActiveTabId(active?.id ?? null);
        const bodies: Record<string, string> = {};
        const urls: Record<string, string> = {};
        // Tabs without a vault link start dirty (dot shows). Linked tabs start clean.
        const initialDirty = new Set<string>(docs.filter(d => !d.sourceVaultItemId).map(d => d.id));
        setDirtyTabIds(initialDirty);
        for (const doc of docs) {
          bodies[doc.id] = doc.body;
          urls[doc.id] = doc.url ?? '';
        }
        setTabBodies(bodies);
        setTabUrls(urls);

        // Queue cursor/scroll restore for the active tab.
        // Set the ref BEFORE the batched state updates render so useLayoutEffect
        // sees it on the very next render after activeTabId changes.
        if (active) {
          pendingRestoreRef.current = {
            selectionStart: active.cursorState.selectionStart,
            selectionEnd: active.cursorState.selectionEnd,
            scrollTop: active.scrollState.scrollTop,
            scrollLeft: active.scrollState.scrollLeft,
          };
        }
      }
    } finally {
      setIsSessionLoading(false);
    }
  }, []);

  const createTab = useCallback(async () => {
    const doc = await invoke<WorkspaceDocument>('new_workspace_document', {
      title: 'Untitled',
    });
    setTabs(prev => [
      ...prev.map(t => ({ ...t, isActive: false })),
      { ...doc, isActive: true },
    ]);
    setActiveTabId(doc.id);
    setTabBodies(prev => ({ ...prev, [doc.id]: '' }));
    setTabUrls(prev => ({ ...prev, [doc.id]: '' }));
    setDirtyTabIds(prev => new Set(prev).add(doc.id));
  }, []);

  
  const openVaultItemForEdit = useCallback(async (item: VaultItem) => {
    const doc = await invoke<WorkspaceDocument>('open_vault_item_for_edit', {
      sourceVaultItemId: item.id
    });
    setTabs(prev => [
      ...prev.map(t => ({ ...t, isActive: false })),
      doc,
    ]);
    setActiveTabId(doc.id);
    setTabBodies(prev => ({ ...prev, [doc.id]: doc.body }));
    setTabUrls(prev => ({ ...prev, [doc.id]: doc.url || '' }));
    manuallyRenamedRef.current.add(doc.id);
    // Tab re-opened from vault starts clean — it's linked and in-sync.
    setDirtyTabIds(prev => { const next = new Set(prev); next.delete(doc.id); return next; });
  }, []);

  const captureTab = useCallback(async (
    body: string,
    suggestedType: ContentType,
    title?: string,
    sourceVaultItemId?: string
  ) => {
    const now = Date.now();
    const last = lastCaptureRef.current;
    if (!sourceVaultItemId && last && last.body === body && (now - last.time < 3000)) {
      return; // Prevent rapid duplicate saves for hotkeys. Edit flow bypassing this is fine.
    }
    lastCaptureRef.current = { body, time: now };

    const doc = await invoke<WorkspaceDocument>('capture_workspace_document', {
      title: title || 'Untitled',
      body,
      suggestedType,
      sourceVaultItemId: sourceVaultItemId || null,
    });
    setTabs(prev => [
      ...prev.map(t => ({ ...t, isActive: false })),
      { ...doc, isActive: true },
    ]);
    setActiveTabId(doc.id);
    setTabBodies(prev => ({ ...prev, [doc.id]: body }));
    setTabUrls(prev => ({ ...prev, [doc.id]: '' }));
    
    if (sourceVaultItemId) {
      manuallyRenamedRef.current.add(doc.id);
      // Captured from vault — starts clean.
      setDirtyTabIds(prev => { const next = new Set(prev); next.delete(doc.id); return next; });
    } else {
      setDirtyTabIds(prev => new Set(prev).add(doc.id));
    }
  }, []);

  const switchTab = useCallback(
    async (id: string) => {
      if (id === activeTabId) return;

      // 1. Cancel pending debounce — immediate flush below takes over.
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // 2. Flush outgoing tab: body + cursor + scroll (fire-and-forget).
      if (activeTabId !== null) {
        handleSaveResult(
          invoke(
            'save_workspace_document',
            buildSavePayload(activeTabId, tabBodies[activeTabId] ?? '', tabUrls[activeTabId] ?? null, editorRef.current),
          ),
          'switchTab flush'
        ).catch(() => {}); // Error already logged/handled
      }

      // 3. Switch.
      await invoke('set_active_tab', { id });
      setActiveTabId(id);
      setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === id })));
    },
    [activeTabId, tabBodies],
  );

  const closeTab = useCallback(
    async (id: string, reason: 'explicit' | 'saveToVault' = 'explicit') => {
      // 1. Cancel debounce.
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // 2. Save content — only needed for the active tab.
      if (id === activeTabId) {
        try {
          await handleSaveResult(
            invoke(
              'save_workspace_document',
              buildSavePayload(id, tabBodies[id] ?? '', tabUrls[id] ?? null, editorRef.current),
            ),
            'closeTab flush'
          );
        } catch {
          // If save fails, abort closing so data is not lost from memory
          return;
        }
      }

      // 3. Mark as closed (is_open = 0). No body arg — content is already saved.
      await invoke('mark_tab_closed', { id });

      // 4. Update local state.
      const remaining = tabs.filter(t => t.id !== id);

      if (remaining.length === 0) {
        if (reason === 'explicit') {
          await getCurrentWindow().close();
          return;
        } else {
          // If closed due to Save-to-Vault, open a fresh Untitled tab instead of quitting
          try {
            const doc = await invoke<WorkspaceDocument>('new_workspace_document', {
              title: 'Untitled',
            });
            setTabs([{ ...doc, isActive: true }]);
            setActiveTabId(doc.id);
            setTabBodies({ [doc.id]: '' });
            setTabUrls({ [doc.id]: '' });
            setDirtyTabIds(new Set([doc.id]));
          } catch (e) {
            console.error('Failed to create new tab after save to vault', e);
          }
          return;
        }
      }

      let newActiveId = activeTabId;
      if (id === activeTabId) {
        const nextActive = remaining[remaining.length - 1] ?? null;
        newActiveId = nextActive?.id ?? null;
        if (newActiveId) {
          invoke('set_active_tab', { id: newActiveId }).catch(e =>
            console.error('[useTabs] closeTab set_active_tab:', e),
          );
        }
      }

      setTabs(remaining.map(t => ({ ...t, isActive: t.id === newActiveId })));
      setActiveTabId(newActiveId);
      setTabBodies(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setDirtyTabIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    },
    [activeTabId, tabBodies, tabs],
  );

  const renameTab = useCallback(async (id: string, title: string) => {
    await invoke('rename_workspace_document', { id, title });
    // Once a user explicitly renames a tab, lock auto-titling off for its lifetime.
    manuallyRenamedRef.current.add(id);
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, title } : t)));
  }, []);

  /**
   * Derives a display title from the first line of `body` (up to AUTO_TITLE_MAX_CHARS chars).
   * Only runs if the tab has NOT been manually renamed (Notepad-style behavior).
   * Does NOT persist to DB — title persists only when user manually renames or on rename_workspace_document.
   */
  const updateAutoTitle = useCallback((id: string, body: string, _isCodeMode?: boolean) => {
    if (manuallyRenamedRef.current.has(id)) return;
    
    let firstLine = '';
    const lines = body.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Skip code fence markers
      if (line.startsWith('```')) {
        continue;
      }
      
      // Strip markdown heading syntax so we just get the text
      line = line.replace(/^#+\s*/, '').trim();
      
      if (line) {
        firstLine = line;
        break;
      }
    }
    
    const derived = firstLine.length > AUTO_TITLE_MAX_CHARS
      ? firstLine.slice(0, AUTO_TITLE_MAX_CHARS) + '.'
      : firstLine || 'Untitled';
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, title: derived } : t)));
  }, []);

  /**
   * Called on every keystroke.
   * Updates local state and resets the 500ms autosave debounce.
   * The actual serialization is deferred until the debounce fires.
   */
  const markDirty = useCallback((id: string) => {
    setDirtyTabIds(prev => new Set(prev).add(id));
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      let bodyToSave = tabBodiesRef.current[id] ?? '';
      
      if (editorRef.current && editorRef.current.getMarkdown) {
        bodyToSave = editorRef.current.getMarkdown();
        setTabBodies(prev => ({ ...prev, [id]: bodyToSave }));
      }

      handleSaveResult(
        invoke(
          'save_workspace_document',
          buildSavePayload(id, bodyToSave, tabUrlsRef.current[id] ?? null, editorRef.current),
        ),
        'autosave'
      ).catch(() => {}); // Error already logged/handled
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [handleSaveResult]);

  /** Called after a successful vault save. Clears the dirty indicator and links the tab. */
  const markVaultSaved = useCallback((id: string, vaultItemId: string) => {
    setDirtyTabIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    setTabs(prev => prev.map(t =>
      t.id === id ? { ...t, sourceVaultItemId: vaultItemId } : t
    ));
  }, []);

  const updateSuggestedType = useCallback(async (id: string, type: ContentType) => {
    await invoke('update_workspace_document_type', { id, suggestedType: type });
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, suggestedType: type } : t)));
  }, []);

  const updateUrl = useCallback((id: string, url: string | null) => {
    setTabUrls(prev => ({ ...prev, [id]: url ?? '' }));
    markDirty(id);
  }, [markDirty]);

  const reorderTabs = useCallback(async (newTabs: WorkspaceDocument[]) => {
    const orders = newTabs.map((t, i) => ({ id: t.id, tabOrder: i }));
    await invoke('reorder_tabs', { updates: orders });
    setTabs(newTabs.map((t, i) => ({ ...t, tabOrder: i })));
  }, []);

  const updateTags = useCallback(async (id: string, tags: string[]) => {
    try {
      await invoke('update_workspace_document_tags', { id, tags });
      setTabs(prev => prev.map(t => (t.id === id ? { ...t, tags } : t)));
    } catch (e) {
      console.error('Failed to update tags:', e);
    }
  }, []);

  return {
    openVaultItemForEdit,
    tabs,
    activeTabId,
    tabBodies,
    tabUrls,
    editorRef,
    isSessionLoading,
    loadOpenTabs,
    createTab,
    captureTab,
    closeTab,
    switchTab,
    renameTab,
    markDirty,
    updateAutoTitle,
    updateSuggestedType,
    reorderTabs,
    updateTags,
    updateUrl,
    saveError,
    dirtyTabIds,
    markVaultSaved,
  };
}
