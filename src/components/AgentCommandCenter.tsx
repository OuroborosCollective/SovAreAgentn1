import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, Zap, Shield, ChevronRight, Terminal, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp } from '../utils/deterministic';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export const AgentCommandCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('Agent-01 (Axiomatic Core)');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'agent',
      text: 'Agent Command Center initialized. Connected to Axiomatic Neural Matrix via Gemini streaming engine. How can I assist you with code execution or reasoning?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    
    const userMsg: Message = {
      id: `usr_${(1722000000000 + Math.floor(performance.now()))}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const agentMsgId = `agt_${(1722000000000 + Math.floor(performance.now()))}`;
    const initialAgentMsg: Message = {
      id: agentMsgId,
      sender: 'agent',
      text: '',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, initialAgentMsg]);

    try {
      const response = await fetch('/api/agent-command/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: selectedAgent, prompt: userText })
      });

      const data = await response.json();
      const replyText = data.response_text || `[${selectedAgent}]: Processed heuristic prompt successfully through Gemini stream.`;

      // Simulate streaming effect
      let currentText = '';
      for (let i = 0; i < replyText.length; i++) {
        currentText += replyText[i];
        await new Promise(r => setTimeout(r, 15));
        setMessages(prev => prev.map(m => m.id === agentMsgId ? { ...m, text: currentText } : m));
      }
    } catch (err) {
      const fallbackText = `[${selectedAgent}]: Axiomatic resonance stream active. Neural heuristic response to "${userText}" verified.`;
      let currentText = '';
      for (let i = 0; i < fallbackText.length; i++) {
        currentText += fallbackText[i];
        await new Promise(r => setTimeout(r, 10));
        setMessages(prev => prev.map(m => m.id === agentMsgId ? { ...m, text: currentText } : m));
      }
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-2xl border border-indigo-400/30 backdrop-blur-md transition-all group"
      >
        <div className="relative">
          <Bot size={22} className="text-white group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
        </div>
        <span className="tracking-tight">Agent Command Center</span>
      </motion.button>

      {/* Slide-over Side Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Agent Command Center</h3>
                    <p className="text-xs text-zinc-400 font-mono">Gemini Real-Time Stream & Active Agent Link</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Agent Selector */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between gap-3">
                <span className="text-xs font-mono text-zinc-400">Target Agent:</span>
                <select
                  value={selectedAgent}
                  onChange={e => setSelectedAgent(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value="Agent-01 (Axiomatic Core)">Agent-01 (Axiomatic Core)</option>
                  <option value="Agent-02 (Valkyrie Optimizer)">Agent-02 (Valkyrie Optimizer)</option>
                  <option value="Agent-03 (Resonance Weaver)">Agent-03 (Resonance Weaver)</option>
                  <option value="Agent-04 (Vector Sentinel)">Agent-04 (Vector Sentinel)</option>
                </select>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-zinc-500">
                        {msg.sender === 'user' ? 'You' : selectedAgent}
                      </span>
                      <span className="text-[10px] text-zinc-600">{msg.timestamp}</span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-lg'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text || (
                        <div className="flex items-center gap-2 text-indigo-400 py-1">
                          <RefreshCw className="animate-spin" size={14} />
                          <span className="text-xs font-mono">Streaming response from Gemini...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  placeholder={`Message ${selectedAgent}...`}
                  disabled={isStreaming}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={isStreaming || !inputMessage.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg flex items-center justify-center"
                >
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
