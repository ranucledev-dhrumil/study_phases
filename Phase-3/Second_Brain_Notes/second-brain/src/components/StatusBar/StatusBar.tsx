import type { ContentType } from '../../types';
import './StatusBar.css';

interface StatusBarProps {
  charCount: number;
  line: number;
  col: number;
  contentType: ContentType | 'plain';
  zoom: number;
  flash?: string | null;
  error?: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  note: 'Note',
  codeSnippet: 'Code',
  link: 'Link',
  image: 'Image',
  file: 'File',
  plain: 'Plain Text'
};

export default function StatusBar({
  charCount,
  line,
  col,
  contentType,
  zoom,
  flash,
  error,
}: StatusBarProps) {
  return (
    <div className="statusbar">
      <div className="statusbar__left">
        <span className="statusbar__segment">Ln {line}, Col {col}</span>
        <span className="statusbar__divider" />
        <span className="statusbar__segment">{charCount} chars</span>
        {error ? (
          <>
            <span className="statusbar__divider" />
            <span className="statusbar__error">{error}</span>
          </>
        ) : flash ? (
          <>
            <span className="statusbar__divider" />
            <span className="statusbar__flash">{flash}</span>
          </>
        ) : null}
      </div>

      <div className="statusbar__right">
        <span className="statusbar__segment">{TYPE_LABELS[contentType] || 'Plain Text'}</span>
        <span className="statusbar__divider" />
        <span className="statusbar__segment">{zoom}%</span>
        <span className="statusbar__divider" />
        <span className="statusbar__segment">Windows (CRLF)</span>
        <span className="statusbar__divider" />
        <span className="statusbar__segment">UTF-8</span>
      </div>
    </div>
  );
}
