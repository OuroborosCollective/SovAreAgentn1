import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
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
  Brain,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { areSqliteStorageService } from './services/areSqliteStorageService';
import { areBackgroundSyncService } from './services/areBackgroundSyncService';
import { voiceService } from './services/voiceService';
import { deviceSensorService } from './services/deviceSensorService';

// Import subcomponents
const HiaResonanceVoice = React.memo(lazy(() => import('./components/HiaResonanceVoice')));
const PredictiveRuntimeInference = React.memo(lazy(() => import('./components/PredictiveRuntimeInference')));
const CoreResonanceSanctuary = React.memo(lazy(() => import('./components/CoreResonanceSanctuary').then(module => ({ default: module.CoreResonanceSanctuary }))));
const NexusBridgeWithBoundary = React.memo(lazy(() => import('./components/NexusBridge')));
const SystemValidationTestbed = React.memo(lazy(() => import('./components/SystemValidationTestbed').then(module => ({ default: module.SystemValidationTestbed }))));
const SystemBugHunt = React.memo(lazy(() => import('./components/SystemBugHunt').then(module => ({ default: module.SystemBugHunt }))));
const FailoverDiagnostics = React.memo(lazy(() => import('./components/FailoverDiagnostics').then(module => ({ default: module.FailoverDiagnostics }))));
const IntegrityDiagnostics = React.memo(lazy(() => import('./components/IntegrityDiagnostics').then(module => ({ default: module.IntegrityDiagnostics }))));
const TTITracker = React.memo(lazy(() => import('./components/TTITracker').then(module => ({ default: module.TTITracker }))));
const SettingsWorkspace = React.memo(lazy(() => import('./components/SettingsWorkspace').then(module => ({ default: module.SettingsWorkspace }))));
const PhysicalStabilityMonitor = React.memo(lazy(() => import('./components/PhysicalStabilityMonitor').then(module => ({ default: module.PhysicalStabilityMonitor }))));
const FleetManagementWorkspace = React.memo(lazy(() => import('./components/FleetManagementWorkspace').then(module => ({ default: module.FleetManagementWorkspace }))));
const Integrations = React.memo(lazy(() => import('./components/Integrations')));
const AREKappaRuntimeWorkspace = React.memo(lazy(() => import('./components/AREKappaRuntimeWorkspace').then(module => ({ default: module.AREKappaRuntimeWorkspace }))));
const PersistentVoiceAssistant = React.memo(lazy(() => import('./components/PersistentVoiceAssistant').then(module => ({ default: module.PersistentVoiceAssistant }))));
import { NexusErrorBoundary } from './components/NexusErrorBoundary';

import { useNotification } from './context/NotificationContext';

import { MountTracker } from './components/MountTracker';

const N1AudiobookReader = React.memo(lazy(() => import('./components/N1AudiobookReader').then(module => ({ default: module.N1AudiobookReader }))));

