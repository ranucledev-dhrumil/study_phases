/**
 * AttachmentMetadata — reserved for future image and file capture.
 *
 * Nothing in v1 creates attachments. This type exists so that adding
 * attachment support later requires no structural changes to
 * WorkspaceDocument or VaultItem.
 */
export interface AttachmentMetadata {
  id: string;
  /** ID of the owning WorkspaceDocument or VaultItem */
  ownerId: string;
  /** Discriminates the owner type for storage queries */
  ownerType: 'workspace' | 'vault';
  /** Absolute local filesystem path */
  localPath: string;
  /** MIME type, e.g. "image/png", "application/pdf" */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** ISO 8601 UTC creation timestamp */
  createdAt: string;
  /** ISO 8601 UTC last-modified timestamp */
  updatedAt: string;
}
