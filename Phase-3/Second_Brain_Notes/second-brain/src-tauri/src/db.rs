//! Database layer — SQLite persistence via rusqlite + rusqlite_migration.
//!
//! Data directory : %APPDATA%\SecondBrain\
//! Database file  : %APPDATA%\SecondBrain\database.sqlite
//!
//! Migrations are tracked via PRAGMA user_version (rusqlite_migration).
//! init_db() is idempotent — safe to call on every app launch.
//!
//! To add a future schema change:
//!   1. Create src-tauri/migrations/002_<description>.sql
//!   2. Append M::up(include_str!("../migrations/002_<description>.sql"))
//!      to the vec in get_migrations() — do NOT modify 001_initial.sql.

use std::{fs, path::PathBuf, sync::Mutex};

use rusqlite::Connection;
use rusqlite_migration::{Migrations, M};

use crate::models::{ContentType, CursorState, ScrollState, VaultItem, WorkspaceDocument};

// ── Migrations ────────────────────────────────────────────────────────────

// Embed migration SQL at compile time — binary is fully self-contained.
const MIGRATION_001: &str = include_str!("../migrations/001_initial.sql");
const MIGRATION_002: &str = include_str!("../migrations/002_add_is_open.sql");
const MIGRATION_003: &str = include_str!("../migrations/003_indexes.sql");
const MIGRATION_004: &str = include_str!("../migrations/004_add_source_vault_item_id.sql");
const MIGRATION_005: &str = include_str!("../migrations/005_add_editor_zoom.sql");
const MIGRATION_006: &str = include_str!("../migrations/006_add_workspace_document_tags.sql");
const MIGRATION_007: &str = include_str!("../migrations/007_add_url_to_workspace_documents.sql");

/// Returns all migrations in application order.
/// Append new M::up(...) entries here for future schema changes.
fn get_migrations() -> Migrations<'static> {
    Migrations::new(vec![
        M::up(MIGRATION_001),
        M::up(MIGRATION_002),
        M::up(MIGRATION_003),
        M::up(MIGRATION_004),
        M::up(MIGRATION_005),
        M::up(MIGRATION_006),
        M::up(MIGRATION_007),
    ])
}

// ── Managed state ─────────────────────────────────────────────────────────

/// Tauri managed state wrapping the SQLite connection.
///
/// Mutex<Connection> is required because rusqlite::Connection is Send
/// but not Sync. All Tauri commands acquire this lock before querying.
pub struct DbState(pub Mutex<Connection>);

// ── Initialization ────────────────────────────────────────────────────────

/// Returns the path to %APPDATA%\SecondBrain.
fn data_dir() -> Result<PathBuf, String> {
    let appdata = std::env::var("APPDATA")
        .map_err(|_| "APPDATA environment variable not set".to_string())?;
    Ok(PathBuf::from(appdata).join("SecondBrain"))
}

/// Initializes the data directory structure and SQLite database.
/// Safe to call on every app launch — migrations are idempotent.
///
/// Creates (if missing):
///   %APPDATA%\SecondBrain\
///   %APPDATA%\SecondBrain\attachments\
///   %APPDATA%\SecondBrain\screenshots\
///   %APPDATA%\SecondBrain\exports\
///   %APPDATA%\SecondBrain\database.sqlite
pub fn init_db() -> Result<Connection, String> {
    let dir = data_dir()?;

    // Create directory tree. fs::create_dir_all is a no-op if the path exists.
    for sub in &["", "attachments", "screenshots", "exports"] {
        let path = if sub.is_empty() { dir.clone() } else { dir.join(sub) };
        fs::create_dir_all(&path)
            .map_err(|e| format!("Failed to create {:?}: {}", path, e))?;
    }

        let db_path = dir.join("database.sqlite");
    
    // If the file exists and is not empty, we MUST verify its integrity BEFORE running pragmas.
    // Running WAL pragma on a garbage text file might otherwise corrupt it or fail with a generic error.
    let is_existing_db = fs::metadata(&db_path).map(|m| m.len() > 0).unwrap_or(false);

    let mut conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database at {:?}: {}", db_path, e))?;

    if is_existing_db {
        // CHANGE 21: Fast integrity check on startup to prevent silent corruption propagation
        let integrity_check = conn.query_row("PRAGMA quick_check", [], |row| row.get::<_, String>(0));
        match integrity_check {
            Ok(res) if res.to_lowercase() != "ok" => {
                return Err(format!("CORRUPTION_DETECTED: {}", res));
            }
            Err(e) => {
                // This catches "file is not a database" and other SQLite decode errors
                return Err(format!("CORRUPTION_DETECTED: {}", e));
            }
            _ => {} // OK
        }
    }

    // WAL mode: readers don't block writers - better for future multi-window use.
    // busy_timeout=5000: wait up to 5s for locks to resolve concurrent writes (CHANGE 21).
    // foreign_keys: enforce ON DELETE CASCADE on vault_item_tags.
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;")
        .map_err(|e| format!("Failed to set PRAGMA: {}", e))?;

    // Apply any pending migrations. No-op when already at latest version.
    get_migrations()
        .to_latest(&mut conn)
        .map_err(|e| format!("Database migration failed: {}", e))?;

    Ok(conn)
}

