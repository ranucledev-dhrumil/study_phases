# Second Brain - Manual Testing Guide

This guide is designed for non-developer validation of the core workflows in Second Brain before a release build. 

**Pre-requisite:**
* Ensure the application is running via `npm run tauri dev`.
* The browser extension must be installed in Chrome or Edge, pointing to the dev build.

---

## 1. Tab Management & Empty States

**Test: Zero-Tab Launch**
1. Close all open tabs in the application.
2. The application window should immediately close.
3. Restart the application (`npm run tauri dev`).
4. **Verify:** A single, fresh "Untitled" tab should be automatically created and focused.

## 2. Editor Modes & Data Safety

**Test: Mode Switching Integrity**
1. In a Note tab, type: `This is a test note.`
2. Switch the Type dropdown to **Code**.
3. **Verify:** The text should be wrapped in a code block fence.
4. Switch the Type dropdown to **Link**.
5. **Verify:** The editor disappears, replaced by a URL input box.
6. Type a URL into the box: `https://example.com`
7. Switch the Type dropdown back to **Note**.
8. **Verify:** The editor reappears. The text `This is a test note.` must still be present. The URL `https://example.com` should be appended as an inline hyperlink at the bottom of the content.

## 3. Vault Item Export

**Test: Markdown & Plain Text Export**
1. Create a new Note tab and add some rich content (a heading, some bold text, a list, and a hyperlink).
2. Click **Save to Vault**.
3. Open the Vault (database icon in the sidebar).
4. Select your newly saved note.
5. In the detail pane, click the **Export** button (near Copy Content).
6. Choose **Markdown (.md)** and save it to your Desktop.
7. Open the file in a text editor.
    * **Verify:** The file contains standard Markdown syntax matching your rich text.
8. Click **Export** again, this time choosing **Plain Text (.txt)**.
9. Open the file.
    * **Verify:** The formatting should be stripped out for readability (e.g., `# Heading` becomes just `Heading`, bold asterisks are removed, lists use standard bullets).

## 4. Browser Capture Integration

**Test: Page Save (Link type)**
1. Open Google Chrome or Microsoft Edge (where the extension is installed).
2. Navigate to an article or website (e.g., `https://en.wikipedia.org/wiki/Main_Page`).
3. Ensure no text is highlighted.
4. Right-click anywhere on the background of the page.
5. Select **Save page to Second Brain**.
6. Switch to the Second Brain application.
7. **Verify:** A "✓ Saved from Browser" flash message should appear briefly.
8. Open the Vault.
9. **Verify:** A new item exists at the top. Its type should be **Link**, and clicking it should display the URL prominently in the detail pane.

**Test: Selection Save (Note type)**
1. On the same web page, highlight a paragraph of text.
2. Right-click the highlighted text.
3. Select **Save selection to Second Brain**.
4. Switch to the Second Brain application.
5. **Verify:** A "✓ Saved from Browser" flash message should appear.
6. Open the Vault.
7. **Verify:** A new item exists. Its type should be **Note**, and the body should contain the exact text you highlighted.

## 5. Global Hotkey Capture

**Test: Hotkey Paste**
1. Highlight some text in any external application (e.g., Notepad, a web browser, or Word).
2. Press `Ctrl+C` to copy it.
3. Press the Second Brain global capture hotkey (default: `Ctrl+Shift+S`).
4. **Verify:** The Second Brain window should come to the foreground.
5. **Verify:** A new tab is created, automatically filled with your copied text. The tab's title should auto-generate based on the first few words.
