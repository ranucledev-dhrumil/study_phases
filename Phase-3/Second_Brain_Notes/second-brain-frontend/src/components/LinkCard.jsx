import { Trash2, ExternalLink } from "lucide-react";
import TagChip from "./TagChip";
import { Link } from "react-router-dom";
import WikiText from "./WikiText";

function LinkCard({ link, onDelete, items = [] }) {
  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <button
        onClick={() => onDelete(link._id)}
        className="absolute right-4 top-4 rounded-full p-2 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        title="Delete link"
      >
        <Trash2 size={16} />
      </button>

      <div>
        <div className="mb-2 pr-8 flex items-start gap-2">
           <Link 
             to={`/item/${link._id}`}
             className="text-lg font-semibold text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors"
           >
             {link.title || link.url}
           </Link>
           <a href={link.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600 flex-shrink-0 mt-1">
             <ExternalLink size={16} />
           </a>
        </div>
        
        <a href={link.url} target="_blank" rel="noreferrer" className="mb-3 block text-sm text-blue-500 hover:underline truncate">
            {link.url}
        </a>

        <div className="mb-4 text-sm text-gray-600 line-clamp-3">
          <WikiText text={link.description} items={items} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {link.tags?.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <span>{new Date(link.createdAt).toLocaleDateString()}</span>
        <Link to={`/item/${link._id}`} className="text-blue-500 hover:underline">
          View details →
        </Link>
      </div>
    </div>
  );
}

export default LinkCard;
