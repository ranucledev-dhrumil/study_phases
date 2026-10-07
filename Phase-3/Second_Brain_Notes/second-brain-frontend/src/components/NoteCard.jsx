import TagChip from "./TagChip";
import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import RichText from "./RichText";

function NoteCard({ note, onDelete, items = [] }) {
  const formattedDate = new Date(note.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group flex flex-col justify-between gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <Link 
          to={`/item/${note._id}`}
          className="text-lg font-semibold leading-snug text-gray-900 hover:text-blue-600 transition-colors"
        >
          {note.title}
        </Link>
        <button
          onClick={() => onDelete(note._id)}
          aria-label="Delete note"
          className="shrink-0 rounded-md p-2 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex-1 whitespace-pre-wrap text-sm text-gray-600">
        <RichText text={note.content} items={items} />
      </div>

      {note.tags && note.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      ) : (
        <p className="text-xs italic text-gray-400">No tags</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{formattedDate}</span>
        <Link to={`/item/${note._id}`} className="text-blue-500 hover:underline">
          View details →
        </Link>
      </div>
    </div>
  );
}

export default NoteCard;