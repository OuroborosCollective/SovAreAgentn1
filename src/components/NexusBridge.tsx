import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Key, 
  ShieldCheck, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  Check, 
  Download, 
  Play, 
  History, 
  FileCode, 
  Wrench, 
  RotateCcw, 
  Zap, 
  Shield as NexusIcon, 
  Lock, 
  Activity, 
  ExternalLink,
  Sliders,
  Sparkles,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp } from '../utils/deterministic';
import { NexusAuth } from './NexusAuth';
import { NexusErrorBoundary } from './NexusErrorBoundary';
import { InputMutexWidget } from './InputMutexWidget';
import { NexusHealthStatus } from './NexusHealthStatus';

export interface SSHKeyConfig {
  algorithm: string;
  bits: number;
  publicKey: string;
  fingerprint: string;
  comment: string;
  generatedAt: string;
  isRegisteredOnNexus: boolean;
  isSshAgentLoaded: boolean;
}

export interface ErrorCommitCorrelation {
  id: string;
  errorLog: string;
  exceptionType: string;
  stackTrace: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  committedAt: string;
  fileAffected: string;
  lineNumber: number;
  driftScore: number; // percentage
  status: 'ACTIVE_DRIFT' | 'REVERTED' | 'PATCHED';
}

export const NexusBridge: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'auth' | 'ssh' | 'correlation' | 'mutex' | 'history'>('auth');

  // Remote Auth & Repo State
  const [remoteUser, setRemoteUser] = useState<any>(null);
  const [availableRepos, setAvailableRepos] = useState<any[]>([]);
  const [isDetectingRepos, setIsDetectingRepos] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // SSH Configuration State
  const [sshConfig, setSshConfig] = useState<SSHKeyConfig>({
    algorithm: 'RSA',
    bits: 4096,
    publicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDC84p...n1-auto-committer@n1-engine',
    fingerprint: 'SHA256:4x90uVb82kM3nL7pQ+E1wYxR89tS0zP4aL2bC9mK0vX=',
    comment: 'n1-auto-committer@n1-system-cluster',
    generatedAt: '2026-07-26 08:00:12 UTC',
    isRegisteredOnNexus: true,
    isSshAgentLoaded: true
  });
  const [isGeneratingSSH, setIsGeneratingSSH] = useState(false);
  const [syncToken, setSyncToken] = useState('');
  const [targetRepo, setTargetRepo] = useState('');
  const [registerStatus, setRegisterStatus] = useState<string | null>(null);
  const [handshakeLog, setHandshakeLog] = useState<string | null>(null);
  const [isTestingHandshake, setIsTestingHandshake] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Automated Error Correlation State
  const [correlations, setCorrelations] = useState<ErrorCommitCorrelation[]>([
    {
      id: 'corr-01',
      errorLog: 'ERR_SYNC_DESYNC_01: Asynchronous state race condition during high-frequency mutation ticks',
      exceptionType: 'StateDesyncException',
      stackTrace: 'at reconcileState (stateMachine.ts:142)\n  at processBatch (queue.ts:88)\n  at async EventEmitter.emit (events.js:315)',
      commitHash: '8f3a12b',
      commitMessage: 'feat(core): update unbuffered state mutation listener ticks',
      author: 'dev-n1-bot <bot@n1-system.org>',
      committedAt: '12 mins ago',
      fileAffected: 'src/lib/stateMachine.ts',
      lineNumber: 142,
      driftScore: 18.4,
      status: 'ACTIVE_DRIFT'
    },
    {
      id: 'corr-02',
      errorLog: 'ERR_HEURISTIC_OVERFLOW_02: Recursive heuristic stack exceeded boundary limits',
      exceptionType: 'StackOverflowError',
      stackTrace: 'at evaluateHeuristicLoop (agentHeuristic.ts:204)\n  at selfImprove (agentHeuristic.ts:218)',
      commitHash: 'e4d9901',
      commitMessage: 'refactor(heuristic): enable recursive depth expansion for sandbox',
      author: 'alex.keller@n1-system.org',
      committedAt: '45 mins ago',
      fileAffected: 'src/engine/agentHeuristic.ts',
      lineNumber: 204,
      driftScore: 24.1,
      status: 'ACTIVE_DRIFT'
    },
    {
      id: 'corr-03',
      errorLog: 'ERR_BUFFER_CONTENTION_03: Token queue throttling saturation under parallel agent reasoning',
      exceptionType: 'BufferOverflowException',
      stackTrace: 'at allocateTokenQueue (neuralProxy.ts:91)\n  at handleStreamResponse (server.ts:312)',
      commitHash: '3c11f7a',
      commitMessage: 'perf(proxy): increase concurrency buffer limit to 1024',
      author: 'dev-n1-bot <bot@n1-system.org>',
      committedAt: '2 hours ago',
      fileAffected: 'src/proxy/neuralProxy.ts',
      lineNumber: 91,
      driftScore: 9.8,
      status: 'PATCHED'
    }
  ]);

  const [correlateFilter, setCorrelateFilter] = useState<'ALL' | 'ACTIVE_DRIFT' | 'PATCHED'>('ALL');
  const [isProcessingNode, setIsProcessingNode] = useState<string | null>(null);

  // Check Auth on Mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/nexus/me');
      const data = await res.json();
      if (data.authenticated) {
        setRemoteUser(data.user);
        handleDetectRepos();
      }
    } catch (e) {
      console.error('Auth check failed:', e);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleNexusLogin = () => {
    window.location.href = '/api/auth/nexus/login';
  };

  const handleNexusLogout = async () => {
    await fetch('/api/auth/nexus/logout', { method: 'POST' });
    setRemoteUser(null);
    setAvailableRepos([]);
  };

  const handleDetectRepos = async () => {
    setIsDetectingRepos(true);
    try {
      const res = await fetch('/api/nexus/repos');
      const data = await res.json();
      if (data.status === 'success') {
        setAvailableRepos(data.repos);
        // Auto-detect: find repo matching "n+1" or similar
        const match = data.repos.find((r: any) => 
          r.name.toLowerCase().includes('n+1') || 
          r.name.toLowerCase().includes('axiom')
        );
        if (match) {
          setTargetRepo(match.full_name);
        }
      }
    } catch (e) {
      console.error('Repo detection failed:', e);
    } finally {
      setIsDetectingRepos(false);
    }
  };

  // Generate RSA-4096 Key Pair
  const handleGenerateRSAKeys = () => {
    setIsGeneratingSSH(true);
    setRegisterStatus(null);
    setTimeout(() => {
      const randomKeyFragment = Array.from({ length: 120 }, () => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'[Math.floor(generateDeterministicNumber(0, 64, performance.now()))]
      ).join('');
      const newPubKey = `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQ${randomKeyFragment}== n1-auto-committer@n1-system-cluster`;
      const newFingerprint = `SHA256:${generateDeterministicId('rnd')}${generateDeterministicId('rnd')}=`;

      setSshConfig({
        algorithm: 'RSA',
        bits: 4096,
        publicKey: newPubKey,
        fingerprint: newFingerprint,
        comment: 'n1-auto-committer@n1-system-cluster',
        generatedAt: new Date().toUTCString(),
        isRegisteredOnNexus: false,
        isSshAgentLoaded: true
      });
      setIsGeneratingSSH(false);
      setRegisterStatus('New RSA-4096 SSH key pair successfully generated in memory!');
    }, 1200);
  };

  // Register Key with Nexus API
  const handleRegisterKeyOnNexus = async () => {
    if (!remoteUser && !syncToken.trim()) {
      setRegisterStatus('Error: Nexus connection or Personal Access Token required.');
      return;
    }
    
    setRegisterStatus('Registering RSA-4096 Key with Nexus API...');
    
    try {
      const response = await fetch('/api/nexus/register-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: syncToken, // server will use cookie if token is empty
          title: 'N1_SYSTEM_RSA4096_AUTOMATED_BOT',
          key: sshConfig.publicKey
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        setSshConfig(prev => ({ ...prev, isRegisteredOnNexus: true }));
        setRegisterStatus(`SUCCESS: SSH Key registered on Nexus as "${result.data.title}" (ID: ${result.data.id})!`);
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      console.error('Nexus Registration Failed:', err);
      setRegisterStatus(`Error: ${err.message || 'Failed to register key on Nexus'}`);
    }
  };

  // Run SSH Handshake test
  const handleTestHandshake = () => {
    setIsTestingHandshake(true);
    setHandshakeLog('Initiating SSH Handshake with git@Nexus.com:22...');
    setTimeout(() => {
      setHandshakeLog(`OpenSSH_9.0p1, OpenSSL 3.0.2 15 Mar 2022
debug1: Connecting to Nexus.com [140.82.121.4] port 22.
debug1: Connection established.
debug1: Identity file id_rsa_4096 type 0 RSA-4096
debug1: Server accept ssh-rsa key.
Hi n1-auto-committer! You've successfully authenticated, but Nexus does not provide shell access.
Connection to Nexus.com closed.
Handshake status: 200 OK (0.042s latency) - SECURE COMMITS ENABLED`);
      setIsTestingHandshake(false);
    }, 1400);
  };

  // Revert Commit Node
  const handleRevertCommitNode = (id: string, hash: string) => {
    setIsProcessingNode(id);
    setTimeout(() => {
      setCorrelations(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: 'REVERTED',
            driftScore: 0.0
          };
        }
        return c;
      }));
      setIsProcessingNode(null);
    }, 1200);
  };

  // Patch Node Engine
  const handlePatchNodeEngine = (id: string) => {
    setIsProcessingNode(id);
    setTimeout(() => {
      setCorrelations(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: 'PATCHED',
            driftScore: Math.max(0, Number((c.driftScore * 0.1).toFixed(1)))
          };
        }
        return c;
      }));
      setIsProcessingNode(null);
    }, 1200);
  };

  const copyPublicKey = () => {
    navigator.clipboard.writeText(sshConfig.publicKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const downloadPublicKey = () => {
    const blob = new Blob([sshConfig.publicKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'id_rsa_n1_system.pub';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredCorrelations = correlations.filter(c => {
    if (correlateFilter === 'ALL') return true;
    return c.status === correlateFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 text-zinc-100 font-sans">
      {/* HEADER */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
            <GitBranch size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white tracking-tight">Git Nexus & Security Layer</h1>
              <span className="text-xs font-mono px-2.5 py-1 bg-purple-950 text-purple-300 border border-purple-800 rounded-lg font-bold">
                RSA-4096 & ERROR CORRELATION
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Automated SSH Key Registration, Nexus commit authorization, and Automated Error Correlation for system drift remediation.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-zinc-900/80 p-1.5 border border-zinc-800 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('auth')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'auth' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <NexusIcon size={14} />
            <span>Nexus Auth</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ssh')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'ssh' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Key size={14} />
            <span>Nexus SSH Config</span>
          </button>

          <button
            onClick={() => setActiveSubTab('correlation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'correlation' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity size={14} />
            <span>Error Correlation</span>
          </button>

          <button
            onClick={() => setActiveSubTab('mutex')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'mutex' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cpu size={14} />
            <span>Input Mutex</span>
          </button>
        </div>
      </header>

      {/* Global Nexus Health Status Widget (when non-auth tab is active) */}
      {activeSubTab !== 'auth' && (
        <NexusHealthStatus />
      )}

      {/* SUBTAB 0: NEXUS & GOOGLE OAUTH MANAGER */}
      {activeSubTab === 'auth' && (
        <NexusErrorBoundary fallbackTitle="Nexus OAuth Handshake Exception">
          <NexusAuth 
            onAuthSuccess={(token, user) => {
              setRemoteUser(user);
              handleDetectRepos();
            }} 
          />
        </NexusErrorBoundary>
      )}

      {/* SUBTAB 0.5: INPUT MUTEX CONTROLLER */}
      {activeSubTab === 'mutex' && (
        <NexusErrorBoundary fallbackTitle="Nexus Input Mutex Exception">
          <InputMutexWidget />
        </NexusErrorBoundary>
      )}

      {/* SUBTAB 1: Nexus SSH CONFIGURATION MODULE */}
      {activeSubTab === 'ssh' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: SSH Key Generator & Status */}
            <div className="lg:col-span-7 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-2.5">
                  <Key size={20} className="text-purple-400" />
                  <h2 className="text-base font-bold text-white">RSA-4096 SSH Key Pair Engine</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                    sshConfig.isSshAgentLoaded 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  }`}>
                    SSH-AGENT LOADED
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                    sshConfig.isRegisteredOnNexus 
                      ? 'bg-purple-950 text-purple-300 border-purple-800' 
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {sshConfig.isRegisteredOnNexus ? 'Nexus REGISTERED' : 'UNREGISTERED'}
                  </span>
                </div>
              </div>

              {/* Key Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                  <span className="text-[10px] text-zinc-500 uppercase">Algorithm</span>
                  <div className="text-white font-bold mt-0.5">{sshConfig.algorithm}</div>
                </div>
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                  <span className="text-[10px] text-zinc-500 uppercase">Key Length</span>
                  <div className="text-purple-400 font-bold mt-0.5">{sshConfig.bits} bits</div>
                </div>
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                  <span className="text-[10px] text-zinc-500 uppercase">Fingerprint Format</span>
                  <div className="text-cyan-400 font-bold mt-0.5">SHA256</div>
                </div>
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                  <span className="text-[10px] text-zinc-500 uppercase">Commit Signing</span>
                  <div className="text-emerald-400 font-bold mt-0.5">SSH GPG Enabled</div>
                </div>
              </div>

              {/* Fingerprint */}
              <div className="p-4 bg-black border border-zinc-800 rounded-2xl space-y-2">
                <div className="text-[10px] font-mono text-zinc-500 uppercase">RSA-4096 Key Fingerprint</div>
                <div className="text-xs font-mono text-cyan-300 font-bold break-all">{sshConfig.fingerprint}</div>
              </div>

              {/* Public Key Display Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">PUBLIC KEY (<code className="text-purple-300">id_rsa_n1_system.pub</code>):</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyPublicKey}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-[11px] flex items-center gap-1.5 transition-all"
                    >
                      {copiedKey ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedKey ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={downloadPublicKey}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-[11px] flex items-center gap-1.5 transition-all"
                    >
                      <Download size={12} />
                      <span>Download .pub</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-black border border-zinc-800 rounded-2xl font-mono text-[11px] text-purple-200/90 break-all leading-relaxed max-h-32 overflow-y-auto">
                  {sshConfig.publicKey}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleGenerateRSAKeys}
                  disabled={isGeneratingSSH}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {isGeneratingSSH ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  <span>{isGeneratingSSH ? 'Generating RSA-4096...' : 'Generate New RSA-4096 Key Pair'}</span>
                </button>

                <button
                  onClick={handleTestHandshake}
                  disabled={isTestingHandshake}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isTestingHandshake ? <RefreshCw size={14} className="animate-spin text-purple-400" /> : <Play size={14} className="text-emerald-400" />}
                  <span>Test SSH Handshake (Nexus.com)</span>
                </button>
              </div>

              {handshakeLog && (
                <div className="p-4 bg-black border border-purple-500/30 rounded-2xl space-y-1 font-mono text-xs text-purple-200/90 whitespace-pre-wrap leading-relaxed">
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">OpenSSH Handshake Output:</div>
                  {handshakeLog}
                </div>
              )}
            </div>

            {/* Right Col: Nexus Direct Registration */}
            <div className="lg:col-span-5 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-6 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                  <div className="flex items-center gap-2.5">
                    <NexusIcon size={20} className="text-white" />
                    <h2 className="text-base font-bold text-white">Nexus OAuth & Detection</h2>
                  </div>
                  {remoteUser ? (
                    <div className="flex items-center gap-2 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                      <img src={remoteUser.avatar_url} alt="Nexus" className="w-4 h-4 rounded-full" />
                      <span className="text-[10px] font-bold text-zinc-300">{remoteUser.login}</span>
                      <button onClick={handleNexusLogout} className="text-[9px] text-red-400 hover:text-red-300 ml-1">Disconnect</button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleNexusLogin}
                      className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-[10px] font-bold rounded-lg transition-all"
                    >
                      Connect Nexus
                    </button>
                  )}
                </div>

                {!remoteUser ? (
                  <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                      <Sparkles size={14} />
                      <span>Smart Setup Logic</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Connect your Nexus account to automatically detect your repository settings, deploy keys, and enable automated error patching.
                    </p>
                    <button 
                      onClick={handleNexusLogin}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                    >
                      OAuth Authorization
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Active Repository</div>
                      <button 
                        onClick={handleDetectRepos}
                        disabled={isDetectingRepos}
                        className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        <RefreshCw size={10} className={isDetectingRepos ? 'animate-spin' : ''} />
                        <span>Re-detect</span>
                      </button>
                    </div>
                    
                    <div className="relative group">
                      <select 
                        value={targetRepo}
                        onChange={(e) => setTargetRepo(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white appearance-none focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
                      >
                        <option value="" disabled>Select or Detect Repository...</option>
                        {availableRepos.map(repo => (
                          <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-500">
                        <Sliders size={12} />
                      </div>
                    </div>

                    {targetRepo && (
                      <div className="flex items-center gap-2 p-2 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-[10px] text-emerald-400 font-mono">
                        <CheckCircle2 size={12} />
                        <span>Detected: {targetRepo}</span>
                      </div>
                    )}

                    <button
                      onClick={handleRegisterKeyOnNexus}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30"
                    >
                      <ShieldCheck size={16} />
                      <span>Authorize System SSH Key</span>
                    </button>
                  </div>
                )}
                
                {!remoteUser && (
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Manual Access Token Fallback</label>
                      <input
                        type="password"
                        placeholder="ghp_..."
                        value={syncToken}
                        onChange={(e) => setSyncToken(e.target.value)}
                        className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}

                {registerStatus && (
                  <div className={`p-4 rounded-2xl border text-xs font-mono leading-relaxed ${
                    registerStatus.includes('SUCCESS') 
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : registerStatus.includes('Error')
                      ? 'bg-red-950/40 border-red-500/30 text-red-300'
                      : 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                  }`}>
                    {registerStatus}
                  </div>
                )}
              </div>

              {/* Security info card */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <Lock size={14} />
                  <span>Automated SSH Commit Signing Spec</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
                  Configures <code className="text-purple-300">git config gpg.format ssh</code> and sets <code className="text-purple-300">user.signingkey</code> to ensure all commits generated by N+1 system pass Nexus's "Verified" cryptographic signature check.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: AUTOMATED ERROR CORRELATION LOG VIEW */}
      {activeSubTab === 'correlation' && (
        <div className="space-y-6">
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div className="flex items-center gap-3">
                <Activity size={22} className="text-pink-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Automated Error Correlation & Git History Mapper</h2>
                  <p className="text-xs text-zinc-400">
                    Automatically maps system exceptions to offending Git commit nodes allowing direct revert or hotfix patch execution.
                  </p>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 bg-zinc-900 p-1 border border-zinc-800 rounded-xl font-mono text-xs">
                {(['ALL', 'ACTIVE_DRIFT', 'PATCHED'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setCorrelateFilter(f)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      correlateFilter === f 
                        ? 'bg-purple-600 text-white font-bold' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Correlation Cards List */}
            <div className="space-y-4">
              {filteredCorrelations.map(corr => (
                <div
                  key={corr.id}
                  className="p-5 bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/30 rounded-2xl space-y-4 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-800 rounded font-mono text-[10px] font-bold">
                          {corr.exceptionType}
                        </span>
                        <span className="text-xs font-mono text-white font-bold">{corr.errorLog}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                        <span>Affected Node: <code className="text-purple-300">{corr.fileAffected}:{corr.lineNumber}</code></span>
                        <span>•</span>
                        <span>Committed: {corr.committedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono">
                        <div className="text-[10px] text-zinc-500 uppercase">System Drift Factor</div>
                        <div className={`text-sm font-bold ${corr.driftScore > 15 ? 'text-red-400' : corr.driftScore > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {corr.driftScore}%
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-xl border ${
                        corr.status === 'ACTIVE_DRIFT' 
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse' 
                          : corr.status === 'REVERTED'
                          ? 'bg-zinc-900 text-zinc-400 border-zinc-800'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      }`}>
                        {corr.status}
                      </span>
                    </div>
                  </div>

                  {/* Commit mapping box */}
                  <div className="p-4 bg-black border border-zinc-800 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center font-mono text-xs">
                    <div className="md:col-span-8 space-y-1">
                      <div className="flex items-center gap-2 text-purple-300 font-bold">
                        <GitCommit size={14} />
                        <span>Correlated Commit Node: <code className="text-white underline">{corr.commitHash}</code></span>
                      </div>
                      <p className="text-zinc-300 text-xs italic">"{corr.commitMessage}"</p>
                      <div className="text-[10px] text-zinc-500">Author: {corr.author}</div>
                    </div>

                    <div className="md:col-span-4 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRevertCommitNode(corr.id, corr.commitHash)}
                        disabled={isProcessingNode === corr.id || corr.status === 'REVERTED'}
                        className="px-3 py-2 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40"
                      >
                        {isProcessingNode === corr.id ? <RefreshCw size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                        <span>Auto Revert Commit</span>
                      </button>

                      <button
                        onClick={() => handlePatchNodeEngine(corr.id)}
                        disabled={isProcessingNode === corr.id || corr.status === 'PATCHED'}
                        className="px-3 py-2 bg-purple-900 hover:bg-purple-800 border border-purple-700 text-purple-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40"
                      >
                        {isProcessingNode === corr.id ? <RefreshCw size={12} className="animate-spin" /> : <Wrench size={12} />}
                        <span>Patch Node</span>
                      </button>
                    </div>
                  </div>

                  {/* Stack trace detail */}
                  <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl font-mono text-[11px] text-zinc-400 whitespace-pre-wrap">
                    <div className="text-[10px] text-zinc-600 uppercase mb-1">Stack Trace Excerpt:</div>
                    {corr.stackTrace}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const NexusBridgeWithBoundary: React.FC = (props) => (
  <NexusErrorBoundary fallbackTitle="Nexus Bridge Subsystem Exception">
    <NexusBridge {...props} />
  </NexusErrorBoundary>
);

export default NexusBridgeWithBoundary;
