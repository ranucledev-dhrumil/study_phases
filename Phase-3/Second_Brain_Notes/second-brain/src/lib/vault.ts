/**
 * src/lib/vault.ts — Vault promotion helpers.
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Promote a WorkspaceDocument to a VaultItem (silent update if already linked).
 * Returns the vault item ID — used by the frontend to update the tab's sourceVaultItemId.
 */
export async function saveWorkspaceDocumentToVault(id: string): Promise<string> {
  return invoke<string>('save_workspace_document_to_vault', { id });
}

/**
 * Renames the workspace document to `title` and then saves to vault.
 * Used for the first-save dialog flow — the dialog title becomes the single
 * source of truth for both the tab strip and the vault item.
 * Returns the vault item ID.
 */
export async function saveWorkspaceDocumentToVaultWithTitle(
  id: string,
  title: string,
): Promise<string> {
  return invoke<string>('save_workspace_document_to_vault_with_title', { id, title });
}

export async function deleteVaultItem(id: string): Promise<void> {
  await invoke('delete_vault_item', { id });
}
