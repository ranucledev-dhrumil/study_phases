import { useEffect, useState, useRef, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { getGraph } from '../api/NotesApi';
import AuthContext from '../context/AuthContext';
import { Network, RefreshCw, Layers } from 'lucide-react';

export default function GraphView() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const navigate = useNavigate();
  const { accessToken } = useContext(AuthContext);

  const fetchGraphData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await getGraph(accessToken);
      const formatted = {
        nodes: data.nodes || [],
        links: (data.edges || []).map((e) => ({
          source: e.source,
          target: e.target,
        })),
      };
      setGraphData(formatted);
    } catch (err) {
      console.error('Failed to load graph data:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessToken) return;
      setLoading(true);
      try {
        const data = await getGraph(accessToken);
        if (!cancelled) {
          setGraphData({
            nodes: data.nodes || [],
            links: (data.edges || []).map((e) => ({
              source: e.source,
              target: e.target,
            })),
          });
        }
      } catch (err) {
        console.error('Failed to load graph data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [accessToken]);

  // Handle dynamic container resize
  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getNodeColor = (type) => {
    switch (type) {
      case 'snippet':
        return '#8b5cf6'; // purple
      case 'link':
        return '#10b981'; // emerald/green
      case 'note':
      default:
        return '#3b82f6'; // blue
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100 overflow-hidden relative">
      {/* Top Overlay Bar */}
      <div className="absolute top-4 left-4 z-10 bg-slate-800/90 backdrop-blur border border-slate-700 p-3 rounded-xl shadow-lg flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Network className="text-indigo-400" size={20} />
          <span className="font-bold text-sm tracking-wide">Vault Knowledge Graph</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-300 border-l border-slate-700 pl-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Note
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Snippet
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Link
          </span>
        </div>

        <button
          onClick={fetchGraphData}
          title="Refresh Graph"
          className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main Canvas Area */}
      <div ref={containerRef} className="flex-1 w-full h-full">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm gap-2">
            <RefreshCw className="animate-spin" size={16} /> Loading vault connections...
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
            <Layers size={32} className="text-slate-600 mb-2" />
            <p className="font-medium text-base">No items in your vault yet</p>
            <p className="text-xs text-slate-500">
              Create notes and link them together using <code>[[Title]]</code> syntax!
            </p>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeId="id"
            nodeLabel="title"
            nodeColor={(node) => getNodeColor(node.type)}
            nodeRelSize={6}
            linkColor={() => '#475569'}
            linkWidth={1.5}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            backgroundColor="#0f172a"
            onNodeClick={(node) => {
              if (node.id) {
                navigate(`/item/${node.id}`);
              }
            }}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.title || 'Untitled';
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;

              // Draw Node circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
              ctx.fillStyle = getNodeColor(node.type);
              ctx.fill();

              // Draw Label below node
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#cbd5e1';
              ctx.fillText(label, node.x, node.y + 10);
            }}
          />
        )}
      </div>
    </div>
  );
}
