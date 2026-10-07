pub mod db;
pub mod models;
pub mod detector;

use tauri::{Emitter, Manager};

#[cfg(target_os = "windows")]
use window_vibrancy::apply_mica;

// ── CHANGE 05: TabOrderUpdate ─────────────────────────────────────────────

/// Payload item for the reorder_tabs command.
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct TabOrderUpdate {
    id: String,
    tab_order: u32,
}

// ── CHANGE 06: SaveContentPayload ─────────────────────────────────────────

/// Full content payload for save_workspace_document.
/// Uses camelCase serde rename so TypeScript can send idiomatic camelCase keys.
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaveContentPayload {
    id: String,
    body: String,
    cursor_position: u64,
    cursor_selection_start: u64,
    cursor_selection_end: u64,
    scroll_top: f64,
    scroll_left: f64,
    url: Option<String>,
}

// ── CHANGE 04 commands ────────────────────────────────────────────────────

/// Inserts a workspace document (CHANGE 04 test command — kept for compatibility).
#[tauri::command]
fn create_workspace_document(
    state: tauri::State<db::DbState>,
    doc: models::WorkspaceDocument,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::insert_workspace_document(&mut conn, &doc)
}

/// Returns all workspace documents regardless of open state (CHANGE 04 test command).
#[tauri::command]
fn list_workspace_documents(
    state: tauri::State<db::DbState>,
) -> Result<Vec<models::WorkspaceDocument>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::list_workspace_documents(&conn)
}

/// Inserts a vault item with tags atomically.
#[tauri::command]
fn create_vault_item(
    state: tauri::State<db::DbState>,
    item: models::VaultItem,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let tx = guard.transaction().map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO vault_items
         (id, title, body, type, source_url, source_domain,
          source_title, captured_at, created_at, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        rusqlite::params![
            item.id, item.title, item.body,
            item.content_type.to_db_str(),
            item.source_url, item.source_domain,
            item.source_title, item.captured_at,
            item.created_at, item.updated_at,
        ],
    )
    .map_err(|e| e.to_string())?;

    for tag in &item.tags {
        tx.execute(
            "INSERT OR IGNORE INTO vault_item_tags (item_id, tag) VALUES (?1, ?2)",
            rusqlite::params![item.id, tag],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())
}

/// Returns all vault items with tags hydrated.
#[tauri::command]
fn list_vault_items(
    state: tauri::State<db::DbState>,
) -> Result<Vec<models::VaultItem>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::list_vault_items(&conn)
}

// ── CHANGE 05 commands ────────────────────────────────────────────────────

/// Returns all currently open workspace documents (is_open = 1) ordered by tab_order.
#[tauri::command]
fn open_workspace_documents(
    state: tauri::State<db::DbState>,
) -> Result<Vec<models::WorkspaceDocument>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::query_open_workspace_documents(&conn)
}

/// Creates a new workspace document with a server-generated UUID.
#[tauri::command]
fn new_workspace_document(
    state: tauri::State<db::DbState>,
    title: String,
) -> Result<models::WorkspaceDocument, String> {
    use chrono::Utc;
    use uuid::Uuid;

    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let tx = guard.transaction().map_err(|e| e.to_string())?;

    let tab_order: u32 = tx
        .query_row(
            "SELECT COALESCE(MAX(tab_order) + 1, 0) FROM workspace_documents WHERE is_open = 1",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|e| e.to_string())? as u32;

    tx.execute(
        "UPDATE workspace_documents SET is_active = 0 WHERE is_open = 1",
        [],
    )
    .map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO workspace_documents
         (id, title, body, suggested_type, tab_order, is_active, is_open,
          cursor_position, cursor_selection_start, cursor_selection_end,
          scroll_top, scroll_left, created_at, updated_at, source_vault_item_id)
         VALUES (?1, ?2, '', 'note', ?3, 1, 1, 0, 0, 0, 0.0, 0.0, ?4, ?4, NULL)",
        rusqlite::params![id, title, tab_order, now],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(models::WorkspaceDocument {
        id,
        title,
        body: String::new(),
        suggested_type: models::ContentType::Note,
        tab_order: tab_order as u32,
        is_active: true,
        cursor_state: models::CursorState { position: 0, selection_start: 0, selection_end: 0 },
        scroll_state: models::ScrollState { scroll_top: 0.0, scroll_left: 0.0 },
        created_at: now.clone(),
        updated_at: now,
        attachments: vec![],
        tags: vec![],
        source_vault_item_id: None,
        url: None,
    })
}