// ── WorkspaceDocument ─────────────────────────────────────────────────────

/// Inserts a new workspace document.
/// The caller must ensure doc.id is a unique UUID v4 string.
pub fn insert_workspace_document(
    conn: &mut Connection,
    doc: &WorkspaceDocument,
) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    tx.execute(
        "INSERT INTO workspace_documents
         (id, title, body, suggested_type, tab_order, is_active,
          cursor_position, cursor_selection_start, cursor_selection_end,
          scroll_top, scroll_left, created_at, updated_at, source_vault_item_id, url)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)",
        rusqlite::params![
            doc.id,
            doc.title,
            doc.body,
            doc.suggested_type.to_db_str(),
            doc.tab_order,
            doc.is_active as i64,
            doc.cursor_state.position as i64,
            doc.cursor_state.selection_start as i64,
            doc.cursor_state.selection_end as i64,
            doc.scroll_state.scroll_top,
            doc.scroll_state.scroll_left,
            doc.created_at,
            doc.updated_at,
            doc.source_vault_item_id,
            doc.url,
        ],
    )
    .map_err(|e| format!("insert_workspace_document: {}", e))?;

    for tag in &doc.tags {
        tx.execute(
            "INSERT INTO workspace_document_tags (doc_id, tag) VALUES (?1, ?2)",
            rusqlite::params![doc.id, tag],
        )
        .map_err(|e| format!("insert_workspace_document_tags: {}", e))?;
    }
    
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

/// Returns all workspace documents ordered by tab_order ascending.
pub fn list_workspace_documents(conn: &Connection) -> Result<Vec<WorkspaceDocument>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, title, body, suggested_type, tab_order, is_active,
                    cursor_position, cursor_selection_start, cursor_selection_end,
                    scroll_top, scroll_left, created_at, updated_at, source_vault_item_id, url
             FROM workspace_documents
             ORDER BY tab_order ASC",
        )
        .map_err(|e| format!("list_workspace_documents prepare: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(WorkspaceDocument {
                id: row.get(0)?,
                title: row.get(1)?,
                body: row.get(2)?,
                suggested_type: ContentType::from_db_str(&row.get::<_, String>(3)?)
                    .unwrap_or(ContentType::Note),
                tab_order: row.get::<_, i64>(4)? as u32,
                is_active: row.get::<_, i64>(5)? != 0,
                cursor_state: CursorState {
                    position: row.get::<_, i64>(6)? as u64,
                    selection_start: row.get::<_, i64>(7)? as u64,
                    selection_end: row.get::<_, i64>(8)? as u64,
                },
                scroll_state: ScrollState {
                    scroll_top: row.get(9)?,
                    scroll_left: row.get(10)?,
                },
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                attachments: vec![],
                tags: vec![],
                source_vault_item_id: row.get(13)?,
                url: row.get(14)?,
            })
        })
        .map_err(|e| format!("list_workspace_documents query: {}", e))?;

    let mut docs = Vec::new();
    for doc_res in rows {
        docs.push(doc_res.map_err(|e| format!("list_workspace_documents collect: {}", e))?);
    }

    for doc in &mut docs {
        let mut tag_stmt = conn
            .prepare("SELECT tag FROM workspace_document_tags WHERE doc_id = ?1 ORDER BY tag ASC")
            .map_err(|e| format!("list_workspace_documents tags prepare: {}", e))?;
        let tag_rows = tag_stmt
            .query_map(rusqlite::params![doc.id], |row| row.get(0))
            .map_err(|e| format!("list_workspace_documents tags query: {}", e))?;
        let mut tags = Vec::new();
        for t in tag_rows {
            tags.push(t.map_err(|e| format!("list_workspace_documents tags collect: {}", e))?);
        }
        doc.tags = tags;
    }

    Ok(docs)
}

