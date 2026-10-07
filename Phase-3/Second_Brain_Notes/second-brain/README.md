# Second Brain

A Windows desktop app built with [Tauri v2](https://tauri.app/) (Rust backend) and a TypeScript/React frontend (Vite).

> **Multi-session project** — this README is written so any new Antigravity session can resume work without re-deriving the setup. Read this before making any changes. If you are touching the browser extension or native messaging, you MUST read [AI_ARCHITECTURE_WARNING.md](AI_ARCHITECTURE_WARNING.md) first.

---

## Toolchain Prerequisites

These must be installed on the machine before any dev or build commands will work.

| Tool | Tech | Version |
|---|---|---|
| Frontend | React + TypeScript + Vite | React 19, Vite 8, TS ~6 |
| Backend | Rust / Tauri | Tauri 2.11.5 |
| SQLite Database | rusqlite + rusqlite_migration | rusqlite 0.31 (bundled), migration 1.x |
| Window effect | window-vibrancy (Mica) | 0.6 |
| Tauri CLI | `@tauri-apps/cli` | ^2 |
| Node pkg manager | npm | — |
| Dev URL | `http://localhost:1420` | — |
| WebView2 runtime | ships with Windows 10/11 | pre-installed on modern Windows |

> **Windows-only note**: The MSVC toolchain is required (`x86_64-pc-windows-msvc`).
> Confirm with: `rustup show` — the active toolchain should be `stable-x86_64-pc-windows-msvc`.

---

## Quick Start

```bash
# 1. Install JS dependencies (first time, or after package.json changes)
npm install

# 2. Start the dev server (Vite + Rust hot-reload)
npm run tauri dev
```

`npm run tauri dev` does two things concurrently:
- Runs `npm run dev` (Vite dev server at `http://localhost:1420`)
- Compiles and launches the Rust/Tauri backend, which opens the native window

The first `cargo` compile is slow (~5 min). Subsequent runs use the incremental cache and are much faster.

---

## Build for Production

```bash
npm run tauri build
```

Produces a Windows NSIS installer and standalone `.exe` under:

```
src-tauri/target/release/bundle/
  nsis/          <- installer (.exe)
  msi/           <- MSI package (if enabled)
```

The release binary itself is at `src-tauri/target/release/second-brain.exe`.

---

## Project Layout

```
second-brain/
├── src/                        # Frontend source (TypeScript / React)
│   ├── main.tsx                # Entry point
│   ├── types/                  # Domain model interfaces (CHANGE 03)
│   ├── components/             # UI layout components (CHANGE 02)
│   └── styles/                 # CSS tokens and global base styles
├── src-tauri/                  # Rust / Tauri backend
│   ├── src/
│   │   ├── main.rs             # Binary entry point
│   │   ├── lib.rs              # App setup: tauri::Builder, commands, plugins
│   │   ├── db.rs               # SQLite database layer (CHANGE 04)
│   │   └── models.rs           # Rust domain structs matching TS interfaces
│   ├── migrations/             # SQLite migrations
│   │   └── 001_initial.sql     # Initial database schema (CHANGE 04)
│   ├── Cargo.toml              # Rust dependencies
│   ├── tauri.conf.json         # Tauri configuration
│   ├── build.rs                # Tauri build script
│   └── icons/                  # App icons
├── index.html                  # Vite HTML entry
├── vite.config.ts              # Vite config (port 1420)
├── tsconfig.json
└── package.json
```

---

## Key Configuration Facts

- **Dev port**: `1420` (set in `vite.config.ts` and `tauri.conf.json → build.devUrl`)
- **App identifier**: `com.secondbrain.app`
- **Window title**: `"Second Brain"`
- **Default window size**: 1200 × 800 (resizable, min 720 × 500)
- **Frontend framework**: React 19 + TypeScript
- **Database**: SQLite at `%APPDATA%\SecondBrain\database.sqlite`
- **CSP**: currently `null` (disabled) for development ease — tighten before shipping.
- **`withGlobalTauri: true`**: the Tauri JS API is available on `window.__TAURI__` without explicit imports.

---

## npm Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server only (no Rust, no native window) |
| `npm run build` | TypeScript compile + Vite production build → `dist/` |
| `npm run tauri dev` | Full dev mode: Vite + Rust + native window |
| `npm run tauri build` | Full production build + Windows installer |

---

## Implementation Plan (28 steps)

This project is built incrementally across 28 sequential changes. Each session should start by reading this README and confirming which CHANGE number is next.

| Change | Description | Status |
|---|---|---|
| 01 | Tauri project shell — bare window boots | ✅ Done |
| 02 | Visual shell — React, design tokens, Mica, 5 layout regions | ✅ Done |
| 03 | Domain model — TypeScript types + Rust structs for Workspace, Vault, Settings | ✅ Done |
| 04 | SQLite persistence — rusqlite + migrations, schema, CRUD commands | ✅ Done |
| 05 | Workspace tabs — useTabs hook, tab lifecycle (create/switch/rename/reorder/close), editor wiring | ✅ Done |
| 06 | Continuous autosave — 500ms debounce, flush on switch/close/blur, cursor & scroll persistence | ✅ Done |
| 07 | Session restore — restore open tabs, order, active tab, cursor/scroll, empty-flash prevention | ✅ Done |
| 08 | Workspace dot indicator — Notepad-11-style dot/× hover toggle, type-driven, active tab elevation | ✅ Done |
| 09 | Close-confirmation dialog — Save to Vault / Close / Cancel modal, vault promotion stub | ✅ Done |
| 10 | Save-to-Vault conversion — atomic promotion command, type mapping, error handling | ✅ Done |
| 11 | Vault browsing UI — 2-column master-detail browser, type badges, statusbar switcher | ✅ Done |
| 12 | Vault search & filters — live debounced search, content-type and tag filters, SQL query | ✅ Done |
| 13 | Clipboard service — native arboard read for text/image/unsupported, discriminated result contract | ✅ Done |
| 14 | Automatic type detection — deterministic classifier for Link, CodeSnippet, Note with test suite | ✅ Done |
| 15 | Global hotkey — system-wide Ctrl+Shift+S via tauri-plugin-global-shortcut, data-driven from settings | ✅ Done |
| 16 | Hotkey-triggered capture workflow — window focus, clipboard read, auto-type detection, tab creation | ✅ Done |
| 17 | Manual type-override UI — interactive type picker on toolbar, persisting suggested_type to workspace row | ✅ Done |
| 18 | Browser integration foundation — Windows Named Pipe server (\\.\pipe\second-brain-nmh), Native Messaging Host companion crate, test harness | ✅ Done |
| 19 | Chrome "Save to Second Brain" — context-menu capture (page & selection), direct VaultItem creation, statusbar flash confirmation, stable extension ID key & installer script | ✅ Done |
| 20 | Edge "Save to Second Brain" — verified shared WebExtensions codebase & stable ID, unified dual Chrome/Edge installer script, Edge Native Messaging registry configuration | ✅ Done |
| 21 | Harden persistence and concurrency — Handle rapid edits, repeated captures, overlapping saves, failed writes, corrupt/incomplete data, and application restarts without silently losing changes. | ✅ Done |
| 22 | Settings and configuration — Add configurable global hotkey and essential behavior/preferences without introducing a large settings system. | ✅ Done |
| 23 | Portable build — Create and test the portable Windows distribution. Verify launch on a clean Windows environment without relying on the development machine's installed tooling. | ✅ Done |
| 24–28 | TBD in subsequent sessions | — |


 
## Known Limitations
See [v1_limitations.md]  for a list of known limitations and features out-of-scope for the v1 release.


## Building and Distribution

For instructions on building the portable executable or the NSIS installer, and troubleshooting browser extension connectivity, please read the [BUILD_AND_DISTRIBUTION.md](BUILD_AND_DISTRIBUTION.md) guide.
