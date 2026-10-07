-- Migration 001: Initial schema — Second Brain domain model
-- ─────────────────────────────────────────────────────────────────────────
-- workspace_documents and vault_items are SEPARATE tables by design.
-- Do NOT merge them. See CHANGE 03 / src/types/index.ts for rationale.
--
-- Primary keys are TEXT UUIDs (not auto-increment integers) so that future
-- multi-device sync does not require key remapping.
--
-- Tracked by PRAGMA user_version via rusqlite_migration.
-- To add a schema change: append M::up("...") in db.rs::get_migrations() ONLY.
-- Never modify this file once applied to any real database.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE workspace_documents (
    id                     TEXT    PRIMARY KEY NOT NULL,
    title                  TEXT    NOT NULL DEFAULT '',
    body                   TEXT    NOT NULL DEFAULT '',
    -- ContentType string literal: 'note' | 'codeSnippet' | 'link' | 'image' | 'file'
    suggested_type         TEXT    NOT NULL DEFAULT 'note',
    tab_order              INTEGER NOT NULL DEFAULT 0,
    -- SQLite has no BOOLEAN; use INTEGER 0/1
    is_active              INTEGER NOT NULL DEFAULT 0,
    -- CursorState flattened (see CHANGE 03 WorkspaceDocument)
    cursor_position        INTEGER NOT NULL DEFAULT 0,
    cursor_selection_start INTEGER NOT NULL DEFAULT 0,
    cursor_selection_end   INTEGER NOT NULL DEFAULT 0,
    -- ScrollState flattened
    scroll_top             REAL    NOT NULL DEFAULT 0.0,
    scroll_left            REAL    NOT NULL DEFAULT 0.0,
    -- ISO 8601 UTC strings (matches TypeScript createdAt/updatedAt)
    created_at             TEXT    NOT NULL,
    updated_at             TEXT    NOT NULL
);

CREATE INDEX idx_workspace_docs_tab_order ON workspace_documents(tab_order);

-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE vault_items (
    id            TEXT PRIMARY KEY NOT NULL,
    title         TEXT NOT NULL DEFAULT '',
    body          TEXT NOT NULL DEFAULT '',
    -- ContentType string literal (same values as workspace suggested_type)
    type          TEXT NOT NULL DEFAULT 'note',
    -- Source / provenance metadata — required for CHANGE 18-20 browser integration.
    -- Optional: NULL when the item was not saved from a URL.
    source_url    TEXT,
    source_domain TEXT,
    source_title  TEXT,
    captured_at   TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);

CREATE INDEX idx_vault_items_title ON vault_items(title);
CREATE INDEX idx_vault_items_type  ON vault_items(type);

-- Tags join table — separate from vault_items to support proper tag-based
-- filtering in CHANGE 11/12. PRIMARY KEY (item_id, tag) prevents duplicates.
-- ON DELETE CASCADE removes tags automatically when the parent vault item is deleted.
CREATE TABLE vault_item_tags (
    item_id TEXT NOT NULL,
    tag     TEXT NOT NULL,
    PRIMARY KEY (item_id, tag),
    FOREIGN KEY (item_id) REFERENCES vault_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_vault_item_tags_tag ON vault_item_tags(tag);

-- ─────────────────────────────────────────────────────────────────────────

-- Single-row settings table. CHECK (id = 1) enforces the invariant.
-- Hotkey stored split: modifiers as comma-separated string.
-- Defaults match DEFAULT_SETTINGS in src/types/settings.ts.
CREATE TABLE app_settings (
    id                       INTEGER PRIMARY KEY DEFAULT 1
                             CHECK (id = 1),
    capture_hotkey_modifiers TEXT    NOT NULL DEFAULT 'ctrl,shift',
    capture_hotkey_key       TEXT    NOT NULL DEFAULT 's',
    -- Theme: 'dark' | 'light' | 'system'
    theme                    TEXT    NOT NULL DEFAULT 'dark',
    -- NULL = use platform default (%APPDATA%\SecondBrain)
    data_directory_path      TEXT,
    confirm_workspace_close  INTEGER NOT NULL DEFAULT 1
);

-- Seed the single settings row immediately.
INSERT INTO app_settings (id) VALUES (1);

-- ─────────────────────────────────────────────────────────────────────────

-- Attachment metadata — schema only in v1; nothing creates attachments yet.
-- Polymorphic owner: owner_type IN ('workspace', 'vault') discriminates
-- whether owner_id references workspace_documents or vault_items.
-- A SQL FOREIGN KEY to two tables is not possible; this is the standard pattern.
CREATE TABLE attachments (
    id          TEXT    PRIMARY KEY NOT NULL,
    owner_id    TEXT    NOT NULL,
    owner_type  TEXT    NOT NULL CHECK (owner_type IN ('workspace', 'vault')),
    local_path  TEXT    NOT NULL,
    mime_type   TEXT    NOT NULL,
    size_bytes  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL
);

CREATE INDEX idx_attachments_owner ON attachments(owner_id, owner_type);
