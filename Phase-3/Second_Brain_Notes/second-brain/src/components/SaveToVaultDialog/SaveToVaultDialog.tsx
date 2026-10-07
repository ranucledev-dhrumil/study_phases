import './SaveToVaultDialog.css';
import { useState, useEffect, useRef } from 'react';

interface SaveToVaultDialogProps {
  initialTitle: string;
  isSaving: boolean;
  saveError: string | null;
  onSave: (title: string) => void;
  onCancel: () => void;
}

export default function SaveToVaultDialog({
  initialTitle,
  isSaving,
  saveError,
  onSave,
  onCancel,
}: SaveToVaultDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving) {
      e.preventDefault();
      onSave(title.trim() || 'Untitled');
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="stvd-overlay" role="dialog" aria-modal="true" aria-labelledby="stvd-title">
      <div className="stvd-dialog">
        <h2 className="stvd-title" id="stvd-title">Save to Vault</h2>
        <p className="stvd-subtitle">Choose a title for this vault item.</p>

        <label className="stvd-label" htmlFor="stvd-input">Title</label>
        <input
          ref={inputRef}
          id="stvd-input"
          className="stvd-input"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          placeholder="Untitled"
        />

        {saveError && <p className="stvd-error">{saveError}</p>}

        <div className="stvd-actions">
          <button
            className="stvd-btn stvd-btn--secondary"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="stvd-btn stvd-btn--primary"
            onClick={() => onSave(title.trim() || 'Untitled')}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
