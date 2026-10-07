# Building and Distributing Second Brain

This document explains the three different ways to run and distribute the Second Brain app, how to build them, and what to do if the browser extension stops working.

## The Three Build Types

### 1. Development Mode (`npm run tauri dev`)
- **What it is:** The live-reloading development environment.
- **When to use it:** When you are actively writing code, testing UI changes, or debugging.
- **Browser Extension:** It does not automatically register with the browser.

### 2. Portable Executable (The `.exe` file)
- **What it is:** A standalone `second-brain.exe` file that runs instantly without needing to be installed. It doesn't write to the Windows registry or create Start Menu shortcuts.
- **When to use it:** Quick testing, running the app from a USB drive, or handing it to someone who doesn't want to (or cannot) install software on their machine.
- **Browser Extension:** **Does NOT work out-of-the-box.** Because it doesn't run an installation script, it cannot tell Google Chrome or Edge that it exists. To use the browser extension with the portable build, you must manually run `scripts\install-native-host.ps1` in PowerShell.

### 3. The Installer (NSIS Setup)
- **What it is:** A traditional Windows setup wizard (`second-brain_0.1.0_x64-setup.exe`). It creates Start Menu shortcuts and adds an entry to "Add or Remove Programs".
- **When to use it:** When you want to permanently install the app on a machine for daily use.
- **Browser Extension:** **Works automatically.** During installation, an automated script runs in the background and writes the required keys to the Windows registry. Chrome and Edge will immediately be able to talk to the app without any manual PowerShell steps.

---

## How to Build

First, ensure you are in the `second-brain` folder (not `src-tauri` or `second-brain-host`).

### To build the Portable Executable:
```bash
npm run tauri build -- --no-bundle
```
**Output location:** `src-tauri\target\release\second-brain.exe`

### To build the NSIS Installer:
```bash
npm run tauri build
```
**Output location:** `src-tauri\target\release\bundle\nsis\second-brain_0.1.0_x64-setup.exe`

*Note on WebView2:* Both builds use the "evergreen" approach. They do not bundle the massive WebView2 runtime into the app itself. They rely on the OS-provided WebView2 runtime (which is standard on modern Windows 10 and 11).

---

## Browser Extension Troubleshooting

The browser extension (Chrome/Edge) talks to a specific file on your computer. **Only one build type can be registered at a time.** If you use the Installer, the registry points to the installed location. If you later run the Portable version from your Downloads folder, the extension will still talk to the Installed version. 

### If the extension stops working or can't connect:

1. **Check which build is registered:** 
   Open the Windows Registry Editor (`regedit`) and look at:
   `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.secondbrain.app`
   The default value points to a JSON file (e.g., `%LOCALAPPDATA%\second-brain\com.secondbrain.app.json`). Open that JSON file in a text editor to see exactly which `second-brain-host.exe` the browser is trying to launch.

2. **To reset/fix the connection:**
   - If you want to use the **Installer** version: Just run the installer again. It will overwrite the registry keys with the correct paths.
   - If you want to use the **Portable** version: Run the `scripts\install-native-host.ps1` script in PowerShell. It will overwrite the registry keys to point to the `%APPDATA%\SecondBrain` folder and compile a fresh host binary.

3. **Check the Extension Console:**
   Go to `chrome://extensions`, turn on Developer Mode, find the Second Brain extension, and click "service worker" to view the console logs. It will tell you if the Native Messaging host is failing to start.

4. **Check the Database:**
   Ensure `%APPDATA%\SecondBrain\second-brain.sqlite` exists and is a valid file.

---

## Cutting a New Release

When you are ready to bump the version number for a new release, you must update it in two places before running the build command:
1. `src-tauri\tauri.conf.json` (under `"version": "x.y.z"`)
2. `src-tauri\Cargo.toml` (under `version = "x.y.z"`)
