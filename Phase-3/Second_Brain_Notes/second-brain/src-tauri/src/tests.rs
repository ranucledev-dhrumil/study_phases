
#[cfg(test)]
mod tests {
    use rusqlite::Connection;
    use crate::models::{ContentType, WorkspaceDocument};

    
    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        // Run migrations
        let migrations = rusqlite_migration::Migrations::new(vec![
            rusqlite_migration::M::up(include_str!("../migrations/001_initial.sql")),
            rusqlite_migration::M::up(include_str!("../migrations/002_add_is_open.sql")),
            rusqlite_migration::M::up(include_str!("../migrations/003_indexes.sql")),
            rusqlite_migration::M::up(include_str!("../migrations/004_add_source_vault_item_id.sql")),
            rusqlite_migration::M::up(include_str!("../migrations/005_add_editor_zoom.sql")),
            rusqlite_migration::M::up(include_str!("../migrations/006_add_workspace_document_tags.sql")),
            rusqlite_migration::M::up(include_str!("../migrations/007_add_url_to_workspace_documents.sql")),
        ]);
        migrations.to_latest(&mut conn).unwrap();
        conn
    }


    #[test]
    fn test_save_workspace_document_to_vault() {
        let mut conn = setup_test_db();
        
        // 1. Link edited with no changes
        conn.execute("INSERT INTO vault_items (id, title, body, type, source_url, source_domain, captured_at, created_at, updated_at) VALUES ('v1', 'Title', 'Body', 'link', 'https://example.com', 'example.com', 'now', 'now', 'now')", []).unwrap();
        conn.execute("INSERT INTO workspace_documents (id, title, body, suggested_type, tab_order, is_active, is_open, cursor_position, cursor_selection_start, cursor_selection_end, scroll_top, scroll_left, created_at, updated_at, source_vault_item_id, url) VALUES ('w1', 'Title', 'Body', 'link', 0, 1, 1, 0, 0, 0, 0, 0, 'now', 'now', 'v1', 'https://example.com')", []).unwrap();
        
                crate::save_workspace_document_to_vault_inner("w1".to_string(), &mut conn).unwrap();
        
        
        let (url, domain): (Option<String>, Option<String>) = conn.query_row("SELECT source_url, source_domain FROM vault_items WHERE id = 'v1'", [], |r| Ok((r.get(0)?, r.get(1)?))).unwrap();
        assert_eq!(url, Some("https://example.com".to_string()));
        
        // 2. Link with URL changed
        conn.execute("INSERT INTO vault_items (id, title, body, type, source_url, source_domain, captured_at, created_at, updated_at) VALUES ('v2', 'Title', 'Body', 'link', 'https://old.com', 'old.com', 'now', 'now', 'now')", []).unwrap();
        conn.execute("INSERT INTO workspace_documents (id, title, body, suggested_type, tab_order, is_active, is_open, cursor_position, cursor_selection_start, cursor_selection_end, scroll_top, scroll_left, created_at, updated_at, source_vault_item_id, url) VALUES ('w2', 'Title', 'Body', 'link', 0, 1, 1, 0, 0, 0, 0, 0, 'now', 'now', 'v2', 'https://new.com')", []).unwrap();
        
        crate::save_workspace_document_to_vault_inner("w2".to_string(), &mut conn).unwrap();
        
        
        let (url, domain): (Option<String>, Option<String>) = conn.query_row("SELECT source_url, source_domain FROM vault_items WHERE id = 'v2'", [], |r| Ok((r.get(0)?, r.get(1)?))).unwrap();
        assert_eq!(url, Some("https://new.com".to_string()));
        assert_eq!(domain, Some("new.com".to_string()));
        
        // 3. Note with source_url preserved
        conn.execute("INSERT INTO vault_items (id, title, body, type, source_url, source_domain, captured_at, created_at, updated_at) VALUES ('v3', 'Title', 'Body', 'note', 'https://preserved.com', 'preserved.com', 'now', 'now', 'now')", []).unwrap();
        conn.execute("INSERT INTO workspace_documents (id, title, body, suggested_type, tab_order, is_active, is_open, cursor_position, cursor_selection_start, cursor_selection_end, scroll_top, scroll_left, created_at, updated_at, source_vault_item_id, url) VALUES ('w3', 'Title', 'Body modified', 'note', 0, 1, 1, 0, 0, 0, 0, 0, 'now', 'now', 'v3', NULL)", []).unwrap();
        
        crate::save_workspace_document_to_vault_inner("w3".to_string(), &mut conn).unwrap();
        
        
        let (url, body): (Option<String>, String) = conn.query_row("SELECT source_url, body FROM vault_items WHERE id = 'v3'", [], |r| Ok((r.get(0)?, r.get(1)?))).unwrap();
        assert_eq!(url, Some("https://preserved.com".to_string()));
        assert_eq!(body, "Body modified");
        
        // 4. Tags preserved
        conn.execute("INSERT INTO vault_items (id, title, body, type, source_url, source_domain, captured_at, created_at, updated_at) VALUES ('v4', 'Title', 'Body', 'note', NULL, NULL, 'now', 'now', 'now')", []).unwrap();
        conn.execute("INSERT INTO vault_item_tags (item_id, tag) VALUES ('v4', 'tag1')", []).unwrap();
        conn.execute("INSERT INTO workspace_documents (id, title, body, suggested_type, tab_order, is_active, is_open, cursor_position, cursor_selection_start, cursor_selection_end, scroll_top, scroll_left, created_at, updated_at, source_vault_item_id, url) VALUES ('w4', 'Title', 'Body', 'note', 0, 1, 1, 0, 0, 0, 0, 0, 'now', 'now', 'v4', NULL)", []).unwrap();
        conn.execute("INSERT INTO workspace_document_tags (doc_id, tag) VALUES ('w4', 'tag2')", []).unwrap();
        
        crate::save_workspace_document_to_vault_inner("w4".to_string(), &mut conn).unwrap();
        
        
        let tag: String = conn.query_row("SELECT tag FROM vault_item_tags WHERE item_id = 'v4'", [], |r| r.get(0)).unwrap();
        assert_eq!(tag, "tag2");
        
        // 5. empty-string URL not overwriting existing source_url
        conn.execute("INSERT INTO vault_items (id, title, body, type, source_url, source_domain, captured_at, created_at, updated_at) VALUES ('v5', 'Title', 'Body', 'link', 'https://keep.com', 'keep.com', 'now', 'now', 'now')", []).unwrap();
        conn.execute("INSERT INTO workspace_documents (id, title, body, suggested_type, tab_order, is_active, is_open, cursor_position, cursor_selection_start, cursor_selection_end, scroll_top, scroll_left, created_at, updated_at, source_vault_item_id, url) VALUES ('w5', 'Title', 'Body', 'link', 0, 1, 1, 0, 0, 0, 0, 0, 'now', 'now', 'v5', '   ')", []).unwrap();
        // simulate the db.rs normalization for empty urls:
        crate::db::db_save_workspace_document(&conn, "w5", "Body", 0, 0, 0, 0.0, 0.0, Some("   ").map(|s| s.trim()).filter(|s| !s.is_empty()), "now").unwrap();
        
        crate::save_workspace_document_to_vault_inner("w5".to_string(), &mut conn).unwrap();
        
        
        let (url, domain): (Option<String>, Option<String>) = conn.query_row("SELECT source_url, source_domain FROM vault_items WHERE id = 'v5'", [], |r| Ok((r.get(0)?, r.get(1)?))).unwrap();
        assert_eq!(url, Some("https://keep.com".to_string()));
    }
}
