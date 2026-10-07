/**
 * TabStrip — horizontal workspace tab bar with drag-to-reorder.
 *
 * Interactions:
 *   Click tab          → switch to that tab
 *   Double-click label → inline rename (Enter/Blur commits, Escape cancels)
 *   Click × button     → close tab (body saved, row retained)
 *   Drag tab           → reorder (requires 5 px of movement to start drag)
 *   Click + button     → create new tab
 *
 * CHANGE 08: Each tab shows a small dot indicator (--sb-dot) at rest.
 *   On hover the dot fades out and the × close button fades in (Windows 11 Notepad style).
 *   The dot is driven by showDot prop — true for WorkspaceDocument tabs,
 *   false for future VaultItem tabs (CHANGE 10/11).
 */

import './TitleTabRow.css';
import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { WorkspaceDocument } from '../../types';

// ── Type helper ───────────────────────────────────────────────────────────────



// ── SortableTab ───────────────────────────────────────────────────────────────

interface SortableTabProps {
  tab: WorkspaceDocument;
  isActive: boolean;
  showDot: boolean;
  onSwitch: (id: string) => void;
  onClose: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

function SortableTab({ tab, isActive, showDot, onSwitch, onClose, onRename }: SortableTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(tab.title);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tab.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(tab.title);
    setIsEditing(true);
  };

  const commitRename = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== tab.title) {
      onRename(tab.id, trimmed);
    } else {
      setEditValue(tab.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') {
      setEditValue(tab.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        'tab',
        isActive ? 'tab--active' : '',
        isDragging ? 'tab--dragging' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => !isEditing && onSwitch(tab.id)}
      tabIndex={isEditing ? -1 : 0}
      role="tab"
      aria-selected={isActive}
      onKeyDown={e => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSwitch(tab.id);
        }
      }}
    >
      {isEditing ? (
        <input
          className="tab__rename-input"
          value={editValue}
          autoFocus
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="tab__label" onDoubleClick={startEditing}>
          {tab.title}
        </span>
      )}

      {/*
        .tab__indicator — fixed 18×18 px slot shared by the dot and the × button.
        Both children are absolutely positioned inside it.
        CSS toggles which is visible: dot at rest, × on tab hover.
      */}
      <div className="tab__indicator">
        {showDot && (
          <span
            className="tab__dot"
            aria-hidden="true"
            title="Workspace document — auto-persisted, not yet in Vault"
          />
        )}
        <button
          className="tab__close"
          title={'Close "' + tab.title + '"'}
          aria-label={'Close ' + tab.title}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation();
            onClose(tab.id);
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ── TitleTabRow ───────────────────────────────────────────────────────────────

import { getCurrentWindow } from '@tauri-apps/api/window';

export interface TitleTabRowProps {
  tabs: WorkspaceDocument[];
  activeTabId: string | null;
  currentView: 'workspace' | 'vault' | 'settings';
  onViewChange: (view: 'workspace' | 'vault' | 'settings') => void;
  onSwitch: (id: string) => void;
  onClose: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onCreate: () => void;
  onReorder: (tabs: WorkspaceDocument[]) => void;
  /** Set of tab IDs whose content is not yet synced with their vault item. */
  dirtyTabIds: Set<string>;
}

export default function TitleTabRow({
  tabs,
  activeTabId,
  currentView,
  onViewChange,
  onSwitch,
  onClose,
  onRename,
  onCreate,
  onReorder,
  dirtyTabIds,
}: TitleTabRowProps) {
  const win = getCurrentWindow();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tabs.findIndex(t => t.id === active.id);
    const newIndex = tabs.findIndex(t => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(tabs, oldIndex, newIndex));
    }
  };

  return (
    <div className="title-tab-row" data-tauri-drag-region>
      {/* 1. App Icon and View Toggle */}
      <div className="title-tab-row__left" data-tauri-drag-region>
        <span className="title-tab-row__icon" aria-hidden="true" data-tauri-drag-region>SB</span>
        <div className="title-tab-row__switcher">
          <button 
            className={`title-tab-row__switch-btn ${currentView === 'workspace' ? 'title-tab-row__switch-btn--active' : ''}`}
            onClick={() => onViewChange('workspace')}
          >
            Workspace
          </button>
          <button 
            className={`title-tab-row__switch-btn ${currentView === 'vault' ? 'title-tab-row__switch-btn--active' : ''}`}
            onClick={() => onViewChange('vault')}
          >
            Vault
          </button>
        </div>
      </div>

      {/* 2. Tab Strip (Hidden in Vault/Settings mode) */}
      <div className={`title-tab-row__tabs ${currentView !== 'workspace' ? 'title-tab-row__tabs--hidden' : ''}`} data-tauri-drag-region>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tabs.map(t => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            {tabs.map(tab => (
              <SortableTab
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeTabId}
                showDot={dirtyTabIds.has(tab.id)}
                onSwitch={onSwitch}
                onClose={onClose}
                onRename={onRename}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button className="title-tab-row__add" onClick={onCreate} aria-label="New tab" title="New tab">
          +
        </button>
      </div>

      {/* 3. Window Controls */}
      <div className="titlebar__controls">
        <button
          className="titlebar__btn"
          onClick={() => win.minimize()}
          title="Minimize"
          aria-label="Minimize window"
        >
          &#x2013;
        </button>
        <button
          className="titlebar__btn"
          onClick={() => win.toggleMaximize()}
          title="Maximize"
          aria-label="Maximize window"
        >
          &#x25A1;
        </button>
        <button
          className="titlebar__btn titlebar__btn--close"
          onClick={() => win.close()}
          title="Close"
          aria-label="Close window"
        >
          &#x2715;
        </button>
      </div>
    </div>
  );
}
