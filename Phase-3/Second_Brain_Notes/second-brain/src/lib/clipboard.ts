/**
 * src/lib/clipboard.ts — Clipboard service contract and helper (CHANGE 13).
 *
 * Result shape is a discriminated union on `kind` — CHANGE 14's detection
 * logic can switch on it cleanly without re-parsing raw bytes.
 *
 * No image bytes are exposed to the frontend — the backend reads them purely
 * to detect the presence of an image. Image/File Vault item persistence is
 * out of scope per the v1 spec (not built until CHANGE 19+ at earliest).
 */

import { invoke } from '@tauri-apps/api/core';

export type ClipboardReadResult =
  | { kind: 'text'; content: string }
  | { kind: 'image'; width: number; height: number }
  | { kind: 'unsupported' }
  | { kind: 'empty' };

/**
 * Reads the current Windows clipboard content.
 * Returns a discriminated result; never throws under normal operation
 * (inaccessible clipboard → { kind: 'unsupported' }).
 *
 * Manual test via browser DevTools:
 *   await __TAURI__.core.invoke('read_clipboard')
 */
export async function readClipboard(): Promise<ClipboardReadResult> {
  return invoke<ClipboardReadResult>('read_clipboard');
}
