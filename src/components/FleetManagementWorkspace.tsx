import React, { useState, useEffect } from 'react';
import { 
  Server, Shield, Box, Zap, RefreshCw, GitCommit, Database, Settings, Activity, Workflow, CheckCircle2, Lock, ListChecks, RotateCcw, ArrowUpCircle, Eye, EyeOff, Terminal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp } from '../utils/deterministic';

export const FleetManagementWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'toolchain' | 'canary' | 'inference'>('endpoints');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [evidenceMode, setEvidenceMode] = useState<Record<string, boolean>>({});
  const [sparklineData, setSparklineData] = useState<number[]>([...Array(20)].map(() => generateDeterministicNumber(0, 100, performance.now())));

  useEffect(() => {
    const interval = setInterval(() => {
      setSparklineData(prev => {
        const next = [...prev.slice(1), generateDeterministicNumber(0, 100, performance.now())];
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fleetNodes = [
    { id: 'node-alpha', name: 'Alpha-Omega Core', status: 'optimal', tools: 142, version: 'rev-903', log: 'cabaRY [PASS] - State mutations verified in isolated memory partition. Entropy nominal.' },
    { id: 'node-beta', name: 'Beta Inference Matrix', status: 'optimal', tools: 89, version: 'rev-903', log: 'cabaRY [PASS] - Ouroboros event stream parsing stable. Zero regression detected.' },
    { id: 'node-gamma', name: 'Gamma Perception Engine', status: 'warning', tools: 169, version: 'rev-902', log: 'cabaRY [WARN] - Kappapos variance detected. Re-evaluating structural bounds.' },
  ];

  const toggleEvidence = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEvidenceMode(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 text-zinc-100 font-sans">
      {/* High-level Summary Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Server size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Fleet Awareness & Management Workspace
                <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-md">
                  400+ TOOLS
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Seamless docking of Docker/API endpoints, revision-safe multiconnect toolchains, and double-verified Canary testing.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-4 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Fleet Aggregate Stability</span>
              <span className="text-lg font-bold text-emerald-400">99.98%</span>
            </div>
            <div className="w-px h-8 bg-zinc-800"></div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Inference Load</span>
              <div className="flex items-end gap-0.5 h-6 mt-1">
                {sparklineData.map((val, i) => (
                  <div key={i} className="w-1.5 bg-indigo-500/50 rounded-t-sm transition-all duration-300" style={{ height: `${Math.max(10, val)}%` }} />
                ))}
              </div>
            </div>
          </div>
          <button className="px-4 py-1.5 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 text-emerald-300 font-bold text-[10px] uppercase rounded-xl flex items-center gap-2 transition-all shadow-lg">
            <RefreshCw size={12} className="animate-spin-slow" />
            <span>Arelogic Perception Engine Active</span>
          </button>
        </div>
      </header>

      {/* Bulk Operation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/40 border border-zinc-800 p-3 rounded-2xl">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-2">Bulk Fleet Operations</div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors border border-zinc-700">
            <ListChecks size={14} /> Validate All
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors border border-zinc-700">
            <RotateCcw size={14} /> Rollback All
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors border border-indigo-500">
            <ArrowUpCircle size={14} /> Update All
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'endpoints', label: 'Docker & API Endpoints', icon: Box },
          { id: 'toolchain', label: '400-Tool Workspace', icon: Workflow },
          { id: 'canary', label: 'Canary Test Verification', icon: Shield },
          { id: 'inference', label: 'Inference Learn Logic', icon: Zap }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
              activeTab === tab.id 
                ? 'bg-zinc-900 border-zinc-700 text-white' 
                : 'bg-zinc-950 border-zinc-800/50 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Fleet Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Fleet Nodes</span>
              <span className="text-[10px] text-zinc-500">3 ACTIVE</span>
            </div>
            
            <div className="space-y-3">
              {fleetNodes.map(node => (
                <div 
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                    selectedNode === node.id ? 'bg-zinc-900 border-indigo-500/50' : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">{node.name}</span>
                    <div className={`size-2 rounded-full ${node.status === 'optimal' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                    <span>{node.tools} Tools Mounted</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-800 px-1.5 py-0.5 rounded">{node.version}</span>
                      <button 
                        onClick={(e) => toggleEvidence(node.id, e)}
                        className={`p-1 rounded-md transition-colors ${evidenceMode[node.id] ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
                        title="Toggle Evidence Mode (cabaRY test logs)"
                      >
                        {evidenceMode[node.id] ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                    </div>
                  </div>

                  {evidenceMode[node.id] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 p-2 bg-black border border-zinc-800 rounded-lg text-[10px] font-mono text-emerald-400 flex flex-col gap-1 overflow-hidden"
                    >
                      <div className="flex items-center gap-1 text-zinc-500 mb-1 border-b border-zinc-900 pb-1">
                        <Terminal size={10} /> RAW cabaRY LOGS
                      </div>
                      <span className="whitespace-pre-wrap">{node.log}</span>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
              <GitCommit size={14} />
              Commit Fleet Revision (Readback Safe)
            </button>
          </div>
        </div>

        {/* Right Column: Tab Content */}
        <div className="lg:col-span-2">
          {activeTab === 'endpoints' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                <Box className="text-indigo-400" size={20} />
                <h2 className="text-lg font-bold text-white">Seamless Docker & API Docking</h2>
              </div>
              <p className="text-xs text-zinc-400">
                Evidence runtime validation and secured multiconnect architecture. Dock any Docker image or external API endpoint seamlessly into the fleet.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Database size={16} className="text-blue-400" />
                    <span className="text-sm font-bold text-white">Milvus Vector Sync</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">Status: Connected • Protocol: gRPC</div>
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={16} className="text-emerald-400" />
                    <span className="text-sm font-bold text-white">Ouroboros Event Stream</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">Status: Docked • Protocol: WSS</div>
                </div>
              </div>
              
              <button className="w-full py-3 border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 rounded-xl text-xs font-bold transition-all">
                + Configure New Integration Endpoint
              </button>
            </motion.div>
          )}

          {activeTab === 'toolchain' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                <Workflow className="text-indigo-400" size={20} />
                <h2 className="text-lg font-bold text-white">Functional Toolchain Workspace</h2>
              </div>
              <p className="text-xs text-zinc-400">
                Information processing workspace with access to 400 specialized tools. Apply bulk edits or target individual nodes with unified readback capabilities.
              </p>
              
              <div className="bg-black border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-300">
                <div className="flex items-center gap-2 text-zinc-500 mb-2 border-b border-zinc-900 pb-2">
                  <Settings size={14} /> ACTIVE TOOLCHAIN CONFIG
                </div>
                <div>{`{`}</div>
                <div className="pl-4">"engine": "Arelogic Automatic Learn",</div>
                <div className="pl-4">"tools_loaded": 400,</div>
                <div className="pl-4">"readback_verification": "enabled",</div>
                <div className="pl-4">"active_modules": ["pattern-rec", "evidence-state"]</div>
                <div>{`}`}</div>
              </div>
            </motion.div>
          )}

          {activeTab === 'canary' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <Shield className="text-emerald-400" size={20} />
                  <h2 className="text-lg font-bold text-white">Double-Test Canary Verification</h2>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-1 rounded">STRICT CABARY LOGIC</span>
              </div>
              <p className="text-xs text-zinc-400">
                All logic changes and state mutations are tested twice (double verification) before being accepted as proven and propagated to the processing queue.
              </p>
              
              <div className="space-y-3">
                {[
                  { name: 'State Vector Mutation', status: 'verified', time: '2s ago' },
                  { name: 'Kappapos Entropy Reset', status: 'verified', time: '45s ago' },
                  { name: 'New Endpoint Docking', status: 'testing', time: 'pending' }
                ].map((test, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <span className="text-xs font-bold text-white">{test.name}</span>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="text-zinc-500">{test.time}</span>
                      {test.status === 'verified' ? (
                        <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={12}/> Double-Verified</span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400"><RefreshCw size={12} className="animate-spin"/> Testing (1/2)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'inference' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                <Zap className="text-amber-400" size={20} />
                <h2 className="text-lg font-bold text-white">Arelogic System-Wide Inference</h2>
              </div>
              <p className="text-xs text-zinc-400">
                Automatic learn logic perception engine (Arelogic) observing the entire architecture to derive system-wide optimizations.
              </p>
              
              <div className="p-5 bg-amber-950/20 border border-amber-900/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-500">
                  <Lock size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Inference Insight</span>
                </div>
                <p className="text-sm text-zinc-300 font-mono leading-relaxed">
                  "Based on cross-architecture endpoint load and recent canary test outcomes, recommend allocating 15% more memory to the Beta Inference Matrix to handle an expected surge in Ouroboros recursion patterns."
                </p>
                <div className="pt-2 flex justify-end">
                   <button className="px-4 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors">
                     Apply Inference
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

