import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface TTIMetric {
  id: string;
  duration: number;
  timestamp: number;
}

export const TTITracker: React.FC = () => {
  const [metrics, setMetrics] = useState<TTIMetric[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMetrics = () => {
    setIsLoading(true);
    try {
      const dataStr = localStorage.getItem('tti_metrics') || '[]';
      const data = JSON.parse(dataStr);
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  useEffect(() => {
    loadMetrics();
    // Poll every 5 seconds to keep dashboard updated
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Process data for charts
  const processChartData = () => {
    if (!metrics.length) return { recent: [], averages: [] };
    
    const recent = metrics.slice(-50).map((m, i) => ({
      name: i, // Use index for x-axis to space them out evenly
      time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      tab: m.id,
      duration: Math.round(m.duration)
    }));
    
    const averagesMap: Record<string, { total: number, count: number }> = {};
    metrics.forEach(m => {
      if (!averagesMap[m.id]) averagesMap[m.id] = { total: 0, count: 0 };
      averagesMap[m.id].total += m.duration;
      averagesMap[m.id].count += 1;
    });
    
    const averages = Object.entries(averagesMap).map(([id, data]) => ({
      tab: id,
      avgDuration: Math.round(data.total / data.count)
    })).sort((a, b) => b.avgDuration - a.avgDuration);
    
    return { recent, averages };
  };

  const chartData = processChartData();

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950/50 border border-indigo-800 text-indigo-400 rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Time-to-Interactive (TTI) Telemetry</h2>
            <p className="text-xs text-zinc-500">Mounting duration metrics across workspaces.</p>
          </div>
        </div>
        <button 
          onClick={loadMetrics}
          disabled={isLoading}
          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-2"
        >
          {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-auto min-h-[250px] w-full">
        {chartData.recent.length > 0 ? (
          <>
          <div className="bg-black/20 rounded-2xl p-4 border border-zinc-800/60 h-[250px] w-full">
            <h3 className="text-[10px] font-bold font-mono text-zinc-500 mb-2 uppercase">Recent Mount History</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={chartData.recent} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#52525b" 
                  fontSize={10} 
                  tick={{ fill: '#52525b' }} 
                  tickMargin={10} 
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={10} 
                  tickFormatter={(val) => `${val}ms`}
                  width={60}
                />
                <Tooltip 
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-xl text-xs font-mono">
                          <p className="text-zinc-500 mb-2">{label}</p>
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                              <span className="text-zinc-300 font-bold capitalize">{entry.payload.tab}</span>
                              <span className="text-indigo-400">{entry.value}ms</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="duration" 
                  stroke="#818cf8" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#6366f1' }}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-black/20 rounded-2xl p-4 border border-zinc-800/60 h-[250px] w-full">
            <h3 className="text-[10px] font-bold font-mono text-zinc-500 mb-2 uppercase">Average Mount Duration by Component</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartData.averages} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="tab" 
                  stroke="#52525b" 
                  fontSize={10} 
                  tick={{ fill: '#52525b' }} 
                  tickMargin={10} 
                  interval={0}
                  tickFormatter={(val) => val.length > 10 ? val.substring(0, 8) + '..' : val}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={10} 
                  tickFormatter={(val) => `${val}ms`}
                  width={60}
                />
                <Tooltip 
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-xl text-xs font-mono flex flex-col gap-1">
                          <span className="text-zinc-300 font-bold capitalize">{label}</span>
                          <span className="text-amber-400">Avg: {payload[0].value}ms</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="avgDuration" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </>
        ) : (
          <div className="lg:col-span-2 w-full h-[250px] bg-black/20 rounded-2xl border border-zinc-800/60 flex flex-col items-center justify-center text-zinc-600 font-mono text-[10px] space-y-2">
            <Activity size={24} className="text-zinc-800 mb-1" />
            <span>Awaiting telemetry data...</span>
            <span>(Navigate between workspaces to capture mount durations)</span>
          </div>
        )}
      </div>
    </div>
  );
};