// ── VaultItem ─────────────────────────────────────────────────────────────

pub fn db_update_vault_item(
    conn: &Connection,
    id: &str,
    title: &str,
    body: &str,
    type_str: &str,
    now: &str,
) -> Result<(), String> {
    conn.execute(
        "UPDATE vault_items SET title = ?1, body = ?2, type = ?3, updated_at = ?4 WHERE id = ?5",
        rusqlite::params![title, body, type_str, now, id],
    )
    .map_err(|e| format!("db_update_vault_item: {}", e))?;
    Ok(())
}

pub fn db_delete_vault_item(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM vault_items WHERE id = ?1",
        rusqlite::params![id],
    )
    .map_err(|e| format!("db_delete_vault_item: {}", e))?;
    Ok(())
}

/// Returns all vault items ordered by updated_at descending (most recent first).
/// Tags are hydrated via a per-item SELECT (N+1 — acceptable at local desktop scale).
pub fn list_vault_items(conn: &Connection) -> Result<Vec<VaultItem>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, title, body, type, source_url, source_domain,
                    source_title, captured_at, created_at, updated_at
             FROM vault_items
             ORDER BY updated_at DESC",
        )
        .map_err(|e| format!("list_vault_items prepare: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(VaultItem {
                id: row.get(0)?,
                title: row.get(1)?,
                body: row.get(2)?,
                content_type: ContentType::from_db_str(&row.get::<_, String>(3)?)
                    .unwrap_or(ContentType::Note),
                source_url: row.get(4)?,
                source_domain: row.get(5)?,
                source_title: row.get(6)?,
                captured_at: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                tags: vec![],
                attachments: vec![],
            })
        })
        .map_err(|e| format!("list_vault_items query: {}", e))?;

    let mut items: Vec<VaultItem> = Vec::new();
    for item_res in rows {
        items.push(item_res.map_err(|e| format!("list_vault_items collect: {}", e))?);
    }

    // Hydrate tags for each item
    for item in &mut items {
        let mut tag_stmt = conn
            .prepare(
                "SELECT tag FROM vault_item_tags WHERE item_id = ?1 ORDER BY tag ASC",
            )
            .map_err(|e| format!("vault_item_tags prepare: {}", e))?;

        let tag_rows = tag_stmt
            .query_map(rusqlite::params![item.id], |row| row.get(0))
            .map_err(|e| format!("vault_item_tags query: {}", e))?;

        let mut tags = Vec::new();
        for tag_res in tag_rows {
            tags.push(tag_res.map_err(|e| format!("vault_item_tags collect: {}", e))?);
        }
        item.tags = tags;
    }

    Ok(items)
}

