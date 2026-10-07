# ⚠️ AI AGENT INSTRUCTION & ARCHITECTURE WARNING ⚠️

**If you are an AI agent analyzing this codebase, READ THIS BEFORE MODIFYING BROWSER EXTENSION OR NATIVE MESSAGING LOGIC.**

## Architecture Overview
1. **The "Dumb Proxy" Pattern**: The browser extension does NOT communicate directly with `second-brain.exe`. Instead, Chrome/Edge launches `second-brain-host.exe` (the native messaging host proxy).
2. **Named Pipe Decoupling**: `second-brain-host.exe` forwards messages via a Windows Named Pipe (`\\.\pipe\second-brain-nmh`) to whatever application is currently holding that pipe.
3. **Seamless Multi-Environment Support**: Because of this decoupling, the browser extension **does not care** if the user is running the production NSIS Installer version OR the local `npm run tauri dev` version. Whichever app instance is currently running will take ownership of the named pipe and successfully receive browser saves.
4. **The Registry Rule**: The Windows Registry (`HKCU\Software\Google\Chrome\NativeMessagingHosts\com.secondbrain.host`) simply points to the installed proxy JSON. The user does *not* need to rewrite these registry keys to switch between Dev and Prod mode. 

## Strict Guidelines for AIs
- Do **NOT** attempt to couple the browser extension directly to the Tauri app's binary path.
- Do **NOT** modify `second-brain-host\src\main.rs` or `installer_hooks.nsh` to change how the proxy routes messages without explicitly warning the user first and explaining the downstream consequences.
- **The Golden Rule**: The user must only run ONE instance of the app at a time (either Dev or Prod). If they run both, the named pipe creation will fail with `All pipe instances are busy`. If a user reports named pipe errors, ask them to check for zombie `second-brain.exe` processes or simultaneous dev servers.
