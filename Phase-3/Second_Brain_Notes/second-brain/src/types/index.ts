/**
 * Second Brain — Application Domain Types
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WORKSPACE vs. VAULT — the core architectural distinction.
 * Read this before modifying any type in this directory.
 *
 *   WorkspaceDocument  ●  A working tab. Content is ALWAYS auto-persisted
 *                         locally. The dot (●) means "not yet in Vault" —
 *                         NOT "unsaved". Avoid isSaved, isDirty, or
 *                         unsavedChanges for workspace state.
 *
 *   VaultItem             A permanently saved item. Created by "Save to Vault"
 *                         (CHANGE 10) or directly via browser extension
 *                         (CHANGE 19-20). No dot shown.
 *
 * These are SEPARATE types defined by intersection with BaseItemFields.
 * Do NOT merge them with a status flag. Do NOT use extends BaseItemFields —
 * use intersection types (Type = BaseItemFields & { … }) to preserve
 * structural distinctness.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type { BaseItemFields } from './base';
export type { ContentType } from './content';
export { ContentTypes } from './content';
export type { AttachmentMetadata } from './attachment';
export type { CursorState, ScrollState, WorkspaceDocument } from './workspace';
export type { VaultItem } from './vault';
export type { Hotkey, Theme, AppSettings } from './settings';
export { DEFAULT_SETTINGS } from './settings';
export type {
  BrowserCapture,
  BrowserMessage,
  BrowserMessageResponse,
  BrowserCaptureSaved,
} from './browser';