#[tauri::command]
fn rename_workspace_document(
    state: tauri::State<db::DbState>,
    id: String,
    title: String,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_rename_workspace_document(&mut conn, &id, &title, &now)
}

#[tauri::command]
fn update_workspace_document_body(
    state: tauri::State<db::DbState>,
    id: String,
    body: String,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_update_body(&mut conn, &id, &body, &now)
}

#[tauri::command]
fn update_workspace_document_type(
    state: tauri::State<db::DbState>,
    id: String,
    suggested_type: String,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_update_workspace_document_type(&mut conn, &id, &suggested_type, &now)
}

#[tauri::command]
fn set_active_tab(
    state: tauri::State<db::DbState>,
    id: String,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_set_active_tab(&mut conn, &id, &now)
}

#[tauri::command]
fn reorder_tabs(
    state: tauri::State<db::DbState>,
    updates: Vec<TabOrderUpdate>,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    let orders: Vec<(String, u32)> = updates.into_iter().map(|u| (u.id, u.tab_order)).collect();
    db::db_reorder_tabs(&mut conn, &orders, &now)
}

#[tauri::command]
fn close_tab(
    state: tauri::State<db::DbState>,
    id: String,
    body: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_close_tab(&conn, &id, &body, &now)
}

#[tauri::command]
fn save_workspace_document(
    state: tauri::State<db::DbState>,
    payload: SaveContentPayload,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_save_workspace_document(
        &conn,
        &payload.id,
        &payload.body,
        payload.cursor_position,
        payload.cursor_selection_start,
        payload.cursor_selection_end,
        payload.scroll_top,
        payload.scroll_left,
        payload.url.as_deref(),
        &now,
    )
}

#[tauri::command]
fn mark_tab_closed(
    state: tauri::State<db::DbState>,
    id: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    db::db_mark_tab_closed(&conn, &id, &now)
}



pub fn save_workspace_document_to_vault_inner(
    id: String,
    conn: &mut rusqlite::Connection,
) -> Result<String, String> {
    use chrono::Utc;
    use uuid::Uuid;

    let tx = conn
        .transaction()
        .map_err(|e| format!("save_workspace_document_to_vault transaction: {}", e))?;

    let (title, body, type_str, source_vault_item_id, doc_url): (String, String, String, Option<String>, Option<String>) = tx
        .query_row(
            "SELECT title, body, suggested_type, source_vault_item_id, url FROM workspace_documents WHERE id = ?1",
            rusqlite::params![id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
        )
        .map_err(|e| format!("save_workspace_document_to_vault read: {}", e))?;

    let vault_type_str = match crate::models::ContentType::from_db_str(&type_str)
        .unwrap_or(crate::models::ContentType::Note)
    {
        crate::models::ContentType::CodeSnippet => "codeSnippet",
        crate::models::ContentType::Link        => "link",
        _                                       => "note",
    };

    let mut tag_stmt = tx.prepare("SELECT tag FROM workspace_document_tags WHERE doc_id = ?1").unwrap();
    let tag_rows = tag_stmt.query_map(rusqlite::params![id], |row| row.get::<_, String>(0)).unwrap();
    let mut tags = Vec::new();
    for t in tag_rows.flatten() {
        tags.push(t);
    }
    drop(tag_stmt);

    let now = Utc::now().to_rfc3339();
    
    let (link_source_url, link_source_domain) = if vault_type_str == "link" {
        let u_opt = doc_url.as_ref().map(|s| s.trim()).filter(|s| !s.is_empty());
        let domain = u_opt.and_then(|trimmed| {
            let without_proto = if let Some(stripped) = trimmed.strip_prefix("https://") {
                stripped
            } else if let Some(stripped) = trimmed.strip_prefix("http://") {
                stripped
            } else {
                trimmed
            };
            without_proto.split('/').next().map(|s| s.to_string())
        });
        (u_opt.map(|s| s.to_string()), domain)
    } else {
        (None, None)
    };

    let target_vault_id = if let Some(vault_id) = source_vault_item_id {
        tx.execute(
            "UPDATE vault_items SET title = ?1, body = ?2, type = ?3, updated_at = ?4, source_url = COALESCE(?5, source_url), source_domain = COALESCE(?6, source_domain) WHERE id = ?7",
            rusqlite::params![title, body, vault_type_str, now, link_source_url, link_source_domain, vault_id.clone()],
        )
        .map_err(|e| format!("save_workspace_document_to_vault update: {}", e))?;
        vault_id
    } else {
        let vault_id = Uuid::new_v4().to_string();
        tx.execute(
            "INSERT INTO vault_items
             (id, title, body, type, source_url, source_domain,
              source_title, captured_at, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, NULL, ?7, ?8)",
            rusqlite::params![vault_id, title, body, vault_type_str, link_source_url, link_source_domain, now.clone(), now],
        )
        .map_err(|e| format!("save_workspace_document_to_vault insert: {}", e))?;

        // Link the workspace document to the new vault item
        tx.execute(
            "UPDATE workspace_documents SET source_vault_item_id = ?1 WHERE id = ?2",
            rusqlite::params![vault_id, id],
        )
        .map_err(|e| format!("save_workspace_document_to_vault link: {}", e))?;

        vault_id
    };

    tx.execute("DELETE FROM vault_item_tags WHERE item_id = ?1", rusqlite::params![target_vault_id])
        .map_err(|e| format!("save_workspace_document_to_vault delete tags: {}", e))?;
    
    for tag in tags {
        tx.execute(
            "INSERT INTO vault_item_tags (item_id, tag) VALUES (?1, ?2)",
            rusqlite::params![target_vault_id, tag],
        )
        .map_err(|e| format!("save_workspace_document_to_vault insert tags: {}", e))?;
    }

    tx.commit()
        .map_err(|e| format!("save_workspace_document_to_vault commit: {}", e))?;

    Ok(target_vault_id)
}


#[tauri::command]
fn save_workspace_document_to_vault(
    id: String,
    state: tauri::State<db::DbState>,
) -> Result<String, String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    save_workspace_document_to_vault_inner(id, &mut guard)
}

