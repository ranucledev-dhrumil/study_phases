import { useState } from "react";
import NoteForm from "../components/NoteForm";
import NoteGrid from "../components/NoteGrid";
import { PlusCircle } from "lucide-react";

function Notes({ notes = [], loading = false, error = "", addNote, removeNote }) {
  const [showForm, setShowForm] = useState(true);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Vault Dashboard</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">
              {notes.length} {notes.length === 1 ? 'item' : 'items'}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Capture notes, code snippets, and links with bidirectional <code>[[wiki-links]]</code>.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition"
        >
          <PlusCircle size={16} />
          <span>{showForm ? "Hide Form" : "New Item"}</span>
        </button>
      </div>

      {/* Creation Form */}
      {showForm && (
        <div className="transition-all">
          <NoteForm onAddNote={addNote} existingItems={notes} />
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Loading vault items...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      ) : (
        <NoteGrid notes={notes} removeNote={removeNote} />
      )}
    </div>
  );
}

export default Notes;
