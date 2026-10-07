import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Code, 
  FileText, 
  Link as LinkIcon,
  CornerDownRight,
  Clock,
  Tag
} from 'lucide-react';
import { getItem } from '../api/NotesApi';
import AuthContext from '../context/AuthContext';
import WikiText from '../components/WikiText';
import TagChip from '../components/TagChip';
import NoteForm from '../components/NoteForm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ItemDetail({ notes = [], removeNote, editNote }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useContext(AuthContext);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function loadItem() {
      if (!accessToken || !id) return;
      setLoading(true);
      setError('');
      setIsEditing(false);
      try {
        const data = await getItem(id, accessToken);
        setItem(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load item');
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [id, accessToken]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      if (removeNote) {
        await removeNote(item._id);
      }
      navigate('/notes');
    }
  };

  const handleUpdate = async (itemId, updatedData) => {
    if (editNote) {
      const updated = await editNote(itemId, updatedData);
      setItem(updated);
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading vault item...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/notes')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={16} /> Back to Vault
        </button>
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
          <h2 className="font-semibold text-lg mb-1">Item Not Found</h2>
          <p className="text-sm">{error || "This note doesn't exist or has been removed."}</p>
        </div>
      </div>
    );
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'snippet':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
            <Code size={12} /> Code Snippet ({item.language})
          </span>
        );
      case 'link':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <LinkIcon size={12} /> External Link
          </span>
        );
      case 'note':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            <FileText size={12} /> Note
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 h-full overflow-y-auto">
      {/* Top action bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <button
          onClick={() => navigate('/notes')}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Vault
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isEditing
                ? 'bg-gray-100 border-gray-300 text-gray-800'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Edit3 size={14} /> {isEditing ? 'Cancel Edit' : 'Edit Item'}
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Item</h2>
          <NoteForm
            initialItem={item}
            onUpdateNote={handleUpdate}
            existingItems={notes}
          />
        </div>
      ) : (
        <article className="space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getTypeBadge(item.type)}
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={12} /> {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {item.title}
            </h1>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center pt-1">
                <Tag size={13} className="text-gray-400" />
                {item.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
            )}
          </div>

          {/* Content display based on type */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            {item.type === 'note' && (
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base">
                <WikiText text={item.content} items={notes} />
              </div>
            )}

            {item.type === 'snippet' && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl">
                  <SyntaxHighlighter
                    language={item.language || 'javascript'}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1.25rem', borderRadius: '0.75rem' }}
                  >
                    {item.code}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}

            {item.type === 'link' && (
              <div className="space-y-4">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-medium transition-colors border border-blue-200"
                >
                  <ExternalLink size={16} /> Open URL: {item.url}
                </a>

                {item.description && (
                  <div className="text-gray-700 text-sm whitespace-pre-wrap pt-2">
                    <WikiText text={item.description} items={notes} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Unresolved Links in this item (if any) */}
          {item.unresolvedLinks && item.unresolvedLinks.length > 0 && (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Unresolved Links ({item.unresolvedLinks.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {item.unresolvedLinks.map((unresolvedTitle, i) => (
                  <Link
                    key={i}
                    to={`/notes?createTitle=${encodeURIComponent(unresolvedTitle)}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100/80 text-amber-900 hover:bg-amber-200 transition-colors border border-amber-300/60"
                  >
                    <span>[[{unresolvedTitle}]]</span>
                    <span className="text-[10px] font-bold text-amber-700">+ Create</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Backlinks / Linked From Section */}
          <section className="pt-6 border-t border-gray-200 space-y-4">
            <div className="flex items-center gap-2">
              <CornerDownRight size={18} className="text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Backlinks ({item.backlinks?.length || 0})
              </h2>
            </div>

            {item.backlinks && item.backlinks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.backlinks.map((bl) => (
                  <Link
                    key={bl._id}
                    to={`/item/${bl._id}`}
                    className="p-3.5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getTypeBadge(bl.type)}
                      <span className="font-medium text-sm text-gray-800 group-hover:text-blue-600 truncate">
                        {bl.title}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-blue-500">→</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No other items link to this note yet. Reference it elsewhere using <code>[[{item.title}]]</code>.
              </p>
            )}
          </section>
        </article>
      )}
    </div>
  );
}