/// Renames the workspace document first (so dialog-confirmed title is the source of truth
/// for both the workspace tab and the vault item), then saves to vault.
#[tauri::command]
fn save_workspace_document_to_vault_with_title(
    id: String,
    title: String,
    state: tauri::State<db::DbState>,
) -> Result<String, String> {
    use chrono::Utc;
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    // Update the workspace document's title first — makes dialog title single source of truth.
    db::db_rename_workspace_document(&mut guard, &id, &title, &now)?;
    // Now save to vault (reads the updated title from DB).
    save_workspace_document_to_vault_inner(id, &mut guard)
}


#[tauri::command]
fn delete_vault_item(id: String, state: tauri::State<db::DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::db_delete_vault_item(&conn, &id)
}

#[tauri::command]
fn export_vault_item(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content.as_bytes())
        .map_err(|e| format!("export failed: {}", e))
}

#[tauri::command]
fn update_workspace_document_tags(
    id: String,
    tags: Vec<String>,
    state: tauri::State<db::DbState>,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::db_update_workspace_document_tags(&mut conn, &id, &tags)
}

#[tauri::command]
fn update_vault_item_tags(
    id: String,
    tags: Vec<String>,
    state: tauri::State<db::DbState>,
) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::db_update_vault_item_tags(&mut conn, &id, &tags)
}

#[tauri::command]
fn get_all_tags(
    state: tauri::State<db::DbState>,
) -> Result<Vec<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::db_get_all_tags(&conn)
}

#[tauri::command]
fn search_vault_items(
    state: tauri::State<db::DbState>,
    query: String,
    content_type: Option<String>,
    tag: Option<String>,
) -> Result<Vec<models::VaultItem>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::search_vault_items(&conn, &query, content_type.as_deref(), tag.as_deref())
}


#[derive(serde::Serialize)]
#[serde(tag = "kind")]
pub enum ClipboardCaptureResult {
    #[serde(rename = "text")]
    Text { content: String },
    #[serde(rename = "empty")]
    Empty,
}
impl ClipboardCaptureResult {
    pub fn kind_label(&self) -> &str {
        match self {
            Self::Text { .. } => "text",
            Self::Empty => "empty",
        }
    }
}

pub fn read_clipboard_inner() -> ClipboardCaptureResult {
    if let Ok(mut clipboard) = arboard::Clipboard::new() {
        if let Ok(text) = clipboard.get_text() {
            let text = text.trim().to_string();
            if !text.is_empty() {
                return ClipboardCaptureResult::Text { content: text };
            }
        }
    }
    ClipboardCaptureResult::Empty
}

