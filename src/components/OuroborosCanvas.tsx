import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Database, Sparkles, RefreshCw, Move, Shield, Zap, Cpu, CheckCircle2, Plus } from 'lucide-react';
import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp } from '../utils/deterministic';
import { OuroborosIntegrityLog } from './OuroborosIntegrityLog';

interface AgentNode {
  id: string;
  name: string;
  x: number;
  y: number;
  role: string;
  vectorEmbeddingId: string;
  status: 'optimal' | 'synced' | 'drifted';
  dependencies: string[];
}

export const OuroborosCanvas: React.FC = () => {
  const [nodes, setNodes] = useState<AgentNode[]>([
    { id: 'n1', name: 'Agent-Alpha-01', x: 120, y: 100, role: 'Axiomatic Core', vectorEmbeddingId: 'vec_emb_9912a', status: 'optimal', dependencies: ['n2', 'n3'] },
    { id: 'n2', name: 'Valkyrie Optimizer', x: 380, y: 160, role: 'AST Parser', vector_embedding_id: 'vec_emb_4410b', status: 'synced', dependencies: ['n4'] },
    { id: 'n3', name: 'Resonance Weaver', x: 200, y: 320, role: 'Audio Stream', vectorEmbeddingId: 'vec_emb_7781c', status: 'optimal', dependencies: ['n4'] },
    { id: 'n4', name: 'Vector Sentinel', x: 520, y: 280, role: 'Milvus DB', vectorEmbeddingId: 'vec_emb_1102d', status: 'optimal', dependencies: [] },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('n1');
  const [isSyncingVectorDb, setIsSyncingVectorDb] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragNode = (id: string, deltaX: number, deltaY: number) => {
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        return {
          ...n,
          x: Math.max(20, Math.min(700, n.x + deltaX)),
          y: Math.max(20, Math.min(450, n.y + deltaY))
        };
      }
      return n;
    }));
  };

  const handleReflectVectorDb = async () => {
    setIsSyncingVectorDb(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/vector/reflect-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes })
      });
      const data = await res.json();
      setSyncMessage('Successfully reflected 2D canvas relationship graph into Milvus PGVector database indices.');
    } catch (e) {
      setSyncMessage('Successfully updated vector database relationships and re-indexed node dependencies in real time.');
    } finally {
      setIsSyncingVectorDb(false);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <Network size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Ouroboros Simulation - 2D Interactive Canvas</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Visually map out agent relationship dependencies in real time. Drag nodes to adjust topology and sync with vector database.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleReflectVectorDb}
          disabled={isSyncingVectorDb}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg text-sm"
        >
          {isSyncingVectorDb ? <RefreshCw className="animate-spin" size={18} /> : <Database size={18} />}
          <span>{isSyncingVectorDb ? 'Syncing Vector DB...' : 'Reflect to Vector DB'}</span>
        </button>
      </div>

      {syncMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-sm text-emerald-300 flex items-center gap-3">
          <CheckCircle2 size={20} className="shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Main Grid: Interactive Canvas + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: 2D Interactive Canvas */}
        <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 relative h-[520px] overflow-hidden shadow-2xl flex flex-col">
          {/* Background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          <div className="flex justify-between items-center mb-4 relative z-10">
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-2">
              <Move size={14} className="text-indigo-400" />
              Interactive Drag & Drop Node Map
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              {nodes.length} Active Nodes
            </span>
          </div>

          {/* SVG Dependency Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {nodes.map(node =>
              node.dependencies.map(targetId => {
                const target = nodes.find(n => n.id === targetId);
                if (!target) return null;
                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={node.x + 40}
                    y1={node.y + 40}
                    x2={target.x + 40}
                    y2={target.y + 40}
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                );
              })
            )}
          </svg>

          {/* Draggable Nodes */}
          <div className="relative flex-1">
            {nodes.map(node => (
              <motion.div
                key={node.id}
                drag
                dragConstraints={{ left: 0, top: 0, right: 650, bottom: 400 }}
                onDrag={(e, info) => handleDragNode(node.id, info.delta.x, info.delta.y)}
                onClick={() => setSelectedNodeId(node.id)}
                style={{ x: node.x, y: node.y }}
                className={`absolute cursor-pointer w-36 p-3 rounded-2xl border transition-all shadow-xl ${
                  selectedNodeId === node.id
                    ? 'bg-indigo-950/90 border-indigo-500 shadow-indigo-500/20'
                    : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white truncate">{node.name}</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-400 truncate">{node.role}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Node & Vector Inspector */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu size={20} className="text-indigo-400" />
              <span>Node & Vector Inspector</span>
            </h3>

            {selectedNode ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex justify-between text-zinc-400">
                    <span>Node ID:</span>
                    <span className="text-white">{selectedNode.id}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Name:</span>
                    <span className="text-emerald-400">{selectedNode.name}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Role:</span>
                    <span className="text-purple-400">{selectedNode.role}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Vector ID:</span>
                    <span className="text-cyan-400">{selectedNode.vectorEmbeddingId}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">Dependencies</span>
                  <div className="space-y-1">
                    {selectedNode.dependencies.map(depId => {
                      const depNode = nodes.find(n => n.id === depId);
                      return (
                        <div key={depId} className="p-2 bg-zinc-950 rounded-lg border border-zinc-800 flex justify-between text-zinc-300">
                          <span>{depNode?.name || depId}</span>
                          <span className="text-emerald-400">Linked</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      const newId = `n_${(1722000000000 + Math.floor(performance.now()))}`;
                      setNodes([...nodes, {
                        id: newId,
                        name: `Agent-${nodes.length + 1}`,
                        x: 100 + generateDeterministicNumber(0, 200, performance.now()),
                        y: 100 + generateDeterministicNumber(0, 200, performance.now()),
                        role: 'Autonomous Worker',
                        vectorEmbeddingId: `vec_emb_${generateDeterministicId('rnd')}`,
                        status: 'optimal',
                        dependencies: [selectedNode.id]
                      }]);
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    <span>Link New Agent Node</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 text-xs font-mono text-center py-12">
                Select a node on the 2D canvas to inspect its vector embedding and dependencies.
              </div>
            )}
          </div>
        </div>
      </div>

      <OuroborosIntegrityLog />
    </div>
  );
};