/// Searches vault items by text (title/body/tags/source fields) with optional
/// type and tag filters. All parameters are optional — empty query = no text filter.
/// Uses LIKE substring matching (case-insensitive via LOWER). Ordered by updated_at DESC.
///
/// Design note: LIKE is appropriate for a local single-user dataset.
/// SQLite FTS5 is noted as a future-follow if performance becomes relevant.
pub fn search_vault_items(
    conn: &Connection,
    query: &str,
    type_filter: Option<&str>,
    tag_filter: Option<&str>,
) -> Result<Vec<VaultItem>, String> {
    let pattern = format!("%{}%", query.to_lowercase());
    let empty_query = query.is_empty();
    let sql = "
        SELECT id, title, body, type, source_url, source_domain,
               source_title, captured_at, created_at, updated_at
        FROM vault_items
        WHERE
          -- Text search: skip entirely when query is empty
          (?1 OR (
            LOWER(COALESCE(title, ''))        LIKE ?2
            OR LOWER(COALESCE(body, ''))      LIKE ?2
            OR LOWER(COALESCE(source_domain,'')) LIKE ?2
            OR LOWER(COALESCE(source_url,'')) LIKE ?2
            OR LOWER(COALESCE(source_title,'')) LIKE ?2
            OR EXISTS (
                SELECT 1 FROM vault_item_tags
                WHERE item_id = vault_items.id
                AND LOWER(tag) LIKE ?2
            )
          ))
          -- Type filter: NULL = all types
          AND (?3 IS NULL OR type = ?3)
          -- Tag filter: NULL = all tags (exact match)
          AND (?4 IS NULL OR EXISTS (
              SELECT 1 FROM vault_item_tags
              WHERE item_id = vault_items.id AND tag = ?4
          ))
        ORDER BY updated_at DESC";
    let mut stmt = conn
        .prepare(sql)
        .map_err(|e| format!("search_vault_items prepare: {}", e))?;
    let rows = stmt
        .query_map(
            rusqlite::params![empty_query, pattern, type_filter, tag_filter],
            |row| {
                Ok(VaultItem {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    body: row.get(2)?,
                    content_type: ContentType::from_db_str(&row.get::<_, String>(3)?)
                        .unwrap_or(ContentType::Note),
                    source_url: row.get(4)?,
                    source_domain: row.get(5)?,
                    source_title: row.get(6)?,
                    captured_at: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                    tags: vec![],
                    attachments: vec![],
                })
            },
        )
        .map_err(|e| format!("search_vault_items query: {}", e))?;
    let mut items: Vec<VaultItem> = Vec::new();
    for item_res in rows {
        items.push(item_res.map_err(|e| format!("search_vault_items collect: {}", e))?);
    }
    // Hydrate tags (same N+1 pattern as list_vault_items — fine at local scale)
    for item in &mut items {
        let mut tag_stmt = conn
            .prepare("SELECT tag FROM vault_item_tags WHERE item_id = ?1 ORDER BY tag ASC")
            .map_err(|e| format!("search_vault_items tags prepare: {}", e))?;
        let tag_rows = tag_stmt
            .query_map(rusqlite::params![item.id], |row| row.get(0))
            .map_err(|e| format!("search_vault_items tags query: {}", e))?;
        let mut tags = Vec::new();
        for t in tag_rows {
            tags.push(t.map_err(|e| format!("search_vault_items tags collect: {}", e))?);
        }
        item.tags = tags;
    }
    Ok(items)
}

// ── CHANGE 05 additions ───────────────────────────────────────────────────

/// Returns only currently open workspace documents (is_open = 1) ordered by tab_order.
pub fn query_open_workspace_documents(conn: &Connection) -> Result<Vec<WorkspaceDocument>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, title, body, suggested_type, tab_order, is_active,
                    cursor_position, cursor_selection_start, cursor_selection_end,
                    scroll_top, scroll_left, created_at, updated_at, source_vault_item_id, url
             FROM workspace_documents
             WHERE is_open = 1
             ORDER BY tab_order ASC",
        )
        .map_err(|e| format!("query_open_workspace_documents prepare: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(WorkspaceDocument {
                id: row.get(0)?,
                title: row.get(1)?,
                body: row.get(2)?,
                suggested_type: ContentType::from_db_str(&row.get::<_, String>(3)?)
                    .unwrap_or(ContentType::Note),
                tab_order: row.get::<_, i64>(4)? as u32,
                is_active: row.get::<_, i64>(5)? != 0,
                cursor_state: CursorState {
                    position: row.get::<_, i64>(6)? as u64,
                    selection_start: row.get::<_, i64>(7)? as u64,
                    selection_end: row.get::<_, i64>(8)? as u64,
                },
                scroll_state: ScrollState {
                    scroll_top: row.get(9)?,
                    scroll_left: row.get(10)?,
                },
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                attachments: vec![],
                tags: vec![],
                source_vault_item_id: row.get(13)?,
                url: row.get(14)?,
            })
        })
        .map_err(|e| format!("query_open_workspace_documents query: {}", e))?;

    let mut docs = Vec::new();
    for doc_res in rows {
        docs.push(
            doc_res.map_err(|e| format!("query_open_workspace_documents collect: {}", e))?,
        );
    }
    
    // Hydrate tags for each document
    for doc in &mut docs {
        let mut tag_stmt = conn
            .prepare("SELECT tag FROM workspace_document_tags WHERE doc_id = ?1 ORDER BY tag ASC")
            .map_err(|e| format!("query_open_workspace_documents tags prepare: {}", e))?;
        let tag_rows = tag_stmt
            .query_map(rusqlite::params![doc.id], |row| row.get(0))
            .map_err(|e| format!("query_open_workspace_documents tags query: {}", e))?;
        let mut tags = Vec::new();
        for t in tag_rows {
            tags.push(t.map_err(|e| format!("query_open_workspace_documents tags collect: {}", e))?);
        }
        doc.tags = tags;
    }
    
    Ok(docs)
}

