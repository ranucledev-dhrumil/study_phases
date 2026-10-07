import type { ContentType } from './content';
import type { AttachmentMetadata } from './attachment';
import type { BaseItemFields } from './base';

/**
 * VaultItem — a permanently saved knowledge item, shown without a dot.
 *
 * Created by an explicit "Save to Vault" action (CHANGE 10), or directly
 * via the browser extension (CHANGE 19-20).
 *
 * ── IMPORTANT ──────────────────────────────────────────────────────────────
 * VaultItem and WorkspaceDocument are intentionally separate types.
 * Do NOT merge them with a field like isInVault: boolean.
 * A VaultItem and a WorkspaceDocument can coexist with the same content
 * before/after promotion — they are structurally different objects.
 * ───────────────────────────────────────────────────────────────────────────
 */
export type VaultItem = BaseItemFields & {
  /**
   * Explicit content type — always set on Vault items.
   * (Field is named 	ype to match domain language; use item.type in code.)
   */
  type: ContentType;
  /** User-defined tags for filtering and search */
  tags: string[];

  // ── Source / provenance metadata ─────────────────────────────────────────
  // Required for CHANGE 18-20 browser integration. Optional because not all
  // Vault items originate from a URL.

  /** Original URL if the item was saved from a web page */
  sourceUrl?: string;
  /** Human-readable source domain, e.g. "github.com" */
  sourceDomain?: string;
  /** Page title from the browser at capture time */
  sourceTitle?: string;
  /**
   * ISO 8601 UTC timestamp of original capture.
   * May differ from createdAt if the item was queued before being saved.
   */
  capturedAt?: string;

  /**
   * Attachment references — reserved for future image/file capture.
   * Always an empty array in v1.
   */
  attachments: AttachmentMetadata[];
};
