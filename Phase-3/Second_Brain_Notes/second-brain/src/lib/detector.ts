/**
 * src/lib/detector.ts — Deterministic content type classifier (CHANGE 14).
 *
 * Classifies clipboard text content as 'link', 'codeSnippet', or 'note'.
 * Rule-based, local, synchronous, non-AI.
 *
 * Precedence:
 *   1. Link        — most unambiguous; structural URL format test
 *   2. CodeSnippet — multi-signal scoring (keywords, punctuation, indentation, etc.)
 *   3. Note        — safe fallback; never errors or throws
 */

import type { ContentType } from '../types';

/**
 * Classify text content into a suggested ContentType ('link' | 'codeSnippet' | 'note').
 * Advisory only — calling code (CHANGE 16/17) can allow manual user overrides.
 *
 * @param text - Raw text to classify
 * @returns 'link' | 'codeSnippet' | 'note'
 */
export function detectContentType(text: string): ContentType {
  const trimmed = text.trim();
  if (!trimmed) return 'note'; // empty string → Note fallback

  if (isUrl(trimmed)) return 'link';
  if (isCode(trimmed)) return 'codeSnippet';
  return 'note';
}

// ── Link detection ────────────────────────────────────────────────────────
/**
 * A Link is text that, as a whole, IS a URL — not text that CONTAINS a URL.
 * Rule: must have no internal whitespace (single token) AND match one of:
 *   a) Starts with http://, https://, ftp://, ftps://
 *   b) Starts with www. followed by a domain
 *   c) domain.tld/path (requires at least one slash — conservative bare-domain test)
 */
function isUrl(text: string): boolean {
  if (/\s/.test(text)) return false; // has whitespace → not purely a URL

  // (a) Explicit scheme — most reliable
  if (/^(https?|ftps?):\/\/.+/i.test(text)) return true;

  // (b) www. prefix — very common bare URL form
  if (/^www\.[a-z0-9-]+\.[a-z]{2,}/i.test(text)) return true;

  // (c) domain/path — e.g. github.com/user/repo; requires a slash so bare words don't match
  if (/^[a-z0-9-]+\.[a-z]{2,}\/.+/i.test(text)) return true;

  return false;
}

// ── Code detection ────────────────────────────────────────────────────────
/**
 * Code signals (each adds +1 to score):
 *   INDENT   — 2+ lines with leading spaces/tabs (→ structured code body)
 *   KEYWORD  — presence of programming keywords (JS/TS, Python, Rust, C/C++, Java, Go, etc.)
 *   PUNCT    — code-characteristic punctuation: { } ; => -> === !== :: ` || &&
 *   FUNC     — function-call pattern: word(...)
 *   COMMENT  — line starting with // /* # -- (code comments)
 *
 * Threshold:
 *   • Score >= 2 → CodeSnippet (requires at least two distinct code signals, preventing
 *                  false positives from common English words like 'for', 'if', 'while' in prose)
 */
const CODE_KEYWORDS =
  /\b(function|def|class|const|let|var|return|import|export|from|if|else|elif|for|while|switch|case|break|continue|try|catch|finally|throw|async|await|yield|extends|implements|interface|type|enum|struct|fn|pub|use|mod|self|super|where|match|loop|move|ref|dyn|trait|impl|macro|#include|#define|#pragma|using|namespace|public|private|protected|static|void|int|bool|float|double|string|char|null|nil|None|True|False|true|false|undefined|package|func|go|defer|select|chan|map|make|new|delete|print|println|console\.log|require|module\.exports)\b/;
const CODE_PUNCT = /(\{|\}|;|=>|->|===|!==|::|`|\|\||&&)/;
const FUNC_CALL = /\b\w+\s*\(/;
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*\/|#\s|#$|--\s)/m;

function isCode(text: string): boolean {
  const lines = text.split('\n');
  let score = 0;

  // INDENT signal (2+ indented lines)
  const indented = lines.filter(l => /^[ \t]+\S/.test(l)).length;
  if (indented >= 2) score++;

  // KEYWORD signal
  if (CODE_KEYWORDS.test(text)) score++;

  // PUNCT signal
  if (CODE_PUNCT.test(text)) score++;

  // FUNC signal
  if (FUNC_CALL.test(text)) score++;

  // COMMENT signal
  if (COMMENT_LINE.test(text)) score++;

  // Requires at least 2 distinct signals to classify as code
  return score >= 2;
}