/// Updates the title of a workspace document.
pub fn db_rename_workspace_document(
    conn: &Connection,
    id: &str,
    title: &str,
    now: &str,
) -> Result<(), String> {
    conn.execute(
        "UPDATE workspace_documents SET title = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![title, now, id],
    )
    .map_err(|e| format!("db_rename_workspace_document: {}", e))?;
    Ok(())
}

/// Writes the current body content of a workspace document to the database.
pub fn db_update_body(
    conn: &Connection,
    id: &str,
    body: &str,
    now: &str,
) -> Result<(), String> {
    conn.execute(
        "UPDATE workspace_documents SET body = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![body, now, id],
    )
    .map_err(|e| format!("db_update_body: {}", e))?;
    Ok(())
}

/// Updates the suggested_type of a workspace document.
pub fn db_update_workspace_document_type(
    conn: &Connection,
    id: &str,
    type_str: &str,
    now: &str,
) -> Result<(), String> {
    conn.execute(
        "UPDATE workspace_documents SET suggested_type = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![type_str, now, id],
    )
    .map_err(|e| format!("db_update_workspace_document_type: {}", e))?;
    Ok(())
}

/// Sets is_active = 1 for `id`, is_active = 0 for all other open documents.
pub fn db_set_active_tab(conn: &mut Connection, id: &str, now: &str) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    tx.execute(
        "UPDATE workspace_documents SET is_active = 0, updated_at = ?1 WHERE is_open = 1",
        rusqlite::params![now],
    )
    .map_err(|e| format!("db_set_active_tab clear: {}", e))?;
    
    tx.execute(
        "UPDATE workspace_documents SET is_active = 1, updated_at = ?1 WHERE id = ?2",
        rusqlite::params![now, id],
    )
    .map_err(|e| format!("db_set_active_tab set: {}", e))?;
    
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

