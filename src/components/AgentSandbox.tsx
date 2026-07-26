import React, { useState, useEffect, useReducer, useRef } from 'react';
import { Play, Pause, RotateCcw, Brain, Home, Zap, Download, FastForward, Mic, MicOff, Send, Sparkles, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateAgentAction } from '../services/geminiService';
import { generateSpeech } from '../services/ttsService';

// Helper function to serialize JS object to clean YAML string format
function jsonToYaml(obj: any, indentLevel = 0): string {
  const indent = '  '.repeat(indentLevel);
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'boolean' || typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#') || obj.includes('"') || obj.includes("'")) {
      return JSON.stringify(obj);
    }
    return obj || '""';
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(item => {
      if (typeof item === 'object' && item !== null) {
        const itemYaml = jsonToYaml(item, indentLevel + 1).trimStart();
        return `${indent}- ${itemYaml}`;
      }
      return `${indent}- ${jsonToYaml(item, indentLevel + 1)}`;
    }).join('\n');
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    return keys.map(key => {
      const val = obj[key];
      if (typeof val === 'object' && val !== null && (Array.isArray(val) ? val.length > 0 : Object.keys(val).length > 0)) {
        return `${indent}${key}:\n${jsonToYaml(val, indentLevel + 1)}`;
      }
      return `${indent}${key}: ${jsonToYaml(val, indentLevel + 1)}`;
    }).join('\n');
  }
  return String(obj);
}

// ============================================================================
// ARE-LOGIK (AXIOM-REALITY-EMERGENCE) - Fundament aller Berechnungen
// ============================================================================

const ARELogic = {
  // 5 Axiome: Energie, Erosion, Beobachtung, Rekursion, Dualität
  axioms: {
    energy: 1.0,      // Ressourcen-Management (0-1)
    erosion: 0.05,    // Zeitverschleiß pro Zug
    observation: 0.8, // Sichtbarkeit (0-1)
    recursion: 1.2,   // Skalierungs-Faktor für Dungeons
    duality: 0.5      // PvP-Konflikt-Balance
  },

  // Stability Index (steuert Schwierigkeit & Events)
  stabilityIndex: (worldState: any) => {
    if (!worldState || !worldState.agents || !worldState.resources) return 0.5;
    const activeAgents = (worldState.agents || []).filter((a: any) => a?.active).length;
    const totalResources = (worldState.resources.wood || 0) + (worldState.resources.stone || 0) + (worldState.resources.iron || 0);
    return Math.min(1.0, (totalResources / 10000) * (5 - activeAgents) / 5);
  },

  // Würfel-Logik (versteckt für Pathfinding)
  rollDice: (dieCount = 1, modifier = 0) => {
    let result = 0;
    for (let i = 0; i < dieCount; i++) {
      result += Math.floor(Math.random() * 6) + 1;
    }
    return result + modifier;
  },

  // Agility → Bewegungs-Bonus (alle 15 Punkte = +1 auf W6)
  getMovementBonus: (agility: number) => Math.floor(agility / 15),

  // Energie-Decay pro Zug
  decayEnergy: (current: number) => Math.max(0, current - 0.02)
};

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialWorldState = {
  gameTime: 0,
  isRunning: false,
  agents: Array(5).fill(null).map((_, i) => ({
    id: `agent-${i}`,
    slot: i,
    active: i < 2, // 2 aktive Agenten zu Start
    name: `Agent-${i + 1}`,
    personality: ['aggressive', 'peaceful', 'greedy', 'curious', 'balanced'][i],
    level: 1,
    xp: 0,
    health: 100,
    maxHealth: 100,
    x: Math.floor(Math.random() * 35),
    y: Math.floor(Math.random() * 35),
    agility: 10 + Math.random() * 20,
    strength: 10 + Math.random() * 20,
    intelligence: 10 + Math.random() * 20,
    charisma: 10 + Math.random() * 20,
    inventory: ['sword', 'shield', 'potion'],
    money: 100,
    gold: 50,
    deathTime: null,
    deathTimer: null,
    inTraining: false,
    trainingProgress: 0,
    actionLog: [] as any[],
    lastAction: 'idle',
    targetX: null as number | null,
    targetY: null as number | null
  })),
  map: Array(35).fill(null).map(() => Array(35).fill({ type: 'grass', enemy: null })),
  resources: {
    wood: 500,
    stone: 300,
    iron: 200,
    gold: 100,
    diamond: 10
  },
  properties: [] as any[], // Immobilien
  guilds: [] as any[],
  events: [] as any[],
  stabilityIndex: 0.8,
  selectedAgentSlot: 0
};

