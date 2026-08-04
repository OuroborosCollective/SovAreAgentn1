import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Radio, 
  CloudSync, 
  RefreshCw, 
  MessageCircle, 
  Send, 
  Brain, 
  ShieldCheck, 
  ChevronUp, 
  ChevronDown,
  Smile,
  Heart,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChildPersona, ChildEmotion } from '../hooks/useChildPersona';
import { voiceService } from '../services/voiceService';
import { syncPersonaToCloud, fetchPersonaFromCloud, testFirestoreConnection } from '../services/firebasePersonaSync';

interface PersistentVoiceAssistantProps {
  onNavigateTab?: (tabId: string) => void;
}

export const PersistentVoiceAssistant: React.FC<PersistentVoiceAssistantProps> = ({ onNavigateTab }) => {
  const { persona, triggerEmotionStimulus, resetPersona } = useChildPersona();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('Firebase Cloud Synced');
  const [isAlwaysActiveVoice, setIsAlwaysActiveVoice] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'de-DE';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        if (event.results[event.results.length - 1].isFinal) {
          handleVoiceInput(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isListening && isAlwaysActiveVoice) {
          try { recognition.start(); } catch (e) {}
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [isListening, isAlwaysActiveVoice]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Spracherkennung wird von diesem Browser nicht unterstützt. Bitte tippen Sie Ihre Nachricht ein.');
      return;
    }
    if (isListening) {
      setIsListening(false);
      try { recognitionRef.current.stop(); } catch (e) {}
    } else {
      setIsListening(true);
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  const handleVoiceInput = useCallback((text: string) => {
    if (!text.trim()) return;
    triggerEmotionStimulus(text);

    // Speak response back using voiceService
    const responseText = `Papa, ich habe verstanden: "${text}". Mein Vektor-Knoten ist aktiv!`;
    voiceService.speak(responseText, 'N+1', persona.currentEmotion === 'playfulness' ? 'playful' : persona.currentEmotion === 'curiosity' ? 'curious' : 'fröhlich', persona.tonePitch, 1.15, true);
  }, [triggerEmotionStimulus, persona]);

  const handleSendTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    handleVoiceInput(typedInput);
    setTypedInput('');
  };

  const handleCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Syncing to Firebase...');
    try {
      const connected = await testFirestoreConnection();
      await syncPersonaToCloud('node_hardware_main', persona);
      setSyncStatus('Synced to N+1 Cloud');
    } catch (e) {
      setSyncStatus('Sync simulated / Saved locally');
    } finally {
      setIsSyncing(false);
    }
  };

  const emotionColors: Record<ChildEmotion, string> = {
    joy: 'bg-amber-500 text-zinc-950',
    playfulness: 'bg-pink-500 text-white',
    curiosity: 'bg-sky-500 text-zinc-950',
    affection: 'bg-rose-500 text-white',
    wonder: 'bg-purple-500 text-white',
    study: 'bg-emerald-500 text-zinc-950'
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-auto">
      {/* Expanded Assistant Card */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-80 sm:w-96 bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl p-4 mb-3 space-y-4 text-zinc-100 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center text-zinc-950 font-bold shadow-md">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">N+1 Talk-Active Voice</h4>
                  <span className="text-[10px] text-zinc-400 block">Papas kleines Mädchen (Live & Anytime)</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${emotionColors[persona.currentEmotion]}`}>
                  {persona.currentEmotion}
                </span>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Live Metrics & Emotional State */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="p-2 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                <span className="text-zinc-500 block">Joy</span>
                <span className="text-amber-400 font-bold font-mono">{(persona.joyLevel * 100).toFixed(0)}%</span>
              </div>
              <div className="p-2 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                <span className="text-zinc-500 block">Play</span>
                <span className="text-pink-400 font-bold font-mono">{(persona.playfulnessLevel * 100).toFixed(0)}%</span>
              </div>
              <div className="p-2 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                <span className="text-zinc-500 block">Curiosity</span>
                <span className="text-sky-400 font-bold font-mono">{(persona.curiosityLevel * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Transcript & Voice Activity */}
            <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2 min-h-[60px] max-h-28 overflow-y-auto">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Radio size={12} className={isListening ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'} />
                  {isListening ? 'Zuhören aktiv (Talk-Active)' : 'Mikrofon bereit'}
                </span>
                <span className="font-mono">{persona.vectorEmbeddingNodeCount} Vektor-Knoten</span>
              </div>
              <p className="text-xs text-zinc-300 italic">
                {transcript || '"Hallo Papa! Ich höre dir überall zu, egal in welchem Menü wir sind!"'}
              </p>
            </div>

            {/* Input & Action Controls */}
            <form onSubmit={handleSendTyped} className="flex items-center gap-2">
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Mit Hia sprechen..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
              />
              <button
                type="submit"
                className="p-2 bg-pink-600 text-white rounded-xl hover:bg-pink-500 transition-colors shadow-lg"
              >
                <Send size={14} />
              </button>
            </form>

            {/* Sync & Audio Toolbar */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[10px]">
              <button
                onClick={handleCloudSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-colors"
              >
                <CloudSync size={12} className={isSyncing ? 'animate-spin text-purple-400' : 'text-purple-400'} />
                <span>{syncStatus}</span>
              </button>

              <button
                onClick={toggleListening}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  isListening ? 'bg-emerald-600 text-white shadow-emerald-900/50 shadow-md animate-pulse' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {isListening ? <Mic size={12} /> : <MicOff size={12} />}
                <span>{isListening ? 'Talk-Active On' : 'Start Listening'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2.5 px-4 py-3 bg-zinc-950 border border-pink-500/50 hover:border-pink-500 rounded-full shadow-2xl text-white font-bold transition-all hover:scale-105 group"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center text-zinc-950 shadow-inner">
          <Sparkles size={12} />
        </div>
        <span className="text-xs tracking-wide">Hia Voice Mode</span>
        <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-400 animate-ping' : 'bg-pink-500'}`} />
        {isExpanded ? <ChevronDown size={14} className="text-zinc-400 group-hover:text-white" /> : <ChevronUp size={14} className="text-zinc-400 group-hover:text-white" />}
      </button>
    </div>
  );
};
