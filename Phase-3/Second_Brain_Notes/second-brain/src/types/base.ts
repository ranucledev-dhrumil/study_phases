/**
 * BaseItemFields — shared structural fields composed into WorkspaceDocument
 * and VaultItem via TypeScript intersection types.
 *
 * ⚠  Do NOT use extends BaseItemFields in WorkspaceDocument or VaultItem.
 *    Extension creates a subtype relationship that blurs the Workspace/Vault
 *    distinction. Use intersection (Type = BaseItemFields & { … }) instead.
 */
export interface BaseItemFields {
  /** Stable unique identifier (UUID v4) */
  id: string;
  /** Display title shown in the tab strip and Vault list */
  title: string;
  /** Main text content */
  body: string;
  /** ISO 8601 UTC creation timestamp */
  createdAt: string;
  /** ISO 8601 UTC last-modified timestamp */
  updatedAt: string;
}
