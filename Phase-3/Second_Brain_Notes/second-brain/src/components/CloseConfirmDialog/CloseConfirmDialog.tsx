/**
 * CloseConfirmDialog — three-option modal for closing a workspace tab (CHANGE 09).
 * CHANGE 10: added isSaving + saveError props for real vault promotion feedback.
 *
 * Appears when the user closes a WorkspaceDocument tab (dot-showing).
 * Three options: Save to Vault (primary) / Close (secondary) / Cancel (ghost).
 * Esc key and clicking the overlay both trigger Cancel.
 */

import './CloseConfirmDialog.css';
import { useEffect } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface CloseConfirmDialogProps {
  tabTitle: string;
  /** True while the vault promotion backend call is in-flight. */
  isSaving: boolean;
  /** Non-null string shows an inline error; null = no error. */
  saveError: string | null;
  onSaveToVault: () => void;
  onClose: () => void;
  onCancel: () => void;
}

export default function CloseConfirmDialog({
  tabTitle,
  isSaving,
  saveError,
  onSaveToVault,
  onClose,
  onCancel,
}: CloseConfirmDialogProps) {
  const dialogRef = useFocusTrap(true);

  // Esc key -> Cancel, Enter key -> Save to Vault
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onCancel();
      if (e.key === 'Enter' && !isSaving) {
        e.preventDefault();
        onSaveToVault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, onSaveToVault, isSaving]);

  return (
    <div
      className="dialog-overlay"
      onClick={!isSaving ? onCancel : undefined}
      aria-hidden="true"
    >
      <div
        ref={dialogRef as any}
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="dialog__title" id="dialog-title">
          Save to Vault?
        </h2>
        <p className="dialog__description">
          <strong className="dialog__tab-name">{tabTitle}</strong> is currently <strong>Autosaved</strong> in your Workspace. 
          Would you like to <strong>Save to Vault</strong> for permanent storage before closing?
        </p>
        <div className="dialog__actions">
          <button
            className="dialog__btn dialog__btn--primary"
            onClick={onSaveToVault}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save to Vault'}
          </button>
          <button
            className="dialog__btn dialog__btn--secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Close without saving
          </button>
          <button
            className="dialog__btn dialog__btn--ghost"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
        {saveError !== null && (
          <p className="dialog__error" role="alert">
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
}