#[tauri::command]
fn read_clipboard() -> ClipboardCaptureResult {
    read_clipboard_inner()
}

#[tauri::command]
fn get_app_settings(
    state: tauri::State<db::DbState>,
) -> Result<models::AppSettings, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::read_app_settings(&conn).map_err(|e| e.to_string())
}


fn get_capture_handler(app_handle: tauri::AppHandle) -> impl Fn(&tauri::AppHandle, &tauri_plugin_global_shortcut::Shortcut, tauri_plugin_global_shortcut::ShortcutEvent) + Send + Sync + 'static {
    use tauri_plugin_global_shortcut::ShortcutState;
    use tauri::Emitter;
    
    move |_, _shortcut, event| {
        if event.state() == ShortcutState::Pressed {
            
            // Simulate Ctrl+C to copy highlighted text automatically via Win32 API
            #[cfg(target_os = "windows")]
            {
                use windows::Win32::UI::Input::KeyboardAndMouse::{
                    keybd_event, KEYBD_EVENT_FLAGS, KEYEVENTF_KEYUP, 
                    VK_CONTROL, VK_MENU, VK_SHIFT, VK_LWIN, VK_RWIN, VK_C
                };
                unsafe {
                    // Force release all modifiers that the user might be holding down for the hotkey
                    keybd_event(VK_MENU.0 as u8, 0, KEYEVENTF_KEYUP, 0);
                    keybd_event(VK_CONTROL.0 as u8, 0, KEYEVENTF_KEYUP, 0);
                    keybd_event(VK_SHIFT.0 as u8, 0, KEYEVENTF_KEYUP, 0);
                    keybd_event(VK_LWIN.0 as u8, 0, KEYEVENTF_KEYUP, 0);
                    keybd_event(VK_RWIN.0 as u8, 0, KEYEVENTF_KEYUP, 0);

                    // Send Ctrl+C
                    keybd_event(VK_CONTROL.0 as u8, 0, KEYBD_EVENT_FLAGS(0), 0);
                    keybd_event(VK_C.0 as u8, 0, KEYBD_EVENT_FLAGS(0), 0);
                    keybd_event(VK_C.0 as u8, 0, KEYEVENTF_KEYUP, 0);
                    keybd_event(VK_CONTROL.0 as u8, 0, KEYEVENTF_KEYUP, 0);
                }
                
                // Give the target application (like Chrome) enough time to process Ctrl+C and write to clipboard
                std::thread::sleep(std::time::Duration::from_millis(200));
            }
            
            let result = read_clipboard_inner();
            app_handle.emit("capture-hotkey-triggered", &result).ok();
            
            // Bring app to foreground automatically
            use tauri::Manager;
            if let Some(window) = app_handle.get_webview_window("main") {
                window.unminimize().ok();
                window.show().ok();
                window.set_focus().ok();
            }
            
            println!("[CHANGE 15/16] capture-hotkey-triggered emitted ({})", result.kind_label());
        }
    }
}

fn try_re_register_hotkey(app: &tauri::AppHandle, shortcut_str: &str, old_shortcut_str: Option<&str>) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
    
    let shortcut: Shortcut = shortcut_str.parse().map_err(|e| format!("Invalid hotkey format: {}", e))?;
    
    // Unregister any existing hotkey first
    let _ = app.global_shortcut().unregister_all();
    
    // Attempt to register the new one with a bound handler
    if let Err(e) = app.global_shortcut().on_shortcut(shortcut, get_capture_handler(app.clone())) {
        // If it fails, attempt to restore the fallback if provided
        if let Some(old_str) = old_shortcut_str {
            if let Ok(old_shortcut) = old_str.parse::<Shortcut>() {
                let _ = app.global_shortcut().on_shortcut(old_shortcut, get_capture_handler(app.clone()));
            }
        }
        return Err(format!("Failed to register hotkey '{}': {} (another app may already own this combination)", shortcut_str, e));
    }
        
    Ok(())
}

#[tauri::command]
fn update_app_settings(
    app: tauri::AppHandle,
    state: tauri::State<db::DbState>,
    settings: models::AppSettings,
) -> Result<(), String> {
    let shortcut_str = hotkey_to_shortcut_str(&settings.capture_hotkey);
    
    let old_shortcut_str = {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        db::read_app_settings(&conn).ok().map(|s| hotkey_to_shortcut_str(&s.capture_hotkey))
    };
    
    try_re_register_hotkey(&app, &shortcut_str, old_shortcut_str.as_deref())?;
    
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::db_update_app_settings(&mut conn, &settings)
}




