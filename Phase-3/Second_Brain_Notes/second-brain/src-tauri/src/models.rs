//! Domain model structs — mirrors the TypeScript types in src/types/.
//!
//! ═══════════════════════════════════════════════════════════════════════════
//! WORKSPACE vs. VAULT — the core architectural distinction:
//!
//!   WorkspaceDocument  A working item. Content is ALWAYS auto-persisted.
//!                      The dot means "not yet in Vault", NOT "unsaved".
//!                      Never call workspace items "unsaved".
//!
//!   VaultItem          A permanently saved item. Created by "Save to Vault"
//!                      or directly via the browser extension.
//!
//! These are separate types. Do NOT merge them with a status field.
//! ═══════════════════════════════════════════════════════════════════════════
//!
//! All structs use #[serde(rename_all = "camelCase")] so JSON field names
//! match the TypeScript interface shapes across the IPC boundary.
//!
//! No database logic lives here — persistence is CHANGE 04.

use serde::{Deserialize, Serialize};

// ── Shared supporting types ───────────────────────────────────────────────

/// Content classification shared by WorkspaceDocument (advisory) and VaultItem (explicit).
/// Image and File are reserved for future capture — nothing creates them in v1.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ContentType {
    Note,
    CodeSnippet,
    Link,
    /// Reserved — future image capture path.
    Image,
    /// Reserved — future file attachment capture.
    File,
}

/// Cursor and text selection state, persisted for session restore (CHANGE 07).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CursorState {
    /// Character offset of the cursor from the start of body.
    pub position: u64,
    /// Start of selection; equals position when no selection is active.
    pub selection_start: u64,
    /// End of selection; equals position when no selection is active.
    pub selection_end: u64,
}

/// Scroll position, persisted for session restore (CHANGE 07).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScrollState {
    /// Vertical scroll offset in pixels.
    pub scroll_top: f64,
    /// Horizontal scroll offset in pixels.
    pub scroll_left: f64,
}

/// Discriminates whether an attachment belongs to a workspace doc or a Vault item.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum OwnerType {
    Workspace,
    Vault,
}

/// Attachment metadata — reserved for future image/file capture.
/// Nothing in v1 creates attachments. Exists to keep the schema stable.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttachmentMetadata {
    pub id: String,
    /// ID of the owning WorkspaceDocument or VaultItem.
    pub owner_id: String,
    pub owner_type: OwnerType,
    /// Absolute local filesystem path.
    pub local_path: String,
    /// MIME type, e.g. "image/png".
    pub mime_type: String,
    /// File size in bytes.
    pub size_bytes: u64,
    pub created_at: String,
    pub updated_at: String,
}

// ── WorkspaceDocument ─────────────────────────────────────────────────────

/// An auto-persisted working tab — shown with the dot indicator.
///
/// Content is ALWAYS persisted locally. The dot means "not promoted to Vault",
/// NOT "unsaved". WorkspaceDocument and VaultItem are separate types.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceDocument {
    pub id: String,
    pub title: String,
    pub body: String,
    pub created_at: String,
    pub updated_at: String,
    /// Content type suggestion — advisory only, never enforced at workspace stage.
    pub suggested_type: ContentType,
    /// Zero-based position in the tab strip.
    pub tab_order: u32,
    /// Whether this tab is currently active/focused.
    pub is_active: bool,
    pub cursor_state: CursorState,
    pub scroll_state: ScrollState,
    /// Always empty in v1 — reserved for future image/file capture.
    pub attachments: Vec<AttachmentMetadata>,
    pub tags: Vec<String>,
    /// Set when this tab originated from a Vault Item Edit action.
    pub source_vault_item_id: Option<String>,
    /// Dedicated URL field for Link-type tabs. Never touches body.
    pub url: Option<String>,
}

// ── VaultItem ─────────────────────────────────────────────────────────────

/// A permanently saved knowledge item — shown without a dot.
///
/// Created by "Save to Vault" or directly via the browser extension.
/// WorkspaceDocument and VaultItem are intentionally separate types.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultItem {
    pub id: String,
    pub title: String,
    pub body: String,
    pub created_at: String,
    pub updated_at: String,
    /// Explicit content type — always set on Vault items.
    /// Renamed from 	ype (reserved keyword in Rust) via serde attribute.
    #[serde(rename = "type")]
    pub content_type: ContentType,
    pub tags: Vec<String>,
    /// Original URL if saved from a web page.
    pub source_url: Option<String>,
    /// Human-readable domain, e.g. "github.com".
    pub source_domain: Option<String>,
    /// Page title from the browser at capture time.
    pub source_title: Option<String>,
    /// ISO 8601 timestamp of original capture — may differ from created_at.
    pub captured_at: Option<String>,
    /// Always empty in v1 — reserved for future image/file capture.
    pub attachments: Vec<AttachmentMetadata>,
}

