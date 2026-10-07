import './EditorArea.css';
import type { Editor } from '@tiptap/react';
import { EditorContent } from '@tiptap/react';
import Spinner from '../Spinner/Spinner';

interface EditorAreaProps {
  editor: Editor | null;
  hasActiveTab: boolean;
  isLoading: boolean;
  zoom: number;
}

export default function EditorArea({ editor, hasActiveTab, isLoading, zoom }: EditorAreaProps) {
  if (isLoading) {
    return (
      <div className="editor-area editor-area--empty">
        <Spinner size="32px" />
      </div>
    );
  }

  if (!hasActiveTab) {
    return (
      <div className="editor-area editor-area--empty">
        <p className="editor-area__empty-hint">
          Click <strong>+</strong> in the tab strip to create a new note.
        </p>
      </div>
    );
  }

  return (
    <div className="editor-area" style={{ fontSize: `calc(var(--sb-font-size-base) * ${zoom / 100})` }}>
      <EditorContent editor={editor} className="editor-area__tiptap-wrapper" />
    </div>
  );
}
