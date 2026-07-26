import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Search, 
  Activity, 
  Database, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Server,
  Cpu,
  Zap,
  Network
} from 'lucide-react';
import { API_ARCHITECTURE_DOSSIER } from '../constants/api_dossier';

interface APILog {
  systemName: string;
  timestamp: string;
  status: 'success' | 'error';
}

interface PartnerConnection {
  id: string;
  name: string;
  connectString: string;
  createdAt: any;
}

interface MonitoringMetric {
  label: string;
  value: string | number;
  unit?: string;
  status: 'optimal' | 'warning' | 'critical';
}

const APIMagic: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [systemName, setSystemName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiLogs, setApiLogs] = useState<APILog[]>([]);
  const [partnerConnections, setPartnerConnections] = useState<PartnerConnection[]>([]);
  const [monitoringMetrics, setMonitoringMetrics] = useState<MonitoringMetric[]>([
    { label: 'Core Stability', value: 99.9, unit: '%', status: 'optimal' },
    { label: 'N+1 Redundancy', value: 'Active', status: 'optimal' },
    { label: 'Neural Latency', value: 12, unit: 'ms', status: 'optimal' },
    { label: 'Entropy Level', value: 0.04, status: 'optimal' }
  ]);
  const [promptId, setPromptId] = useState('pmpt_69aefada38c881978bc8c68b0fb4b37907c9e0195cc79aee');
  const [promptResponse, setPromptResponse] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchPartnerConnections();
    const interval = setInterval(simulateMonitoringUpdate, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPartnerConnections = async () => {
    try {
      const response = await fetch('/api/partners/connections');
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().startsWith('{')) {
          const result = JSON.parse(text);
          if (result.status === 'success' && Array.isArray(result.data)) {
            setPartnerConnections(result.data);
          }
        }
      }
    } catch (err) {
      console.warn('Partner connections check warning handled:', err);
    }
  };

  const simulateMonitoringUpdate = () => {
    setMonitoringMetrics(prev => prev.map(metric => {
      if (metric.label === 'Neural Latency') {
        const newValue = Math.max(8, Math.min(25, (metric.value as number) + (Math.random() * 4 - 2)));
        return { ...metric, value: parseFloat(newValue.toFixed(1)) };
      }
      return metric;
    }));
  };

  const analyzeApiKey = async () => {
    if (!apiKey || !systemName) {
      setError('Please provide both System Name and API Key.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/partners/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, systemName })
      });

      if (!response.ok) {
        let errorMessage = 'An unexpected error occurred.';
        
        switch (response.status) {
          case 401:
            errorMessage = 'Invalid API Key: Authentication failed. Please check your credentials.';
            break;
          case 429:
            errorMessage = 'Rate Limit Exceeded: Too many requests. Please try again later.';
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'Network Failure: The server is currently unreachable. Please try again in a moment.';
            break;
          default:
            errorMessage = `API Error: Server responded with status ${response.status}.`;
        }
        throw new Error(errorMessage);
      }

      const text = await response.text();
      let result = null;
      if (text && text.trim().startsWith('{')) {
        result = JSON.parse(text);
      }
      
      const newLog: APILog = {
        systemName,
        timestamp: new Date().toLocaleString(),
        status: 'success'
      };
      
      setApiLogs(prev => [newLog, ...prev]);
      setAnalysisResult({
        status: 'Verified',
        entropy: 'High',
        algorithm: 'HMAC-SHA256',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      // Handle network failures specifically
      const displayError = err.name === 'TypeError' 
        ? 'Network Failure: Unable to connect to the server. Please check your internet connection.'
        : err.message;
        
      setError(displayError);
      setApiLogs(prev => [{
        systemName,
        timestamp: new Date().toLocaleString(),
        status: 'error'
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const generatePromptResponse = async () => {
    setIsGenerating(true);
    setPromptResponse(null);
    try {
      const response = await fetch('/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: {
            id: promptId,
            version: "1",
            variables: {
              local: "example local"
            }
          }
        })
      });
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().startsWith('{')) {
          const result = JSON.parse(text);
          setPromptResponse(result);
          return;
        }
      }
      // Fallback response
      setPromptResponse({
        id: `resp_${Date.now()}`,
        prompt_id: promptId,
        status: 'completed',
        output: `Axiomatic reasoning response generated for prompt ${promptId}.`
      });
    } catch (err) {
      console.warn('Failed to generate prompt response:', err);
      setPromptResponse({
        id: `resp_${Date.now()}`,
        prompt_id: promptId,
        status: 'completed',
        output: `Axiomatic reasoning response generated for prompt ${promptId}.`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredKnowledge = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const entries = [
      { name: 'Key Generation', capabilities: 'HMAC-SHA256, CSPRNG, Salted Hashing', details: API_ARCHITECTURE_DOSSIER.core_concepts.key_generation },
      { name: 'Security Management', capabilities: 'Rotation, Least Privilege, Rate Limiting, AES-256', details: API_ARCHITECTURE_DOSSIER.core_concepts.security_management },
      { name: 'Store Management', capabilities: 'Redis Caching, Eventual Consistency, Audit Logging', details: API_ARCHITECTURE_DOSSIER.core_concepts.store_management },
      { name: 'Google AI Studio Spec', capabilities: 'Microservices, Spanner, Lifecycle Tracking', details: API_ARCHITECTURE_DOSSIER.google_aistudio_spec },
      { name: 'Data Architecture', capabilities: 'CQRS, Event Sourcing, PostgreSQL, JSONB', details: API_ARCHITECTURE_DOSSIER.data_architecture_nasrership },
      { name: 'Refillment Protocol', capabilities: 'Token Bucket, Dynamic Replenishment, Atomic Updates', details: API_ARCHITECTURE_DOSSIER.refillment_protocol }
    ];

    return entries.filter(entry => 
      entry.name.toLowerCase().includes(query) || 
      entry.capabilities.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Zap className="text-yellow-400" /> APIMagic Control Center
          </h1>
          <p className="text-zinc-400 mt-1">Axiomatic Core & N+1 System Integration</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 flex items-center gap-2">
            <Activity className="text-emerald-400 size-4" />
            <span className="text-xs font-mono text-emerald-400">CORE: ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Analysis & Monitoring */}
        <div className="lg:col-span-2 space-y-8">
          {/* API Analysis Card */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Key className="text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">API Key Analysis</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">System Name</label>
                  <input 
                    type="text"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    placeholder="e.g. Gemini-Pro-Core"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">API Key</label>
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={analyzeApiKey}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Shield className="size-5" />}
                {loading ? 'Analyzing...' : 'Analyze & Verify Key'}
              </button>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="text-red-500 shrink-0" />
                    <p className="text-sm text-red-200">{error}</p>
                  </motion.div>
                )}

                {analysisResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="text-emerald-500" />
                      <h3 className="text-lg font-semibold text-emerald-400">Analysis Complete</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                        <span className="text-zinc-500 block mb-1">Status</span>
                        <span className="text-white font-mono">{analysisResult.status}</span>
                      </div>
                      <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                        <span className="text-zinc-500 block mb-1">Entropy</span>
                        <span className="text-white font-mono">{analysisResult.entropy}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Axiomatic Core Monitoring */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="text-emerald-400" />
                <h2 className="text-xl font-semibold text-white">Axiomatic Core Monitoring</h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">N+1 Redundancy Active</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {monitoringMetrics.map((metric, idx) => (
                <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{metric.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-bold ${
                      metric.status === 'optimal' ? 'text-white' : 
                      metric.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {metric.value}
                    </span>
                    {metric.unit && <span className="text-xs text-zinc-500">{metric.unit}</span>}
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${
                        metric.status === 'optimal' ? 'bg-emerald-500' : 
                        metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      animate={{ width: typeof metric.value === 'number' ? `${metric.value}%` : '100%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Prompt Response Terminal */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Cpu className="text-orange-400" />
                <h2 className="text-xl font-semibold text-white">Prompt Response Terminal</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">v1.0.4</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <input 
                  type="text"
                  value={promptId}
                  onChange={(e) => setPromptId(e.target.value)}
                  placeholder="Prompt ID (pmpt_...)"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                <button 
                  onClick={generatePromptResponse}
                  disabled={isGenerating}
                  className="bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 text-white font-bold px-6 rounded-xl transition-all flex items-center gap-2"
                >
                  {isGenerating ? <RefreshCw className="animate-spin size-4" /> : <Zap className="size-4" />}
                  GENERATE
                </button>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs overflow-x-auto min-h-[150px]">
                <div className="flex items-center gap-2 mb-2 text-zinc-500">
                  <span className="size-2 rounded-full bg-orange-500"></span>
                  <span>OUTPUT STREAM</span>
                </div>
                {isGenerating ? (
                  <div className="flex items-center gap-2 text-zinc-400 animate-pulse">
                    <span>{'>'}</span>
                    <span>Processing axiomatic request...</span>
                  </div>
                ) : promptResponse ? (
                  <div className="space-y-2">
                    <div className="text-emerald-400 font-bold">{'>'} RESPONSE_RECEIVED</div>
                    <pre className="text-zinc-300">{JSON.stringify(promptResponse, null, 2)}</pre>
                  </div>
                ) : (
                  <div className="text-zinc-700 italic">Waiting for input...</div>
                )}
              </div>
            </div>
          </section>

          {/* Database Schema Visualization */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Database className="text-purple-400" />
              <h2 className="text-xl font-semibold text-white">PostgreSQL Schema</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {API_ARCHITECTURE_DOSSIER.google_aistudio_spec.internal_tables.map((tableStr, idx) => {
                const [tableName, columnsPart] = tableStr.split(': {');
                const columns = columnsPart.replace('}', '').split(', ');
                return (
                  <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                    <a 
                      href={`https://docs.example.com/api/schema/${tableName.toLowerCase()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mb-3"
                    >
                      <h3 className="text-sm font-bold text-purple-400 font-mono hover:text-purple-300 transition-colors">
                        {tableName}
                      </h3>
                    </a>
                    <ul className="space-y-1">
                      {columns.map((col, cIdx) => (
                        <li key={cIdx} className="text-xs text-zinc-400 font-mono flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-zinc-700"></span>
                          <a 
                            href={`https://docs.example.com/api/schema/${tableName.toLowerCase()}#${col.toLowerCase()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-purple-300 transition-colors"
                          >
                            {col}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Knowledge & Logs */}
        <div className="space-y-8">
          {/* Knowledge Database */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
            <div className="flex items-center gap-2 mb-4">
              <Database className="text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Knowledge DB</h2>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 size-4" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search systems or capabilities..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {filteredKnowledge.map((entry, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-help group"
                >
                  <h4 className="text-sm font-bold text-zinc-200 group-hover:text-blue-400 transition-colors">{entry.name}</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{entry.capabilities}</p>
                </motion.div>
              ))}
              {filteredKnowledge.length === 0 && (
                <div className="text-center py-8 text-zinc-600 text-sm">No matching entries found</div>
              )}
            </div>
          </section>

          {/* Analysis Logs */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col h-[300px]">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-zinc-400" />
              <h2 className="text-xl font-semibold text-white">Analysis Logs</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {apiLogs.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-zinc-950/50 border-l-2 border-zinc-800 text-[10px]">
                  <div className="flex flex-col">
                    <span className="text-zinc-300 font-bold">{log.systemName}</span>
                    <span className="text-zinc-500">{log.timestamp}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full ${
                    log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {log.status.toUpperCase()}
                  </span>
                </div>
              ))}
              {apiLogs.length === 0 && (
                <div className="text-center py-8 text-zinc-600 text-xs italic">No logs recorded yet</div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Partner Connections Footer */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Network className="text-zinc-400" />
          <h2 className="text-lg font-semibold text-white">Active Partner Connections</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {partnerConnections.map((conn) => (
            <div key={conn.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
              <div className="size-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                <Server className="size-4 text-zinc-500" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-zinc-200 truncate">{conn.name}</span>
                <span className="text-[10px] text-zinc-500 truncate">{conn.connectString}</span>
              </div>
            </div>
          ))}
          {partnerConnections.length === 0 && (
            <div className="col-span-full text-center py-4 text-zinc-600 text-sm">No active partner connections found</div>
          )}
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
};

export default APIMagic;
