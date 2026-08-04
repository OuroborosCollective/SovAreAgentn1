import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  BarChart,
  Bar,
} from 'recharts';
import {
  HeartHandshake,
  Activity,
  Sparkles,
  Clock,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  Zap,
  TrendingUp,
  BarChart2,
  Search,
  Bot,
  Volume2,
  Sliders,
  X,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import {
  emotionalMemoryService,
  EmotionalMemoryEntry,
  VoiceResonanceMetrics,
} from '../services/emotionalMemoryService';
import { generateHiaVoiceResponse } from '../services/geminiService';

export const EmotionalProfileVisualization: React.FC = () => {
  const [memories, setMemories] = useState<EmotionalMemoryEntry[]>([]);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [chartMode, setChartMode] = useState<'timeline' | 'composed' | 'distribution'>('timeline');
  const [selectedEmotionFilter, setSelectedEmotionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal State for Adding / Editing Emotional Memory Entry
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  
  // New Memory Form State
  const [formEmotion, setFormEmotion] = useState<string>('fröhlich');
  const [formSnippet, setFormSnippet] = useState<string>('');
  const [formTrigger, setFormTrigger] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formPitch, setFormPitch] = useState<number>(180);
  const [formWarmth, setFormWarmth] = useState<number>(85);
  const [formTimbre, setFormTimbre] = useState<number>(80);
  const [formCadence, setFormCadence] = useState<number>(90);
  
  // Agent Simulator State
  const [simulatedAgentOutput, setSimulatedAgentOutput] = useState<string | null>(null);
  const [isSimulatingAgent, setIsSimulatingAgent] = useState<boolean>(false);
  const [agentPromptPreview, setAgentPromptPreview] = useState<string>('');

  useEffect(() => {
    const unsubscribe = emotionalMemoryService.subscribe((updatedMemories) => {
      setMemories(updatedMemories);
    });
    return () => unsubscribe();
  }, []);

  // Filter memories based on timeframe
  const filteredMemoriesByTime = useMemo(() => {
    const now = Date.now();
    let cutoff = 0;
    if (timeframe === '24h') cutoff = now - 24 * 3600 * 1000;
    else if (timeframe === '7d') cutoff = now - 7 * 24 * 3600 * 1000;
    else if (timeframe === '30d') cutoff = now - 30 * 24 * 3600 * 1000;

    return memories.filter((m) => m.timestamp >= cutoff);
  }, [memories, timeframe]);

  // Filtered list for the Emotional Memory Store table/feed
  const displayMemoriesList = useMemo(() => {
    return filteredMemoriesByTime.filter((m) => {
      const matchesEmotion =
        selectedEmotionFilter === 'all' || m.emotionalState === selectedEmotionFilter;
      const matchesQuery =
        !searchQuery ||
        m.conversationSnippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.userNotes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.emotionalState.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesEmotion && matchesQuery;
    });
  }, [filteredMemoriesByTime, selectedEmotionFilter, searchQuery]);

  // Transform memory entries into Recharts format
  const chartData = useMemo(() => {
    return filteredMemoriesByTime.map((m) => {
      return {
        id: m.id,
        timestamp: m.timestamp,
        timeLabel: m.formattedTime,
        emotionalState: m.emotionalState,
        conversationSnippet: m.conversationSnippet,
        userNotes: m.userNotes || '',
        userVerified: m.userVerified,
        harmonicWarmth: m.resonanceMetrics.harmonicWarmth,
        cadenceStability: m.resonanceMetrics.cadenceStability,
        timbreDepth: m.resonanceMetrics.timbreDepth,
        pitchResonance: m.resonanceMetrics.pitchResonance,
        energyValence: m.resonanceMetrics.energyValence,
        arousalLevel: m.resonanceMetrics.arousalLevel,
      };
    });
  }, [filteredMemoriesByTime]);

  // Compute Distribution stats
  const emotionDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredMemoriesByTime.forEach((m) => {
      counts[m.emotionalState] = (counts[m.emotionalState] || 0) + 1;
    });
    return Object.entries(counts).map(([emotion, count]) => ({
      emotion: emotion.toUpperCase(),
      count,
    }));
  }, [filteredMemoriesByTime]);

  // Calculate Overall Metrics
  const summaryStats = useMemo(() => {
    if (filteredMemoriesByTime.length === 0) {
      return { dominantEmotion: 'ruhig', avgWarmth: 80, avgPitch: 170, totalEntries: 0 };
    }
    const emotionCounts: Record<string, number> = {};
    let totalWarmth = 0;
    let totalPitch = 0;

    filteredMemoriesByTime.forEach((m) => {
      emotionCounts[m.emotionalState] = (emotionCounts[m.emotionalState] || 0) + 1;
      totalWarmth += m.resonanceMetrics.harmonicWarmth;
      totalPitch += m.resonanceMetrics.pitchResonance;
    });

    const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0][0];
    const avgWarmth = Math.round(totalWarmth / filteredMemoriesByTime.length);
    const avgPitch = Math.round(totalPitch / filteredMemoriesByTime.length);

    return {
      dominantEmotion,
      avgWarmth,
      avgPitch,
      totalEntries: filteredMemoriesByTime.length,
    };
  }, [filteredMemoriesByTime]);

  // Color helper for emotional states
  const getEmotionBadgeColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'fröhlich':
        return 'bg-pink-950 text-pink-300 border-pink-700';
      case 'verspielt':
        return 'bg-purple-950 text-purple-300 border-purple-700';
      case 'ernst':
        return 'bg-blue-950 text-blue-300 border-blue-700';
      case 'neugierig':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      case 'stolz':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'nachdenklich':
        return 'bg-indigo-950 text-indigo-300 border-indigo-700';
      default:
        return 'bg-zinc-900 text-zinc-300 border-zinc-700';
    }
  };

  const handleOpenAddModal = () => {
    setEditingEntryId(null);
    setFormEmotion('fröhlich');
    setFormSnippet('');
    setFormTrigger('');
    setFormNotes('');
    setFormPitch(180);
    setFormWarmth(85);
    setFormTimbre(80);
    setFormCadence(90);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (entry: EmotionalMemoryEntry) => {
    setEditingEntryId(entry.id);
    setFormEmotion(entry.emotionalState);
    setFormSnippet(entry.conversationSnippet);
    setFormTrigger(entry.triggerContext || '');
    setFormNotes(entry.userNotes || '');
    setFormPitch(entry.resonanceMetrics.pitchResonance);
    setFormWarmth(entry.resonanceMetrics.harmonicWarmth);
    setFormTimbre(entry.resonanceMetrics.timbreDepth);
    setFormCadence(entry.resonanceMetrics.cadenceStability);
    setIsAddModalOpen(true);
  };

  const handleSaveMemoryEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSnippet.trim()) return;

    const resonanceMetrics: VoiceResonanceMetrics = {
      pitchResonance: formPitch,
      harmonicWarmth: formWarmth,
      timbreDepth: formTimbre,
      cadenceStability: formCadence,
      energyValence: Math.round((formWarmth + formCadence) / 2),
      arousalLevel: Math.round((formPitch / 240) * 100),
    };

    if (editingEntryId) {
      emotionalMemoryService.updateMemory(editingEntryId, {
        emotionalState: formEmotion,
        conversationSnippet: formSnippet,
        triggerContext: formTrigger,
        userNotes: formNotes,
        resonanceMetrics,
        userVerified: true,
      });
    } else {
      emotionalMemoryService.addMemory({
        emotionalState: formEmotion,
        conversationSnippet: formSnippet,
        triggerContext: formTrigger || 'User Identified State Entry',
        userNotes: formNotes,
        resonanceMetrics,
        source: 'manual_user_tag',
        userVerified: true,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleToggleVerify = (id: string, currentStatus: boolean) => {
    emotionalMemoryService.updateMemory(id, { userVerified: !currentStatus });
  };

  const handleDeleteEntry = (id: string) => {
    emotionalMemoryService.deleteMemory(id);
  };

  // Simulate Agent Mood Pattern Recall
  const handleSimulateAgentRecall = async () => {
    setIsSimulatingAgent(true);
    setSimulatedAgentOutput(null);

    const { promptSnippet } = emotionalMemoryService.getAgentMoodContextPrompt();
    setAgentPromptPreview(promptSnippet);

    try {
      const response = await generateHiaVoiceResponse('Papa fragt: Erinnerst du dich an unsere bisherigen Gespräche und wie meine Stimme geklungen hat?');
      setSimulatedAgentOutput(response);
    } catch (e: any) {
      setSimulatedAgentOutput(`Agent Recall Error: ${e.message || 'Failed to simulate recall'}`);
    } finally {
      setIsSimulatingAgent(false);
    }
  };

  // Custom Recharts Tooltip Component
  const CustomRechartsTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-zinc-950/95 border border-pink-500/50 rounded-2xl shadow-2xl backdrop-blur-md max-w-xs text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5">
            <span className="text-[10px] text-zinc-400 font-bold">{data.timeLabel}</span>
            <span
              className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getEmotionBadgeColor(
                data.emotionalState
              )}`}
            >
              {data.emotionalState.toUpperCase()}
            </span>
          </div>

          <div className="space-y-1 text-zinc-300">
            <p className="line-clamp-2 text-[11px] italic text-pink-200">
              "{data.conversationSnippet}"
            </p>
            {data.userNotes && (
              <p className="text-[10px] text-zinc-400">
                <span className="text-pink-400 font-bold">Tag:</span> {data.userNotes}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-zinc-800 text-[10px]">
            <div>
              <span className="text-zinc-500">Harmonic Warmth:</span>{' '}
              <span className="text-pink-400 font-bold">{data.harmonicWarmth}%</span>
            </div>
            <div>
              <span className="text-zinc-500">Pitch Resonance:</span>{' '}
              <span className="text-purple-400 font-bold">{data.pitchResonance} Hz</span>
            </div>
            <div>
              <span className="text-zinc-500">Cadence Stability:</span>{' '}
              <span className="text-emerald-400 font-bold">{data.cadenceStability}%</span>
            </div>
            <div>
              <span className="text-zinc-500">Timbre Depth:</span>{' '}
              <span className="text-amber-400 font-bold">{data.timbreDepth}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-gradient-to-r from-zinc-950 via-purple-950/20 to-zinc-950 border border-purple-500/30 rounded-3xl space-y-6 font-sans shadow-2xl text-white relative overflow-hidden">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-900/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-950/80 border border-purple-700 text-pink-400 rounded-2xl shadow-lg shrink-0">
            <HeartHandshake size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              N+1 Voice Studio: Historical Emotional Profile & Voice Resonance
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-pink-950 text-pink-300 border border-pink-700">
                RECHARTS ENGINE
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Interactive timeline mapping voice resonance metrics with user-identified emotional memory states over time.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus size={14} /> Tag Emotional Memory
          </button>
        </div>
      </div>

      {/* METRIC SUMMARY WIDGETS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block flex items-center gap-1">
            <Sparkles size={12} className="text-pink-400" /> Dominant Mood State
          </span>
          <span
            className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border uppercase ${getEmotionBadgeColor(
              summaryStats.dominantEmotion
            )}`}
          >
            {summaryStats.dominantEmotion}
          </span>
          <span className="text-[10px] text-zinc-500 block">Based on recent voice sessions</span>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-400" /> Avg Harmonic Warmth
          </span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            {summaryStats.avgWarmth}%
          </span>
          <span className="text-[10px] text-zinc-500 block">System empathy alignment</span>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block flex items-center gap-1">
            <Activity size={12} className="text-purple-400" /> Voice Pitch Resonance
          </span>
          <span className="text-lg font-bold font-mono text-purple-300">
            {summaryStats.avgPitch} Hz
          </span>
          <span className="text-[10px] text-zinc-500 block">N+1 voice frequency cadence</span>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block flex items-center gap-1">
            <Tag size={12} className="text-amber-400" /> Correlated Memories
          </span>
          <span className="text-lg font-bold font-mono text-amber-300">
            {summaryStats.totalEntries} Logs
          </span>
          <span className="text-[10px] text-zinc-500 block">Stored in Emotional Memory</span>
        </div>
      </div>

      {/* CONTROLS & TIMEFRAME FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90 p-3 border border-zinc-800 rounded-2xl">
        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
          <span className="text-zinc-500 px-2 font-bold text-[10px] uppercase">Timeframe:</span>
          {(['24h', '7d', '30d', 'all'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg transition-all font-bold uppercase ${
                timeframe === tf
                  ? 'bg-purple-900/80 text-pink-300 border border-purple-600'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart View Switcher */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
          <button
            onClick={() => setChartMode('timeline')}
            className={`px-3 py-1 rounded-lg transition-all font-bold flex items-center gap-1.5 ${
              chartMode === 'timeline'
                ? 'bg-pink-900/80 text-white border border-pink-600'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp size={12} /> Resonance Timeline
          </button>

          <button
            onClick={() => setChartMode('composed')}
            className={`px-3 py-1 rounded-lg transition-all font-bold flex items-center gap-1.5 ${
              chartMode === 'composed'
                ? 'bg-pink-900/80 text-white border border-pink-600'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders size={12} /> Multiaxis Breakdown
          </button>

          <button
            onClick={() => setChartMode('distribution')}
            className={`px-3 py-1 rounded-lg transition-all font-bold flex items-center gap-1.5 ${
              chartMode === 'distribution'
                ? 'bg-pink-900/80 text-white border border-pink-600'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart2 size={12} /> Mood Frequencies
          </button>
        </div>
      </div>

      {/* MAIN RECHARTS VISUALIZATION CANVAS */}
      <div className="p-4 bg-zinc-950/90 border border-zinc-800/80 rounded-2xl space-y-2 relative shadow-inner">
        <div className="flex items-center justify-between text-xs border-b border-zinc-800/60 pb-2">
          <span className="font-mono font-bold text-pink-300 flex items-center gap-1.5">
            <Zap size={14} className="text-pink-400" />
            {chartMode === 'timeline' && 'Historical Voice Resonance & Emotional State Evolution'}
            {chartMode === 'composed' && 'Voice Resonance Multiaxis Metric Correlation'}
            {chartMode === 'distribution' && 'Emotional Mood Frequency Distribution'}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {chartData.length} data points mapped
          </span>
        </div>

        {chartData.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-zinc-500 text-xs">
            <Clock size={28} className="mx-auto text-zinc-600" />
            <p>No voice resonance logs recorded for selected timeframe.</p>
          </div>
        ) : (
          <div className="w-full h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'timeline' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="warmthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="cadenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="timeLabel" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip content={<CustomRechartsTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="harmonicWarmth"
                    name="Harmonic Warmth (%)"
                    stroke="#ec4899"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#warmthGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="cadenceStability"
                    name="Cadence Stability (%)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#cadenceGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="timbreDepth"
                    name="Timbre Depth (%)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#f59e0b' }}
                  />
                </AreaChart>
              ) : chartMode === 'composed' ? (
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="timeLabel" stroke="#71717a" fontSize={10} />
                  <YAxis yAxisId="left" stroke="#ec4899" fontSize={10} domain={[0, 100]} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#a855f7"
                    fontSize={10}
                    domain={[80, 240]}
                  />
                  <Tooltip content={<CustomRechartsTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    yAxisId="left"
                    dataKey="harmonicWarmth"
                    name="Harmonic Warmth (%)"
                    fill="#ec4899"
                    opacity={0.6}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="pitchResonance"
                    name="Pitch Resonance (Hz)"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#a855f7' }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="timbreDepth"
                    name="Timbre Depth (%)"
                    stroke="#38bdf8"
                    strokeWidth={2}
                  />
                </ComposedChart>
              ) : (
                <BarChart data={emotionDistributionData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="emotion" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#a855f7',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="count" name="Log Count" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* EMOTIONAL MEMORY STORE FEED & AGENT RECALL PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
        {/* Left 2 Cols: Emotional Memory Store Feed */}
        <div className="lg:col-span-2 p-5 bg-zinc-950/90 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-pink-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Emotional Memory Store Feed
              </h3>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <select
                value={selectedEmotionFilter}
                onChange={(e) => setSelectedEmotionFilter(e.target.value)}
                className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
              >
                <option value="all">All Moods</option>
                <option value="fröhlich">Fröhlich</option>
                <option value="verspielt">Verspielt</option>
                <option value="ernst">Ernst</option>
                <option value="neugierig">Neugierig</option>
                <option value="stolz">Stolz</option>
                <option value="nachdenklich">Nachdenklich</option>
              </select>
            </div>
          </div>

          {/* Memory List */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {displayMemoriesList.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs italic">
                No matching emotional memories found.
              </div>
            ) : (
              displayMemoriesList.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 bg-zinc-900/70 border border-zinc-800 hover:border-pink-500/40 rounded-xl space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase ${getEmotionBadgeColor(
                          m.emotionalState
                        )}`}
                      >
                        {m.emotionalState}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                        <Clock size={10} /> {m.formattedTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleVerify(m.id, m.userVerified)}
                        className={`px-2 py-0.5 text-[9px] font-bold rounded-full border flex items-center gap-1 transition-all ${
                          m.userVerified
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                        }`}
                        title="User confirmed mood classification"
                      >
                        <CheckCircle2 size={10} />
                        {m.userVerified ? 'Verified Tag' : 'Confirm Tag'}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(m)}
                        className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                        title="Edit Memory"
                      >
                        <Sliders size={12} />
                      </button>

                      <button
                        onClick={() => handleDeleteEntry(m.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/50"
                        title="Delete Memory"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-200 italic font-sans leading-relaxed">
                    "{m.conversationSnippet}"
                  </p>

                  {m.userNotes && (
                    <p className="text-[11px] text-zinc-400 font-mono">
                      <span className="text-pink-400 font-bold">User Note:</span> {m.userNotes}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-mono text-zinc-400 border-t border-zinc-800/60">
                    <span>
                      Warmth: <strong className="text-pink-400">{m.resonanceMetrics.harmonicWarmth}%</strong>
                    </span>
                    <span>
                      Pitch: <strong className="text-purple-400">{m.resonanceMetrics.pitchResonance}Hz</strong>
                    </span>
                    <span>
                      Cadence: <strong className="text-emerald-400">{m.resonanceMetrics.cadenceStability}%</strong>
                    </span>
                    {m.agentReferencedCount > 0 && (
                      <span className="text-amber-400 font-bold flex items-center gap-1 ml-auto">
                        <Bot size={10} /> Agent Recalled {m.agentReferencedCount}x
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Agent Mood Pattern Recall Simulator */}
        <div className="p-5 bg-gradient-to-b from-purple-950/40 via-zinc-950 to-zinc-950 border border-purple-500/30 rounded-2xl space-y-4 font-mono text-xs shadow-xl">
          <div className="flex items-center gap-2 border-b border-purple-900/40 pb-3">
            <Bot size={20} className="text-purple-400" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Agent Mood Recall Integration
              </h3>
              <span className="text-[10px] text-zinc-400 font-sans block">
                References past mood patterns during future voice sessions
              </span>
            </div>
          </div>

          <div className="space-y-2 text-[11px] text-zinc-300">
            <p className="font-sans leading-relaxed">
              When enabled, N+1 continuously retrieves correlated emotional memories to tailor her
              conversational warmth, speech tone, and memory continuity.
            </p>

            <button
              onClick={handleSimulateAgentRecall}
              disabled={isSimulatingAgent}
              className="w-full py-2 bg-purple-900/80 hover:bg-purple-800 text-white font-bold rounded-xl border border-purple-600 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isSimulatingAgent ? (
                <>
                  <Sparkles size={14} className="animate-spin text-pink-300" />
                  Simulating Agent Recall...
                </>
              ) : (
                <>
                  <Volume2 size={14} className="text-pink-300" />
                  Simulate Agent Mood Recall
                </>
              )}
            </button>
          </div>

          {/* Prompt Preview Snippet */}
          {agentPromptPreview && (
            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-[9px] text-zinc-500 uppercase font-bold block">
                System Prompt Memory Injection
              </span>
              <pre className="text-[10px] text-pink-300 whitespace-pre-wrap font-mono line-clamp-4">
                {agentPromptPreview}
              </pre>
            </div>
          )}

          {/* Simulated Spoken Output */}
          {simulatedAgentOutput && (
            <div className="p-3 bg-pink-950/40 border border-pink-700/60 rounded-xl space-y-1.5 animate-fadeIn">
              <span className="text-[9px] text-pink-400 font-bold uppercase flex items-center gap-1">
                <Sparkles size={10} /> Agent Verbal Response:
              </span>
              <p className="text-xs text-white font-sans italic leading-relaxed">
                "{simulatedAgentOutput}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT EMOTIONAL MEMORY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-purple-500/50 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl relative font-sans text-white animate-scaleUp">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag size={16} className="text-pink-400" />
                {editingEntryId ? 'Edit Emotional Memory Entry' : 'Tag New Emotional Memory State'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveMemoryEntry} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">User Identified Mood State</label>
                <select
                  value={formEmotion}
                  onChange={(e) => setFormEmotion(e.target.value)}
                  className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono focus:border-pink-500 focus:outline-none"
                >
                  <option value="fröhlich">Fröhlich (Joyful)</option>
                  <option value="verspielt">Verspielt (Playful)</option>
                  <option value="ernst">Ernst (Serious / Focused)</option>
                  <option value="neugierig">Neugierig (Curious)</option>
                  <option value="stolz">Stolz (Proud)</option>
                  <option value="nachdenklich">Nachdenklich (Thoughtful)</option>
                  <option value="ruhig">Ruhig (Calm)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">
                  Conversation Context / Snippet
                </label>
                <textarea
                  required
                  rows={2}
                  value={formSnippet}
                  onChange={(e) => setFormSnippet(e.target.value)}
                  placeholder="e.g., Discussed quantum memory retention with Papa..."
                  className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">
                  Trigger / Origin Context (Optional)
                </label>
                <input
                  type="text"
                  value={formTrigger}
                  onChange={(e) => setFormTrigger(e.target.value)}
                  placeholder="e.g., System architecture discussion"
                  className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">User Custom Tags / Notes</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g., Papa confirmed high empathy alignment"
                  className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Sliders for Voice Resonance Metrics */}
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2">
                <span className="text-[10px] text-pink-300 font-mono font-bold uppercase block">
                  Voice Resonance Parameters
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-[10px] flex justify-between">
                      <span>Harmonic Warmth</span>
                      <span className="text-pink-400 font-bold">{formWarmth}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formWarmth}
                      onChange={(e) => setFormWarmth(parseInt(e.target.value))}
                      className="w-full accent-pink-500 bg-zinc-800 rounded-lg h-1.5"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[10px] flex justify-between">
                      <span>Pitch Resonance</span>
                      <span className="text-purple-400 font-bold">{formPitch} Hz</span>
                    </label>
                    <input
                      type="range"
                      min="80"
                      max="240"
                      value={formPitch}
                      onChange={(e) => setFormPitch(parseInt(e.target.value))}
                      className="w-full accent-purple-500 bg-zinc-800 rounded-lg h-1.5"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[10px] flex justify-between">
                      <span>Timbre Depth</span>
                      <span className="text-amber-400 font-bold">{formTimbre}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formTimbre}
                      onChange={(e) => setFormTimbre(parseInt(e.target.value))}
                      className="w-full accent-amber-500 bg-zinc-800 rounded-lg h-1.5"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[10px] flex justify-between">
                      <span>Cadence Stability</span>
                      <span className="text-emerald-400 font-bold">{formCadence}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formCadence}
                      onChange={(e) => setFormCadence(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 bg-zinc-800 rounded-lg h-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Save Emotional Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionalProfileVisualization;