#[tauri::command]
fn open_vault_item_for_edit(
    source_vault_item_id: String,
    state: tauri::State<db::DbState>,
) -> Result<models::WorkspaceDocument, String> {
    use chrono::Utc;
    use uuid::Uuid;

    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();

    let tx = guard.transaction().map_err(|e| format!("open_vault_item_for_edit tx: {}", e))?;

    let (title, body, type_str, source_url): (String, String, String, Option<String>) = tx
        .query_row(
            "SELECT title, body, type, source_url FROM vault_items WHERE id = ?1",
            rusqlite::params![source_vault_item_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .map_err(|e| format!("open_vault_item_for_edit read: {}", e))?;

    let suggested_type = match type_str.as_str() {
        "codeSnippet" => "codeSnippet",
        "link" => "link",
        _ => "note",
    };

    let max_order: Option<i64> = tx
        .query_row(
            "SELECT MAX(tab_order) FROM workspace_documents",
            [],
            |row| row.get(0),
        )
        .ok()
        .flatten();
    let tab_order = max_order.map(|o| o + 1).unwrap_or(0);

    let url_for_workspace = if suggested_type == "link" {
        source_url
    } else {
        None
    };

    tx.execute(
        "INSERT INTO workspace_documents
         (id, title, body, suggested_type, tab_order,
          cursor_position, cursor_selection_start, cursor_selection_end,
          scroll_top, scroll_left, is_active, is_open, source_vault_item_id, url, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 0, 0, 0, 0.0, 0.0, 1, 1, ?6, ?7, ?8, ?8)",
        rusqlite::params![
            id,
            title,
            body,
            suggested_type,
            tab_order,
            source_vault_item_id,
            url_for_workspace,
            now
        ],
    )
    .map_err(|e| format!("open_vault_item_for_edit insert: {}", e))?;

    let mut tag_stmt = tx.prepare("SELECT tag FROM vault_item_tags WHERE item_id = ?1").unwrap();
    let tag_rows = tag_stmt.query_map(rusqlite::params![source_vault_item_id], |row| row.get::<_, String>(0)).unwrap();
    let mut tags = Vec::new();
    for t in tag_rows.flatten() {
        tags.push(t);
    }
    drop(tag_stmt);

    for tag in &tags {
        tx.execute(
            "INSERT INTO workspace_document_tags (doc_id, tag) VALUES (?1, ?2)",
            rusqlite::params![id, tag],
        )
        .map_err(|e| format!("open_vault_item_for_edit insert tags: {}", e))?;
    }

    tx.execute(
        "UPDATE workspace_documents SET is_active = 0 WHERE id != ?1",
        rusqlite::params![id],
    )
    .map_err(|e| format!("open_vault_item_for_edit update active: {}", e))?;

    tx.commit().map_err(|e| format!("open_vault_item_for_edit commit: {}", e))?;

    let doc = models::WorkspaceDocument {
        id,
        title,
        body,
        suggested_type: models::ContentType::from_db_str(suggested_type).unwrap_or(models::ContentType::Note),
        tab_order: tab_order as u32,
        is_active: true,
        cursor_state: models::CursorState { position: 0, selection_start: 0, selection_end: 0 },
        scroll_state: models::ScrollState { scroll_top: 0.0, scroll_left: 0.0 },
        created_at: now.clone(),
        updated_at: now,
        attachments: vec![],
        tags,
        source_vault_item_id: Some(source_vault_item_id),
        url: url_for_workspace,
    };

    Ok(doc)
}



#[tauri::command]
fn capture_workspace_document(
    state: tauri::State<db::DbState>,
    title: String,
    body: String,
    suggested_type: String,
    source_vault_item_id: Option<String>,
) -> Result<models::WorkspaceDocument, String> {
    use chrono::Utc;
    use uuid::Uuid;

    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let ct = models::ContentType::from_db_str(&suggested_type)
        .unwrap_or(models::ContentType::Note);

    let tx = guard.transaction().map_err(|e| e.to_string())?;

    let tab_order: u32 = tx
        .query_row(
            "SELECT COALESCE(MAX(tab_order) + 1, 0) FROM workspace_documents WHERE is_open = 1",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|e| e.to_string())? as u32;

    tx.execute(
        "UPDATE workspace_documents SET is_active = 0 WHERE is_open = 1",
        [],
    )
    .map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO workspace_documents
         (id, title, body, suggested_type, tab_order, is_active, is_open,
          cursor_position, cursor_selection_start, cursor_selection_end,
          scroll_top, scroll_left, created_at, updated_at, source_vault_item_id)
         VALUES (?1, ?2, ?3, ?4, ?5, 1, 1, 0, 0, 0, 0.0, 0.0, ?6, ?6, ?7)",
        rusqlite::params![id, title, body, ct.to_db_str(), tab_order, now, source_vault_item_id],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(models::WorkspaceDocument {
        id,
        title,
        body,
        suggested_type: ct,
        tab_order,
        is_active: true,
        cursor_state: models::CursorState {
            position: 0,
            selection_start: 0,
            selection_end: 0,
        },
        scroll_state: models::ScrollState {
            scroll_top: 0.0,
            scroll_left: 0.0,
        },
        created_at: now.clone(),
        updated_at: now,
        attachments: vec![],
        tags: vec![],
        source_vault_item_id: source_vault_item_id.clone(),
        url: None,
    })
}


fn hotkey_to_shortcut_str(hotkey: &models::Hotkey) -> String {
    let mut parts: Vec<String> = hotkey
        .modifiers
        .iter()
        .map(|m| match m.to_lowercase().as_str() {
            "ctrl" => "Ctrl".to_string(),
            "shift" => "Shift".to_string(),
            "alt" => "Alt".to_string(),
            "meta" => "Super".to_string(),
            other => {
                let mut s = other.to_string();
                if let Some(c) = s.get_mut(0..1) {
                    c.make_ascii_uppercase();
                }
                s
            }
        })
        .collect();
    let key = if hotkey.key.len() == 1 {
        hotkey.key.to_uppercase()
    } else {
        let mut s = hotkey.key.clone();
        if let Some(c) = s.get_mut(0..1) {
            c.make_ascii_uppercase();
        }
        s
    };
    parts.push(key);
    parts.join("+")
}



const PIPE_NAME: &str = r"\\.\pipe\second-brain-nmh";

#[cfg(windows)]
async fn start_named_pipe_server(app: tauri::AppHandle) {
    use tokio::net::windows::named_pipe::ServerOptions;

    println!("[CHANGE 18] Named pipe server starting on: {}", PIPE_NAME);

    loop {
        let server = match ServerOptions::new().create(PIPE_NAME) {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[CHANGE 18] Failed to create named pipe instance: {}", e);
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                continue;
            }
        };

        println!("[CHANGE 18] Named pipe waiting: {}", PIPE_NAME);

        if let Err(e) = server.connect().await {
            eprintln!("[CHANGE 18] Named pipe client connect error: {}", e);
            continue;
        }

        use tauri::Manager;
        let handle = app.clone();
        tauri::async_runtime::spawn(handle_pipe_connection(server, handle));
    }
}

#[cfg(windows)]
async fn handle_pipe_connection(
    mut pipe: tokio::net::windows::named_pipe::NamedPipeServer,
    app: tauri::AppHandle,
) {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    let mut len_buf = [0u8; 4];
    if let Err(e) = pipe.read_exact(&mut len_buf).await {
        eprintln!("[CHANGE 18] Failed to read message length from pipe: {}", e);
        return;
    }

    let msg_len = u32::from_le_bytes(len_buf) as usize;
    if msg_len > 65_536 {
        eprintln!("[CHANGE 18] Message too large ({} bytes), dropping", msg_len);
        let resp = crate::models::BrowserMessageResponse {
            ok: false,
            error: Some(format!("Message too large: {} bytes (max 65536)", msg_len)),
        };
        let resp_json = serde_json::to_string(&resp).unwrap();
        let resp_len = (resp_json.len() as u32).to_le_bytes();
        let _ = pipe.write_all(&resp_len).await;
        let _ = pipe.write_all(resp_json.as_bytes()).await;
        return;
    }

    let mut msg_buf = vec![0u8; msg_len];
    if let Err(e) = pipe.read_exact(&mut msg_buf).await {
        eprintln!("[CHANGE 18] Failed to read message body from pipe: {}", e);
        return;
    }

    let msg_str = match String::from_utf8(msg_buf) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[CHANGE 18] Message not valid UTF-8: {}", e);
            return;
        }
    };

    let msg: crate::models::BrowserMessage = match serde_json::from_str(&msg_str) {
        Ok(m) => m,
        Err(e) => {
            eprintln!("[CHANGE 18] Failed to parse browser message JSON: {}", e);
            return;
        }
    };

    use tauri::{Manager, Emitter};
    app.emit("browser-message", &msg).ok();

    if msg.action == "capture" {
        let state = app.state::<crate::db::DbState>();
        
        let resp = {
            let mut guard = state.0.lock().unwrap();
            match crate::db::db_create_vault_item_from_browser(&mut guard, &msg.payload) {
                Ok(item) => {
                    app.emit("browser-capture-saved", &item).ok();
                    crate::models::BrowserMessageResponse { ok: true, error: None }
                }
                Err(e) => {
                    eprintln!("[CHANGE 18] Failed to save browser capture: {}", e);
                    app.emit("browser-capture-error", &e).ok();
                    crate::models::BrowserMessageResponse { ok: false, error: Some(e) }
                }
            }
        };

        let resp_json = serde_json::to_string(&resp).unwrap();
        let resp_len = (resp_json.len() as u32).to_le_bytes();
        let _ = pipe.write_all(&resp_len).await;
        let _ = pipe.write_all(resp_json.as_bytes()).await;
    }
}

