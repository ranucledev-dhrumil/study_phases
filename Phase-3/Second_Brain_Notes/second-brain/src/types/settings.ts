/**
 * Structured hotkey — avoids brittle string parsing when displaying or
 * rebinding shortcuts in the settings screen (CHANGE 22).
 */
export interface Hotkey {
  /** Modifier keys held during the keypress */
  modifiers: Array<'ctrl' | 'alt' | 'shift' | 'meta'>;
  /**
   * Primary key as a lowercase string.
   * Examples: 's', 'f1', 'space', 'arrowup'
   */
  key: string;
}

/**
 * UI color theme.
 * 'system' is reserved for future OS-preference detection — not implemented in v1.
 */
export type Theme = 'dark' | 'light' | 'system';

/**
 * AppSettings — user-configurable application preferences.
 *
 * Minimal for v1. A settings screen is added in CHANGE 22.
 * Fields with no UI yet still need a type and default so the backend
 * can persist and restore them from CHANGE 04 onwards.
 */
export interface AppSettings {
  /** Global capture hotkey — default Ctrl+Shift+S, user-configurable (CHANGE 22) */
  captureHotkey: Hotkey;
  /**
   * UI color theme. Applied via data-theme attribute on <html> (CHANGE 02 token system).
   */
  theme: Theme;
  /**
   * Absolute path to the data directory.
   * null = use the platform default, resolved at runtime by the Rust backend.
   */
  dataDirectoryPath: string | null;
  /**
   * Show close-confirmation dialog when closing a workspace tab not in Vault.
   * Corresponds to CHANGE 09 behavior. Default: true (per spec).
   */
  confirmWorkspaceClose: boolean;
  /** Fixed zoom preference applied on startup */
  editorZoom: number;
}

/** Canonical defaults applied on first launch */
export const DEFAULT_SETTINGS: AppSettings = {
  captureHotkey: {
    modifiers: ['ctrl', 'shift'],
    key: 's',
  },
  theme: 'dark',
  dataDirectoryPath: null,
  confirmWorkspaceClose: true,
  editorZoom: 100,
};