/// Batch-updates tab_order for multiple documents. Wrapped in a transaction.
pub fn db_reorder_tabs(
    conn: &mut Connection,
    orders: &[(String, u32)],
    now: &str,
) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    for (id, order) in orders {
        tx.execute(
            "UPDATE workspace_documents SET tab_order = ?1, updated_at = ?2 WHERE id = ?3",
            rusqlite::params![order, now, id],
        )
        .map_err(|e| format!("db_reorder_tabs: {}", e))?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

/// Saves the body and marks a tab closed (is_open = 0, is_active = 0).
/// The row is NOT deleted — content is retained per product spec.
pub fn db_close_tab(
    conn: &Connection,
    id: &str,
    body: &str,
    now: &str,
) -> Result<(), String> {
    conn.execute(
        "UPDATE workspace_documents
         SET body = ?1, is_open = 0, is_active = 0, updated_at = ?2
         WHERE id = ?3",
        rusqlite::params![body, now, id],
    )
    .map_err(|e| format!("db_close_tab: {}", e))?;
    Ok(())
}

// ── CHANGE 06 additions ───────────────────────────────────────────────────

/// Persists body, cursor, and scroll state for a workspace document.
/// Called by the 500ms autosave debounce and all flush boundaries
/// (tab switch, tab close, window visibility-change).
pub fn db_save_workspace_document(
    conn: &Connection,
    id: &str,
    body: &str,
    cursor_position: u64,
    cursor_selection_start: u64,
    cursor_selection_end: u64,
    scroll_top: f64,
    scroll_left: f64,
    url: Option<&str>,
    now: &str,
) -> Result<(), String> {
    conn.execute(
        "UPDATE workspace_documents
         SET body                  = ?1,
             cursor_position       = ?2,
             cursor_selection_start = ?3,
             cursor_selection_end   = ?4,
             scroll_top            = ?5,
             scroll_left           = ?6,
             updated_at            = ?7,
             url                   = ?8
         WHERE id = ?9",
        rusqlite::params![
            body,
            cursor_position as i64,
            cursor_selection_start as i64,
            cursor_selection_end as i64,
            scroll_top,
            scroll_left,
            now,
            url.map(|s| s.trim()).filter(|s| !s.is_empty()),
            id,
        ],
    )
    .map_err(|e| format!("db_save_workspace_document: {}", e))?;
    Ok(())
}

/// Marks a tab as closed (is_open = 0, is_active = 0).
/// Content must be saved separately via db_save_workspace_document before calling this.
pub fn db_mark_tab_closed(conn: &Connection, id: &str, now: &str) -> Result<(), String> {
    conn.execute(
        "UPDATE workspace_documents
         SET is_open = 0, is_active = 0, updated_at = ?1
         WHERE id = ?2",
        rusqlite::params![now, id],
    )
    .map_err(|e| format!("db_mark_tab_closed: {}", e))?;
    Ok(())
}

// ── CHANGE 15: AppSettings queries ────────────────────────────────────────

/// Reads the single app_settings row (always exists, seeded in migration 001).
/// Falls back to AppSettings::default() at the call site if this fails.
pub fn read_app_settings(conn: &Connection) -> Result<crate::models::AppSettings, String> {
    conn.query_row(
        "SELECT capture_hotkey_modifiers, capture_hotkey_key,
                theme, data_directory_path, confirm_workspace_close, editor_zoom
         FROM app_settings WHERE id = 1",
        [],
        |row| {
            let modifiers_str: String = row.get(0)?;
            let key: String = row.get(1)?;
            let theme: String = row.get(2)?;
            let data_dir: Option<String> = row.get(3)?;
            let confirm: i64 = row.get(4)?;
            let zoom: i64 = row.get(5)?;
            Ok(crate::models::AppSettings {
                capture_hotkey: crate::models::Hotkey {
                    modifiers: modifiers_str
                        .split(',')
                        .map(|s| s.trim().to_string())
                        .collect(),
                    key,
                },
                theme,
                data_directory_path: data_dir,
                confirm_workspace_close: confirm != 0,
                editor_zoom: zoom as u32,
            })
        },
    )
    .map_err(|e| format!("read_app_settings: {}", e))
}

/// Updates the single app_settings row (id = 1).
pub fn db_update_app_settings(
    conn: &mut Connection,
    settings: &crate::models::AppSettings,
) -> Result<(), String> {
    let modifiers_str = settings.capture_hotkey.modifiers.join(",");
    let confirm = if settings.confirm_workspace_close { 1 } else { 0 };

    conn.execute(
        "UPDATE app_settings
         SET capture_hotkey_modifiers = ?1,
             capture_hotkey_key = ?2,
             theme = ?3,
             confirm_workspace_close = ?4,
             editor_zoom = ?5
         WHERE id = 1",
        rusqlite::params![
            modifiers_str,
            settings.capture_hotkey.key,
            settings.theme,
            confirm,
            settings.editor_zoom as i64,
        ],
    )
    .map_err(|e| format!("db_update_app_settings: {}", e))?;
    
    Ok(())
}

// ── CHANGE 19: Direct Vault Creation from Browser Capture ─────────────────

/// Creates a VaultItem directly in the database from a BrowserCapture message (CHANGE 19).
/// Returns (item_id, item_type).
pub fn db_create_vault_item_from_browser(
    conn: &Connection,
    payload: &crate::models::BrowserCapture,
) -> Result<(String, String), String> {
    use chrono::Utc;
    use uuid::Uuid;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let has_selection = payload
        .selected_text
        .as_ref()
        .map(|s| !s.trim().is_empty())
        .unwrap_or(false);

    let vault_type = if has_selection {
        crate::detector::detect_content_type(payload.selected_text.as_deref().unwrap_or(""))
    } else {
        "link"
    };
    let body = payload.selected_text.clone().unwrap_or_default();

    // CHANGE 28: Duplicate detection (prevent rapid multiple saves)
    {
        let mut stmt = conn.prepare("SELECT id, created_at FROM vault_items WHERE IFNULL(source_url, '') = IFNULL(?1, '') AND body = ?2 ORDER BY rowid DESC LIMIT 1").unwrap();
        let mut rows = stmt.query(rusqlite::params![payload.url, body]).unwrap();
        if let Ok(Some(row)) = rows.next() {
            let existing_id: String = row.get(0).unwrap();
            let existing_created_at: String = row.get(1).unwrap();
            if let Ok(parsed_time) = chrono::DateTime::parse_from_rfc3339(&existing_created_at) {
                if chrono::Utc::now().signed_duration_since(parsed_time.with_timezone(&chrono::Utc)).num_seconds() < 5 {
                    return Ok((existing_id, vault_type.to_string()));
                }
            }
        }
    }

    let source_domain = payload.url.as_ref().and_then(|u| {
        let trimmed = u.trim();
        let without_proto = if let Some(stripped) = trimmed.strip_prefix("https://") {
            stripped
        } else if let Some(stripped) = trimmed.strip_prefix("http://") {
            stripped
        } else {
            trimmed
        };
        let host = without_proto.split('/').next().unwrap_or(without_proto);
        let host = host.split(':').next().unwrap_or(host);
        if host.is_empty() {
            None
        } else {
            Some(host.to_string())
        }
    });

    let title = payload
        .title
        .as_ref()
        .map(|t| t.trim().to_string())
        .filter(|t| !t.is_empty())
        .or_else(|| source_domain.as_ref().map(|d| format!("Page from {}", d)))
        .unwrap_or_else(|| "Untitled Capture".to_string());

    let captured_at = match payload.timestamp {
        Some(ms) => chrono::DateTime::from_timestamp_millis(ms)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_else(|| now.clone()),
        None => now.clone(),
    };

    conn.execute(
        "INSERT INTO vault_items
         (id, title, body, type, source_url, source_domain,
          source_title, captured_at, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        rusqlite::params![
            id,
            title,
            body,
            vault_type,
            payload.url,
            source_domain,
            payload.title,
            captured_at,
            now,
            now
        ],
    )
    .map_err(|e| format!("db_create_vault_item_from_browser: {}", e))?;

    Ok((id, vault_type.to_string()))
}

// ── Tag functionality ───────────────────────────────────────────────────

pub fn db_update_workspace_document_tags(
    conn: &mut Connection,
    doc_id: &str,
    tags: &[String],
) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "DELETE FROM workspace_document_tags WHERE doc_id = ?1",
        rusqlite::params![doc_id],
    )
    .map_err(|e| format!("db_update_workspace_document_tags delete: {}", e))?;

    for tag in tags {
        tx.execute(
            "INSERT INTO workspace_document_tags (doc_id, tag) VALUES (?1, ?2)",
            rusqlite::params![doc_id, tag],
        )
        .map_err(|e| format!("db_update_workspace_document_tags insert: {}", e))?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

pub fn db_update_vault_item_tags(
    conn: &mut Connection,
    item_id: &str,
    tags: &[String],
) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "DELETE FROM vault_item_tags WHERE item_id = ?1",
        rusqlite::params![item_id],
    )
    .map_err(|e| format!("db_update_vault_item_tags delete: {}", e))?;

    for tag in tags {
        tx.execute(
            "INSERT INTO vault_item_tags (item_id, tag) VALUES (?1, ?2)",
            rusqlite::params![item_id, tag],
        )
        .map_err(|e| format!("db_update_vault_item_tags insert: {}", e))?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

pub fn db_get_all_tags(conn: &Connection) -> Result<Vec<String>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT tag FROM vault_item_tags 
             UNION 
             SELECT tag FROM workspace_document_tags 
             ORDER BY tag ASC",
        )
        .map_err(|e| format!("db_get_all_tags prepare: {}", e))?;

    let rows = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| format!("db_get_all_tags query: {}", e))?;

    let mut tags = Vec::new();
    for t in rows {
        tags.push(t.map_err(|e| format!("db_get_all_tags collect: {}", e))?);
    }
    Ok(tags)
}




