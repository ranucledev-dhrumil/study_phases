import './App.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import TitleTabRow from './components/TitleTabRow/TitleTabRow';

import WorkspaceEditor from './components/WorkspaceEditor/WorkspaceEditor';
import StatusBar from './components/StatusBar/StatusBar';
import VaultBrowser from './components/VaultBrowser/VaultBrowser';
import SettingsView from './components/Settings/SettingsView';
import CloseConfirmDialog from './components/CloseConfirmDialog/CloseConfirmDialog';
import { useTabs } from './hooks/useTabs';
import { useTheme } from './hooks/useTheme';
import { saveWorkspaceDocumentToVault, saveWorkspaceDocumentToVaultWithTitle } from './lib/vault';
import SaveToVaultDialog from './components/SaveToVaultDialog/SaveToVaultDialog';
import { detectContentType } from './lib/detector';
import type { ClipboardReadResult } from './lib/clipboard';
import type { BrowserCaptureSaved, BrowserMessage, VaultItem } from './types';

/**
 * App — root component.
 * Threads textareaRef and isSessionLoading from useTabs to EditorArea so the hook can read
 * cursor and scroll position at every autosave flush boundary and suppress initial flash.
 * Manages pendingCloseTabId to prompt close-confirmation for WorkspaceDocument tabs (CHANGE 09/10).
 * Supports switching between Workspace view and Vault browser (CHANGE 11).
 * Executes hotkey-triggered clipboard capture workflow (CHANGE 16).
 * Listens for browser integration messages and direct vault saves (CHANGE 18/19).
 */