// ============================================================================
// WORLD REDUCER
// ============================================================================

const worldReducer = (state: typeof initialWorldState, action: any): typeof initialWorldState => {
  switch (action.type) {
    case 'TOGGLE_GAME':
      return { ...state, isRunning: !state.isRunning };

    case 'UPDATE_AGENT_POSITION': {
      const agents = [...state.agents];
      const agent = agents[action.payload.slot];
      if (agent && agent.active) {
        // Würfel für Bewegungs-Entfernung (versteckt)
        const movementRoll = ARELogic.rollDice(1, ARELogic.getMovementBonus(agent.agility));
        const distance = Math.min(movementRoll, 4); // Max 4 Schritte pro Update

        // Pathfinding (vereinfacht: zum Ziel oder random)
        let newX = agent.x;
        let newY = agent.y;

        if (agent.targetX !== null && agent.targetY !== null) {
          // Zielbewegung
          if (Math.abs(agent.targetX - agent.x) > 0) {
            newX += agent.targetX > agent.x ? distance : -distance;
          } else if (Math.abs(agent.targetY - agent.y) > 0) {
            newY += agent.targetY > agent.y ? distance : -distance;
          }
        } else {
          // Random Walk
          const direction = Math.floor(Math.random() * 4);
          if (direction === 0) newX += distance;
          if (direction === 1) newX -= distance;
          if (direction === 2) newY += distance;
          if (direction === 3) newY -= distance;
        }

        // Boundaries
        newX = Math.max(0, Math.min(34, newX));
        newY = Math.max(0, Math.min(34, newY));

        agent.x = newX;
        agent.y = newY;
        agent.lastAction = `moved to (${newX},${newY})`;
        
        // Log für Training
        agent.actionLog.push({
          time: state.gameTime,
          action: 'move',
          x: newX,
          y: newY,
          roll: movementRoll
        });
      }
      return { ...state, agents };
    }

    case 'SET_SELECTED_AGENT':
      return { ...state, selectedAgentSlot: action.payload };

    case 'SEND_TO_TRAINING': {
      const agents = [...state.agents];
      agents[action.payload].inTraining = true;
      agents[action.payload].active = false;
      agents[action.payload].trainingProgress = 0;
      return { ...state, agents };
    }

    case 'ADVANCE_TRAINING': {
      const agents = [...state.agents];
      const agent = agents[action.payload];
      if (agent.inTraining) {
        agent.trainingProgress += 1;
        // Nach 100 Steps Trainingsabschluss
        if (agent.trainingProgress >= 100) {
          agent.inTraining = false;
          agent.intelligence += 2;
          agent.agility += 1;
          agent.trainingProgress = 0;
        }
      }
      return { ...state, agents };
    }

    case 'TICK_GAME': {
      const isFastTrack = !!action.payload?.isFastTrack;
      let newState = { ...state, gameTime: state.gameTime + (isFastTrack ? 5 : 1) };

      // Für jeden aktiven Agenten: Position updaten
      newState.agents.forEach((agent, idx) => {
        if (agent.active) {
          newState = worldReducer(newState, {
            type: 'UPDATE_AGENT_POSITION',
            payload: { slot: idx, isFastTrack }
          });
        }
      });

      // Memory optimization during Fast-Track high-frequency testing:
      // Keep actionLog buffers capped to prevent memory leak / performance degradation
      if (isFastTrack) {
        newState.agents.forEach(agent => {
          if (agent.actionLog && agent.actionLog.length > 15) {
            agent.actionLog = agent.actionLog.slice(-10);
          }
        });
      }

      // Training-Fortschritt
      newState.agents.forEach((agent, idx) => {
        if (agent.inTraining) {
          newState = worldReducer(newState, {
            type: 'ADVANCE_TRAINING',
            payload: idx
          });
        }
      });

      // Stability Index berechnen
      newState.stabilityIndex = ARELogic.stabilityIndex(newState);

      return newState;
    }

    case 'TRIGGER_AI_ACTION': {
      const agents = [...state.agents];
      const agent = agents[action.payload.slot];
      if (agent) {
        agent.personality = action.payload.newPersonality;
        agent.lastAction = action.payload.action;
        agent.actionLog.push({
          time: state.gameTime,
          action: 'ai_action',
          reasoning: action.payload.reasoning
        });
      }
      return { ...state, agents };
    }

    case 'RESET':
      return initialWorldState;

    default:
      return state;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AgentSandbox() {
  const [worldState, dispatch] = useReducer(worldReducer, initialWorldState);
  const [isFastTrack, setIsFastTrack] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Game Loop (Echtzeit with Fast-Track support)
  useEffect(() => {
    if (worldState.isRunning) {
      const interval = isFastTrack ? 100 : 500; // 100ms in Fast-Track mode, 500ms standard
      gameLoopRef.current = setInterval(() => {
        dispatch({ type: 'TICK_GAME', payload: { isFastTrack } });
      }, interval);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [worldState.isRunning, isFastTrack]);

  // Voice recording logic with MediaRecorder & SpeechRecognition
  const startVoiceRecording = async () => {
    setVoiceTranscript('');
    setIsRecording(true);
    setRecordingTime(0);

    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let text = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          if (text) {
            setVoiceTranscript(text);
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech Recognition notice:', err);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition error:', err);
      }
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
      } catch (err) {
        console.warn('Microphone access notice:', err);
        if (!SpeechRecognition) {
          setVoiceTranscript('Execute tactical move: Increase intelligence and scan grid (30,15)');
        }
      }
    } else if (!SpeechRecognition) {
      setVoiceTranscript('Execute tactical move: Increase intelligence and scan grid (30,15)');
    }
  };

  const stopVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) {}
    }

    setIsRecording(false);
  };

  const selectedAgent = worldState.agents[worldState.selectedAgentSlot];

  const downloadStateYAML = () => {
    const auditState = {
      simulation_metadata: {
        title: "Ouroboros Singularität ARE-Logik Simulation State",
        version: "3.0.0",
        export_timestamp: new Date().toISOString(),
        game_time_ms: worldState.gameTime,
        stability_index: Number((worldState.stabilityIndex * 100).toFixed(2)),
        is_running: worldState.isRunning,
      },
      axioms: ARELogic.axioms,
      resources: worldState.resources,
      selected_agent_slot: worldState.selectedAgentSlot,
      agents: worldState.agents.map(a => ({
        id: a.id,
        slot: a.slot,
        name: a.name,
        active: a.active,
        personality: a.personality,
        level: a.level,
        xp: a.xp,
        health: a.health,
        max_health: a.maxHealth,
        position: { x: a.x, y: a.y },
        stats: {
          agility: Number(a.agility.toFixed(2)),
          strength: Number(a.strength.toFixed(2)),
          intelligence: Number(a.intelligence.toFixed(2)),
          charisma: Number(a.charisma.toFixed(2)),
        },
        inventory: a.inventory,
        money: a.money,
        gold: a.gold,
        in_training: a.inTraining,
        training_progress: a.trainingProgress,
        last_action: a.lastAction,
        action_log_count: (a.actionLog || []).length,
        recent_action_logs: (a.actionLog || []).slice(-10)
      })),
      properties: worldState.properties || [],
      events: worldState.events || []
    };

    const yamlContent = jsonToYaml(auditState);
    const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ouroboros-simulation-state-${worldState.gameTime}ms.yaml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono overflow-hidden" style={{
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,255,255,0.03) 0px, rgba(0,255,255,0.03) 1px, transparent 1px, transparent 2px)',
      backgroundSize: '100% 4px'
    }}>
      {/* Header */}
      <div className="border-b-2 border-cyan-500 bg-black bg-opacity-80 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-widest">
            ◆ OUROBOROS SINGULARITÄT v3.0 ◆
          </h1>
          <div className="flex items-center gap-4 text-sm">
            {isFastTrack && (
              <div className="px-2.5 py-1 bg-amber-950/80 border border-amber-500/80 text-amber-300 font-bold text-xs rounded uppercase flex items-center gap-1.5 animate-pulse">
                <FastForward size={12} />
                <span>Fast-Track (100ms)</span>
              </div>
            )}
            <div className="text-right">
              <div>GAME TIME: {worldState.gameTime}ms</div>
              <div>STABILITY: {(worldState.stabilityIndex * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 p-6 h-[calc(100vh-100px)]">
        {/* Left Panel: Agent Management */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
          {/* Controls */}
          <div className="border-2 border-cyan-500 p-4 bg-black bg-opacity-60 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_GAME' })}
                className="flex-1 px-3 py-2 bg-cyan-900 hover:bg-cyan-700 border border-cyan-500 rounded text-xs font-bold uppercase"
              >
                {worldState.isRunning ? <Pause size={14} className="inline mr-1" /> : <Play size={14} className="inline mr-1" />}
                {worldState.isRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => dispatch({ type: 'RESET' })}
                className="px-3 py-2 bg-fuchsia-900 hover:bg-fuchsia-700 border border-fuchsia-500 rounded text-xs font-bold uppercase"
                title="Reset Simulation"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Fast-Track Mode Toggle */}
            <button
              onClick={() => setIsFastTrack(!isFastTrack)}
              className={`w-full px-3 py-2 border rounded text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all ${
                isFastTrack
                  ? 'bg-amber-950 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
              }`}
              title="Fast-Track Mode: 100ms ticks & memory log optimization for high-frequency testing"
            >
              <FastForward size={14} className={isFastTrack ? 'text-amber-400' : ''} />
              <span>Fast-Track: {isFastTrack ? 'ON (100ms)' : 'OFF (500ms)'}</span>
            </button>

            <button
              onClick={downloadStateYAML}
              className="w-full px-3 py-2 bg-emerald-950 hover:bg-emerald-800 border border-emerald-500 text-emerald-400 rounded text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm"
              title="Download YAML state snapshot for reproducibility and auditing"
            >
              <Download size={14} />
              <span>Download State (YAML)</span>
            </button>
          </div>

          {/* Agent Slots */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-fuchsia-400 border-b border-fuchsia-500 pb-2">
              Agent Slots (5/5)
            </h3>
            {worldState.agents.map((agent, idx) => (
              <div
                key={agent.id}
                onClick={() => dispatch({ type: 'SET_SELECTED_AGENT', payload: idx })}
                className={`p-3 border-2 rounded cursor-pointer transition ${
                  worldState.selectedAgentSlot === idx
                    ? 'border-fuchsia-500 bg-fuchsia-900 bg-opacity-30'
                    : 'border-cyan-500 bg-black hover:bg-cyan-900 hover:bg-opacity-20'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm">{agent.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    agent.active ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
                  }`}>
                    {agent.active ? 'ACTIVE' : agent.inTraining ? 'TRAINING' : 'DEAD'}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div>Lvl {agent.level} | XP {agent.xp}</div>
                  <div>HP: {agent.health}/{agent.maxHealth}</div>
                  <div>Pos: ({agent.x}, {agent.y})</div>
                  <div className="text-yellow-400">Gold: {agent.gold}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Agent Details */}
          {selectedAgent && (
            <div className="border-2 border-fuchsia-500 p-3 bg-fuchsia-900 bg-opacity-20">
              <h4 className="text-xs font-bold uppercase mb-3 text-fuchsia-400">
                {selectedAgent.name} Details
              </h4>
              <div className="text-xs space-y-1 mb-3">
                <div>Personality: <span className="text-cyan-300">{selectedAgent.personality}</span></div>
                <div>Agility: {selectedAgent.agility.toFixed(1)}</div>
                <div>Strength: {selectedAgent.strength.toFixed(1)}</div>
                <div>Intelligence: {selectedAgent.intelligence.toFixed(1)}</div>
                <div>Charisma: {selectedAgent.charisma.toFixed(1)}</div>
                <div>Last Action: <span className="text-green-400">{selectedAgent.lastAction}</span></div>
              </div>

              {selectedAgent.active && (
                <div className="space-y-2">
                  <button
                    onClick={() => dispatch({ type: 'SEND_TO_TRAINING', payload: worldState.selectedAgentSlot })}
                    className="w-full px-2 py-2 bg-blue-900 hover:bg-blue-700 border border-blue-500 rounded text-xs font-bold uppercase"
                  >
                    <Brain size={12} className="inline mr-1" /> Send to Training
                  </button>
                  <button
                    onClick={async () => {
                      const result = await generateAgentAction(selectedAgent, worldState);
                      if (result) {
                        dispatch({
                          type: 'TRIGGER_AI_ACTION',
                          payload: {
                            slot: worldState.selectedAgentSlot,
                            ...result
                          }
                        });
                        if (result.voiceText) {
                            const audioUrl = await generateSpeech(result.voiceText);
                            if (audioUrl) {
                                const audio = new Audio(audioUrl);
                                audio.play();
                            }
                        }
                      }
                    }}
                    className="w-full px-2 py-2 bg-purple-900 hover:bg-purple-700 border border-purple-500 rounded text-xs font-bold uppercase"
                  >
                    <Zap size={12} className="inline mr-1" /> Trigger AI Action
                  </button>
                </div>
              )}

              {selectedAgent.inTraining && (
                <div className="mt-2 p-2 bg-blue-900 bg-opacity-40 rounded">
                  <div className="text-xs font-bold mb-2">Training Progress: {selectedAgent.trainingProgress}%</div>
                  <div className="w-full bg-black border border-blue-500 rounded h-3">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${selectedAgent.trainingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Voice Command & Training Notes (MediaRecorder API) */}
          <div className="border-2 border-red-500 p-3 bg-red-950 bg-opacity-20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-red-400 flex items-center gap-1.5">
                <Radio size={14} className={isRecording ? 'text-red-500 animate-pulse' : 'text-red-400'} />
                <span>Voice Command & Notes</span>
              </h4>
              {isRecording && (
                <span className="text-[10px] text-red-400 font-mono bg-red-900/60 px-1.5 py-0.5 rounded animate-pulse">
                  REC 00:0{recordingTime}
                </span>
              )}
            </div>

            <div className="relative">
              <textarea
                value={voiceTranscript}
                onChange={(e) => setVoiceTranscript(e.target.value)}
                placeholder={isRecording ? "Listening to microphone input..." : "Click mic to dictate voice commands or agent training notes..."}
                className="w-full h-16 p-2 bg-black border border-red-900/80 rounded text-xs text-red-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono resize-none"
              />
              <button
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={`absolute right-2 bottom-2 p-1.5 rounded-full transition-all ${
                  isRecording
                    ? 'bg-red-600 text-white animate-bounce shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                    : 'bg-zinc-800 text-red-400 hover:bg-zinc-700'
                }`}
                title={isRecording ? "Stop Recording Voice Input" : "Start Voice Recording (MediaRecorder API)"}
              >
                {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
            </div>

            <button
              onClick={async () => {
                if (!voiceTranscript.trim() || !selectedAgent) return;
                const cmd = voiceTranscript;
                setVoiceTranscript('');
                // Dispatch AI Action with voice prompt
                const result = await generateAgentAction({
                  ...selectedAgent,
                  personality: `${selectedAgent.personality} (Voice Directive: "${cmd}")`
                }, worldState);
                if (result) {
                  dispatch({
                    type: 'TRIGGER_AI_ACTION',
                    payload: {
                      slot: worldState.selectedAgentSlot,
                      ...result
                    }
                  });
                }
              }}
              disabled={!voiceTranscript.trim() || !selectedAgent || !selectedAgent.active}
              className="w-full py-1.5 px-3 bg-red-900 hover:bg-red-800 disabled:opacity-40 border border-red-500 text-red-200 rounded text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all"
            >
              <Send size={12} />
              <span>Dispatch Vocal Command</span>
            </button>
          </div>
        </div>

        {/* Center Panel: Live Game Map */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="border-2 border-cyan-500 p-4 bg-black bg-opacity-60 flex-1 overflow-hidden relative">
            <h3 className="text-xs font-bold uppercase mb-3 tracking-widest">Live Map (35x35)</h3>
            
            <div className="grid gap-0.5 relative" style={{
              gridTemplateColumns: 'repeat(35, minmax(0, 1fr))',
              height: 'calc(100% - 30px)'
            }}>
              <AnimatePresence>
                {worldState.agents
                  .filter(a => a.active)
                  .map(agent => (
                    <motion.div
                      key={agent.id}
                      className="absolute w-2.5 h-2.5 rounded-full border border-cyan-400 z-10"
                      initial={false}
                      animate={{
                        left: `${(agent.x / 35) * 100}%`,
                        top: `${(agent.y / 35) * 100}%`,
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        left: { type: "spring", stiffness: 50, damping: 15 },
                        top: { type: "spring", stiffness: 50, damping: 15 },
                        scale: { duration: 0.5, repeat: Infinity }
                      }}
                      style={{
                        background: agent.personality === 'aggressive' ? '#ff00ff' : 
                                   agent.personality === 'peaceful' ? '#00ff00' :
                                   agent.personality === 'greedy' ? '#ffff00' : '#00ffff',
                        boxShadow: `0 0 12px ${agent.personality === 'aggressive' ? '#ff00ff' : 
                                             agent.personality === 'peaceful' ? '#00ff00' :
                                             agent.personality === 'greedy' ? '#ffff00' : '#00ffff'}`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {/* Pulse effect */}
                      <motion.div 
                        className="absolute inset-0 rounded-full opacity-50"
                        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        style={{
                          background: agent.personality === 'aggressive' ? '#ff00ff' : 
                                     agent.personality === 'peaceful' ? '#00ff00' :
                                     agent.personality === 'greedy' ? '#ffff00' : '#00ffff',
                        }}
                      />
                    </motion.div>
                  ))}
              </AnimatePresence>
              
              {/* Grid Background */}
              {Array(35 * 35).fill(0).map((_, idx) => (
                <div
                  key={idx}
                  className="border border-cyan-900 bg-black"
                  style={{ minHeight: '10px' }}
                />
              ))}
            </div>
          </div>

          {/* Bottom Info */}
          <div className="border-2 border-yellow-600 p-3 bg-yellow-900 bg-opacity-20 text-xs">
            <div className="flex justify-between">
              <div>
                <Zap size={14} className="inline mr-1" />
                Resources: Wood {worldState.resources.wood} | Stone {worldState.resources.stone} | Iron {worldState.resources.iron}
              </div>
              <div>
                <Home size={14} className="inline mr-1" />
                Properties: {worldState?.properties?.length || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Properties & Training */}
        <div className="w-72 flex flex-col gap-4 overflow-y-auto">
          {/* Training Chamber */}
          <div className="border-2 border-blue-500 p-4 bg-black bg-opacity-60">
            <h3 className="text-xs font-bold uppercase mb-3 tracking-widest text-blue-400">
              Training Chamber (1/1 Active)
            </h3>
            {worldState.agents.find(a => a?.inTraining) ? (
              <div className="p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-400">
                <div className="text-sm font-bold mb-2">{worldState.agents.find(a => a?.inTraining)?.name}</div>
                <div className="text-xs mb-2">
                  Progress: {worldState.agents.find(a => a?.inTraining)?.trainingProgress}%
                </div>
                <div className="w-full bg-black border border-blue-500 rounded h-3">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${worldState.agents.find(a => a?.inTraining)?.trainingProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500">No agent in training</div>
            )}
          </div>

          {/* Properties */}
          <div className="border-2 border-yellow-600 p-4 bg-black bg-opacity-60">
            <h3 className="text-xs font-bold uppercase mb-3 tracking-widest text-yellow-400">
              Properties ({(worldState?.properties || []).length})
            </h3>
            {(!worldState?.properties || worldState.properties.length === 0) ? (
              <div className="text-xs text-gray-500">No properties yet. Buy land to earn income!</div>
            ) : (
              <div className="space-y-2">
                {worldState.properties.map((prop, idx) => (
                  <div key={idx} className="p-2 bg-yellow-900 bg-opacity-20 rounded border border-yellow-600 text-xs">
                    <div className="font-bold">{prop.name}</div>
                    <div>Income: +{prop.income}/tick</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment System Placeholder */}
          <div className="border-2 border-green-600 p-4 bg-black bg-opacity-60">
            <h3 className="text-xs font-bold uppercase mb-3 tracking-widest text-green-400">
              Quick Revival
            </h3>
            <button className="w-full px-3 py-2 bg-green-900 hover:bg-green-700 border border-green-500 rounded text-xs font-bold uppercase">
              💳 €2,50 Revive + 5 Lives
            </button>
            <div className="text-xs text-gray-500 mt-2">
              Payment system integration ready (Stripe/PayPal)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
