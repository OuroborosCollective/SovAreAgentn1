import React, { useState } from 'react';
import { Network, Database, Sparkles, Cpu, ShieldCheck, Zap, RefreshCw, Layers, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AhaMomentTimeline } from './AhaMomentTimeline';

export const SemanticGraphKnowledgeBase: React.FC = () => {
  const [engineMode, setEngineMode] = useState<'erdos-kappa' | 'hawking-prosom' | 'axiomatic-field'>('erdos-kappa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('g1');

  const [graphNodes, setGraphNodes] = useState([
    { 
      id: 'g1', 
      label: 'Axiomatic Core n+1', 
      type: 'Root', 
      stability: '99.9%', 
      entropy: '0.01',
      embeddingSnippet: '[0.1482, -0.8912, 0.4421, 0.9912, 0.0234, -0.5519, ... (dim=1536, HNSW indexed)]',
      metadata: { author: 'n+1 Sentinel', version: 'v4.8.3', clusterId: 'cls_root_001' },
      connections: ['g2', 'g3', 'g4']
    },
    { 
      id: 'g2', 
      label: 'Erdős-Kappa Field', 
      type: 'Combinator', 
      stability: '98.4%', 
      entropy: '0.04',
      embeddingSnippet: '[0.7712, 0.2319, -0.1142, 0.8841, -0.3321, 0.1294, ... (dim=1536, Kappa=1.414)]',
      metadata: { author: 'Gabardine Engine', version: 'v2.1', clusterId: 'cls_comb_042' },
      connections: ['g1', 'g4']
    },
    { 
      id: 'g3', 
      label: 'Hawking Pro-Som Rules', 
      type: 'Refactoring', 
      stability: '99.1%', 
      entropy: '0.02',
      embeddingSnippet: '[-0.2214, 0.5591, 0.8821, -0.1142, 0.4419, 0.7712, ... (dim=1536, Pro-Som)]',
      metadata: { author: 'Hawking Protocol', version: 'v1.9', clusterId: 'cls_ref_109' },
      connections: ['g1', 'g4']
    },
    { 
      id: 'g4', 
      label: 'Deterministic ARE-Logik Engine', 
      type: 'Execution', 
      stability: '99.8%', 
      entropy: '0.00',
      embeddingSnippet: '[0.9912, -0.1482, 0.3321, -0.8912, 0.1294, 0.5519, ... (dim=1536, ARE)]',
      metadata: { author: 'ARE Kernel', version: 'v4.0', clusterId: 'cls_exec_999' },
      connections: ['g1', 'g2', 'g3']
    },
  ]);

  const selectedNode = graphNodes.find(n => n.id === selectedNodeId) || graphNodes[0];

  const handleRunEnginePipeline = () => {
    setIsProcessing(true);
    setSuccessMsg(null);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessMsg(`Successfully executed ${engineMode.toUpperCase()} semantic graph refactoring with Hawking pro-som rules & Erdős-Kappa axiomatic field verification.`);
    }, 1200);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400">
              <Network size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Semantic Graph Knowledge Base & Axiomatic Field Engine</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Semantic graph detection, un-verstanden Gabardine combinatoring, deterministic ARE-Logik, Erdős-Kappa field analysis, and Hawking pro-som rules refactoring.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
            {(['erdos-kappa', 'hawking-prosom', 'axiomatic-field'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setEngineMode(mode)}
                className={`px-3 py-1.5 rounded-lg uppercase transition-all ${
                  engineMode === mode ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {mode.replace('-', ' ')}
              </button>
            ))}
          </div>
          <button
            onClick={handleRunEnginePipeline}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg text-sm"
          >
            {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
            <span>{isProcessing ? 'Running Pipeline...' : 'Execute Axiomatic Refactoring'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-sm text-emerald-300 flex items-center gap-3">
          <CheckCircle2 size={20} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Semantic Graph Visualizer */}
        <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 relative h-[520px] overflow-hidden shadow-2xl flex flex-col justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          <div className="flex justify-between items-center relative z-10">
            <span className="text-xs font-mono text-purple-400 flex items-center gap-2">
              <Sparkles size={16} />
              Semantic Graph Topology & Gabardine Combinator (Click Node for Sidebar)
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Engine: {engineMode.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10 my-auto">
            {graphNodes.map(node => {
              const isSelected = node.id === selectedNodeId;
              return (
                <motion.div
                  key={node.id}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-5 rounded-2xl space-y-2 shadow-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 shadow-purple-500/20'
                      : 'bg-zinc-900/95 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      {node.type}
                    </span>
                    <span className="text-xs font-mono text-emerald-400">{node.stability}</span>
                  </div>
                  <div className="text-sm font-bold text-white font-mono">{node.label}</div>
                  <div className="text-[11px] font-mono text-zinc-400 flex justify-between pt-1 border-t border-zinc-800">
                    <span>Entropy Delta:</span>
                    <span className="text-cyan-400">{node.entropy}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-zinc-500 relative z-10 pt-2 border-t border-zinc-900">
            <span>Erdős-Kappa Index: 0.9994</span>
            <span>Hawking Pro-Som Verified</span>
          </div>
        </div>

        {/* Right: Expandable Sidebar for Node Metadata & Embeddings */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-2xl flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu size={20} className="text-purple-400" />
                <span>Node Inspector Sidebar</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Selected
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 text-xs font-mono"
              >
                {/* Basic Metadata */}
                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Node ID:</span>
                    <span className="text-white font-bold">{selectedNode.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Label:</span>
                    <span className="text-purple-300">{selectedNode.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Cluster ID:</span>
                    <span className="text-cyan-400">{selectedNode.metadata.clusterId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Author / Engine:</span>
                    <span className="text-zinc-300">{selectedNode.metadata.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Version:</span>
                    <span className="text-emerald-400">{selectedNode.metadata.version}</span>
                  </div>
                </div>

                {/* Raw Embedding Snippet */}
                <div className="space-y-2">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layers size={14} className="text-purple-400" />
                    Raw Vector Embedding Snippet
                  </span>
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-[11px] text-purple-300/90 font-mono break-all leading-relaxed">
                    {selectedNode.embeddingSnippet}
                  </div>
                </div>

                {/* Related Node Connections */}
                <div className="space-y-2">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Network size={14} className="text-cyan-400" />
                    Connected Graph Nodes ({selectedNode.connections.length})
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedNode.connections.map(connId => {
                      const targetNode = graphNodes.find(n => n.id === connId);
                      return (
                        <button
                          key={connId}
                          onClick={() => setSelectedNodeId(connId)}
                          className="p-2.5 bg-zinc-950 hover:bg-zinc-800/80 rounded-xl border border-zinc-800 flex items-center justify-between transition-all text-left"
                        >
                          <div>
                            <span className="text-white font-bold">{targetNode?.label || connId}</span>
                            <span className="text-[10px] text-zinc-500 block">Type: {targetNode?.type}</span>
                          </div>
                          <ChevronRight size={14} className="text-purple-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="pt-4 border-t border-zinc-800 text-[11px] font-mono text-zinc-500 flex justify-between">
            <span>Axiomatic Field v4.8</span>
            <span className="text-emerald-400">Synced</span>
          </div>
        </div>
      </div>
      
      {/* Aha-Moment Timeline Section */}
      <div className="mt-8">
        <AhaMomentTimeline />
      </div>
    </div>
  );
};

export default SemanticGraphKnowledgeBase;
