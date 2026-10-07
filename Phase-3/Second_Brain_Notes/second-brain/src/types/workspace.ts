import type { ContentType } from './content';
import type { AttachmentMetadata } from './attachment';
import type { BaseItemFields } from './base';

/** Cursor and text selection state, persisted for session restore (CHANGE 07) */
export interface CursorState {
  /** Character offset of the cursor from the start of body */
  position: number;
  /** Start of the selection range; equals position when no selection is active */
  selectionStart: number;
  /** End of the selection range; equals position when no selection is active */
  selectionEnd: number;
}

/** Scroll position, persisted for session restore (CHANGE 07) */
export interface ScrollState {
  /** Vertical scroll offset in pixels */
  scrollTop: number;
  /** Horizontal scroll offset in pixels */
  scrollLeft: number;
}

/**
 * WorkspaceDocument — an auto-persisted working tab, shown with a dot indicator.
 *
 * ── IMPORTANT ──────────────────────────────────────────────────────────────
 * WorkspaceDocument content is ALWAYS persisted locally. The dot (●) indicates
 * the item has not been promoted to the Vault — it does NOT mean "unsaved".
 * Never use field names like isSaved, unsavedChanges, or isDirty for
 * workspace state. Use "workspace" / "not yet in Vault" wording instead.
 *
 * WorkspaceDocument and VaultItem are intentionally separate types.
 * Do NOT collapse them into one type with a status flag.
 * ───────────────────────────────────────────────────────────────────────────
 */
export type WorkspaceDocument = BaseItemFields & {
  /**
   * Content type suggestion from clipboard detection or user override.
   * Advisory only — never enforced at the workspace stage.
   */
  suggestedType: ContentType;
  /** Zero-based position in the tab strip */
  tabOrder: number;
  /** Whether this tab is currently active/focused */
  isActive: boolean;
  /** Last known cursor/selection state for session restore */
  cursorState: CursorState;
  /** Last known scroll position for session restore */
  scrollState: ScrollState;
  /**
   * Attachment references — reserved for future image/file capture.
   * Always an empty array in v1.
   */
  attachments: AttachmentMetadata[];
  /** Tags assigned to this workspace document */
  tags: string[];
  /** Set when this tab originated from a Vault Item Edit action */
  sourceVaultItemId?: string;
  /** Dedicated URL for Link-type tabs. Never written to by mode switches on body. */
  url?: string;
};
