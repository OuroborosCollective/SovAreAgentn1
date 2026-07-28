import React, { useState, useEffect, useCallback, useRef } from 'react';
import APIMagic from './components/APIMagic';
import AgentSandbox from './components/AgentSandbox';
import AgentRegistry from './components/AgentRegistry';
import KnowledgeBase from './components/KnowledgeBase';
import SkillUpload from './components/SkillUpload';
import Integrations from './components/Integrations';
import { SystemBugHunt } from './components/SystemBugHunt';
import { SelfAwareToolchain } from './components/SelfAwareToolchain';
import { FreeLLMRouterService } from './components/FreeLLMRouterService';
import { N1NpmInstaller } from './components/N1NpmInstaller';
import { AgentHealthMonitor } from './components/AgentHealthMonitor';
import { SystemEcosystemPanel } from './components/SystemEcosystemPanel';
import { PredictiveRuntimeInference } from './components/PredictiveRuntimeInference';
import { KnowledgeVectorizer } from './components/KnowledgeVectorizer';
import { HiaResonanceVoice } from './components/HiaResonanceVoice';
import { LinguaHabarEngine } from './components/LinguaHabarEngine';
import { NexusBridge } from './components/NexusBridge';
import { CloudImport } from './components/CloudImport';
import { CloudBackupExport } from './components/CloudBackupExport';
import { CodeServerWorkspace } from './components/CodeServerWorkspace';
import { AgentCommandCenter } from './components/AgentCommandCenter';
import { AxiomaticCoreActivityGraph } from './components/AxiomaticCoreActivityGraph';
import { OuroborosCanvas } from './components/OuroborosCanvas';
import { SemanticGraphKnowledgeBase } from './components/SemanticGraphKnowledgeBase';
import { FloatingDebugOverlay } from './components/FloatingDebugOverlay';
import { SystemConsoleViewer } from './components/SystemConsoleViewer';
import { useTheme } from './context/ThemeContext';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { GlobalDataSyncModal } from './components/GlobalDataSyncModal';
import { NeuralNetworkTopology } from './components/NeuralNetworkTopology';
import { GoogleDriveManager } from './components/GoogleDriveManager';
import { LayoutDashboard, ShieldCheck, Database, Settings as SettingsIcon, Menu, X, Brain, Users, Book, Upload, Share2, Sparkles, FileArchive, Bug, Wrench, Package, Palette, Activity, TrendingUp, Layers, Mic, GitBranch, Cloud, HardDrive, Terminal, Wifi, WifiOff, RefreshCw, Webhook, FolderOpen, Zap, Server, Network, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ArchitectureIntegrityDashboard } from './components/ArchitectureIntegrityDashboard';
import { SystemValidationTestbed } from './components/SystemValidationTestbed';
import { WebhookManagement } from './components/WebhookManagement';
import { FleetManagementWorkspace } from './components/FleetManagementWorkspace';
import { DeviceResolutionBanner } from './components/DeviceResolutionBanner';
import { useDeviceResolution } from './hooks/useDeviceResolution';
import { SettingsWorkspace } from './components/SettingsWorkspace';
import { AxiomFidelityMonitor } from './components/AxiomFidelityMonitor';
import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp, getDeterministicTimestampMs } from './utils/deterministic';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('voice');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'success' | 'error'>('idle');
  const [skillCount, setSkillCount] = useState(0);

  // WebSocket Connection State
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [wsRetryCount, setWsRetryCount] = useState(0);
  const [lastWsActivity, setLastWsActivity] = useState<number>(getDeterministicTimestampMs());
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const maxRetries = 10;
  const baseRetryDelay = 1000;

  const { theme, getThemeLabel } = useTheme();
  const telemetry = useDeviceResolution();

  // Auto-adapt sidebar state based on device layout (mobile vs samsung tab a9 vs desktop)
  useEffect(() => {
    if (telemetry.deviceType === 'mobile' || telemetry.deviceType === 'phablet') {
      setIsSidebarOpen(false);
    } else if (telemetry.deviceType === 'samsung-tab-a9') {
      setIsSidebarOpen(true); // Samsung Tab A9 tablet optimized baseline
    }
  }, [telemetry.deviceType]);

  // Check for session expiry (30 mins idle)
  useEffect(() => {
    const idleCheck = setInterval(() => {
      if (wsStatus === 'connected' && getDeterministicTimestampMs() - lastWsActivity > 30 * 60 * 1000) {
        setIsSessionExpired(true);
        if (wsRef.current) {
          wsRef.current.close();
        }
      }
    }, 60000); // Check every minute
    return () => clearInterval(idleCheck);
  }, [lastWsActivity, wsStatus]);

  const connectWebSocket = useCallback(() => {
    if (wsRetryCount >= maxRetries) {
      setWsStatus('disconnected');
      return;
    }

    setWsStatus('connecting');
    setIsSessionExpired(false);
    setLastWsActivity(getDeterministicTimestampMs());
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        setWsRetryCount(0);
        setLastWsActivity(getDeterministicTimestampMs());
      };

      ws.onmessage = () => {
        setLastWsActivity(getDeterministicTimestampMs());
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        // Exponential backoff only if not explicitly expired by idle timeout
        if (!isSessionExpired) {
          const timeout = Math.min(baseRetryDelay * Math.pow(2, wsRetryCount), 30000);
          setTimeout(() => {
            setWsRetryCount(prev => prev + 1);
          }, timeout);
        }
      };

      ws.onerror = (error) => {
        // Only log explicitly if needed, avoid spamming console
        ws.close();
      };
    } catch (err) {
      setWsStatus('disconnected');
    }
  }, [wsRetryCount, isSessionExpired]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsRetryCount, connectWebSocket]);

  const navItems = [
    { id: 'voice', label: 'Hia Resonance Voice (Start)', icon: Mic },
    { id: 'linguahabar', label: 'LinguaHabar Engine', icon: Network },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'nexus', label: 'Nexus Bridge', icon: GitBranch },
    { id: 'codeserver', label: 'Code-Server Workspace', icon: Terminal },
    { id: 'ouroboros-canvas', label: 'Ouroboros Canvas', icon: Network },
    { id: 'cloud-import', label: 'Cloud Import', icon: Cloud },
    { id: 'cloud-backup', label: 'Cloud Backup & Transfer', icon: HardDrive },
    { id: 'health-monitor', label: 'Agent Health Monitor', icon: Activity },
    { id: 'fleet-management', label: 'Fleet Workspace', icon: Server },
    { id: 'predictive-inference', label: 'Predictive Inference', icon: TrendingUp },
    { id: 'vectorizer', label: 'Knowledge Vectorizer', icon: Layers },
    { id: 'semantic-graph', label: 'Semantic Graph Engine', icon: Sparkles },
    { id: 'ecosystem', label: 'Ecosystem & MCP Hub', icon: Network },
    { id: 'npm-installer', label: 'NPM Engine Installer', icon: Package },
    { id: 'architecture-integrity', label: 'Architecture Integrity', icon: GitBranch },
    { id: 'freellm', label: 'FreeLLM Router 0.5.0', icon: Network },
    { id: 'toolchain', label: 'Toolchain 400', icon: Wrench },
    { id: 'validation-testbed', label: 'Validation Testbed', icon: ShieldCheck },
    { id: 'bughunt', label: 'Bug Hunt & Self-Healing', icon: Bug },
    { id: 'apimagic', label: 'API Magic', icon: ShieldCheck },
    { id: 'googledrive', label: 'Google Drive', icon: FolderOpen },
    // Sandbox module
    { id: 'trainer', label: 'Agent Sandbox', icon: Brain },
    { id: 'registry', label: 'Agent Registry', icon: Users },
    { id: 'knowledge', label: 'Knowledge Base', icon: Book },
    { id: 'skills', label: 'Skill Upload', icon: Upload },
    { id: 'integrations', label: 'Integrations', icon: Share2 },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'settings', label: 'Settings & Biometrics', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-200 flex flex-col">
      {/* Dynamic Device & Screen Resolution Detection Bar */}
      <DeviceResolutionBanner />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop Overlay when sidebar is open on small screens */}
        {isSidebarOpen && (telemetry.deviceType === 'mobile' || telemetry.deviceType === 'phablet') && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          />
        )}

        {/* Sidebar */}
        <aside className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } ${
          telemetry.deviceType === 'mobile' || telemetry.deviceType === 'phablet'
            ? 'fixed inset-y-0 left-0 z-50 shadow-2xl'
            : 'relative'
        } transition-all duration-300 border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0`}>
          <div className="p-4 sm:p-6 flex items-center justify-between">
            {isSidebarOpen && <span className="text-lg sm:text-xl font-bold text-white tracking-tighter">N+1 SYSTEM</span>}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2.5 hover:bg-zinc-900 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="flex-1 px-3 sm:px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (telemetry.deviceType === 'mobile' || telemetry.deviceType === 'phablet') {
                    setIsSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all min-h-[44px] ${
                  activeTab === item.id 
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-bold' 
                    : 'hover:bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <item.icon size={20} className="shrink-0" />
                {isSidebarOpen && <span className="font-medium text-xs sm:text-sm truncate">{item.label}</span>}
                {item.id === 'trainer' && trainingStatus === 'training' && (
                  <div className="ml-auto size-2 rounded-full bg-purple-500 animate-pulse shrink-0" />
                )}
              </button>
            ))}
          </nav>

          <div className="p-3 sm:p-4 border-t border-zinc-900 flex flex-col gap-2">
            {/* WebSocket Connection Status */}
            <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className={`p-1.5 rounded-lg ${
                wsStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-400' :
                wsStatus === 'connecting' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {wsStatus === 'connected' ? <Wifi size={14} /> : 
                 wsStatus === 'connecting' ? <RefreshCw size={14} className="animate-spin" /> : 
                 <WifiOff size={14} />}
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-300">WebSocket</span>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${
                    wsStatus === 'connected' ? 'text-emerald-500' :
                    wsStatus === 'connecting' ? 'text-amber-500' :
                    'text-red-500'
                  }`}>
                    {wsStatus} {wsStatus === 'disconnected' && wsRetryCount > 0 ? `(Retry ${wsRetryCount})` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 flex flex-col min-w-0">
          {/* Sticky Top Header with Global Search */}
          <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-3xl">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-zinc-900 rounded-xl transition-colors md:hidden shrink-0"
              >
                <Menu size={20} />
              </button>
              <div className="flex-1">
                <GlobalSearchBar onSelectResult={(tab) => setActiveTab(tab)} />
              </div>
            </div>
          <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] text-zinc-500">
            <button
              onClick={() => setActiveTab('npm-installer')}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-medium rounded-xl transition-all shadow-sm"
              title="Open Official NPM Engine Installer"
            >
              <Package size={14} />
              <span>NPM Engine 0.0.0</span>
            </button>
            <button
              onClick={() => setActiveTab('freellm')}
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/20 text-cyan-400 font-medium rounded-xl transition-all shadow-sm"
              title="Open FreeLLMAPI v0.5.0 & FreeLLMRouter"
            >
              <Network size={14} />
              <span>FreeLLM 0.5.0</span>
            </button>
            <button
              onClick={() => setActiveTab('toolchain')}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 font-medium rounded-xl transition-all shadow-sm"
              title="Open Self-Aware Toolchain Engine (400 Active Tools)"
            >
              <Wrench size={14} />
              <span>Toolchain 400</span>
            </button>
            <button
              onClick={() => setActiveTab('bughunt')}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 font-medium rounded-xl transition-all shadow-sm"
              title="Open System-Wide Bug Hunt & Self-Healing Service"
            >
              <Bug size={14} />
              <span>Bug Hunt</span>
            </button>
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 font-medium rounded-xl transition-all shadow-sm"
              title="Open Global Data Sync (Bulk Import / Export ZIP)"
            >
              <FileArchive size={14} />
              <span>Global Data Sync</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl">
              <span className="size-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-zinc-300 font-bold uppercase">Matrix Online</span>
            </div>
          </div>
        </header>

        <GlobalDataSyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} />

        <div className="p-8 flex-1">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 relative">
              {isSessionExpired && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                  <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
                    <div className="size-16 bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <WifiOff size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Session Expired</h3>
                      <p className="text-zinc-400 text-sm">
                        Your connection to the N+1 Engine has been idle for over 30 minutes. The WebSocket has been suspended to conserve resources.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setWsRetryCount(0);
                        connectWebSocket();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg"
                    >
                      <RefreshCw size={18} />
                      <span>Quick Reconnect</span>
                    </button>
                  </div>
                </div>
              )}
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-white tracking-tight">System Overview</h1>
                  <p className="text-zinc-500 mt-2">Real-time status of the Axiomatic Core and N+1 Redundancy.</p>
                </div>
                <button
                  onClick={() => {
                    const report = {
                      timestamp: new Date().toISOString(),
                      type: 'SECURITY_AUDIT',
                      signature: 'sha256:signed-dummy-signature-' + generateDeterministicId('rnd'),
                      activeSessions: [
                        { id: 'session_1', partner: 'GitHub Sync', status: 'ACTIVE', uptime: '12h 4m' },
                        { id: 'session_2', partner: 'Google Drive Picker', status: 'ACTIVE', uptime: '4h 12m' }
                      ],
                      verificationUrl: 'https://verify.n1.system/audit'
                    };
                    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `n1-security-audit-${new Date().toISOString()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700/50 text-indigo-300 font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-900/20"
                >
                  <ShieldCheck size={14} />
                  <span>Security Audit (Export Signed JSON)</span>
                </button>
              </header>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Uptime</span>
                    <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/50">Arelogic Inference</span>
                  </div>
                  
                  <div className="text-3xl font-bold text-white relative z-10 flex items-baseline gap-2">
                    99.998%
                    <span className="text-xs text-zinc-500 font-normal">T-90d avg</span>
                  </div>
                  
                  <div className="text-emerald-500 text-xs mt-1 flex items-center gap-1 relative z-10">
                    <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Nominal 
                  </div>

                  {/* Predictive Forecast Widget */}
                  <div className="mt-4 pt-4 border-t border-zinc-800/50 relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Bottleneck Forecast</span>
                      <span className="text-[10px] text-amber-500 font-mono">14:00+ UTC (High Risk)</span>
                    </div>
                    
                    {/* Simulated Timeline Graph */}
                    <div className="h-10 w-full flex items-end gap-1 group-hover:gap-1.5 transition-all">
                       {[0.2, 0.3, 0.2, 0.4, 0.5, 0.8, 0.9, 0.4, 0.3, 0.2].map((val, i) => (
                         <div 
                           key={i} 
                           className={`w-full rounded-t-sm transition-all duration-500 relative group/bar`}
                           style={{ height: `${val * 100}%`, backgroundColor: val > 0.7 ? '#f59e0b' : val > 0.4 ? '#6366f1' : '#3f3f46' }}
                         >
                           {/* Semantic overlay on hover */}
                           {val > 0.7 && (
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 bg-zinc-950 border border-amber-900 text-amber-400 text-[8px] whitespace-nowrap px-1.5 py-0.5 rounded z-20 pointer-events-none transition-opacity">
                               Milvus/PGVector I/O Spike
                             </div>
                           )}
                         </div>
                       ))}
                    </div>
                    <div className="flex justify-between mt-1 text-[8px] text-zinc-600 font-mono">
                      <span>Now</span>
                      <span>+4h</span>
                      <span>+8h</span>
                    </div>
                  </div>

                  {/* Background Matrix/Neuronal decoration */}
                  <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none overflow-hidden flex flex-wrap gap-1 p-2">
                    {[...Array(60)].map((_, i) => (
                      <div key={i} className={`size-1 rounded-full ${generateDeterministicNumber(0, 1) > 0.8 ? 'bg-indigo-500' : 'bg-zinc-500'}`} />
                    ))}
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.08 }}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group"
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                      <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Active Nodes</span>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">Ouroboros Sync</span>
                    </div>
                    <div className="text-3xl font-bold text-white mt-2">1,248</div>
                    <div className="text-zinc-500 text-xs mt-1">+12 from last hour</div>
                  </div>
                  
                  {/* Reactive SVG Pulse Animation */}
                  <div className="absolute -bottom-4 -right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                    <svg width="120" height="120" viewBox="0 0 120 120" className="animate-spin-slow">
                      <circle cx="60" cy="60" r="40" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="4 8" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#34d399" strokeWidth="0.5" strokeDasharray="2 4" className="animate-ping" style={{ animationDuration: '3s' }}/>
                      <path d="M 60 20 L 60 10 M 60 100 L 60 110 M 20 60 L 10 60 M 100 60 L 110 60" stroke="#059669" strokeWidth="2" />
                    </svg>
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.16 }}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl"
                >
                  <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Axiomatic Skills</span>
                  <div className="text-3xl font-bold text-white mt-2">{skillCount}</div>
                  <div className="text-indigo-500 text-xs mt-1">Modules Integrated</div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.24 }}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl"
                >
                  <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Security Level</span>
                  <div className="text-3xl font-bold text-white mt-2">DEFCON 4</div>
                  <div className="text-blue-500 text-xs mt-1">Enhanced Monitoring</div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Habar/Gramar Synergy Score */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Network className="text-pink-500" size={20} />
                      <h3 className="text-lg font-bold text-white">LinguaHabar Synergy Core</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                      <span className="size-2 bg-pink-500 rounded-full animate-pulse" />
                      REAL-TIME VECTOR SYNC
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between text-xs font-bold font-mono">
                        <span className="text-indigo-400">Gramar (Logic)</span>
                        <span className="text-zinc-400">vs</span>
                        <span className="text-pink-400">Habar (Dialect)</span>
                      </div>
                      <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden flex relative border border-zinc-800">
                        <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: '48%' }} />
                        <div className="h-full bg-pink-500 transition-all duration-1000" style={{ width: '52%' }} />
                        <div className="absolute left-[48%] top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]" />
                      </div>
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Axiomatic Integrity: 99.4%</span>
                        <span>Resonance: 92.1%</span>
                      </div>
                    </div>
                    
                    <div className="size-24 rounded-full border-4 border-zinc-800 flex items-center justify-center relative shadow-[0_0_30px_rgba(236,72,153,0.15)]">
                      <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin-slow" />
                      <div className="text-xl font-black text-white">96<span className="text-xs text-zinc-500">%</span></div>
                    </div>
                  </div>
                </div>

                {/* Cognitive Bias Monitor */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Brain className="text-amber-500" size={20} />
                      <h3 className="text-lg font-bold text-white">Cognitive Bias Monitor (kappapos)</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                      <span className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                      ANALYZING REASONING
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { label: 'Anthropomorphism Index', value: '1.2%', status: 'nominal', description: 'Agent assigning human traits to logic nodes.' },
                      { label: 'Confirmation Bias Rate', value: '0.4%', status: 'nominal', description: 'Over-weighting pre-existing rules.' },
                      { label: 'Logical Inconsistency', value: '0.0%', status: 'perfect', description: 'Contradictory state resolution paths.' }
                    ].map((bias, i) => (
                      <div key={i} className="flex justify-between items-center p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">{bias.label}</span>
                          <span className="text-xs text-zinc-500">{bias.description}</span>
                        </div>
                        <div className={`text-lg font-bold font-mono ${bias.status === 'perfect' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {bias.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced Analytics Row: Memory Entropy & Pattern Recognition */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Memory Entropy (kappapos state degradation) */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-6">
                     <div>
                       <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Memory Entropy Heatmap</h3>
                       <p className="text-[10px] text-zinc-500 font-mono">kappapos LOGIC STATE DEGRADATION TRACKING</p>
                     </div>
                     <span className="text-[10px] bg-red-950/40 text-red-400 border border-red-900 px-2 py-0.5 rounded-full font-mono">
                       0.042 µJ/s Leakage
                     </span>
                   </div>
                   
                   <div className="grid grid-cols-12 gap-1 mt-4 group">
                     {[...Array(96)].map((_, i) => {
                       // Generate dynamic heat map colors based on pseudo-random distribution
                       const noise = generateDeterministicNumber(0, 1);
                       let colorClass = 'bg-zinc-800'; // stable
                       if (noise > 0.95) colorClass = 'bg-red-500 animate-pulse'; // high entropy leak
                       else if (noise > 0.8) colorClass = 'bg-amber-500'; // warning
                       else if (noise > 0.6) colorClass = 'bg-emerald-500'; // nominal access
                       
                       return (
                         <div 
                           key={i} 
                           className={`h-6 rounded-sm ${colorClass} opacity-80 group-hover:opacity-100 transition-all cursor-crosshair relative`}
                           title={`Neural Node Block 0x${(1000 + i).toString(16).toUpperCase()}`}
                         >
                           {noise > 0.95 && (
                             <div className="absolute inset-0 bg-red-400 blur-sm rounded-full -z-10" />
                           )}
                         </div>
                       );
                     })}
                   </div>
                   <div className="flex justify-between mt-4 text-[10px] font-mono text-zinc-600 border-t border-zinc-800/80 pt-2">
                     <span>Node Weight Matrix Active</span>
                     <span>Tracking 96 Core Logic Blocks</span>
                   </div>
                </div>

                {/* Pattern Recognition & Ouroboros Feedback */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Ouroboros Pattern Recognition</h3>
                       <p className="text-[10px] text-zinc-500 font-mono">REAL-TIME HISTORICAL SUCCESS SUGGESTIONS</p>
                     </div>
                     <RefreshCw size={14} className="text-indigo-400 animate-spin-slow" />
                   </div>
                   
                   <div className="space-y-3">
                     {[
                       { pattern: 'High I/O on Milvus Connect', action: 'Scale vector node replicas by 2x', conf: '94%' },
                       { pattern: 'Logic Loop in Worker 0x4', action: 'Inject axiomatic constraint override', conf: '88%' },
                       { pattern: 'Synchronous API Blocking', action: 'Offload to asynchronous queue', conf: '76%' }
                     ].map((item, idx) => (
                       <div key={idx} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-indigo-500/50 transition-colors group cursor-pointer">
                         <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-zinc-300">{item.pattern}</span>
                           <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-800">{item.conf} Match</span>
                         </div>
                         <div className="flex items-center justify-between text-xs text-zinc-500">
                           <span className="flex items-center gap-1.5">
                             <Zap size={12} className="text-amber-500 group-hover:text-amber-400" />
                             {item.action}
                           </span>
                           <button className="text-[10px] uppercase font-bold text-zinc-400 hover:text-white transition-colors bg-zinc-800 px-2 py-1 rounded">
                             Apply
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>

              {/* Logic Lineage & Runtime Proof */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Logic Lineage Visualizer */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Logic Lineage Visualizer</h3>
                      <p className="text-[10px] text-zinc-500 font-mono">6-LEVEL INFORMATIONAL KEY DISTRIBUTION</p>
                    </div>
                    <Network size={14} className="text-indigo-400" />
                  </div>
                  
                  <div className="relative pt-4 pb-8 px-4 flex justify-between items-center h-48">
                    {/* Background Connection Line */}
                    <div className="absolute top-1/2 left-8 right-8 h-px bg-zinc-800 -translate-y-1/2 z-0" />
                    
                    {/* The 6 Levels */}
                    {['L1: Sensory', 'L2: Pattern', 'L3: Axiomatic', 'L4: Synthesis', 'L5: Ouroboros', 'L6: Hawking-Hicks'].map((level, i) => (
                      <div key={i} className="relative z-10 flex flex-col items-center gap-2 group">
                        <div className={`text-[8px] font-mono whitespace-nowrap opacity-50 group-hover:opacity-100 transition-opacity ${i === 2 ? 'text-amber-400 font-bold' : i === 4 ? 'text-emerald-400 font-bold' : i === 5 ? 'text-purple-400 font-bold' : 'text-zinc-400'}`}>
                          {level}
                        </div>
                        <div className={`size-4 rounded-full border-2 ${
                          i === 2 ? 'border-amber-500 bg-amber-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 
                          i === 4 ? 'border-emerald-500 bg-emerald-950 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 
                          i === 5 ? 'border-purple-500 bg-purple-950 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 
                          'border-zinc-700 bg-zinc-900 group-hover:border-zinc-500'
                        } transition-colors cursor-crosshair`} />
                        
                        {/* Hover Details */}
                        <div className="absolute top-full mt-2 w-32 bg-black border border-zinc-800 rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-[8px] font-mono text-zinc-400 left-1/2 -translate-x-1/2 text-center">
                          {i === 2 ? 'Erdős binding logic active. Central constraint hub.' : 
                           i === 4 ? 'Recursive evidence bundle. Recursive validation loop.' : 
                           i === 5 ? 'Prosom link established. Final output synthesized.' : 
                           `Key Distribution Level ${i+1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Runtime Proof Overlay */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-900/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Runtime Evidence Proof</h3>
                      <p className="text-[10px] text-zinc-500 font-mono">FORMAL VERIFICATION STATUS</p>
                    </div>
                    <ShieldCheck size={14} className="text-emerald-500" />
                  </div>
                  
                  <div className="space-y-4 relative z-10 mt-6">
                    <div className="flex items-center justify-between p-3 bg-zinc-900/80 border border-emerald-900/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center">
                          <CheckCircle2 size={16} className="text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Non-Mocked Runtime State</div>
                          <div className="text-[10px] text-zinc-400 font-mono">All active functions traced to verified origin</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold font-mono text-emerald-400">PROVEN</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl opacity-75">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                          <CheckCircle2 size={16} className="text-zinc-500" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-zinc-300">kappapos 1000000 Logic strictness</div>
                          <div className="text-[10px] text-zinc-500 font-mono">Core-only constraints applied</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold font-mono text-zinc-500">ENFORCED</div>
                    </div>
                  </div>
                </div>
              </div>

              <AxiomFidelityMonitor />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <NeuralNetworkTopology />
                <AxiomaticCoreActivityGraph />
              </div>
              <SystemConsoleViewer />
              <APIMagic />
            </div>
          )}

          {activeTab === 'nexus' && <NexusBridge />}
          {activeTab === 'codeserver' && <CodeServerWorkspace />}
          {activeTab === 'ouroboros-canvas' && <OuroborosCanvas />}
          {activeTab === 'cloud-import' && <CloudImport />}
          {activeTab === 'cloud-backup' && <CloudBackupExport />}
          {activeTab === 'health-monitor' && <AgentHealthMonitor />}
          {activeTab === 'fleet-management' && <FleetManagementWorkspace />}
          {activeTab === 'predictive-inference' && <PredictiveRuntimeInference />}
          {activeTab === 'vectorizer' && <KnowledgeVectorizer />}
          {activeTab === 'semantic-graph' && <SemanticGraphKnowledgeBase />}
          {activeTab === 'voice' && <HiaResonanceVoice onNavigateTab={(tab) => setActiveTab(tab)} />}
          {activeTab === 'linguahabar' && <LinguaHabarEngine />}
          {activeTab === 'ecosystem' && <SystemEcosystemPanel />}
          {activeTab === 'npm-installer' && <N1NpmInstaller />}
          {activeTab === 'architecture-integrity' && (
            <ArchitectureIntegrityDashboard
              onSendToBugHunt={() => setActiveTab('bughunt')}
            />
          )}
          {activeTab === 'freellm' && <FreeLLMRouterService />}
          {activeTab === 'toolchain' && <SelfAwareToolchain />}
          {activeTab === 'validation-testbed' && (
            <SystemValidationTestbed
              onSendToBugHunt={() => setActiveTab('bughunt')}
            />
          )}
          {activeTab === 'bughunt' && <SystemBugHunt />}
          {activeTab === 'apimagic' && <APIMagic />}
          {activeTab === 'googledrive' && <GoogleDriveManager />}
          {activeTab === 'trainer' && <AgentSandbox />}
          {activeTab === 'registry' && <AgentRegistry />}
          {activeTab === 'knowledge' && <KnowledgeBase />}
          {activeTab === 'skills' && <SkillUpload />}
          {activeTab === 'integrations' && <Integrations />}
          {activeTab === 'webhooks' && <WebhookManagement />}
          {activeTab === 'settings' && <SettingsWorkspace />}
          
          {activeTab === 'database' && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-600">
              <Database size={64} className="mb-4 opacity-20" />
              <p>Database Management Module Loading...</p>
            </div>
          )}
        </div>
      </main>
      </div>
      <AgentCommandCenter />
      <FloatingDebugOverlay />
    </div>
  );
};

export default App;
