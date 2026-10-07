import { Trash2 } from "lucide-react";
import TagChip from "./TagChip";
import { Link } from "react-router-dom";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

function SnippetCard({ snippet, onDelete }) {
  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <button
        onClick={() => onDelete(snippet._id)}
        className="absolute right-4 top-4 rounded-full p-2 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        title="Delete snippet"
      >
        <Trash2 size={16} />
      </button>

      <div>
        <Link 
          to={`/item/${snippet._id}`}
          className="mb-2 pr-8 text-lg font-semibold text-gray-800 line-clamp-2 block hover:text-blue-600 transition-colors"
        >
          {snippet.title}
        </Link>
        
        <div className="mb-4">
          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {snippet.language || 'code'}
          </span>
        </div>

        <div className="mb-4 overflow-hidden rounded-md text-sm">
          <SyntaxHighlighter language={snippet.language || 'javascript'} style={vscDarkPlus} customStyle={{ margin: 0, maxHeight: '200px' }}>
            {snippet.code}
          </SyntaxHighlighter>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {snippet.tags?.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
        <Link to={`/item/${snippet._id}`} className="text-blue-500 hover:underline">
          View details →
        </Link>
      </div>
    </div>
  );
}

export default SnippetCard;
