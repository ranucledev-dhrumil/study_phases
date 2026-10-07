-- Migration 002: Add is_open column to workspace_documents.
-- is_open = 1: the document is currently shown in the tab strip.
-- is_open = 0: the tab was closed; the content row is retained.
-- CHANGE 07 (session restore) uses WHERE is_open = 1 to reload the previous session.
-- DEFAULT 1 keeps all existing rows as "open" after the migration runs.
ALTER TABLE workspace_documents ADD COLUMN is_open INTEGER NOT NULL DEFAULT 1;
