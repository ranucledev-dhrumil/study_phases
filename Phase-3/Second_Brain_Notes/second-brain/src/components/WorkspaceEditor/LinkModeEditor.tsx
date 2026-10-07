import './LinkModeEditor.css';

interface LinkModeEditorProps {
  url: string;
  onChange: (url: string) => void;
  zoom?: number;
}

export default function LinkModeEditor({ url, onChange, zoom }: LinkModeEditorProps) {
  return (
    <div className="editor-area link-mode-editor" style={{ fontSize: `${zoom ?? 100}%` }}>
      <div className="link-mode-editor__inner">
        <label className="link-mode-editor__label">URL</label>
        <input
          type="url"
          className="link-mode-editor__input"
          value={url}
          onChange={e => onChange(e.target.value)}
          placeholder="https://example.com"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
        <p className="link-mode-editor__hint">
          Switching back to Note will insert this URL as an inline hyperlink. Your note content is preserved separately.
        </p>
      </div>
    </div>
  );
}