function App() {
  const {
    tabs,
    activeTabId,
    tabBodies,
    tabUrls,
    editorRef,
    isSessionLoading,
    loadOpenTabs,
    createTab,
    captureTab, openVaultItemForEdit,
    closeTab,
    switchTab,
    renameTab,
    markDirty,
    updateAutoTitle,
    updateSuggestedType,
    reorderTabs,
    updateTags,
    updateUrl,
    saveError: autosaveError,
    dirtyTabIds,
    markVaultSaved,
  } = useTabs();

  useTheme();

  /** Current top-level active view ('workspace' | 'vault' | 'settings') */
  const [currentView, setCurrentView] = useState<'workspace' | 'vault' | 'settings'>('workspace');

  /** null = no dialog; non-null = dialog shown for that tab id */
  const [pendingCloseTabId, setPendingCloseTabId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /** Transient flash message in the status bar (CHANGE 19) */
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** First-save-to-vault dialog state */
  const [saveToVaultDialogTabId, setSaveToVaultDialogTabId] = useState<string | null>(null);
  const [saveToVaultDialogTitle, setSaveToVaultDialogTitle] = useState('');
  const [saveToVaultDialogSaving, setSaveToVaultDialogSaving] = useState(false);
  const [saveToVaultDialogError, setSaveToVaultDialogError] = useState<string | null>(null);

  const [allTags, setAllTags] = useState<string[]>([]);
  const refreshTags = useCallback(() => {
    invoke<string[]>('get_all_tags')
      .then(tags => setAllTags(tags))
      .catch(e => console.error('Failed to load tags:', e));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { 
    loadOpenTabs(); 
    refreshTags();
    const loadZoom = () => invoke<any>('get_app_settings').then(s => { setZoom(s.editorZoom); setIsZoomLoaded(true); }).catch(e => { console.error(e); setIsZoomLoaded(true); });
    loadZoom();

    const onSettingsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail && customEvent.detail.editorZoom) {
        setZoom(customEvent.detail.editorZoom);
      } else {
        loadZoom();
      }
    };
    window.addEventListener('settings-updated', onSettingsUpdated);
    return () => window.removeEventListener('settings-updated', onSettingsUpdated);
  }, []);

  // Ctrl+S → Save active tab to Vault. Ctrl+W → Close active tab (shows confirmation dialog).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (activeTabId !== null) void handleSaveToVaultDirectly(activeTabId);
      }
      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (activeTabId !== null) handleTabClose(activeTabId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // handleSaveToVaultDirectly / handleTabClose are defined below — using refs avoids stale closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId]);

  const onCaptureHotkeyTriggered = useCallback(
    async (result: ClipboardReadResult) => {
      // Always land in Workspace view when capture hotkey fires
      setCurrentView('workspace');

      if (result.kind === 'text') {
        const suggestedType = detectContentType(result.content);
        await captureTab(result.content, suggestedType);
      } else {
        // image | unsupported | empty → blank note tab (image/file attachment out of scope in v1)
        await captureTab('', 'note');
      }
    },
    [captureTab],
  );

  useEffect(() => {
    const unlistenPromise = listen<ClipboardReadResult>('capture-hotkey-triggered', event => {
      void onCaptureHotkeyTriggered(event.payload);
    });
    return () => {
      unlistenPromise.then(fn => fn());
    };
  }, [onCaptureHotkeyTriggered]);

  /**
   * CHANGE 18: Browser integration message listener.
   * Listens for raw messages forwarded from the Native Messaging Host over the Windows Named Pipe.
   */
  useEffect(() => {
    const unlistenPromise = listen<BrowserMessage>('browser-message', event => {
      console.log('[CHANGE 18] Received browser message from:', event.payload.payload.source);
    });
    return () => {
      unlistenPromise.then(fn => fn());
    };
  }, []);

  /**
   * CHANGE 19: Browser integration (Chrome Extension).
   * Direct vault creation via named pipe.
   */
  useEffect(() => {
    const unlistenSavedPromise = listen<BrowserCaptureSaved>('browser-capture-saved', async () => {
      showFlash('✓ Saved from Browser');
      try {
        const { sendNotification } = await import('@tauri-apps/plugin-notification');
        sendNotification({ title: 'Second Brain', body: 'Successfully saved from browser.' });
      } catch (e) { console.error(e); }
    });
    
    const unlistenErrorPromise = listen<string>('browser-capture-error', async (event) => {
      showFlash(`Failed to save from browser: ${event.payload}`);
      try {
        const { sendNotification } = await import('@tauri-apps/plugin-notification');
        sendNotification({ title: 'Second Brain Error', body: `Failed to save from browser: ${event.payload}` });
      } catch (e) { console.error(e); }
    });

    return () => {
      unlistenSavedPromise.then(fn => fn());
      unlistenErrorPromise.then(fn => fn());
    };
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeBody = activeTabId ? tabBodies[activeTabId] ?? '' : '';

  /** Show a status-bar flash message that auto-dismisses after 3 s. */
  const showFlash = useCallback((msg: string) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashMessage(msg);
    flashTimerRef.current = setTimeout(() => setFlashMessage(null), 3000);
  }, []);


  const handleSaveToVaultDirectly = async (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;

    if (tab.sourceVaultItemId) {
      // ── Second+ save: silent update, no dialog, no tab close ──
      try {
        const vaultItemId = await saveWorkspaceDocumentToVault(id);
        markVaultSaved(id, vaultItemId);
        showFlash('✓ Saved to Vault');
        try {
          const { sendNotification } = await import('@tauri-apps/plugin-notification');
          sendNotification({ title: 'Second Brain', body: 'Saved to vault.' });
        } catch (e) { console.error(e); }
      } catch (e: unknown) {
        const msg = typeof e === 'string' ? e : "Couldn't save to Vault";
        showFlash(msg);
      }
    } else {
      // ── First save: open title dialog ──
      setSaveToVaultDialogTabId(id);
      setSaveToVaultDialogTitle(tab.title);
      setSaveToVaultDialogSaving(false);
      setSaveToVaultDialogError(null);
    }
  };

  const handleSaveToVaultDialogConfirm = async (confirmedTitle: string) => {
    if (!saveToVaultDialogTabId) return;
    const id = saveToVaultDialogTabId;
    setSaveToVaultDialogSaving(true);
    setSaveToVaultDialogError(null);
    try {
      const vaultItemId = await saveWorkspaceDocumentToVaultWithTitle(id, confirmedTitle);
      // Update tab title in state (the DB was already updated by the Rust command)
      await renameTab(id, confirmedTitle);
      markVaultSaved(id, vaultItemId);
      setSaveToVaultDialogTabId(null);
      showFlash('✓ Saved to Vault');
      try {
        const { sendNotification } = await import('@tauri-apps/plugin-notification');
        sendNotification({ title: 'Second Brain', body: 'Saved to vault.' });
      } catch (e) { console.error(e); }
    } catch (e: unknown) {
      setSaveToVaultDialogSaving(false);
      setSaveToVaultDialogError(typeof e === 'string' ? e : "Couldn't save to Vault. Please try again.");
    }
  };

  /**
   * Intercepts tab close.
   * WorkspaceDocument tabs (dot-showing) → show confirmation dialog.
   * Non-workspace tabs (future VaultItem-backed) → close directly, no dialog.
   */
  const handleTabClose = async (id: string) => {
    const tab = tabs.find(t => t.id === id);
    // Show confirmation if the tab has un-synced changes (dirty) regardless of vault link
    if (tab && dirtyTabIds.has(id)) {
      try {
        const settings = await invoke<import('./types/settings').AppSettings>('get_app_settings');
        if (settings.confirmWorkspaceClose) {
          setPendingCloseTabId(id);
          setSaveError(null);
          setIsSaving(false);
          return;
        }
      } catch (e) {
        console.error('Failed to read settings for tab close:', e);
      }
    }
    
    void closeTab(id);
  };

  const handleConfirmSaveToVault = async () => {
    if (pendingCloseTabId === null) return;
    const id = pendingCloseTabId;

    setIsSaving(true);
    setSaveError(null);

    try {
      await saveWorkspaceDocumentToVault(id); // real invoke — may throw
      // Success: dismiss dialog and close the tab
      setPendingCloseTabId(null);
      setIsSaving(false);
      await closeTab(id, 'saveToVault');
    } catch (e: unknown) {
      // Failure: keep dialog open, show contextual error
      setIsSaving(false);
      setSaveError(typeof e === 'string' ? e : "Couldn't save to Vault. Please try again.");
    }
  };

  const handleConfirmClose = async () => {
    if (pendingCloseTabId === null) return;
    const id = pendingCloseTabId;
    setPendingCloseTabId(null);
    setSaveError(null);
    setIsSaving(false);
    await closeTab(id); // marks is_open=0, removes from strip
  };

  const handleCancelClose = () => {
    setPendingCloseTabId(null); // dismiss; tab remains open, no state change
    setSaveError(null);
    setIsSaving(false);
  };

  const handleEditFromVault = useCallback((item: VaultItem) => {
    void openVaultItemForEdit(item);
    setCurrentView('workspace');
  }, [openVaultItemForEdit]);

  const [zoom, setZoom] = useState<number>(100);
  const [isZoomLoaded, setIsZoomLoaded] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1, charCount: 0 });

  return (
    <div className="app">
      <TitleTabRow
        tabs={tabs}
        activeTabId={activeTabId}
        currentView={currentView}
        onViewChange={setCurrentView}
        onSwitch={switchTab}
        onClose={handleTabClose}
        onRename={renameTab}
        onCreate={createTab}
        onReorder={reorderTabs}
      dirtyTabIds={dirtyTabIds}
      />

      {currentView === 'workspace' ? (
        <WorkspaceEditor
          ref={editorRef}
          body={activeBody}
          url={activeTab?.url ?? tabUrls[activeTabId ?? ''] ?? ''}
          onUrlChange={url => activeTabId !== null && updateUrl(activeTabId, url)}
          onChange={() => {
            if (activeTabId === null) return;
            markDirty(activeTabId);
            const body = editorRef.current?.getMarkdown?.() ?? tabBodies[activeTabId] ?? '';
            updateAutoTitle(activeTabId, body, activeTab?.suggestedType === "codeSnippet");
          }}
          hasActiveTab={activeTabId !== null}
          isLoading={isSessionLoading || !isZoomLoaded}
          zoom={zoom}
          onCursorChange={(line, col, charCount) => setCursorPos({ line, col, charCount })}
          suggestedType={activeTab?.suggestedType}
          onTypeChange={type => activeTabId !== null && void updateSuggestedType(activeTabId, type)}
          tags={activeTab?.tags}
          tagSuggestions={allTags}
          onTagsChange={tags => {
            if (activeTabId !== null) {
              void updateTags(activeTabId, tags).then(() => refreshTags());
            }
          }}
          onSaveToVault={activeTabId !== null ? () => void handleSaveToVaultDirectly(activeTabId) : undefined}
          onNewTab={createTab}
          onCloseTab={activeTabId !== null ? () => void handleTabClose(activeTabId) : undefined}
          onSettingsClick={() => setCurrentView('settings')}
        />
      ) : currentView === 'vault' ? (
        <VaultBrowser 
          onEdit={handleEditFromVault}
          onViewChange={setCurrentView}
          onFlash={showFlash}
        />
      ) : (
        <SettingsView onClose={() => setCurrentView('workspace')} />
      )}

      <StatusBar
        charCount={cursorPos.charCount}
        line={cursorPos.line}
        col={cursorPos.col}
        contentType={activeTab?.suggestedType || 'plain'}
        zoom={zoom}
        flash={flashMessage}
        error={autosaveError}
      />

      {saveToVaultDialogTabId !== null && (
        <SaveToVaultDialog
          initialTitle={saveToVaultDialogTitle}
          isSaving={saveToVaultDialogSaving}
          saveError={saveToVaultDialogError}
          onSave={handleSaveToVaultDialogConfirm}
          onCancel={() => setSaveToVaultDialogTabId(null)}
        />
      )}

      {pendingCloseTabId !== null && (
        <CloseConfirmDialog
          tabTitle={tabs.find(t => t.id === pendingCloseTabId)?.title ?? 'Untitled'}
          isSaving={isSaving}
          saveError={saveError}
          onSaveToVault={() => { void handleConfirmSaveToVault(); }}
          onClose={() => { void handleConfirmClose(); }}
          onCancel={handleCancelClose}
        />
      )}
    </div>
  );
}

export default App;
