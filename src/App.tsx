import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Radio, 
  Terminal, 
  Sliders, 
  ShieldAlert, 
  Shield,
  Sparkles, 
  Command, 
  Bell, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  KeyRound, 
  RefreshCw,
  X,
  Send,
  Lock,
  Heart,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import subcomponents
import HiaResonanceVoice from './components/HiaResonanceVoice';
import PredictiveRuntimeInference from './components/PredictiveRuntimeInference';
import { CoreResonanceSanctuary } from './components/CoreResonanceSanctuary';
import NexusBridgeWithBoundary from './components/NexusBridge';
import { SystemValidationTestbed } from './components/SystemValidationTestbed';
import { SystemBugHunt } from './components/SystemBugHunt';
import { SettingsWorkspace } from './components/SettingsWorkspace';
import { FleetManagementWorkspace } from './components/FleetManagementWorkspace';
import Integrations from './components/Integrations';
import { AREKappaRuntimeWorkspace } from './components/AREKappaRuntimeWorkspace';

import { useNotification } from './context/NotificationContext';

export const App: React.FC = () => {
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<string>('voice');
  const [coherenceScore, setCoherenceScore] = useState<number>(100);
  const [cpuLoad, setCpuLoad] = useState<number>(24);
  const [activeConnections, setActiveConnections] = useState<number>(1);
  const [isCoreLocked, setIsCoreLocked] = useState<boolean>(true);
  
  // Push notification state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [testTitle, setTestTitle] = useState<string>('System Alert');
  const [testBody, setTestBody] = useState<string>('N+1 is fully initialized and monitoring axioms.');
  const [testUrl, setTestUrl] = useState<string>('/');
  const [isSendingPush, setIsSendingPush] = useState<boolean>(false);

  // Set up Service Worker registration
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('[ServiceWorker] Registered successfully with scope:', reg.scope);
        })
        .catch(err => {
          console.error('[ServiceWorker] Registration failed:', err);
        });
    }
  }, []);

  // Set up Server-Sent Events (SSE) Push Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: any = null;

    const connectSse = () => {
      if (typeof window === 'undefined') return;

      console.log('[Push System] Connecting to SSE stream at /api/push/stream');
      eventSource = new EventSource('/api/push/stream');

      eventSource.onopen = () => {
        console.log('[Push System] Connected to Real-time Notification Server.');
        setSseConnected(true);
      };

      eventSource.onerror = (err) => {
        console.log('[Push System] SSE connection momentarily closed or reconnecting (normal during server restarts or proxy handshakes).');
        setSseConnected(false);
        eventSource?.close();

        // Retry connection after 5 seconds
        retryTimeout = setTimeout(() => {
          connectSse();
        }, 5000);
      };

      eventSource.addEventListener('notification', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Push System] Received real-time push event:', data);

          // 1. Play native sound/trigger in-app notification context
          addNotification(data.body || 'New system event.', 'info', 'PUSH_ALERT');

          // 2. Show native OS notification if permission is granted
          if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(data.title || 'N+1', {
                body: data.body || 'A system event requires attention.',
                icon: 'https://raw.githubusercontent.com/OuroborosCollective/SovAreAgentn1/main/public/icon.png',
                badge: 'https://raw.githubusercontent.com/OuroborosCollective/SovAreAgentn1/main/public/icon.png',
                vibrate: [100, 50, 100],
                data: {
                  url: data.url || '/'
                }
              } as any);
            });
          }
        } catch (e) {
          console.error('[Push System] Failed to parse stream payload:', e);
        }
      });
    };

    connectSse();

    // Fluctuating metric simulation for realistic dashboard telemetry
    const metricInterval = setInterval(() => {
      setCpuLoad(Math.floor(18 + Math.random() * 12));
      setCoherenceScore(prev => {
        const delta = Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.max(98, Math.min(100, prev + delta));
      });
    }, 4000);

    return () => {
      if (eventSource) eventSource.close();
      if (retryTimeout) clearTimeout(retryTimeout);
      clearInterval(metricInterval);
    };
  }, [addNotification]);

  // Request native permission
  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      addNotification('This browser does not support native desktop notifications.', 'error');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        addNotification('Native Push Notifications successfully authorized!', 'success');
        // Test notification immediately
        new Notification('N+1 Active', {
          body: 'You will now receive native alerts even in the background.',
          icon: 'https://raw.githubusercontent.com/OuroborosCollective/SovAreAgentn1/main/public/icon.png'
        });
      } else {
        addNotification('Notification permissions denied. Alerts will fall back to in-app toasts.', 'info');
      }
    } catch (e: any) {
      console.error('Permission request failed:', e);
      addNotification(`Could not request permissions: ${e.message}`, 'error');
    }
  };

  // Trigger server-sent push notification
  const handleTriggerTestPush = async () => {
    setIsSendingPush(true);
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: testTitle,
          body: testBody,
          url: testUrl
        })
      });

      if (response.ok) {
        addNotification('Push broadcast sent successfully through real server!', 'success');
      } else {
        const errData = await response.json();
        addNotification(`Failed to broadcast: ${errData.error || 'Server error'}`, 'error');
      }
    } catch (e: any) {
      addNotification(`Failed to send test push: ${e.message}`, 'error');
    } finally {
      setIsSendingPush(false);
    }
  };

  const menuItems = [
    { id: 'voice', label: 'N+1 Voice Studio', icon: Radio, badge: 'Papas girl' },
    { id: 'inference', label: 'LLM Revolver Hub', icon: Sliders, badge: 'Active' },
    { id: 'arekappa', label: 'AREKappa Workspace', icon: Shield, badge: 'κIR' },
    { id: 'sanctuary', label: 'Axiom Sanctuary', icon: ShieldAlert, badge: 'Immutable' },
    { id: 'vcs', label: 'VCS Sync (Nexus)', icon: Layers, badge: 'GitHub' },
    { id: 'diagnostics', label: 'Diagnostics & Bug Hunt', icon: Terminal, badge: 'Checks' },
    { id: 'calibrations', label: 'Settings & Workspace', icon: Cpu, badge: 'Core' }
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans select-none antialiased selection:bg-pink-500/30 selection:text-white">
      {/* Dynamic Status / Navigation Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-pink-400 shadow-md">
            <Brain size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight uppercase text-white">N+1 System Control Center</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-950/80 text-pink-300 border border-pink-800 font-bold">
                Axiom-Consistent
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium">Sovereign Voice & LLM Routing Supervisor Engine</p>
          </div>
        </div>

        {/* Live Telemetry Bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* SSE Push Status Banner */}
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
            sseConnected 
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-950/30 border-amber-500/30 text-amber-400'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${sseConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span>SSE Push Stream: {sseConnected ? 'Connected' : 'Reconnecting'}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-300 flex items-center gap-2">
            <Cpu size={14} className="text-pink-400" />
            <span>CPU: {cpuLoad}%</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-300 flex items-center gap-2">
            <Activity size={14} className="text-purple-400" />
            <span>Coherence: {coherenceScore}%</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-300 flex items-center gap-2">
            <Lock size={14} className={isCoreLocked ? "text-emerald-400" : "text-amber-400"} />
            <span>Core: {isCoreLocked ? "Locked" : "Decoupled"}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar Navigation */}
        <nav className="w-full md:w-64 border-r border-zinc-900 bg-zinc-950/50 p-4 space-y-2 flex flex-col justify-between shrink-0">
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
              System Operations
            </div>
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-pink-950/40 border-pink-500/30 text-pink-200 font-bold shadow-md'
                      : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-pink-400' : 'text-zinc-500'} />
                    <span>{item.label}</span>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-pink-900/50 text-pink-300' : 'bg-zinc-900 text-zinc-500'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Push System Integration Box */}
          <div className="mt-8 p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                <Bell size={12} className="text-pink-400 animate-bounce" />
                <span>Desktop Alerts</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                notificationPermission === 'granted' 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : notificationPermission === 'denied'
                    ? 'bg-red-950 text-red-400 border border-red-800'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}>
                {notificationPermission}
              </span>
            </div>

            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Enable native background OS push notifications for important reminders.
            </p>

            {notificationPermission !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-[11px] rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Authorize Push Alerts</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold bg-emerald-950/20 p-2 border border-emerald-900/30 rounded-lg">
                <CheckCircle2 size={12} />
                <span>OS Push Enabled</span>
              </div>
            )}
          </div>
        </nav>

        {/* Content Workspace Panel */}
        <main className="flex-1 bg-zinc-950/10 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="h-full space-y-8"
            >
              {activeTab === 'voice' && (
                <div className="space-y-6">
                  {/* Push Notifications Configuration Panel */}
                  <div className="p-6 bg-zinc-950/80 border border-zinc-900 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div className="flex items-center gap-2">
                        <Bell size={18} className="text-pink-400" />
                        <h2 className="text-sm font-bold text-white">Push System Dispatcher & Diagnostics</h2>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-500">
                        Real-Time (SSE Stream)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs leading-relaxed">
                      <div className="space-y-2">
                        <h3 className="font-bold text-zinc-300">Push System Mechanism</h3>
                        <p className="text-zinc-500">
                          The system registers the service worker <code>/sw.js</code> on startup. In parallel, it connects to a Server-Sent Events stream at <code>/api/push/stream</code>, providing immediate full-stack notifications.
                        </p>
                        <p className="text-zinc-500">
                          When a reminder triggers on the server, a push event is broadcasted. If authorized, the service worker pushes a native desktop overlay even with the window closed.
                        </p>
                      </div>

                      <div className="space-y-3 p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                        <h4 className="font-bold text-white flex items-center gap-1.5">
                          <Sliders size={14} className="text-purple-400" />
                          <span>Custom Test Event</span>
                        </h4>
                        
                        <div className="space-y-2 font-mono">
                          <div className="space-y-1">
                            <label className="text-[9px] text-zinc-500 uppercase font-bold">Alert Title</label>
                            <input
                              type="text"
                              value={testTitle}
                              onChange={e => setTestTitle(e.target.value)}
                              className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-pink-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-zinc-500 uppercase font-bold">Alert Message</label>
                            <input
                              type="text"
                              value={testBody}
                              onChange={e => setTestBody(e.target.value)}
                              className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-pink-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                        <div className="space-y-2">
                          <h4 className="font-bold text-white flex items-center gap-1.5">
                            <Send size={14} className="text-pink-400" />
                            <span>Dispatch Broadcast</span>
                          </h4>
                          <p className="text-zinc-500">
                            Broadcast this notification template to all active operators. If native permissions are granted, this will immediately fire a desktop alert.
                          </p>
                        </div>

                        <button
                          onClick={handleTriggerTestPush}
                          disabled={isSendingPush}
                          className="mt-4 w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                        >
                          {isSendingPush ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                          <span>Trigger Server Push Alert</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <HiaResonanceVoice />
                </div>
              )}

              {activeTab === 'inference' && (
                <PredictiveRuntimeInference />
              )}

              {activeTab === 'arekappa' && (
                <AREKappaRuntimeWorkspace />
              )}

              {activeTab === 'sanctuary' && (
                <CoreResonanceSanctuary />
              )}

              {activeTab === 'vcs' && (
                <NexusBridgeWithBoundary />
              )}

              {activeTab === 'diagnostics' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <SystemValidationTestbed onSendToBugHunt={() => setActiveTab('diagnostics')} />
                  <SystemBugHunt />
                </div>
              )}

              {activeTab === 'calibrations' && (
                <div className="space-y-8">
                  <SettingsWorkspace onCoreLockStateChange={(locked) => setIsCoreLocked(locked)} />
                  <FleetManagementWorkspace />
                  <Integrations />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;
