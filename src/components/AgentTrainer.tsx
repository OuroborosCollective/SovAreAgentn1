import React, { useState, useMemo, useEffect } from 'react';
import { Brain, Network, Upload, Zap, AlertCircle, CheckCircle2, Shield, Database, Cpu, RefreshCw, Activity, ZapOff, Clock, ShieldCheck, History, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp } from '../utils/deterministic';

interface TrainingHistoryItem {
  id: string;
  agent_id: string;
  duration_sec: number;
  outcome: 'success' | 'error';
  timestamp: string;
  learn_effect_score?: number;
}

const NeuralTopology = ({ progress, isTraining, trainingResult }: { progress: number, isTraining: boolean, trainingResult: any }) => {
  const nodes = useMemo(() => [
    { id: 1, x: 20, y: 50, label: 'Input', type: 'core' },
    { id: 2, x: 40, y: 30, label: 'Axiomatic', type: 'logical' },
    { id: 3, x: 40, y: 70, label: 'Memcache', type: 'logical' },
    { id: 4, x: 60, y: 20, label: 'GPU', type: 'hardware', disabled: true },
    { id: 5, x: 60, y: 50, label: 'Vector DB', type: 'logical' },
    { id: 6, x: 60, y: 80, label: 'TPU', type: 'hardware', disabled: true },
    { id: 7, x: 80, y: 50, label: 'Valky', type: 'logical' },
    { id: 8, x: 95, y: 50, label: 'Output', type: 'core' },
  ], []);

  const connections = [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 2, to: 5 }, { from: 3, to: 5 },
    { from: 5, to: 7 }, { from: 7, to: 8 },
    // Hardware bypasses
    { from: 2, to: 4, hardware: true }, { from: 3, to: 6, hardware: true }
  ];

  return (
    <div className="relative w-full h-48 bg-black/40 rounded-xl border border-zinc-800/50 overflow-hidden p-4">
      <div className="absolute top-2 left-2 flex items-center gap-2">
        <Activity className="size-3 text-purple-500 animate-pulse" />
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Neural Topology Map</span>
      </div>

      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Connections */}
        {connections.map((conn, i) => {
          const fromNode = nodes.find(n => n.id === conn.from)!;
          const toNode = nodes.find(n => n.id === conn.to)!;
          const isActive = isTraining && progress > (fromNode.x);
          const isHardware = conn.hardware;

          return (
            <motion.line
              key={i}
              x1={fromNode.x} y1={fromNode.y}
              x2={toNode.x} y2={toNode.y}
              stroke={isHardware ? '#ef4444' : isActive ? '#a855f7' : '#27272a'}
              strokeWidth={isActive ? 0.8 : 0.4}
              strokeDasharray={isHardware ? "2 2" : "none"}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <motion.circle
              cx={node.x} cy={node.y}
              r={node.type === 'core' ? 2 : 1.5}
              fill={node.disabled ? '#18181b' : (isTraining && progress > node.x) ? '#a855f7' : '#3f3f46'}
              stroke={node.disabled ? '#ef4444' : (isTraining && progress > node.x) ? '#c084fc' : 'none'}
              strokeWidth={0.5}
              animate={isTraining && progress > node.x ? { r: [1.5, 2, 1.5], opacity: [0.5, 1, 0.5] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            {node.disabled && (
              <text x={node.x} y={node.y + 1} textAnchor="middle" fontSize="3" fill="#ef4444" className="font-bold">×</text>
            )}
            <text x={node.x} y={node.y - 4} textAnchor="middle" fontSize="2.5" fill={node.disabled ? '#71717a' : '#a1a1aa'} className="font-mono uppercase tracking-tighter">
              {node.label}
            </text>
          </g>
        ))}
      </svg>

      {isTraining && (
        <div className="absolute bottom-2 right-2 flex items-center gap-2 text-[8px] font-mono text-emerald-500">
          <Shield className="size-2" />
          <span>BYPASSING HARDWARE ACCELERATION</span>
        </div>
      )}
    </div>
  );
};

interface AgentTrainerProps {
  trainingStatus: 'idle' | 'training' | 'success' | 'error';
  setTrainingStatus: React.Dispatch<React.SetStateAction<'idle' | 'training' | 'success' | 'error'>>;
}

const AgentTrainer: React.FC<AgentTrainerProps> = ({ trainingStatus, setTrainingStatus }) => {
  const [targetAgent, setTargetAgent] = useState('axiomatic-agent-01.internal.net');
  const [connectionMethod, setConnectionMethod] = useState('websocket');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [handshakeResult, setHandshakeResult] = useState<any>(null);
  const [trainingResult, setTrainingResult] = useState<any>(null);
  const [isHandshaking, setIsHandshaking] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [successRate, setSuccessRate] = useState<number>(0);
  const [history, setHistory] = useState<TrainingHistoryItem[]>([]);
  const [knowledgeBuffer, setKnowledgeBuffer] = useState<string[]>(['Axiomatic Inference', 'Memcache Elasticity', 'Hardware Bypass']);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    // Fallback to localStorage since Firebase is deinstalled
    const saved = localStorage.getItem('axiom_training_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved).slice(0, 10));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    // Fallback to localStorage since Firebase is deinstalled
    const saved = localStorage.getItem('axiom_skills');
    if (saved) {
      try {
        setAvailableSkills(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleHandshake = async () => {
    if (!targetAgent) return;
    setIsHandshaking(true);
    setHandshakeResult(null);
    setTrainingStatus('training');
    setProgress(0);
    setStage('Initiating Axiomatic Handshake...');

    try {
      // Simulation of "waiting for connection"
      const waitingInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 40) {
            clearInterval(waitingInterval);
            return 40;
          }
          return prev + 5;
        });
      }, 200);

      const response = await fetch('/api/agents/handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: targetAgent,
          use_vector_db: true,
          use_memcache: true,
          use_valky_db: true,
          resource_constraints: {
            gpu: false,
            tpu: false
          },
          connection_timeout_sec: 5
        })
      });

      const result = await response.json();
      clearInterval(waitingInterval);

      if (result.status === 'success') {
        setHandshakeResult(result.data);
        setTrainingStatus('success');
        setProgress(100);
        setStage('Handshake Complete');
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      console.error('Handshake failed:', err);
      setTrainingStatus('error');
      setStage('Handshake Failed');
    } finally {
      setIsHandshaking(false);
    }
  };

  const handleTrain = async () => {
    if (!targetAgent) return;
    setIsTraining(true);
    setTrainingResult(null);
    setTrainingStatus('training');
    setProgress(0);
    setEstimatedTime(8);
    setSuccessRate(0);
    setStage('Initializing connection...');

    try {
      // Start progress simulation
      const stages = [
        'Neural Link', 
        'Hardware Bypass (GPU/TPU Avoidance)', 
        'Heuristic Injection', 
        'Memcache Sync', 
        'Logical TPU-Emulation',
        'Finalizing'
      ];
      let currentStage = 0;
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          const next = prev + 1.5;
          const stageThreshold = (100 / stages.length) * (currentStage + 1);
          if (next >= stageThreshold && currentStage < stages.length) {
            setStage(stages[currentStage]);
            currentStage++;
          }
          
          // Update estimated time and success rate
          setEstimatedTime(Math.max(0, Math.ceil((8 * (100 - next)) / 100)));
          setSuccessRate(Math.min(99.9, Math.floor(next * 0.95 + generateDeterministicNumber(0, 5, performance.now()))));
          
          return next;
        });
      }, 100);

      const response = await fetch('/api/agents/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: targetAgent,
          connection_method: connectionMethod,
          constraints: {
            gpu: false,
            tpu: false
          },
          skills: selectedSkills
        })
      });

      const result = await response.json();
      clearInterval(progressInterval);

      if (result.status === 'success') {
        setTrainingResult(result.data);
        setTrainingStatus('success');
        setProgress(100);
        setEstimatedTime(0);
        setSuccessRate(99.9);
        setStage('Knowledge Transfer Complete');
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      console.error('Training failed:', err);
      setTrainingStatus('error');
      setStage('Training Failed');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Brain className="text-purple-400" /> Deep Learning Logical Trainer
        </h1>
        <p className="text-zinc-400 mt-1">Integrate heuristical knowledge into external agents using logical neural pathways.</p>
      </header>

      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <Shield className="size-5 text-purple-400" />
            <div>
              <p className="text-xs font-bold text-purple-300 uppercase tracking-widest">Logical Transfer Protocol Active</p>
              <p className="text-[10px] text-purple-400/70">Bypassing hardware acceleration (GPU/TPU) in favor of local heuristics and logical neural pathways.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Target Agent ID / URL</label>
              <input 
                type="text"
                value={targetAgent}
                onChange={(e) => setTargetAgent(e.target.value)}
                placeholder="e.g. agent-01.internal.net"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Knowledge Buffer</label>
              <div className="flex flex-wrap gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-xl min-h-[46px]">
                {knowledgeBuffer.map((k, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] text-purple-400 font-bold uppercase flex items-center gap-1">
                    <CheckCircle2 size={10} /> {k}
                  </span>
                ))}
                <button className="text-[10px] text-zinc-600 hover:text-zinc-400 font-bold uppercase tracking-widest ml-auto">+ Load More</button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Axiomatic Skills to Inject</label>
              <span className="text-[10px] text-zinc-600 font-mono">{selectedSkills.length} selected</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableSkills.length === 0 ? (
                <div className="col-span-full p-4 border border-dashed border-zinc-800 rounded-xl text-center">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">No skills available in repository</p>
                </div>
              ) : (
                availableSkills.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => {
                      if (selectedSkills.includes(skill.id)) {
                        setSelectedSkills(selectedSkills.filter(id => id !== skill.id));
                      } else {
                        setSelectedSkills([...selectedSkills, skill.id]);
                      }
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selectedSkills.includes(skill.id)
                        ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedSkills.includes(skill.id) ? 'bg-indigo-500/20' : 'bg-zinc-900'}`}>
                      <BookOpen size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold truncate">{skill.name}</p>
                      <p className="text-[10px] opacity-60 line-clamp-1">{skill.description}</p>
                    </div>
                    {selectedSkills.includes(skill.id) && <CheckCircle2 size={14} className="ml-auto" />}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleTrain}
              disabled={trainingStatus === 'training' || isHandshaking || isTraining}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isTraining ? <Zap className="animate-spin" /> : <Upload className="size-5" />}
              {isTraining ? 'Training...' : 'Initiate Knowledge Transfer'}
            </button>

            <button 
              onClick={handleHandshake}
              disabled={trainingStatus === 'training' || isHandshaking}
              className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 border border-zinc-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isHandshaking ? <RefreshCw className="animate-spin size-5" /> : <Shield className="size-5 text-orange-400" />}
              {isHandshaking ? 'Handshaking...' : 'Axiomatic Handshake'}
            </button>
          </div>

          <AnimatePresence>
            {trainingResult && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-purple-400">
                    <Brain className="size-5" />
                    <h3 className="font-bold uppercase tracking-widest text-xs">Deep Learning Logical Transfer Results</h3>
                  </div>
                  <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] text-purple-400 font-bold uppercase">
                    Learn Effect: {(trainingResult.learn_effect_score * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trainingResult.heuristics.map((h: any, i: number) => (
                    <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-zinc-300">{h.name}</p>
                        <p className="text-[10px] text-zinc-500">{h.gain}</p>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono uppercase">{h.status}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Transfer Log</span>
                  <div className="bg-black border border-zinc-900 rounded-lg p-3 font-mono text-[10px] text-zinc-400 space-y-1 max-h-32 overflow-y-auto">
                    {trainingResult.log.map((line: string, i: number) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-zinc-700">[{i+1}]</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-900 flex justify-between items-center text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1"><Shield className="size-3 text-emerald-500" /> GPU/TPU Avoidance: ACTIVE</span>
                  <span>{new Date(trainingResult.timestamp).toLocaleTimeString()}</span>
                </div>
              </motion.div>
            )}

            {handshakeResult && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-orange-400">
                    <Shield className="size-5" />
                    <h3 className="font-bold uppercase tracking-widest text-xs">Axiomatic Handshake Results</h3>
                  </div>
                  <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] text-orange-400 font-bold uppercase">
                    Status: {handshakeResult.connection_status}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {handshakeResult.heuristics_taught.map((h: any, i: number) => (
                    <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-zinc-300">{h.name}</p>
                        <p className="text-[10px] text-zinc-500">Resource: {h.resource}</p>
                      </div>
                      <span className="text-[10px] text-orange-400 font-mono uppercase">{h.type}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Resource Utilization</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(handshakeResult.resources_utilized).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-black border border-zinc-900 rounded p-2 text-center">
                        <p className="text-[8px] text-zinc-500 uppercase font-bold">{key.replace(/_/g, ' ')}</p>
                        <p className={`text-[10px] font-mono ${value.includes('Active') || value.includes('Disabled') ? 'text-emerald-400' : 'text-zinc-400'}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-900 flex justify-between items-center text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1"><Database className="size-3 text-emerald-500" /> Cost-Effective: {handshakeResult.cost_efficiency}</span>
                  <span>{new Date(handshakeResult.timestamp).toLocaleTimeString()}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {trainingStatus === 'training' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <NeuralTopology progress={progress} isTraining={isTraining} trainingResult={trainingResult} />
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                  <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Current Stage</p>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="size-3 animate-spin text-purple-500" />
                      <p className="text-xs font-medium text-zinc-200">{stage}</p>
                    </div>
                  </div>
                  <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Est. Time Remaining</p>
                    <div className="flex items-center gap-2">
                      <Clock className="size-3 text-indigo-400" />
                      <p className="text-xs font-medium text-zinc-200">{estimatedTime}s</p>
                    </div>
                  </div>
                  <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Logical Success Rate</p>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-3 text-emerald-400" />
                      <p className="text-xs font-medium text-zinc-200">{successRate}%</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-sm text-zinc-400">
                  <span className="text-xs font-mono uppercase tracking-widest">Training Progress</span>
                  <span className="font-mono">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {trainingStatus === 'success' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-emerald-400">
              <CheckCircle2 /> Knowledge successfully integrated into target agent.
            </motion.div>
          )}
          {trainingStatus === 'error' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
              <AlertCircle /> Training failed. Check connection parameters.
            </motion.div>
          )}
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <History className="size-5 text-zinc-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Recent Training History</h2>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono">Showing last 10 tasks</p>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-600 uppercase tracking-widest">No recent training tasks found</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex items-center justify-between hover:border-zinc-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`size-8 rounded-lg flex items-center justify-center ${
                    item.outcome === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {item.outcome === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-200">{item.agent_id}</p>
                    <p className="text-[10px] text-zinc-500">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest mb-0.5">Duration</p>
                    <p className="text-[10px] font-mono text-zinc-400">{item.duration_sec}s</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest mb-0.5">Outcome</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                      item.outcome === 'success' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {item.outcome}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Shield className="size-4 text-emerald-500" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Hardware Bypass</h3>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Strict avoidance of GPU/TPU acceleration. All deep learning is executed via logical heuristics to maintain axiomatic stability.
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Database className="size-4 text-blue-500" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Memcache Elasticity</h3>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Dynamic scaling of local memcache nodes to handle recursive self-improvement loops without latency spikes.
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Zap className="size-4 text-purple-500" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Learn Effect</h3>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Triggering logical deep learning states that allow agents to autonomously refine their own heuristic models.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AgentTrainer;
