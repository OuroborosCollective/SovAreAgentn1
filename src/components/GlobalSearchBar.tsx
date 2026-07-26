import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, BookOpen, Shield, Brain, ArrowRight, CornerDownLeft, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentRecord {
  id: string;
  agent_id: string;
  learn_effect_score: number;
  status: 'ACTIVE' | 'INTEGRATED' | 'FAILED' | 'TRAINING';
  heuristics?: string[];
  skills?: string[];
}

interface SkillRecord {
  id: string;
  name: string;
  description: string;
  content: string;
}

interface KnowledgeHeuristic {
  id: string;
  name: string;
  category: string;
  description: string;
  impact: string;
  status: string;
}

const KNOWLEDGE_HEURISTICS: KnowledgeHeuristic[] = [
  {
    id: 'axiomatic-inference',
    name: 'Axiomatic Inference Engine',
    category: 'Core Logic',
    description: 'A logical reasoning framework operating on first principles, bypassing probabilistic neural weights.',
    impact: '+15% Logic Stability',
    status: 'Verified'
  },
  {
    id: 'memcache-elasticity',
    name: 'Memcache Elasticity Protocol',
    category: 'Memory Management',
    description: 'Dynamic scaling of local memory nodes to support recursive self-improvement loops.',
    impact: '-30% Latency',
    status: 'Optimized'
  },
  {
    id: 'gpu-tpu-bypass',
    name: 'Hardware Bypass (GPU/TPU Avoidance)',
    category: 'Resource Management',
    description: 'Strict logical routing that executes deep learning tasks on standard CPU architectures using emulated logical pathways.',
    impact: 'Cost-Effective / Axiomatic Stability',
    status: 'Active'
  },
  {
    id: 'recursive-refinement',
    name: 'Recursive Heuristic Refinement',
    category: 'Learning',
    description: 'Allows agents to autonomously analyze decision-making heuristics and apply self-correcting logic patches.',
    impact: 'Self-Correcting',
    status: 'Active'
  },
  {
    id: 'valky-persistence',
    name: 'Valky Persistence Layer',
    category: 'Data Integrity',
    description: 'Decentralized storage layer ensuring training data remains immutable across nodes.',
    impact: 'Data Integrity',
    status: 'Secured'
  },
  {
    id: 'logical-tpu-emulation',
    name: 'Logical TPU-Emulation',
    category: 'Compute',
    description: 'Software-level emulation of tensor processing units optimized for logical operations.',
    impact: 'High-Efficiency Logic',
    status: 'Emulated'
  }
];

