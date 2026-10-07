/**
 * Browser Integration Types (CHANGE 18)
 *
 * Represents incoming capture messages originating from Chrome/Edge extensions
 * via the Native Messaging Host companion and Windows Named Pipe.
 */

export interface BrowserCapture {
  title?: string;
  url?: string;
  selectedText?: string;
  source?: string; // 'chrome' | 'edge'
  timestamp?: number; // Unix epoch ms
}

export interface BrowserMessage {
  version: number; // currently 1
  action: 'capture' | 'ping' | string;
  payload: BrowserCapture;
}

export interface BrowserMessageResponse {
  ok: boolean;
  error?: string | null;
}

export interface BrowserCaptureSaved {
  id: string;
  title: string;
  itemType: string;
  source?: string;
}

