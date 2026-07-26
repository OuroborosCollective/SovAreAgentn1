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
import { NexusBridge } from './components/NexusBridge';
import { CloudImport } from './components/CloudImport';
import { CloudBackupExport } from './components/CloudBackupExport';
import { CodeServerWorkspace } from './components/CodeServerWorkspace';
import { AgentCommandCenter } from './components/AgentCommandCenter';
import { AxiomaticCoreActivityGraph } from './components/AxiomaticCoreActivityGraph';
import { OuroborosCanvas } from './components/OuroborosCanvas';
import { SemanticGraphKnowledgeBase } from './components/SemanticGraphKnowledgeBase';
import { FloatingDebugOverlay } from './components/FloatingDebugOverlay';
import { useTheme } from './context/ThemeContext';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { GlobalDataSyncModal } from './components/GlobalDataSyncModal';
import { NeuralNetworkTopology } from './components/NeuralNetworkTopology';
import { GoogleDriveManager } from './components/GoogleDriveManager';
import { LayoutDashboard, ShieldCheck, Database, Settings as SettingsIcon, Menu, X, Brain, Users, Book, Upload, Share2, Sparkles, FileArchive, Bug, Wrench, Network, Package, Palette, Activity, TrendingUp, Layers, Mic, GitBranch, Cloud, HardDrive, Terminal, Wifi, WifiOff, RefreshCw, Webhook, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { WebhookManagement } from './components/WebhookManagement';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('trainer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'success' | 'error'>('idle');
  const [skillCount, setSkillCount] = useState(0);

  // WebSocket Connection State
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [wsRetryCount, setWsRetryCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const maxRetries = 10;
  const baseRetryDelay = 1000;

  const { theme, getThemeLabel } = useTheme();

  const connectWebSocket = useCallback(() => {
    if (wsRetryCount >= maxRetries) {
      setWsStatus('disconnected');
      return;
    }

    setWsStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        setWsRetryCount(0);
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        // Exponential backoff
        const timeout = Math.min(baseRetryDelay * Math.pow(2, wsRetryCount), 30000);
        setTimeout(() => {
          setWsRetryCount(prev => prev + 1);
        }, timeout);
      };

      ws.onerror = (error) => {
        // Only log explicitly if needed, avoid spamming console
        ws.close();
      };
    } catch (err) {
      setWsStatus('disconnected');
    }
  }, [wsRetryCount]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsRetryCount, connectWebSocket]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'nexus', label: 'Nexus Bridge', icon: GitBranch },
    { id: 'codeserver', label: 'Code-Server Workspace', icon: Terminal },
    { id: 'ouroboros-canvas', label: 'Ouroboros Canvas', icon: Network },
    { id: 'cloud-import', label: 'Cloud Import', icon: Cloud },
    { id: 'cloud-backup', label: 'Cloud Backup & Transfer', icon: HardDrive },
    { id: 'health-monitor', label: 'Agent Health Monitor', icon: Activity },
    { id: 'predictive-inference', label: 'Predictive Inference', icon: TrendingUp },
    { id: 'vectorizer', label: 'Knowledge Vectorizer', icon: Layers },
    { id: 'semantic-graph', label: 'Semantic Graph Engine', icon: Sparkles },
    { id: 'voice', label: 'Hia Resonance Voice', icon: Mic },
    { id: 'ecosystem', label: 'Ecosystem & MCP Hub', icon: Network },
    { id: 'npm-installer', label: 'NPM Engine Installer', icon: Package },
    { id: 'freellm', label: 'FreeLLM Router 0.5.0', icon: Network },
    { id: 'toolchain', label: 'Toolchain 400', icon: Wrench },
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
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-200 flex">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 border-r border-zinc-800 bg-zinc-950 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <span className="text-xl font-bold text-white tracking-tighter">N+1 SYSTEM</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-900 rounded-lg">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'hover:bg-zinc-900 text-zinc-500'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              {item.id === 'trainer' && trainingStatus === 'training' && (
                <div className="ml-auto w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-900 flex flex-col gap-2">
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
      <main className="flex-1 overflow-y-auto bg-zinc-950 flex flex-col">
        {/* Sticky Top Header with Global Search */}
        <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-3xl">
            <GlobalSearchBar onSelectResult={(tab) => setActiveTab(tab)} />
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
            <div className="space-y-8">
              <header>
                <h1 className="text-4xl font-bold text-white tracking-tight">System Overview</h1>
                <p className="text-zinc-500 mt-2">Real-time status of the Axiomatic Core and N+1 Redundancy.</p>
              </header>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl"
                >
                  <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Uptime</span>
                  <div className="text-3xl font-bold text-white mt-2">99.998%</div>
                  <div className="text-emerald-500 text-xs mt-1 flex items-center gap-1">
                    <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Nominal
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.08 }}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl"
                >
                  <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Active Nodes</span>
                  <div className="text-3xl font-bold text-white mt-2">1,248</div>
                  <div className="text-zinc-500 text-xs mt-1">+12 from last hour</div>
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <NeuralNetworkTopology />
                <AxiomaticCoreActivityGraph />
              </div>
              <APIMagic />
            </div>
          )}

          {activeTab === 'nexus' && <NexusBridge />}
          {activeTab === 'codeserver' && <CodeServerWorkspace />}
          {activeTab === 'ouroboros-canvas' && <OuroborosCanvas />}
          {activeTab === 'cloud-import' && <CloudImport />}
          {activeTab === 'cloud-backup' && <CloudBackupExport />}
          {activeTab === 'health-monitor' && <AgentHealthMonitor />}
          {activeTab === 'predictive-inference' && <PredictiveRuntimeInference />}
          {activeTab === 'vectorizer' && <KnowledgeVectorizer />}
          {activeTab === 'semantic-graph' && <SemanticGraphKnowledgeBase />}
          {activeTab === 'voice' && <HiaResonanceVoice onNavigateTab={(tab) => setActiveTab(tab)} />}
          {activeTab === 'ecosystem' && <SystemEcosystemPanel />}
          {activeTab === 'npm-installer' && <N1NpmInstaller />}
          {activeTab === 'freellm' && <FreeLLMRouterService />}
          {activeTab === 'toolchain' && <SelfAwareToolchain />}
          {activeTab === 'bughunt' && <SystemBugHunt />}
          {activeTab === 'apimagic' && <APIMagic />}
          {activeTab === 'googledrive' && <GoogleDriveManager />}
          {activeTab === 'trainer' && <AgentSandbox />}
          {activeTab === 'registry' && <AgentRegistry />}
          {activeTab === 'knowledge' && <KnowledgeBase />}
          {activeTab === 'skills' && <SkillUpload />}
          {activeTab === 'integrations' && <Integrations />}
          {activeTab === 'webhooks' && <WebhookManagement />}
          
          {activeTab === 'database' && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-600">
              <Database size={64} className="mb-4 opacity-20" />
              <p>Database Management Module Loading...</p>
            </div>
          )}
        </div>
      </main>
      <AgentCommandCenter />
      <FloatingDebugOverlay />
    </div>
  );
};

export default App;
