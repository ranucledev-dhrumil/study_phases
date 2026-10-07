import { useState, useMemo, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Code, 
  Link as LinkIcon, 
  Network, 
  Search, 
  Tag, 
  LogOut, 
  Layers,
} from 'lucide-react';
import AuthContext from '../context/AuthContext';

export default function Sidebar({ items = [] }) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // all | note | snippet | link
  const [selectedTag, setSelectedTag] = useState('all');
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);

  // Get all unique tags across items
  const allTags = useMemo(() => {
    const tagSet = new Set();
    items.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }, [items]);

  // Filter items by search, type, and tag
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.content?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.code?.toLowerCase().includes(search.toLowerCase());

      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesTag = selectedTag === 'all' || (item.tags && item.tags.includes(selectedTag));

      return matchesSearch && matchesType && matchesTag;
    });
  }, [items, search, selectedType, selectedTag]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'snippet':
        return <Code size={15} className="text-purple-500" />;
      case 'link':
        return <LinkIcon size={15} className="text-emerald-500" />;
      case 'note':
      default:
        return <FileText size={15} className="text-blue-500" />;
    }
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-screen select-none shrink-0">
      {/* Vault Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <Link to="/notes" className="flex items-center gap-2 text-gray-900 font-bold text-lg hover:opacity-80">
          <Layers className="text-blue-600" size={22} />
          <span>Second Brain</span>
        </Link>
      </div>

      {/* Nav Actions */}
      <div className="p-3 border-b border-gray-100 flex flex-col gap-1 text-sm font-medium">
        <Link
          to="/notes"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            location.pathname === '/notes'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Layers size={18} />
          <span>Vault Items</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-normal">
            {items.length}
          </span>
        </Link>

        <Link
          to="/graph"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            location.pathname === '/graph'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Network size={18} className="text-indigo-600" />
          <span>Graph View</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="p-3 space-y-3 border-b border-gray-100 bg-gray-50/50">
        {/* Search input */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search vault..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-md border border-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {search && (
            <button 
              onClick={() => setSearch('')} 
              className="absolute right-2 top-2 text-xs text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Type selector tabs */}
        <div className="flex bg-gray-200/60 p-0.5 rounded-lg text-xs font-medium text-gray-600">
          {[
            { id: 'all', label: 'All' },
            { id: 'note', label: 'Notes' },
            { id: 'snippet', label: 'Code' },
            { id: 'link', label: 'Links' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`flex-1 py-1 text-center rounded-md transition-all ${
                selectedType === tab.id
                  ? 'bg-white text-gray-900 shadow-xs font-semibold'
                  : 'hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar text-xs">
            <span className="text-gray-400 shrink-0">
              <Tag size={12} />
            </span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                selectedTag === 'all'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              all tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <div className="text-[11px] font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">
          Items ({filteredItems.length})
        </div>
        {filteredItems.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-6">
            No matching items found
          </div>
        ) : (
          filteredItems.map((item) => {
            const isActive = location.pathname === `/item/${item._id}`;
            return (
              <Link
                key={item._id}
                to={`/item/${item._id}`}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="shrink-0">{getTypeIcon(item.type)}</span>
                <span className="truncate flex-1">{item.title || 'Untitled'}</span>
                {item.linkedNoteIds && item.linkedNoteIds.length > 0 && (
                  <span className="text-[10px] text-gray-400 group-hover:text-gray-600">
                    {item.linkedNoteIds.length} 🔗
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>

      {/* Footer / User Profile & Logout */}
      <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="truncate text-xs text-gray-600">
          <div className="font-semibold text-gray-900 truncate">
            {user?.email || 'Logged In'}
          </div>
          <div className="text-[10px] text-gray-400">Personal Vault</div>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
