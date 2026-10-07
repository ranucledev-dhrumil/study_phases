/**
 * Utilities for exporting Vault items.
 */

/** Returns the markdown body unchanged. */
export function exportAsMd(body: string): string {
  return body;
}

/** 
 * Strips common Markdown formatting syntax for a plain text export.
 * This is a pragmatic, regex-based conversion meant for readability,
 * not a full AST parser.
 */
export function exportAsTxt(body: string): string {
  let text = body;

  // Code blocks: remove fences but keep content
  text = text.replace(/^```[\s\S]*?\n([\s\S]*?)\n```$/gm, '$1');

  // Inline code: remove backticks
  text = text.replace(/`([^`]+)`/g, '$1');

  // Headers: remove # markers
  text = text.replace(/^#+\s+(.*)$/gm, '$1');

  // Bold/Italic: remove **, __, *, _
  // Avoid stripping mid-word underscores
  text = text.replace(/(?:\*\*|__)(.*?)(?:\*\*|__)/g, '$1');
  text = text.replace(/(?:\b|[^a-zA-Z0-9_])(?:\*|_)(?!\s)(.*?)(?!\s)(?:\*|_)(?:\b|[^a-zA-Z0-9_])/g, ' $1 ');

  // Strikethrough: remove ~~
  text = text.replace(/~~(.*?)~~/g, '$1');

  // Links: convert [text](url) to text (url), or just text if url is complex/same
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, p1, p2) => {
    if (p1 === p2) return p1;
    return `${p1} (${p2})`;
  });

  // Images: convert ![alt](url) to [Image: alt]
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[Image: $1]');

  // Lists: Unordered lists: convert * or - to bullet
  text = text.replace(/^[ \t]*[-*+]\s+(.*)$/gm, '• $1');

  // Blockquotes: remove >
  text = text.replace(/^[ \t]*>\s+(.*)$/gm, '$1');

  // Horizontal rules: remove ---, ***, ___
  text = text.replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '');

  // Tables: strip pipes, pad cells roughly
  text = text.replace(/^[ \t]*\|(.+)\|[ \t]*$/gm, (_match, p1) => {
    // Check if it's a separator row (---)
    if (/^[-:| ]+$/.test(p1)) return '';
    const cells = p1.split('|').map((c: string) => c.trim());
    return cells.join('  ');
  });

  // Cleanup: collapse 3+ newlines to 2 newlines
  text = text.replace(/\n{3,}/g, '\n\n');

  // Clean up any double spaces that might have sneaked in from styling removal
  text = text.replace(/ +/g, ' ');

  return text.trim();
}

/** Sanitize a title for use as a filename */
export function sanitizeFilename(title: string): string {
  return title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'untitled';
}