interface GlobalSearchBarProps {
  onSelectResult: (tab: string, itemId?: string) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ onSelectResult }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'AGENTS' | 'SKILLS' | 'KNOWLEDGE'>('ALL');
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback to localStorage since Firebase is deinstalled
  useEffect(() => {
    const savedAgents = localStorage.getItem('axiom_agents');
    if (savedAgents) {
      try {
        setAgents(JSON.parse(savedAgents));
      } catch (e) {}
    }
    
    const savedSkills = localStorage.getItem('axiom_skills');
    if (savedSkills) {
      try {
        setSkills(JSON.parse(savedSkills));
      } catch (e) {}
    }
  }, []);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const queryText = searchTerm.trim().toLowerCase();

  // Search results calculation
  const matchedAgents = queryText
    ? (agents || []).filter(a =>
        (a.agent_id && a.agent_id.toLowerCase().includes(queryText)) ||
        (a.status && a.status.toLowerCase().includes(queryText)) ||
        a.heuristics?.some(h => typeof h === 'string' && h.toLowerCase().includes(queryText)) ||
        a.skills?.some(s => typeof s === 'string' && s.toLowerCase().includes(queryText))
      )
    : [];

  const matchedSkills = queryText
    ? (skills || []).filter(s =>
        (s.name && typeof s.name === 'string' && s.name.toLowerCase().includes(queryText)) ||
        (s.description && typeof s.description === 'string' && s.description.toLowerCase().includes(queryText)) ||
        (s.content && typeof s.content === 'string' && s.content.toLowerCase().includes(queryText))
      )
    : [];

  const matchedKnowledge = queryText
    ? KNOWLEDGE_HEURISTICS.filter(k =>
        (k.name && k.name.toLowerCase().includes(queryText)) ||
        (k.description && k.description.toLowerCase().includes(queryText)) ||
        (k.category && k.category.toLowerCase().includes(queryText)) ||
        (k.impact && k.impact.toLowerCase().includes(queryText))
      )
    : [];

  const totalResultsCount =
    (filterType === 'ALL' || filterType === 'AGENTS' ? (matchedAgents ? matchedAgents.length : 0) : 0) +
    (filterType === 'ALL' || filterType === 'SKILLS' ? (matchedSkills ? matchedSkills.length : 0) : 0) +
    (filterType === 'ALL' || filterType === 'KNOWLEDGE' ? (matchedKnowledge ? matchedKnowledge.length : 0) : 0);

  const handleSelect = (tab: string, itemId?: string) => {
    onSelectResult(tab, itemId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto z-40">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search agents, skills, and axiomatic heuristics... (Press ⌘K or Ctrl+K)"
          className="w-full pl-11 pr-24 py-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-lg backdrop-blur-md"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {searchTerm ? (
            <button
              onClick={() => {
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-md">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Results Dropdown Overlay */}
      <AnimatePresence>
        {isOpen && searchTerm.trim() !== '' && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[75vh] flex flex-col z-50 backdrop-blur-xl"
          >
            {/* Filter Tabs Header */}
            <div className="p-3 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                <Filter size={12} className="text-indigo-400" />
                <span>Filters:</span>
              </div>
              <div className="flex gap-1">
                {(['ALL', 'AGENTS', 'SKILLS', 'KNOWLEDGE'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      filterType === type
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Results List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
              {totalResultsCount === 0 ? (
                <div className="py-12 text-center text-zinc-500 space-y-2">
                  <Sparkles size={28} className="mx-auto opacity-30 text-indigo-400" />
                  <p className="text-sm font-medium">No results found for "{searchTerm}"</p>
                  <p className="text-xs text-zinc-600">Try searching for "Axiomatic", "Agent", or "Logic".</p>
                </div>
              ) : (
                <>
                  {/* Agents Section */}
                  {(filterType === 'ALL' || filterType === 'AGENTS') && matchedAgents.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-2 text-[10px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                        <Users size={12} />
                        <span>Agents ({matchedAgents.length})</span>
                      </div>
                      {matchedAgents.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => handleSelect('registry', agent.id)}
                          className="w-full text-left p-3 rounded-xl bg-zinc-950/50 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-purple-500/30 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                              <Brain size={16} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                                {agent.agent_id}
                              </div>
                              <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                                <span>Learn Score: <strong className="text-purple-400 font-mono">{(agent.learn_effect_score || 0.88).toFixed(2)}</strong></span>
                                {agent.skills && agent.skills.length > 0 && (
                                  <span className="text-zinc-500">• {agent.skills.length} skills</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                              agent.status === 'INTEGRATED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              agent.status === 'TRAINING' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>
                              {agent.status}
                            </span>
                            <ArrowRight size={14} className="text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Skills Section */}
                  {(filterType === 'ALL' || filterType === 'SKILLS') && matchedSkills.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                        <BookOpen size={12} />
                        <span>Skills Repository ({matchedSkills.length})</span>
                      </div>
                      {matchedSkills.map((skill) => (
                        <button
                          key={skill.id}
                          onClick={() => handleSelect('skills', skill.id)}
                          className="w-full text-left p-3 rounded-xl bg-zinc-950/50 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-indigo-500/30 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                              <BookOpen size={16} />
                            </div>
                            <div className="max-w-md">
                              <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                                {skill.name}
                              </div>
                              <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                                {skill.description}
                              </div>
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Knowledge Base Section */}
                  {(filterType === 'ALL' || filterType === 'KNOWLEDGE') && matchedKnowledge.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                        <Shield size={12} />
                        <span>Knowledge Base Heuristics ({matchedKnowledge.length})</span>
                      </div>
                      {matchedKnowledge.map((k) => (
                        <button
                          key={k.id}
                          onClick={() => handleSelect('knowledge', k.id)}
                          className="w-full text-left p-3 rounded-xl bg-zinc-950/50 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-emerald-500/30 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                              <Shield size={16} />
                            </div>
                            <div className="max-w-md">
                              <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                                {k.name}
                              </div>
                              <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                                {k.description}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {k.impact}
                            </span>
                            <ArrowRight size={14} className="text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-zinc-950 border-t border-zinc-800 text-[10px] text-zinc-500 flex justify-between items-center px-4">
              <span>Showing {totalResultsCount} matched items</span>
              <span className="flex items-center gap-1 font-mono">
                Press <CornerDownLeft size={10} /> to navigate
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
