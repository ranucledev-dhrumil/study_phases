import { useNavigate, Link } from 'react-router-dom';

// Splits text into tokens: wiki-links, highlights, or plain text.
// Processes wiki-links first (outer split), then highlights within each plain chunk.
function tokenize(text) {
  const wikiSplit = text.split(/(\[\[.*?\]\])/g);
  const tokens = [];

  wikiSplit.forEach((chunk) => {
    const wikiMatch = chunk.match(/^\[\[(.*?)\]\]$/);
    if (wikiMatch) {
      tokens.push({ kind: 'wikilink', title: wikiMatch[1].trim() });
      return;
    }
    // Not a wiki-link chunk — split for highlights
    const hlSplit = chunk.split(/(==.+?==)/g);
    hlSplit.forEach((part) => {
      const hlMatch = part.match(/^==(.+?)==$/);
      if (hlMatch) {
        tokens.push({ kind: 'highlight', text: hlMatch[1] });
      } else if (part) {
        tokens.push({ kind: 'text', text: part });
      }
    });
  });

  return tokens;
}

export default function RichText({ text, items = [] }) {
  const navigate = useNavigate();
  if (!text) return null;

  const tokens = tokenize(text);

  return (
    <span>
      {tokens.map((token, index) => {
        if (token.kind === 'highlight') {
          return (
            <mark
              key={index}
              className="bg-yellow-200 text-gray-900 rounded px-0.5"
            >
              {token.text}
            </mark>
          );
        }

        if (token.kind === 'wikilink') {
          const targetItem = items.find(
            (i) => i.title.toLowerCase() === token.title.toLowerCase()
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
          }
          return (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/notes?createTitle=${encodeURIComponent(token.title)}`);
              }}
              className="inline-flex items-center text-amber-700 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-400 rounded px-1.5 py-0.5 text-xs font-medium transition-colors mx-0.5 cursor-pointer"
              title={`Note "${token.title}" doesn't exist yet. Click to create it.`}
            >
              [[{token.title}]] <span className="ml-1 font-bold text-amber-600">+</span>
            </button>
          );
        }

        return <span key={index}>{token.text}</span>;
      })}
    </span>
  );
}