import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function WikiText({ text, items = [] }) {
  const navigate = useNavigate();

  if (!text) return null;

  // Split by [[wiki-link]] patterns while capturing the matched groups
  const parts = text.split(/(\[\[.*?\]\])/g);

  return (
    <span>
      {parts.map((part, index) => {
        const match = part.match(/^\[\[(.*?)\]\]$/);
        if (match) {
          const title = match[1].trim();
          const targetItem = items.find(
            (i) => i.title.toLowerCase() === title.toLowerCase()
          );

          if (targetItem) {
            return (
              <Link
                key={index}
                to={`/item/${targetItem._id}`}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded text-sm font-medium border border-blue-200 transition-colors mx-0.5 no-underline"
              >
                [[{targetItem.title}]]
              </Link>
            );
          } else {
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/notes?createTitle=${encodeURIComponent(title)}`);
                }}
                className="inline-flex items-center text-amber-700 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-400 rounded px-1.5 py-0.5 text-xs font-medium transition-colors mx-0.5 cursor-pointer"
                title={`Note "${title}" doesn't exist yet. Click to create it.`}
              >
                [[{title}]] <span className="ml-1 font-bold text-amber-600">+</span>
              </button>
            );
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
