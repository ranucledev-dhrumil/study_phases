import React from 'react';
import Sidebar from './Sidebar';
import useNotes from '../hooks/useNotes';

export default function VaultLayout({ children }) {
  const { notes, loading, error, addNote, editNote, removeNote, fetchNotes } = useNotes();

  // Only inject vault state into children that can accept it
  const childWithProps = React.isValidElement(children)
    ? React.cloneElement(children, {
        notes,
        loading,
        error,
        addNote,
        editNote,
        removeNote,
        fetchNotes,
      })
    : children;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Persistent Sidebar */}
      <Sidebar items={notes} />

      {/* Main Content Area — no overflow for graph, scroll for other pages */}
      <main className="flex-1 h-screen overflow-hidden relative">
        {childWithProps}
      </main>
    </div>
  );
}
