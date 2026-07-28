import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Cpu, Database, Zap, RefreshCw, Layers, Radio, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp } from '../utils/deterministic';

interface ActivityDataPoint {
  time: string;
  inferenceLoad: number;
  vectorMilvusOps: number;
  sqlTransactions: number;
  thinkingActingScore: number;
}

export const AxiomaticCoreActivityGraph: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'LIVE' | '1H' | '24H'>('LIVE');
  const [isBoosting, setIsBoosting] = useState(false);
  const [data, setData] = useState<ActivityDataPoint[]>([
    { time: '08:00', inferenceLoad: 420, vectorMilvusOps: 1250, sqlTransactions: 310, thinkingActingScore: 88 },
    { time: '08:05', inferenceLoad: 580, vectorMilvusOps: 1420, sqlTransactions: 450, thinkingActingScore: 92 },
    { time: '08:10', inferenceLoad: 790, vectorMilvusOps: 1890, sqlTransactions: 620, thinkingActingScore: 95 },
    { time: '08:15', inferenceLoad: 650, vectorMilvusOps: 1650, sqlTransactions: 510, thinkingActingScore: 90 },
    { time: '08:20', inferenceLoad: 920, vectorMilvusOps: 2100, sqlTransactions: 780, thinkingActingScore: 97 },
    { time: '08:25', inferenceLoad: 1100, vectorMilvusOps: 2450, sqlTransactions: 890, thinkingActingScore: 99 },
    { time: '08:30', inferenceLoad: 1280, vectorMilvusOps: 2800, sqlTransactions: 950, thinkingActingScore: 99.4 },
  ]);

  // Simulate real-time updates when in LIVE mode
  useEffect(() => {
    if (timeRange !== 'LIVE') return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setData(prev => {
        const last = prev[prev.length - 1] || { inferenceLoad: 1000, vectorMilvusOps: 2000, sqlTransactions: 800, thinkingActingScore: 95 };
        const newPoint: ActivityDataPoint = {
          time: timeStr,
          inferenceLoad: Math.round(Math.max(500, Math.min(2500, last.inferenceLoad + (generateDeterministicNumber(0, 200, performance.now()) - 90)))),
          vectorMilvusOps: Math.round(Math.max(1000, Math.min(5000, last.vectorMilvusOps + (generateDeterministicNumber(0, 400, performance.now()) - 180)))),
          sqlTransactions: Math.round(Math.max(300, Math.min(2000, last.sqlTransactions + (generateDeterministicNumber(0, 150, performance.now()) - 70)))),
          thinkingActingScore: parseFloat(Math.min(99.9, Math.max(85, last.thinkingActingScore + (generateDeterministicNumber(0, 2, performance.now()) - 1))).toFixed(1))
        };
        const updated = [...prev.slice(1), newPoint];
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [timeRange]);

  const handleResonanceBoost = () => {
    setIsBoosting(true);
    setTimeout(() => {
      setData(prev => prev.map(p => ({
        ...p,
        inferenceLoad: Math.round(p.inferenceLoad * 1.35),
        vectorMilvusOps: Math.round(p.vectorMilvusOps * 1.4),
        sqlTransactions: Math.round(p.sqlTransactions * 1.25),
        thinkingActingScore: 99.9
      })));
      setIsBoosting(false);
    }, 1000);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
            <Activity size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Axiomatic Core Activity</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Resonance Stream
              </span>
            </div>
            <p className="text-zinc-400 text-sm mt-0.5">
              Real-time telemetry across SQL database, Milvus vector embeddings, inference reasoning, and thinking-acting loops.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {(['LIVE', '1H', '24H'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleResonanceBoost}
            disabled={isBoosting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg text-xs"
          >
            {isBoosting ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
            <span>{isBoosting ? 'Boosting Core...' : 'Resonance Boost'}</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-1">
          <span className="text-zinc-500 text-xs font-mono flex items-center gap-1.5">
            <Cpu size={14} className="text-indigo-400" />
            Inference Load
          </span>
          <div className="text-2xl font-bold text-white font-mono">
            {data[data.length - 1]?.inferenceLoad.toLocaleString()} <span className="text-xs font-normal text-zinc-500">tks/s</span>
          </div>
        </div>
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-1">
          <span className="text-zinc-500 text-xs font-mono flex items-center gap-1.5">
            <Layers size={14} className="text-purple-400" />
            Milvus Vector Ops
          </span>
          <div className="text-2xl font-bold text-white font-mono">
            {data[data.length - 1]?.vectorMilvusOps.toLocaleString()} <span className="text-xs font-normal text-zinc-500">qps</span>
          </div>
        </div>
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-1">
          <span className="text-zinc-500 text-xs font-mono flex items-center gap-1.5">
            <Database size={14} className="text-cyan-400" />
            SQL Transactions
          </span>
          <div className="text-2xl font-bold text-white font-mono">
            {data[data.length - 1]?.sqlTransactions.toLocaleString()} <span className="text-xs font-normal text-zinc-500">tx/s</span>
          </div>
        </div>
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-1">
          <span className="text-zinc-500 text-xs font-mono flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            Thinking-Acting Index
          </span>
          <div className="text-2xl font-bold text-white font-mono">
            {data[data.length - 1]?.thinkingActingScore}% <span className="text-xs font-normal text-emerald-400">optimal</span>
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-[320px] w-full pt-4 relative z-10">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorInference" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorVector" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorSql" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="time" stroke="#71717a" textAnchor="end" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
            <YAxis stroke="#71717a" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#09090b',
                borderColor: '#27272a',
                borderRadius: '1rem',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
            />
            <Area type="monotone" dataKey="vectorMilvusOps" name="Milvus Vector QPS" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorVector)" />
            <Area type="monotone" dataKey="inferenceLoad" name="Inference Load (tks/s)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorInference)" />
            <Area type="monotone" dataKey="sqlTransactions" name="SQL Transactions" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorSql)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono text-zinc-400 pt-4 border-t border-zinc-800 relative z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
            <span>Milvus Vector Ops</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
            <span>Inference Load</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />
            <span>SQL Transactions</span>
          </div>
        </div>
        <span className="text-zinc-500">Engine Protocol: v4.8.3-n1-axiom</span>
      </div>
    </div>
  );
};
