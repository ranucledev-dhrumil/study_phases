-- CHANGE 27: Performance optimizations for large vaults
-- These indexes accelerate the most common lookup and sorting operations on the dashboard and tabs.

-- Used heavily by the VaultBrowser to sort by recency
CREATE INDEX IF NOT EXISTS idx_vault_items_updated_at 
ON vault_items(updated_at DESC);

-- Used heavily by the VaultBrowser to filter by type
CREATE INDEX IF NOT EXISTS idx_vault_items_type 
ON vault_items(type);

-- Used to efficiently filter and order the workspace tabs on load
CREATE INDEX IF NOT EXISTS idx_workspace_documents_open_order 
ON workspace_documents(is_open, tab_order ASC);
