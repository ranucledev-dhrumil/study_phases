// NoteGrid.jsx
import NoteCard from "./NoteCard";
import SnippetCard from "./SnippetCard";
import LinkCard from "./LinkCard";

function NoteGrid({ notes, removeNote }) {
  if (notes.length === 0) {
    return (
      <div className="py-10 text-center text-gray-500">
        <p>No items yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((item) => {
        if (item.type === 'snippet') return <SnippetCard key={item._id} snippet={item} onDelete={removeNote} items={notes} />;
        if (item.type === 'link') return <LinkCard key={item._id} link={item} onDelete={removeNote} items={notes} />;
        return <NoteCard key={item._id} note={item} onDelete={removeNote} items={notes} />;
      })}
    </div>
  );
}

export default NoteGrid;