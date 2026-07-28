import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Network, 
  Brain, 
  Settings2, 
  MessageSquare, 
  Activity, 
  Mic, 
  GitBranch, 
  Zap,
  Globe2,
  Database,
  RefreshCw,
  CheckCircle2,
  Lock,
  LineChart,
  Sparkles
} from 'lucide-react';
import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp } from '../utils/deterministic';

type EngineMode = 'GRAMAR' | 'HABAR' | 'SYNTHESIS';

interface NodePath {
  id: string;
  source: string;
  target: string;
  weight: number;
  label: string;
}

interface LinguaVectorConfig {
  targetAudience: string;
  linguisticSetting: string;
  autoSync: boolean;
  deterministicMode: boolean;
}

export const LinguaHabarEngine: React.FC = () => {
  const [activeMode, setActiveMode] = useState<EngineMode>('SYNTHESIS');
  const [paths, setPaths] = useState<NodePath[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [vectorSyncStatus, setVectorSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('synced');
  const [config, setConfig] = useState<LinguaVectorConfig>({
    targetAudience: 'b2b',
    linguisticSetting: 'bilingual',
    autoSync: true,
    deterministicMode: true
  });
  
  const [scores, setScores] = useState({
    lexiScore: 92.4,
    gramVect: 88.1,
    vocaDial: 76.3,
    idiomix: 84.9,
    syntacCore: 95.2,
    contexta: 89.7
  });

  useEffect(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem('n1_linguahabar_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Failed to parse linguahabar config');
      }
    }
    generatePaths(activeMode);
  }, []);

  useEffect(() => {
    generatePaths(activeMode);
  }, [activeMode, config]);

  const updateConfig = (key: keyof LinguaVectorConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    localStorage.setItem('n1_linguahabar_config', JSON.stringify(newConfig));
  };

  const forceSync = () => {
    setVectorSyncStatus('syncing');
    setTimeout(() => {
      // Simulate pushing weights to vector store
      const vectors = JSON.parse(localStorage.getItem('n1_system_knowledge_vectors') || '[]');
      vectors.push({
        id: generateDeterministicId('vec-lingua'),
        timestamp: new Date().toISOString(),
        mode: activeMode,
        scores: { ...scores }
      });
      localStorage.setItem('n1_system_knowledge_vectors', JSON.stringify(vectors));
      
      // Update logs
      const puckLogs = JSON.parse(localStorage.getItem('n1_puck_personal_logs') || '[]');
      puckLogs.unshift({
        id: generateDeterministicId('log-lingua'),
        timestamp: new Date().toLocaleString('de-DE'),
        category: 'system_core',
        title: `LinguaHabar Sync: ${activeMode}`,
        description: `Vector space aligned with linguistic matrix. LexiScore: ${scores.lexiScore.toFixed(1)}%, VocaDial: ${scores.vocaDial.toFixed(1)}%`,
        type: 'success'
      });
      localStorage.setItem('n1_puck_personal_logs', JSON.stringify(puckLogs));
      
      setVectorSyncStatus('synced');
    }, 1500);
  };

  const generatePaths = (mode: EngineMode) => {
    setIsProcessing(true);
    setTimeout(() => {
      const newPaths: NodePath[] = [];
      const nodeCount = Math.floor(generateDeterministicNumber(8, 16, performance.now()));
      
      for (let i = 0; i < nodeCount; i++) {
        let source, target, label;
        
        if (mode === 'GRAMAR') {
          source = ['SyntacCore', 'LogiGram', 'LexiScore'][Math.floor(generateDeterministicNumber(0, 3, performance.now() + i))];
          target = ['GramVect', 'DetVox', 'PathLingua'][Math.floor(generateDeterministicNumber(0, 3, performance.now() + i + 1))];
          label = 'Logical Deterministic Routing';
        } else if (mode === 'HABAR') {
          source = ['VocaDial', 'Idiomix', 'HabarVox'][Math.floor(generateDeterministicNumber(0, 3, performance.now() + i))];
          target = ['Contexta', 'NodoVoice', 'LexiTrack'][Math.floor(generateDeterministicNumber(0, 3, performance.now() + i + 1))];
          label = 'Dialectical Adaptation';
        } else {
          // SYNTHESIS
          source = ['SyntacCore', 'VocaDial', 'Verbalog'][Math.floor(generateDeterministicNumber(0, 3, performance.now() + i))];
          target = ['GramVect', 'Contexta', 'NodoVoice'][Math.floor(generateDeterministicNumber(0, 3, performance.now() + i + 1))];
          label = 'Hybrid Matrix Sync';
        }
        
        newPaths.push({
          id: generateDeterministicId('path'),
          source,
          target,
          weight: Math.floor(generateDeterministicNumber(50, 100, performance.now() + i * 2)),
          label
        });
      }
      
      // Update scores deterministically based on mode
      const variance = (generateDeterministicNumber(0, 1, performance.now()) - 0.5) * 5;
      setScores(prev => ({
        lexiScore: mode === 'GRAMAR' ? Math.min(99.9, prev.lexiScore + variance) : prev.lexiScore,
        gramVect: mode === 'GRAMAR' ? Math.min(99.9, prev.gramVect + variance) : prev.gramVect,
        vocaDial: mode === 'HABAR' ? Math.min(99.9, prev.vocaDial + variance) : prev.vocaDial,
        idiomix: mode === 'HABAR' ? Math.min(99.9, prev.idiomix + variance) : prev.idiomix,
        syntacCore: mode === 'SYNTHESIS' ? Math.min(99.9, prev.syntacCore + variance) : prev.syntacCore,
        contexta: mode === 'SYNTHESIS' ? Math.min(99.9, prev.contexta + variance) : prev.contexta,
      }));

      setPaths(newPaths);
      setIsProcessing(false);
      
      if (config.autoSync) {
        forceSync();
      }
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="size-8 text-indigo-500" />
            LinguaHabar Deterministic Voice Engine
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Dual-Core Personality & Parsing Matrix. Balances rigid deterministic logic (Gramar) with adaptive dialectical resonance (Habar) via deep Vector Space integration.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              // Archive aha-moment to KB
              const vectors = JSON.parse(localStorage.getItem('n1_knowledge_db_items') || '[]');
              vectors.push({
                id: generateDeterministicId('aha-lingua'),
                title: `Linguistic Aha-Moment: ${activeMode}`,
                category: 'LinguaHabar Patterns',
                content: `Archived high-resonance semantic pattern graph for mode ${activeMode}. Path Count: ${paths.length}. Scores: Lexi ${scores.lexiScore.toFixed(1)}%, Habar ${scores.vocaDial.toFixed(1)}%.`,
                date: new Date().toISOString()
              });
              localStorage.setItem('n1_knowledge_db_items', JSON.stringify(vectors));
              setVectorSyncStatus('synced');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all text-sm font-bold"
          >
            <Sparkles className="size-4" />
            Archive Aha-Moment
          </button>
          
          <button 
            onClick={forceSync}
            disabled={vectorSyncStatus === 'syncing'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl transition-all disabled:opacity-50 text-sm font-bold"
          >
            {vectorSyncStatus === 'syncing' ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : vectorSyncStatus === 'synced' ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Database className="size-4" />
            )}
            Vector Sync
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Network className="size-5 text-indigo-400" />
                PathLingua Node Routing Matrix
              </h3>
              <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                <button
                  onClick={() => setActiveMode('GRAMAR')}
                  className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${
                    activeMode === 'GRAMAR' 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  Gramar Core
                </button>
                <button
                  onClick={() => setActiveMode('SYNTHESIS')}
                  className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${
                    activeMode === 'SYNTHESIS' 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  Synthesis
                </button>
                <button
                  onClick={() => setActiveMode('HABAR')}
                  className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${
                    activeMode === 'HABAR' 
                      ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  Habar Core
                </button>
              </div>
            </div>

            <div className="relative h-[400px] bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden flex items-center justify-center">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Activity className="size-8 text-indigo-500 animate-pulse" />
                  <span className="text-xs font-mono text-zinc-500 uppercase">Recalculating 3D Vector Space...</span>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center perspective-[1000px]">
                  <motion.div 
                    initial={{ rotateX: 60, rotateZ: 0 }}
                    animate={{ rotateZ: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="relative w-[300px] h-[300px] [transform-style:preserve-3d]"
                  >
                    {/* Simulated 3D Network Graph via positioned nodes */}
                    {paths.map((p, i) => {
                      const angle = (i / paths.length) * Math.PI * 2;
                      const radius = 100 + (Math.sin(i * 123.45) * 40);
                      const zIndex = Math.floor(Math.cos(angle) * 100);
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;
                      
                      const isHighWeight = p.weight > 80;
                      
                      return (
                        <React.Fragment key={p.id}>
                          {/* Node representing Target */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="absolute left-1/2 top-1/2 rounded-full flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
                            style={{
                              transform: `translate3d(${x}px, ${y}px, ${Math.sin(i)*50}px)`,
                              zIndex: 100 + zIndex,
                              width: isHighWeight ? 40 : 24,
                              height: isHighWeight ? 40 : 24,
                              backgroundColor: activeMode === 'GRAMAR' ? '#4f46e5' : activeMode === 'HABAR' ? '#ec4899' : '#10b981',
                              boxShadow: `0 0 20px ${activeMode === 'GRAMAR' ? '#4f46e555' : activeMode === 'HABAR' ? '#ec489955' : '#10b98155'}`,
                            }}
                          >
                            <span className="text-[8px] font-bold text-white uppercase transform rotateX-[-60deg] text-center leading-tight shadow-black drop-shadow-md hidden sm:block absolute -top-4 whitespace-nowrap">
                              {p.target}
                            </span>
                          </motion.div>

                          {/* Connections to Center */}
                          <svg className="absolute inset-0 w-[300px] h-[300px] overflow-visible pointer-events-none [transform-style:preserve-3d]">
                            <line 
                              x1="150" y1="150" 
                              x2={150 + x} y2={150 + y} 
                              stroke={activeMode === 'GRAMAR' ? '#4f46e5' : activeMode === 'HABAR' ? '#ec4899' : '#10b981'} 
                              strokeWidth={isHighWeight ? 2 : 1}
                              strokeOpacity={p.weight / 100}
                              strokeDasharray={isHighWeight ? 'none' : '4 4'}
                            />
                          </svg>
                        </React.Fragment>
                      );
                    })}
                    
                    {/* Central Core Node */}
                    <div className="absolute left-1/2 top-1/2 w-16 h-16 rounded-full bg-white flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_40px_white] z-[200]">
                      <Network className="text-zinc-900 size-6 transform rotateX-[-60deg]" />
                    </div>
                  </motion.div>
                </div>
              )}
              
              <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs font-mono text-zinc-500 z-[300] bg-zinc-950/80 p-2 rounded-lg backdrop-blur-sm border border-zinc-800">
                <span>{paths.length} Active Vectors</span>
                <span>Avg Weight: {Math.floor(paths.reduce((acc, curr) => acc + curr.weight, 0) / (paths.length || 1))}%</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="size-4 text-indigo-400" />
                GramMarc Matrix
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400 font-mono">LexiScore Weighting</span>
                    <span className="text-xs font-bold text-indigo-400">{scores.lexiScore.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${scores.lexiScore}%` }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400 font-mono">GramVect Tensor</span>
                    <span className="text-xs font-bold text-indigo-400">{scores.gramVect.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${scores.gramVect}%` }} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Settings2 className="size-4 text-emerald-400" />
                SyntacCore Links
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400 font-mono">SyntacCore Connect</span>
                    <span className="text-xs font-bold text-emerald-400">{scores.syntacCore.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${scores.syntacCore}%` }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400 font-mono">Contexta Depth</span>
                    <span className="text-xs font-bold text-emerald-400">{scores.contexta.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${scores.contexta}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Globe2 className="size-4 text-pink-400" />
                HabarVox Dialect
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400 font-mono">VocaDial Adaptation</span>
                    <span className="text-xs font-bold text-pink-400">{scores.vocaDial.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 transition-all duration-1000" style={{ width: `${scores.vocaDial}%` }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400 font-mono">Idiomix Fluency</span>
                    <span className="text-xs font-bold text-pink-400">{scores.idiomix.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 transition-all duration-1000" style={{ width: `${scores.idiomix}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Database className="size-4 text-indigo-400" />
              Deep Configuration
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Audience Focus</label>
                <select 
                  value={config.targetAudience}
                  onChange={(e) => updateConfig('targetAudience', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="b2b">B2B Developer Tool (Strict Logic)</option>
                  <option value="consumer">End User / Consumer (Conversational)</option>
                  <option value="hybrid">Hybrid Enterprise (Balanced)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Linguistic Dialect Setting</label>
                <select 
                  value={config.linguisticSetting}
                  onChange={(e) => updateConfig('linguisticSetting', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="bilingual">Bilingual Auto-Switch (Default)</option>
                  <option value="en">International / English Strict</option>
                  <option value="de">German (Deutsch) Deep Integration</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-800/80 transition-colors"
                onClick={() => updateConfig('autoSync', !config.autoSync)}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-zinc-200">Auto Vector Sync</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono">Sync with N+1 KB</span>
                </div>
                <div className={`size-4 rounded border flex items-center justify-center ${config.autoSync ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-zinc-600'}`}>
                  {config.autoSync && <CheckCircle2 className="size-3" />}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-800/80 transition-colors"
                onClick={() => updateConfig('deterministicMode', !config.deterministicMode)}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-zinc-200">Deterministic Lock</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono">DetVox Constraint</span>
                </div>
                <div className={`size-4 rounded border flex items-center justify-center ${config.deterministicMode ? 'bg-amber-500 border-amber-500 text-black' : 'border-zinc-600'}`}>
                  {config.deterministicMode && <Lock className="size-3" />}
                </div>
              </div>
              
              {config.deterministicMode && (
                <div className="pt-2">
                  <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-indigo-400">DetVox Status</span>
                      <span className="text-[10px] text-indigo-300 uppercase font-mono">Deterministic Voice Active</span>
                    </div>
                    <Zap className="size-5 text-indigo-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
             <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <LineChart className="size-4 text-emerald-400" />
                Active Node Matrix
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400">NodoVoice Hooks</span>
                  <span className="text-emerald-400">Active</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400">Verbalog Sync</span>
                  <span className="text-indigo-400">Synced</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400">LexiTrack History</span>
                  <span className="text-pink-400">Tracking</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400">LogiGram Resolver</span>
                  <span className="text-amber-400">Deterministic</span>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