export const App: React.FC = () => {
  const { addNotification } = useNotification();
  const validTabIds = ['voice', 'inference', 'arekappa', 'sanctuary', 'vcs', 'diagnostics', 'calibrations'];

  // Global Interceptor Exception State
  const [systemCrash, setSystemCrash] = useState<{ error: string; count: number } | null>(null);

  const initialTab = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('n1_active_tab');
      if (saved && validTabIds.includes(saved)) {
        return saved;
      }
    }
    return 'voice';
  }, []);

  // useRef-backed state to prevent state loops & ensure consistent reads across heavy operations
  const activeTabRef = useRef<string>(initialTab);
  const [activeTab, setActiveTabState] = useState<string>(initialTab);

  const setActiveTab = useCallback((tabId: string) => {
    const targetTab = validTabIds.includes(tabId) ? tabId : 'voice';
    if (activeTabRef.current !== targetTab) {
      activeTabRef.current = targetTab;
      setActiveTabState(targetTab);
      if (typeof window !== 'undefined') {
        localStorage.setItem('n1_active_tab', targetTab);
      }
    }
  }, [validTabIds]);

  // Global Interceptor for catching runtime crashes and navigation errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('[Global App Interceptor] Caught runtime exception:', event.error || event.message);
      setSystemCrash({
        error: event.error?.stack || event.error?.message || event.message || 'Unknown runtime error',
        count: 1
      });
      event.preventDefault();
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reasonStr = event.reason?.stack || event.reason?.message || (typeof event.reason === 'string' ? event.reason : JSON.stringify(event.reason || ''));
      console.warn('[Global App Interceptor] Caught unhandled rejection:', reasonStr);
      
      // Always prevent default browser console popup for handled background rejections
      event.preventDefault();

      // Only crash if React component tree or state evaluation explicitly threw invariant DOM/render errors
      const isReactDomCrash = reasonStr.includes('Minified React error') || 
                               reasonStr.includes('Cannot read properties of null (reading \'useContext\')') ||
                               reasonStr.includes('Target container is not a DOM element');
      if (isReactDomCrash) {
        setSystemCrash({
          error: reasonStr,
          count: 1
        });
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Isolated monitoring effect for activeTab changes to prevent re-render cascades
  useEffect(() => {
    console.log(`[System Navigation] Active tab safely transitioned to: ${activeTab}`);
  }, [activeTab]);

  const [coherenceScore, setCoherenceScore] = useState<number>(100);
  const [cpuLoad, setCpuLoad] = useState<number>(24);
  const [activeConnections, setActiveConnections] = useState<number>(1);
  const [isCoreLocked, setIsCoreLocked] = useState<boolean>(true);
  
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [showSyncAlert, setShowSyncAlert] = useState<boolean>(false);
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [isFlushingFromAlert, setIsFlushingFromAlert] = useState<boolean>(false);

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

  // LocalStorage Maintenance Hook
  useEffect(() => {
    const checkStorage = () => {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          total += (localStorage.getItem(key)?.length || 0) * 2; // Approx 2 bytes per char
        }
      }
      
      const MAX_STORAGE = 5 * 1024 * 1024; // ~5MB
      const threshold = MAX_STORAGE * 0.8;
      
      if (total > threshold) {
        console.warn(`[Storage Maintenance] LocalStorage usage at ${(total/1024/1024).toFixed(2)}MB. Clearing non-critical caches...`);
        // Clear non-critical entries
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('cache_') || key.includes('temp') || key === 'n1_voice_logs')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    };
    
    // Check initially and every 5 minutes
    checkStorage();
    const interval = setInterval(checkStorage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Set up Server-Sent Events (SSE) Push Stream with Exponential Backoff & 'Idle-Hold' State
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: any = null;
    let retryCount = 0;
    let currentlyConnected = false;

    const getIdleHoldStatus = () => {
      const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
      const isPowerSaving = typeof window !== 'undefined' && localStorage.getItem('n1_power_saving') === 'true';
      return isHidden || isPowerSaving;
    };

    const postStateToServiceWorker = () => {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
        const isPowerSaving = typeof window !== 'undefined' && localStorage.getItem('n1_power_saving') === 'true';
        navigator.serviceWorker.controller.postMessage({
          type: 'FOCUS_CHANGED',
          hidden: isHidden
        });
        navigator.serviceWorker.controller.postMessage({
          type: 'POWER_SAVING_CHANGED',
          active: isPowerSaving
        });
      }
    };

    const connectSse = () => {
      if (typeof window === 'undefined') return;

      const isIdleHold = getIdleHoldStatus();
      console.log(`[Push System] Connecting to SSE stream at /api/push/stream (Idle Hold Mode: ${isIdleHold})`);
      
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource('/api/push/stream');

      eventSource.onopen = () => {
        console.log('[Push System] Connected to Real-time Notification Server.');
        setSseConnected(true);
        currentlyConnected = true;
        retryCount = 0; // Reset retry count on successful connection
        postStateToServiceWorker();
      };

      eventSource.onerror = (err) => {
        const currentIdleHold = getIdleHoldStatus();
        console.log(`[Push System] SSE connection closed. Reconnecting... (Idle Hold: ${currentIdleHold})`);
        setSseConnected(false);
        currentlyConnected = false;
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        // Exponential backoff calculation
        const baseDelay = currentIdleHold ? 15000 : 1500;
        const maxDelay = currentIdleHold ? 60000 : 30000;
        const backoffDelay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount));

        console.log(`[Push System] Reconnecting in ${backoffDelay}ms (Attempt #${retryCount + 1})`);

        retryCount++;

        clearTimeout(retryTimeout);
        retryTimeout = setTimeout(() => {
          connectSse();
        }, backoffDelay);
      };

      const handleSseMessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Push System] Received real-time push event:', data);

          // Ouroboros Protocol: Automatically persist critical incoming SSE event into local SQLite store
          areSqliteStorageService.persistSseEvent(data).catch(err => {
            console.warn('[Push System] Failed to persist SSE event to SQLite:', err);
          });

          // Process incoming SSE stream audio chunk if present
          const base64Audio = data.audio || data.base64Audio || (data.payload && (data.payload.audio || data.payload.base64Audio));
          const contentType = data.audioContentType || data.contentType || 'audio/wav';

          if (base64Audio && typeof base64Audio === 'string' && base64Audio.trim().length > 10) {
            console.log(`[Push System] Validated SSE stream audio buffer (${base64Audio.length} chars, ${contentType}), mapping to AudioContext visualizer.`);
            voiceService.playAudioChunk(base64Audio, contentType, 'N+1 (SSE Voice Stream)', 'fröhlich').catch(err => {
              console.warn('[Push System] Error mapping audio chunk to AudioContext:', err);
            });
          }

          // Play native sound/trigger in-app notification context
          if (data.body) {
            addNotification(data.body, 'info', 'PUSH_ALERT');
          }
        } catch (e) {
          console.error('[Push System] Failed to parse stream payload:', e);
        }
      };

      eventSource.addEventListener('notification', handleSseMessage);
      eventSource.addEventListener('audio_chunk', handleSseMessage);
      eventSource.onmessage = handleSseMessage;
    };

    connectSse();

    // Focus & Visibility state change listeners
    const handleVisibilityChange = () => {
      const isHidden = document.visibilityState === 'hidden';
      console.log(`[Push System] Tab visibility changed: ${isHidden ? 'hidden (idle-hold)' : 'visible'}`);
      
      postStateToServiceWorker();

      // If visible again, aggressively reset backoff and reconnect immediately if offline
      if (!isHidden) {
        retryCount = 0;
        if (!currentlyConnected) {
          console.log('[Push System] Visible again: Force-triggering active high-fidelity reconnection...');
          clearTimeout(retryTimeout);
          connectSse();
        }
      }
    };

    // Monitor Power Saving state updates via LocalStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'n1_power_saving') {
        const isPowerSaving = e.newValue === 'true';
        console.log(`[Push System] Power saving mode changed: ${isPowerSaving ? 'active' : 'inactive'}`);
        postStateToServiceWorker();
        
        // If power saving is disabled, try to reconnect with fresh speed
        if (!isPowerSaving && !currentlyConnected) {
          retryCount = 0;
          clearTimeout(retryTimeout);
          connectSse();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    const initSwSyncTimeout = setTimeout(() => {
      postStateToServiceWorker();
    }, 1000);

    // Fluctuating metric simulation for realistic dashboard telemetry
    let organicBaseline = 100;
    const metricInterval = setInterval(() => {
      setCpuLoad(Math.floor(18 + Math.random() * 12));
      organicBaseline = Math.max(98, Math.min(100, organicBaseline + (Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0)));
    }, 4000);

    // Dynamic Physical Telemetry Service Subscription
    deviceSensorService.startListening();
    const unsubscribeSensors = deviceSensorService.subscribe((sensorState) => {
      const computedScore = organicBaseline - sensorState.coherenceImpact;
      setCoherenceScore(Math.max(10, Math.min(100, parseFloat(computedScore.toFixed(1)))));
    });

    // Background 'Sync Auditor' hook: executes periodic query on are_ticks view
    const queryAndAuditSync = async () => {
      try {
        const queryResult = await areSqliteStorageService.executeRawQuery(
          "SELECT count(*) FROM are_ticks WHERE synced = 0;"
        );
        if (queryResult && queryResult[0] && queryResult[0].values) {
          const count = Number(queryResult[0].values[0][0]);
          setUnsyncedCount(count);
          if (count > 30) {
            setShowSyncAlert(true);
          } else {
            setShowSyncAlert(false);
          }
        }
      } catch (err) {
        console.warn('[Sync Auditor] Failed to query are_ticks count:', err);
      }
    };

    // Run immediately and then every 10 seconds
    queryAndAuditSync();
    const syncAuditorInterval = setInterval(queryAndAuditSync, 10000);

    return () => {
      if (eventSource) eventSource.close();
      if (retryTimeout) clearTimeout(retryTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(initSwSyncTimeout);
      clearInterval(metricInterval);
      clearInterval(syncAuditorInterval);
      unsubscribeSensors();
      deviceSensorService.stopListening();
    };
  }, [addNotification]);

  // Swipe-to-navigate gesture handling for main workspace tabs with vertical scrolling isolation
  const touchStartRef = useRef<{ x: number; y: number; time: number; isInteractive: boolean } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const target = e.target as HTMLElement | null;
      // Detect if user started touch inside an interactive control or scrollable child container
      const isInteractive = Boolean(
        target && (
          target.closest('input, textarea, select, button, canvas, audio, video, pre, code, [data-no-swipe]') ||
          target.closest('.overflow-x-auto') ||
          target.closest('.no-swipe')
        )
      );

      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
        isInteractive
      };
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    
    // Ignore swipe tab navigation if touch started on an interactive control/scrollable subcontainer
    if (touchStartRef.current.isInteractive) {
      touchStartRef.current = null;
      return;
    }

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now()
    };
    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const durationMs = touchEnd.time - touchStartRef.current.time;
    touchStartRef.current = null;

    // Strict criteria for Horizontal Tab Navigation Swipe:
    // 1. Horizontal movement deltaX > 60px
    // 2. Vertical displacement deltaY < 50px (Ensures vertical page scroll is unaffected)
    // 3. Horizontal displacement is at least 2.0x larger than vertical movement
    // 4. Swipe duration < 600ms (prevents slow diagonal scroll gestures from triggering)
    if (
      Math.abs(deltaX) > 60 && 
      Math.abs(deltaY) < 50 && 
      Math.abs(deltaX) > Math.abs(deltaY) * 2.0 &&
      durationMs < 600
    ) {
      const currentIndex = validTabIds.indexOf(activeTabRef.current);
      if (currentIndex !== -1) {
        if (deltaX < -60) {
          // Swiped left -> Navigate to Next Tab
          const nextIndex = (currentIndex + 1) % validTabIds.length;
          const nextTabId = validTabIds[nextIndex];
          setActiveTab(nextTabId);
          addNotification(`Swiped to workspace tab: ${nextTabId.toUpperCase()}`, 'info');
        } else if (deltaX > 60) {
          // Swiped right -> Navigate to Previous Tab
          const prevIndex = (currentIndex - 1 + validTabIds.length) % validTabIds.length;
          const prevTabId = validTabIds[prevIndex];
          setActiveTab(prevTabId);
          addNotification(`Swiped to workspace tab: ${prevTabId.toUpperCase()}`, 'info');
        }
      }
    }
  }, [validTabIds, setActiveTab, addNotification]);

  // Ref and state for mobile touch control optimized menu tab scrolling
  const navTabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftNav, setCanScrollLeftNav] = useState(false);
  const [canScrollRightNav, setCanScrollRightNav] = useState(false);

  const checkNavScrollState = useCallback(() => {
    if (navTabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navTabsContainerRef.current;
      setCanScrollLeftNav(scrollLeft > 5);
      setCanScrollRightNav(scrollLeft + clientWidth < scrollWidth - 5);
    }
  }, []);

  // Auto-scroll active tab into view on touch/click/swipe tab changes
  useEffect(() => {
    if (navTabsContainerRef.current) {
      const activeEl = navTabsContainerRef.current.querySelector<HTMLElement>(`[data-tab-id="${activeTab}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
      checkNavScrollState();
    }
  }, [activeTab, checkNavScrollState]);

  const scrollNavTabs = (direction: 'left' | 'right') => {
    if (navTabsContainerRef.current) {
      const amount = direction === 'left' ? -180 : 180;
      navTabsContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
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

  if (systemCrash) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 font-mono text-xs selection:bg-pink-500/30">
        <div className="max-w-md w-full bg-zinc-950 border border-red-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle background red pulse */}
          <div className="absolute inset-0 bg-red-500/[0.02] pointer-events-none" />
          
          <div className="flex items-center gap-3 border-b border-red-500/20 pb-4">
            <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl animate-pulse">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase text-white tracking-tight">System Recovering</h2>
              <p className="text-[10px] text-red-400 font-bold">N+1 Global Interceptor Caught Exception</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              A critical runtime error was intercepted during the active execution cycle. The engine has halted further rendering loops to prevent layout cascades.
            </p>

            <div className="p-4 bg-black border border-zinc-900 rounded-2xl space-y-2">
              <span className="text-[9px] text-zinc-500 uppercase font-bold">Exception Log</span>
              <pre className="text-[10px] text-red-400/90 whitespace-pre-wrap font-mono leading-relaxed max-h-24 overflow-y-auto scrollbar-thin">
                {systemCrash.error}
              </pre>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              onClick={() => {
                setSystemCrash(null);
                setActiveTab('voice');
              }}
              className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={12} />
              <span>Soft Reset</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-md"
            >
              Hard Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 flex flex-col font-sans select-none antialiased selection:bg-pink-500/30 selection:text-white">
      {/* Dynamic Status / Navigation Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md shrink-0 px-3 py-3 sm:px-6 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 z-40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-pink-400 shadow-md">
            <Brain size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-white">N+1 System Control Center</h1>
              <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-950/80 text-pink-300 border border-pink-800 font-bold">
                Axiom-Consistent
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-500 font-medium">Sovereign Voice & LLM Routing Supervisor Engine</p>
          </div>
        </div>

        {/* Live Telemetry Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* SSE Push Status Banner */}
          <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-[11px] ${
            sseConnected 
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-950/30 border-amber-500/30 text-amber-400'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${sseConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span>SSE Push: {sseConnected ? 'Connected' : 'Reconnecting'}</span>
          </div>

          <div className="px-2.5 py-1 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-300 flex items-center gap-1.5 text-[11px]">
            <Cpu size={12} className="text-pink-400" />
            <span>CPU: {cpuLoad}%</span>
          </div>

          <div className="px-2.5 py-1 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-300 flex items-center gap-1.5 text-[11px]">
            <Activity size={12} className="text-purple-400" />
            <span>Coherence: {coherenceScore}%</span>
          </div>

          <div className="px-2.5 py-1 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-300 flex items-center gap-1.5 text-[11px]">
            <Lock size={12} className={isCoreLocked ? "text-emerald-400" : "text-amber-400"} />
            <span>Core: {isCoreLocked ? "Locked" : "Decoupled"}</span>
          </div>
        </div>
      </header>

      {/* BACKGROUND SYNC AUDITOR FLOATING ALERT BANNER */}
      <AnimatePresence>
        {showSyncAlert && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-amber-950/90 border-b border-amber-500/30 px-4 py-3 text-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-mono z-30"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg animate-pulse shrink-0">
                <AlertTriangle size={15} />
              </div>
              <div>
                <span className="font-extrabold text-white block sm:inline mr-1">
                  CRITICAL SYNC LATENCY DETECTED:
                </span>
                <span>
                  The background SQLite buffer has accumulated <strong className="text-white underline">{unsyncedCount}</strong> pending unsynced ticks.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                disabled={isFlushingFromAlert}
                onClick={async () => {
                  setIsFlushingFromAlert(true);
                  try {
                    const res = await areBackgroundSyncService.flushQueue();
                    if (res.syncedCount > 0) {
                      addNotification(`Successfully flushed ${res.syncedCount} ticks!`, 'success');
                      // Re-audit immediately
                      const queryResult = await areSqliteStorageService.executeRawQuery(
                        "SELECT count(*) FROM are_ticks WHERE synced = 0;"
                      );
                      if (queryResult && queryResult[0] && queryResult[0].values) {
                        const count = Number(queryResult[0].values[0][0]);
                        setUnsyncedCount(count);
                        setShowSyncAlert(count > 30);
                      }
                    } else if (res.errors && res.errors.length > 0) {
                      addNotification(`Flush failed: ${res.errors.join(', ')}`, 'error');
                    } else {
                      addNotification('Flush finished, but no ticks were synced.', 'info');
                    }
                  } catch (err: any) {
                    addNotification(`Sync Error: ${err.message}`, 'error');
                  } finally {
                    setIsFlushingFromAlert(false);
                  }
                }}
                className={`px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold rounded-lg transition-all flex items-center gap-1 ${
                  isFlushingFromAlert ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {isFlushingFromAlert ? (
                  <>
                    <RefreshCw size={11} className="animate-spin" />
                    <span>Flushing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={11} />
                    <span>Force Manual Flush</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowSyncAlert(false)}
                className="px-2 py-1.5 hover:bg-white/10 text-amber-300 rounded-lg transition-all font-bold"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container with Viewport Constraint for Vertical Scroll */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Responsive Navigation Bar with Mobile Touch Control Optimized Scroll */}
        <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-900 bg-zinc-950/50 p-2 sm:p-4 flex flex-col justify-between shrink-0 relative md:overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <div className="hidden md:block px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
              System Operations
            </div>

            {/* Mobile Touch Control Scroll Header */}
            <div className="flex md:hidden items-center justify-between px-1 pb-1 text-[10px] text-zinc-500 font-mono">
              <span className="uppercase text-[9px] font-bold text-zinc-400 tracking-wider">Workspace Tabs</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollNavTabs('left')}
                  disabled={!canScrollLeftNav}
                  className={`p-1 rounded-md transition-all ${
                    canScrollLeftNav
                      ? 'bg-zinc-900 hover:bg-pink-950/50 text-pink-400 border border-pink-900/40 active:scale-95'
                      : 'bg-zinc-950 text-zinc-700 opacity-40 cursor-not-allowed border border-transparent'
                  }`}
                  aria-label="Scroll menu left"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollNavTabs('right')}
                  disabled={!canScrollRightNav}
                  className={`p-1 rounded-md transition-all ${
                    canScrollRightNav
                      ? 'bg-zinc-900 hover:bg-pink-950/50 text-pink-400 border border-pink-900/40 active:scale-95'
                      : 'bg-zinc-950 text-zinc-700 opacity-40 cursor-not-allowed border border-transparent'
                  }`}
                  aria-label="Scroll menu right"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Scrollable Nav Tab Track with smooth touch physics */}
            <div
              ref={navTabsContainerRef}
              onScroll={checkNavScrollState}
              className="flex md:flex-col overflow-x-auto md:overflow-x-visible gap-1.5 pb-2 md:pb-0 scroll-smooth touch-pan-x snap-x snap-mandatory md:snap-none scrollbar-thin select-none"
            >
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    data-tab-id={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative shrink-0 md:w-full min-h-[44px] snap-center flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'text-pink-200 font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabBackground"
                        className="absolute inset-0 bg-pink-950/40 border border-pink-500/30 rounded-xl shadow-md pointer-events-none"
                        initial={false}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-2.5 pointer-events-none">
                      <Icon size={16} className={isActive ? 'text-pink-400' : 'text-zinc-500'} />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </div>
                    <span className={`relative z-10 text-[9px] font-mono px-1.5 py-0.5 rounded-md ml-2 pointer-events-none ${
                      isActive ? 'bg-pink-900/50 text-pink-300' : 'bg-zinc-900 text-zinc-500'
                    }`}>
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Content Workspace Panel with Swipe-to-Navigate Gesture support & Vertical Scroll */}
        <main 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 bg-zinc-950/10 p-3 sm:p-6 overflow-y-auto overscroll-y-contain min-h-0 relative touch-pan-y custom-scrollbar"
        >
          {/* Mobile & Tablet Touch Swipe Navigation Banner */}
          <div className="flex items-center justify-between pb-2 text-[10px] text-zinc-500 font-mono sm:hidden border-b border-zinc-900/60 mb-4 bg-zinc-950/60 px-3 py-1.5 rounded-xl border">
            <span className="flex items-center gap-1.5 text-zinc-400 font-bold">
              <ChevronLeft size={13} className="text-pink-400 animate-pulse" />
              <span>Swipe Left/Right to Switch Workspace Tabs</span>
              <ChevronRight size={13} className="text-pink-400 animate-pulse" />
            </span>
            <span className="px-2 py-0.5 bg-pink-950/80 text-pink-300 font-bold rounded-md border border-pink-800/50 uppercase text-[9px]">
              Tab {validTabIds.indexOf(activeTab) + 1} of {validTabIds.length}
            </span>
          </div>

          <div className="min-h-full">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px] w-full text-zinc-500 font-mono text-[10px]">
                <RefreshCw className="animate-spin w-4 h-4 mr-2" />
                INITIALIZING SUBSYSTEM...
              </div>
            }>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="min-h-full space-y-6"
                >
                  {activeTab === 'voice' && (
                    <MountTracker id="voice">
                      <NexusErrorBoundary fallbackTitle="N+1 Voice Studio Exception">
                        <div className="space-y-6">
                          <HiaResonanceVoice onNavigateTab={setActiveTab} />
                        </div>
                      </NexusErrorBoundary>
                    </MountTracker>
                  )}

                  {activeTab === 'inference' && (
                    <MountTracker id="inference">
                      <NexusErrorBoundary fallbackTitle="LLM Revolver Exception">
                        <PredictiveRuntimeInference />
                      </NexusErrorBoundary>
                    </MountTracker>
                  )}

                  {activeTab === 'arekappa' && (
                    <MountTracker id="arekappa">
                      <NexusErrorBoundary fallbackTitle="AREKappa Workspace Exception">
                        <AREKappaRuntimeWorkspace />
                      </NexusErrorBoundary>
                    </MountTracker>
                  )}

                  {activeTab === 'sanctuary' && (
                    <MountTracker id="sanctuary">
                      <NexusErrorBoundary fallbackTitle="Axiom Sanctuary Exception">
                        <CoreResonanceSanctuary />
                      </NexusErrorBoundary>
                    </MountTracker>
                  )}

                  {activeTab === 'vcs' && (
                    <MountTracker id="vcs">
                      <NexusErrorBoundary fallbackTitle="VCS Sync Exception">
                        <NexusBridgeWithBoundary />
                      </NexusErrorBoundary>
                    </MountTracker>
                  )}

                  {activeTab === 'diagnostics' && (
                    <MountTracker id="diagnostics">
                      <NexusErrorBoundary fallbackTitle="Diagnostics View Exception">
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            <SystemValidationTestbed onSendToBugHunt={() => setActiveTab('diagnostics')} />
                            <SystemBugHunt />
                          </div>
                          <TTITracker />
                          <FailoverDiagnostics />
                          <IntegrityDiagnostics />
                        </div>
                      </NexusErrorBoundary>
                    </MountTracker>
                  )}

                  {activeTab === 'calibrations' && (
                    <MountTracker id="calibrations">
                      <NexusErrorBoundary fallbackTitle="Settings Workspace Exception">
                        <div className="space-y-8">
                          <N1AudiobookReader />
                          <SettingsWorkspace onCoreLockStateChange={(locked) => setIsCoreLocked(locked)} />
                          <PhysicalStabilityMonitor />
                          <FleetManagementWorkspace />
                          <Integrations />
                        </div>
                      </NexusErrorBoundary>
                    </MountTracker>
                  )}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </div>
        </main>
      </div>
      <PersistentVoiceAssistant onNavigateTab={setActiveTab} />
    </div>
  );
};

export default App;