#[cfg(not(windows))]
async fn start_named_pipe_server(_app: tauri::AppHandle) {
    // no-op on non-Windows
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {

            // Setup Named Pipe for browser extension
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                start_named_pipe_server(app_handle).await;
            });

            // Make window vibrant
            #[cfg(target_os = "windows")]
            {
                use window_vibrancy::apply_mica;
                let window = app.get_webview_window("main").unwrap();
                apply_mica(&window, Some(true)).ok();
            }

            // Register global hotkey
            let handle = app.handle().clone();
            
            let conn = match db::init_db() {
                Ok(c) => c,
                Err(e) if e.starts_with("CORRUPTION_DETECTED") => {
                    use tauri_plugin_dialog::DialogExt;
                    let app_data_dir = std::path::PathBuf::from(std::env::var("APPDATA").unwrap()).join("SecondBrain");
                    let db_path = app_data_dir.join("database.sqlite");
                    let backup_path = app_data_dir.join(format!("database_corrupt_{}.sqlite", chrono::Utc::now().format("%Y%m%d_%H%M%S")));
                    std::fs::rename(&db_path, &backup_path).unwrap();
                    app.dialog().message(format!("Database corruption detected and moved to {:?}. A new database will be created.", backup_path)).title("Database Error").blocking_show();
                    db::init_db().unwrap()
                },
                Err(e) => panic!("Database initialization failed: {}", e),
            };
            app.manage(db::DbState(std::sync::Mutex::new(conn)));
            
            // Re-acquire for read_app_settings since we just gave it away
            let state = app.state::<db::DbState>();
            let conn = state.0.lock().unwrap();

            let settings = db::read_app_settings(&conn).unwrap_or_else(|e| {
                eprintln!("[CHANGE 15] read_app_settings failed: {}; using defaults", e);
                models::AppSettings::default()
            });

            let shortcut_str = hotkey_to_shortcut_str(&settings.capture_hotkey);
            
            if let Err(e) = app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new().build(),
            ) {
                eprintln!("[CHANGE 15] plugin err: {}", e);
            }
            
            if let Err(e) = try_re_register_hotkey(&handle, &shortcut_str, None) {
                eprintln!("[CHANGE 15] register err: {}", e);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_workspace_document,
            list_workspace_documents,
            create_vault_item,
            list_vault_items,
            open_workspace_documents,
            new_workspace_document,
            rename_workspace_document,
            update_workspace_document_body,
            update_workspace_document_type,
            set_active_tab,
            reorder_tabs,
            close_tab,
            save_workspace_document,
            mark_tab_closed,
            save_workspace_document_to_vault,
              save_workspace_document_to_vault_with_title,
            delete_vault_item,
            export_vault_item,
            update_workspace_document_tags,
            update_vault_item_tags,
            get_all_tags,
            search_vault_items,
            read_clipboard,
            open_vault_item_for_edit,
            capture_workspace_document,
            get_app_settings,
            update_app_settings,
        ]);

    builder.run(tauri::generate_context!())
        .expect("error while running tauri application");
}


#[cfg(test)]
mod tests;
