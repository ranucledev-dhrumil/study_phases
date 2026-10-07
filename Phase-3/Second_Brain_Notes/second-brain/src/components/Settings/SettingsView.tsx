import { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AppSettings, Theme } from '../../types';
import './SettingsView.css';

export default function SettingsView({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<Set<string>>(new Set());
  const [copyStatus, setCopyStatus] = useState<string>('Copy');

  useEffect(() => {
    invoke<AppSettings>('get_app_settings')
      .then(setSettings)
      .catch(e => console.error('Failed to load settings:', e));
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't close if recording a hotkey
      if (e.key === 'Escape' && !isRecording) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isRecording, onClose]);

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await invoke('update_app_settings', { settings: newSettings });
      setSettings(newSettings);
      setError(null);
      window.dispatchEvent(new CustomEvent('settings-updated', { detail: newSettings }));
    } catch (e: unknown) {
      console.error('Failed to save settings:', e);
      setError(typeof e === 'string' ? e : String(e));
    }
  };

  const handleToggleConfirmClose = (checked: boolean) => {
    if (!settings) return;
    void saveSettings({ ...settings, confirmWorkspaceClose: checked });
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isRecording) return;
    e.preventDefault();
    
    const key = e.key.toLowerCase();
    
    // Ignore pure modifier presses if we only want to track them, but wait,
    // if the user is pressing a modifier, we add it to the set.
    if (['control', 'alt', 'shift', 'meta'].includes(key)) {
      let modifier = key;
      if (key === 'control') modifier = 'ctrl';
      setRecordedKeys(prev => {
        const next = new Set(prev);
        next.add(modifier);
        return next;
      });
    } else {
      // It's a regular key. Finish recording.
      setRecordedKeys(prev => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      
      setIsRecording(false);
      
      if (!settings) return;
      
      // Determine final hotkey
      setRecordedKeys(finalKeys => {
        const modifiers = Array.from(finalKeys).filter(k => ['ctrl', 'alt', 'shift', 'meta'].includes(k)) as any[];
        const primaryKey = key;
        
        void saveSettings({
          ...settings,
          captureHotkey: { modifiers, key: primaryKey }
        });
        return new Set();
      });
    }
  }, [isRecording, settings]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isRecording) return;
    e.preventDefault();
    const key = e.key.toLowerCase();
    let norm = key;
    if (key === 'control') norm = 'ctrl';
    
    setRecordedKeys(prev => {
      const next = new Set(prev);
      next.delete(norm);
      return next;
    });
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      setRecordedKeys(new Set());
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, handleKeyDown, handleKeyUp]);

  if (!settings) {
    return <div className="settings-view">Loading...</div>;
  }

  const formatHotkey = (hotkey: typeof settings.captureHotkey) => {
    const mods = hotkey.modifiers.map(m => m.charAt(0).toUpperCase() + m.slice(1));
    let keyName = hotkey.key;
    if (keyName.length === 1) keyName = keyName.toUpperCase();
    else keyName = keyName.charAt(0).toUpperCase() + keyName.slice(1);
    
    return [...mods, keyName].join(' + ');
  };

  const handleCopyPath = () => {
    if (settings.dataDirectoryPath) {
      void navigator.clipboard.writeText(settings.dataDirectoryPath);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy'), 2000);
    }
  };

  return (
    <div className="settings-view">
      <div className="settings-view__content">
        <h1 className="settings-view__title">Settings</h1>
        
        <div className="settings-section">
          <div className="settings-section__header">
            <h2 className="settings-section__title">Appearance</h2>
          </div>
          <div className="settings-section__body">
            <div className="settings-select-wrapper">
              <select 
                className="sb-select"
                value={settings.theme}
                onChange={e => saveSettings({ ...settings, theme: e.target.value as Theme })}
              >
                <option value="system">System (Default)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            
            <div className="settings-select-wrapper" style={{ marginTop: '16px' }}>
              <select 
                className="sb-select"
                value={settings.editorZoom}
                onChange={e => saveSettings({ ...settings, editorZoom: Number(e.target.value) })}
              >
                <option value={75}>Small (75%)</option>
                <option value={90}>Compact (90%)</option>
                <option value={100}>Default (100%)</option>
                <option value={115}>Large (115%)</option>
                <option value={130}>Extra Large (130%)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section__header">
            <h2 className="settings-section__title">Global Capture Hotkey</h2>
            <p className="settings-section__description">Shortcut to instantly capture clipboard content into a new note from anywhere.</p>
          </div>
          <div className="settings-section__body">
             <div className="hotkey-recorder">
                <button 
                  className={`sb-button hotkey-btn ${isRecording ? 'recording' : ''}`}
                  onClick={() => setIsRecording(!isRecording)}
                  title="Click to record new hotkey"
                >
                  {isRecording ? 
                    (recordedKeys.size > 0 ? Array.from(recordedKeys).map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' + ') : 'Listening...') : 
                    formatHotkey(settings.captureHotkey)
                  }
                </button>
                {isRecording ? (
                  <span className="hotkey-hint">Press key combination...</span>
                ) : (
                  <span className="hotkey-hint">Click to change</span>
                )}
             </div>
             {error && <div className="settings-error">{error}</div>}
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section__header">
            <h2 className="settings-section__title">Data Location</h2>
            <p className="settings-section__description">Where your Vault and Workspace items are stored locally.</p>
          </div>
          <div className="settings-section__body">
            <div className="data-location-wrapper">
              <input 
                type="text" 
                className="sb-input settings-input--readonly" 
                readOnly 
                value={settings.dataDirectoryPath || ''} 
              />
              <button 
                className="sb-button copy-btn" 
                onClick={handleCopyPath}
                disabled={!settings.dataDirectoryPath}
              >
                {copyStatus}
              </button>
            </div>
            <p className="settings-hint">Data migration is planned for a future release.</p>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section__header">
            <h2 className="settings-section__title">Behavior</h2>
          </div>
          <div className="settings-section__body">
            <label className="settings-checkbox-wrapper">
              <input 
                type="checkbox" 
                checked={settings.confirmWorkspaceClose} 
                onChange={(e) => handleToggleConfirmClose(e.target.checked)} 
              />
              <span>Confirm before closing Workspace tabs</span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section__header">
            <h2 className="settings-section__title">Browser Integration</h2>
            <p className="settings-section__description">
              To enable "Save to Second Brain" from Chrome or Edge, run <code>scripts\install-native-host.ps1</code> manually. 
              The portable version does not modify your registry automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