// ── AppSettings ───────────────────────────────────────────────────────────

/// Structured hotkey — avoids brittle string parsing.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Hotkey {
    /// Modifier keys, e.g. ["ctrl", "shift"].
    pub modifiers: Vec<String>,
    /// Primary key as a lowercase string, e.g. "s", "f1".
    pub key: String,
}

/// User-configurable application settings.
/// No settings UI in v1 — screen added in CHANGE 22.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub capture_hotkey: Hotkey,
    /// Matches the Theme type in TypeScript: "dark" | "light" | "system".
    pub theme: String,
    /// None = use the platform default data directory.
    pub data_directory_path: Option<String>,
    pub confirm_workspace_close: bool,
    pub editor_zoom: u32,
}

impl Default for AppSettings {
    fn default() -> Self {
        AppSettings {
            capture_hotkey: Hotkey {
                modifiers: vec!["ctrl".to_string(), "shift".to_string()],
                key: "s".to_string(),
            },
            theme: "dark".to_string(),
            data_directory_path: None,
            confirm_workspace_close: true,
            editor_zoom: 100,
        }
    }
}

// ── String conversion helpers for SQLite ──────────────────────────────────
//
// to_db_str() / from_db_str() convert between Rust enum variants and the
// canonical string values stored in SQLite (matching the TypeScript union
// member strings so the IPC JSON roundtrip is consistent end-to-end).

impl ContentType {
    /// Canonical string stored in SQLite / sent over IPC.
    /// Matches the TypeScript `ContentType` union member values exactly.
    pub fn to_db_str(&self) -> &'static str {
        match self {
            ContentType::Note        => "note",
            ContentType::CodeSnippet => "codeSnippet",
            ContentType::Link        => "link",
            ContentType::Image       => "image",
            ContentType::File        => "file",
        }
    }

    /// Parses a SQLite string back to ContentType.
    /// Call sites use `.unwrap_or(ContentType::Note)` for graceful degradation
    /// if a future schema adds new values not yet known to this build.
    pub fn from_db_str(s: &str) -> Result<Self, String> {
        match s {
            "note"        => Ok(ContentType::Note),
            "codeSnippet" => Ok(ContentType::CodeSnippet),
            "link"        => Ok(ContentType::Link),
            "image"       => Ok(ContentType::Image),
            "file"        => Ok(ContentType::File),
            other         => Err(format!("Unknown ContentType in DB: '{}'", other)),
        }
    }
}

impl OwnerType {
    pub fn to_db_str(&self) -> &'static str {
        match self {
            OwnerType::Workspace => "workspace",
            OwnerType::Vault     => "vault",
        }
    }

    pub fn from_db_str(s: &str) -> Result<Self, String> {
        match s {
            "workspace" => Ok(OwnerType::Workspace),
            "vault"     => Ok(OwnerType::Vault),
            other       => Err(format!("Unknown OwnerType in DB: '{}'", other)),
        }
    }
}

// ── CHANGE 18: Browser Integration Models ─────────────────────────────────

/// Browser-originated capture message, sent via named pipe (CHANGE 18).
/// Protocol: 4-byte little-endian u32 length prefix, then JSON body.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserMessage {
    pub version: u32,          // protocol version; currently 1
    pub action: String,        // "capture" | "ping"
    pub payload: BrowserCapture,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserCapture {
    pub title: Option<String>,         // page title
    pub url: Option<String>,           // page URL
    pub selected_text: Option<String>, // user's selection
    pub source: Option<String>,        // "chrome" | "edge"
    pub timestamp: Option<i64>,        // Unix ms timestamp
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserMessageResponse {
    pub ok: bool,
    pub error: Option<String>,
}

/// Event payload emitted when a browser capture is saved to the vault (CHANGE 19).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserCaptureSaved {
    pub id: String,
    pub title: String,
    pub item_type: String,
    pub source: Option<String>,
}



