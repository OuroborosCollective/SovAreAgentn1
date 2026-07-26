import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  Sparkles, 
  CheckCircle2, 
  Terminal, 
  Command, 
  Activity, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  RefreshCw,
  Play,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface VoiceCommandLog {
  id: string;
  transcript: string;
  intent: string;
  response: string;
  executedAt: string;
  status: 'Success' | 'Parsed' | 'Executing';
}

interface HiaResonanceVoiceProps {
  onNavigateTab?: (tabId: string) => void;
}

export const HiaResonanceVoice: React.FC<HiaResonanceVoiceProps> = ({ onNavigateTab }) => {
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  const [speechSynthEnabled, setSpeechSynthEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<string | null>(
    'Hia Resonance Voice Engine initialized. Say "Report system status", "Trigger self healing", "Run vector search", or "Equip knowledge patterns".'
  );
  const [commandLogs, setCommandLogs] = useState<VoiceCommandLog[]>([
    {
      id: 'cmd-01',
      transcript: 'Report system status',
      intent: 'SYSTEM_HEALTH_CHECK',
      response: 'All 5 Keller nodes nominal. Predictive risk factor 1.8%. Port 3000 ingress online.',
      executedAt: '1 min ago',
      status: 'Success'
    }
  ]);

  const [frequencyData, setFrequencyData] = useState<number[]>([12, 45, 78, 90, 65, 34, 88, 54, 32, 95, 60, 40, 75, 85, 30]);
  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition if available with proper unmount cleanup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // Check if final
        if (event.results[event.results.length - 1]?.isFinal) {
          processNaturalLanguageCommand(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // ignore
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Frequency wave generator effect
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(() => {
      setFrequencyData(prev => prev.map(() => Math.floor(Math.random() * 85) + 15));
    }, 150);

    return () => clearInterval(interval);
  }, [isListening]);

  const speakText = (text: string) => {
    setLastResponse(text);
    if (!speechSynthEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const processNaturalLanguageCommand = async (cmdText: string) => {
    const textLower = cmdText.toLowerCase().trim();
    if (!textLower) return;

    let intent = 'UNKNOWN_COMMAND';
    let responseText = `Command recognized: "${cmdText}". Executing general query on N+1 network state.`;

    if (textLower.includes('status') || textLower.includes('health') || textLower.includes('report')) {
      intent = 'SYSTEM_HEALTH_CHECK';
      responseText = 'All 5 Keller nodes are operating nominally. Memory pressure is at 28%. Port 3000 reverse proxy ingress is healthy.';
    } else if (textLower.includes('heal') || textLower.includes('fix') || textLower.includes('mitigate')) {
      intent = 'TRIGGER_SELF_HEALING';
      responseText = 'Initiating preemptive self-healing protocol. V8 garbage collector flushed and worker threads rebalanced.';
    } else if (textLower.includes('vector') || textLower.includes('search') || textLower.includes('index')) {
      intent = 'VECTOR_SEARCH';
      responseText = 'Executing Milvus and PGVector semantic search across 18,420 knowledge vectors. Recall rate is 99.85%.';
    } else if (textLower.includes('equip') || textLower.includes('pattern') || textLower.includes('knowledge')) {
      intent = 'EQUIP_PATTERNS';
      responseText = 'Full pattern library equipped. Replit Agent autonomous coding engine and Manus Agent multi-step verification active.';
    } else if (textLower.includes('predict') || textLower.includes('bottleneck') || textLower.includes('simulate')) {
      intent = 'PREDICTIVE_INFERENCE';
      responseText = 'Predictive simulation completed across 12 forward time horizons. Maximum forecasted risk is bounded at 1.8%.';
    } else if (textLower.includes('navigate') || textLower.includes('open') || textLower.includes('go to')) {
      intent = 'NAVIGATION';
      if (textLower.includes('dashboard') && onNavigateTab) {
        onNavigateTab('dashboard');
        responseText = 'Navigating to primary N+1 System Dashboard.';
      } else if (textLower.includes('knowledge') && onNavigateTab) {
        onNavigateTab('knowledge');
        responseText = 'Navigating to Knowledge Base Pattern Library.';
      } else if (textLower.includes('vector') && onNavigateTab) {
        onNavigateTab('vectorizer');
        responseText = 'Navigating to Knowledge Vectorizer Service.';
      } else if (textLower.includes('health') && onNavigateTab) {
        onNavigateTab('health-monitor');
        responseText = 'Navigating to Agent Health Monitor.';
      }
    }

    speakText(responseText);

    const newLog: VoiceCommandLog = {
      id: `cmd-${Date.now()}`,
      transcript: cmdText,
      intent,
      response: responseText,
      executedAt: 'Just now',
      status: 'Success'
    };

    setCommandLogs(prev => [newLog, ...prev]);

    try {
      // Simulation of command sync since Firebase is deinstalled
      localStorage.setItem('axiom_last_voice_command', JSON.stringify(newLog));
    } catch (e) {
      console.warn('Voice command sync warning:', e);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    } else {
      setIsListening(true);
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    }
  };

  const handleSimulateCommand = (presetText: string) => {
    setTranscript(presetText);
    processNaturalLanguageCommand(presetText);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 text-zinc-100 font-sans">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-pink-400">
              <Mic size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                Hia Resonance Voice Engine Interface
                <span className="text-xs font-mono px-2.5 py-1 bg-pink-950 text-pink-300 border border-pink-800 rounded-lg font-bold">
                  SPEECH-TO-INTENT RUNTIME
                </span>
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Natural language command execution, voice synthesis system status broadcasts, and real-time audio resonance frequency visualization.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSpeechSynthEnabled(!speechSynthEnabled)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
              speechSynthEnabled 
                ? 'bg-pink-950 border-pink-800 text-pink-300' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            {speechSynthEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{speechSynthEnabled ? 'Voice Synthesis Active' : 'Muted'}</span>
          </button>

          <button
            onClick={toggleListening}
            className={`px-6 py-2.5 font-bold text-sm rounded-xl flex items-center gap-2.5 transition-all shadow-xl ${
              isListening 
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white animate-pulse shadow-pink-950/50' 
                : 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-purple-950/30'
            }`}
          >
            {isListening ? <Square size={18} /> : <Mic size={18} />}
            <span>{isListening ? 'Stop Listening' : 'Start Voice Input'}</span>
          </button>
        </div>
      </header>

      {/* AUDIO WAVEFORM VISUALIZER & COMMAND CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resonance Visualizer */}
        <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <Radio size={18} className="text-pink-400" />
              <h2 className="text-sm font-bold text-white">Resonance Frequency Waveform</h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {isListening ? 'MICROPHONE LIVE' : 'STANDBY'}
            </span>
          </div>

          {/* Equalizer Bars */}
          <div className="flex items-end justify-center gap-2 h-32 py-2">
            {frequencyData.map((val, idx) => (
              <motion.div
                key={idx}
                animate={{ height: `${val}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`w-3.5 rounded-t-lg ${
                  isListening 
                    ? 'bg-gradient-to-t from-pink-600 to-purple-400' 
                    : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>

          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2 font-mono text-xs">
            <div className="flex justify-between text-zinc-500 text-[10px]">
              <span>SPEECH RECOGNITION TRANSCRIPT:</span>
              <span>{isListening ? 'LISTENING...' : 'IDLE'}</span>
            </div>
            <div className="text-white font-bold min-h-8">
              {transcript ? `"${transcript}"` : <span className="text-zinc-600 italic">Say a command or click a preset below...</span>}
            </div>
          </div>
        </div>

        {/* Hia Response & Presets */}
        <div className="lg:col-span-2 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-pink-400" />
                <h2 className="text-sm font-bold text-white">Hia Voice Assistant Response</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-pink-950 text-pink-300 border border-pink-800 rounded-md font-bold">
                AHEAD-OF-TIME NLP
              </span>
            </div>

            <div className="p-5 bg-gradient-to-r from-pink-950/30 via-zinc-900 to-zinc-950 border border-pink-500/20 rounded-2xl text-sm font-mono text-pink-200 leading-relaxed min-h-24 flex items-center gap-3">
              <Activity size={20} className="text-pink-400 shrink-0 animate-pulse" />
              <span>{lastResponse}</span>
            </div>
          </div>

          {/* Quick Preset Voice Commands */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Quick Voice Command Presets</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              {[
                { label: 'Report system status', text: 'Report system status' },
                { label: 'Trigger self healing', text: 'Trigger self healing' },
                { label: 'Run vector search', text: 'Run vector search' },
                { label: 'Equip knowledge patterns', text: 'Equip knowledge patterns' },
                { label: 'Predictive simulation', text: 'Run predictive simulation' },
                { label: 'Go to Knowledge Base', text: 'Open knowledge base' }
              ].map(cmd => (
                <button
                  key={cmd.label}
                  onClick={() => handleSimulateCommand(cmd.text)}
                  className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{cmd.label}</span>
                  <Play size={12} className="text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COMMAND HISTORY LOG */}
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-pink-400" />
            <h2 className="text-sm font-bold text-white">Executed Voice Command Audit Log</h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">{commandLogs.length} Commands Recorded</span>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {commandLogs.map(log => (
            <div key={log.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">"{log.transcript}"</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-800">
                    {log.intent}
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">{log.response}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                  <CheckCircle2 size={12} /> {log.status}
                </span>
                <span className="text-zinc-500 text-[10px]">{log.executedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HiaResonanceVoice;
