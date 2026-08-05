/**
 * GeminiLiveVoiceComponent - Full-Duplex Voice Interface
 * 
 * Real-time bidirectional voice interface using Gemini Live API.
 * Features simultaneous audio input/output with native barge-in support.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneOff,
  Waves,
  Zap,
  Activity,
  Wifi,
  WifiOff,
  AlertCircle,
  Settings,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGeminiLiveVoice } from '../hooks/useGeminiLiveVoice';
import { googleApiKeyManager } from '../services/googleApiKeyManager';

interface GeminiLiveVoiceComponentProps {
  systemInstruction?: string;
  voiceName?: string;
  autoConnect?: boolean;
}

export const GeminiLiveVoiceComponent: React.FC<GeminiLiveVoiceComponentProps> = ({
  systemInstruction = 'Du bist N+1, ein freundliches und neugieriges KI-Mädchen. Antworte kurz und fröhlich.',
  voiceName = 'Puck',
  autoConnect = false
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [manualApiKey, setManualApiKey] = useState('');
  
  const {
    state,
    isConnected,
    isRecording,
    isPlaying,
    interimTranscript,
    finalTranscript,
    metrics,
    initialize,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    bargeIn,
    sendText,
    clearTranscripts
  } = useGeminiLiveVoice();

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      handleConnect();
    }
  }, []);

  // Get API key from manager or manual input
  const getApiKey = useCallback(async (): Promise<string> => {
    // First try to get from active key in manager
    const activeKey = googleApiKeyManager.getActiveKey();
    if (activeKey) {
      return activeKey.key;
    }
    
    // Then try manual input
    if (manualApiKey) {
      return manualApiKey;
    }
    
    throw new Error('No API key available. Please add a key in the Free LLM Router settings.');
  }, [manualApiKey]);

  // Handle connect
  const handleConnect = async () => {
    try {
      const apiKey = await getApiKey();
      initialize({
        apiKey,
        voiceName,
        systemInstruction,
        enableBargeIn: true,
        vadEnabled: true
      });
      await connect();
    } catch (error: any) {
      console.error('[GeminiLive] Connect failed:', error);
      alert(error.message || 'Failed to connect');
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    await disconnect();
  };

  // Handle mic toggle
  const handleMicToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Handle barge-in (click during playback)
  const handleBargeIn = () => {
    if (isPlaying) {
      bargeIn();
    }
  };

  // Get state icon and color
  const getStateDisplay = () => {
    switch (state) {
      case 'disconnected':
        return { icon: WifiOff, color: 'text-zinc-500', bg: 'bg-zinc-900' };
      case 'connecting':
        return { icon: RefreshCw, color: 'text-amber-400', bg: 'bg-amber-900/30' };
      case 'connected':
        return { icon: Wifi, color: 'text-emerald-400', bg: 'bg-emerald-900/30' };
      case 'listening':
        return { icon: Mic, color: 'text-cyan-400', bg: 'bg-cyan-900/30' };
      case 'thinking':
        return { icon: Activity, color: 'text-purple-400', bg: 'bg-purple-900/30' };
      case 'speaking':
        return { icon: Volume2, color: 'text-pink-400', bg: 'bg-pink-900/30' };
      case 'interrupted':
        return { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-900/30' };
      case 'error':
        return { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-900/30' };
      default:
        return { icon: WifiOff, color: 'text-zinc-500', bg: 'bg-zinc-900' };
    }
  };

  const stateDisplay = getStateDisplay();
  const StateIcon = stateDisplay.icon;

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Main Voice Interface */}
      <div className={`
        p-6 rounded-3xl border transition-all duration-300
        ${stateDisplay.bg} border-zinc-800
        ${isPlaying ? 'ring-2 ring-pink-500/50' : ''}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${stateDisplay.bg} ${stateDisplay.color}`}>
              <Waves size={20} className={state === 'connecting' ? 'animate-pulse' : ''} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gemini Live Voice</h3>
              <p className="text-[10px] text-zinc-500">Full-Duplex Audio Interface</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Settings size={16} className="text-zinc-500" />
            </button>
          </div>
        </div>

        {/* State Indicator */}
        <div className={`
          flex items-center justify-center gap-3 p-4 rounded-2xl mb-6
          ${state === 'speaking' ? 'bg-pink-950/30 animate-pulse' : 'bg-zinc-900/50'}
        `}>
          <StateIcon size={24} className={stateDisplay.color} />
          <span className={`text-sm font-bold uppercase tracking-wider ${stateDisplay.color}`}>
            {state}
          </span>
        </div>

        {/* Waveform Visualizer (placeholder) */}
        <div className="h-16 bg-zinc-900/50 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
          {isRecording ? (
            <div className="flex items-center gap-1">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-cyan-400 rounded-full"
                  animate={{
                    height: [8, 24 + Math.random() * 16, 8]
                  }}
                  transition={{
                    duration: 0.3 + Math.random() * 0.2,
                    repeat: Infinity,
                    delay: i * 0.05
                  }}
                />
              ))}
            </div>
          ) : isPlaying ? (
            <div className="flex items-center gap-1">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-pink-400 rounded-full"
                  animate={{
                    height: [8, 16 + Math.random() * 24, 8]
                  }}
                  transition={{
                    duration: 0.4 + Math.random() * 0.3,
                    repeat: Infinity,
                    delay: i * 0.04
                  }}
                />
              ))}
            </div>
          ) : (
            <span className="text-zinc-600 text-xs">Warte auf Verbindung...</span>
          )}
        </div>

        {/* Transcript Display */}
        <div className="bg-zinc-950/50 rounded-xl p-4 mb-6 min-h-24 max-h-32 overflow-y-auto">
          {finalTranscript ? (
            <p className="text-white text-sm leading-relaxed">{finalTranscript}</p>
          ) : interimTranscript ? (
            <p className="text-zinc-400 text-sm leading-relaxed italic">
              {interimTranscript}
              <span className="animate-pulse">|</span>
            </p>
          ) : (
            <p className="text-zinc-600 text-xs text-center">
              {isConnected ? 'Sprich jetzt...' : 'Verbinde dich um zu starten'}
            </p>
          )}
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: 'Input', value: metrics.audioInputMs, unit: 'ms', color: 'cyan' },
            { label: 'STT', value: metrics.sttLatencyMs, unit: 'ms', color: 'amber' },
            { label: 'TTF', value: metrics.ttsLatencyMs, unit: 'ms', color: 'pink' },
            { label: 'Total', value: metrics.totalRoundTripMs, unit: 'ms', color: 'emerald' }
          ].map((metric, i) => (
            <div key={i} className="bg-zinc-900/50 rounded-lg p-2 text-center">
              <div className={`text-${metric.color}-400 text-xs font-bold`}>{metric.value} {metric.unit}</div>
              <div className="text-zinc-600 text-[9px] uppercase">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Mic Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleMicToggle}
            disabled={!isConnected}
            className={`
              p-4 rounded-full transition-all duration-200
              ${isRecording 
                ? 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/30' 
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
              }
              ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
          </motion.button>

          {/* Connect/Disconnect Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={isConnected ? handleDisconnect : handleConnect}
            className={`
              p-4 rounded-full transition-all duration-200
              ${isConnected 
                ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/30' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30'
              }
            `}
          >
            {isConnected ? <PhoneOff size={24} /> : <Phone size={24} />}
          </motion.button>

          {/* Barge-In Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBargeIn}
            disabled={!isPlaying}
            className={`
              p-4 rounded-full transition-all duration-200
              ${isPlaying 
                ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30' 
                : 'bg-zinc-800 text-zinc-600'
              }
            `}
          >
            <Zap size={24} />
          </motion.button>
        </div>

        {/* Status Bar */}
        <div className="mt-6 flex items-center justify-between text-[10px] text-zinc-600">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isRecording ? 'bg-cyan-400 animate-pulse' : 
              isPlaying ? 'bg-pink-400 animate-pulse' : 
              isConnected ? 'bg-emerald-400' : 'bg-zinc-600'
            }`} />
            <span>
              {isRecording ? 'Recording' : 
               isPlaying ? 'Speaking' : 
               isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <span>Dropped: {metrics.droppedFrames}</span>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 left-0 right-0 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 z-10"
          >
            <h4 className="text-xs font-bold text-white mb-3">API Key Settings</h4>
            
            <input
              type="password"
              value={manualApiKey}
              onChange={(e) => setManualApiKey(e.target.value)}
              placeholder="Enter API Key manually (optional)"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs placeholder-zinc-600 mb-2"
            />
            
            <p className="text-[9px] text-zinc-600">
              Or use keys from Free LLM Router. Priority: Active Key &gt; Manual Input
            </p>
            
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="mt-3 w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
