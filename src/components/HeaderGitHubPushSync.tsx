import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitPullRequest, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, 
  ArrowUpRight, Github, Send, AlertTriangle, Download, GitMerge, 
  ShieldAlert, ToggleLeft, ToggleRight, Info 
} from 'lucide-react';

interface HeaderGitHubPushSyncProps {
  repoUrl?: string;
}

export interface ConflictingFile {
  path: string;
  localModifiedAt: number;
  description: string;
}

export type SyncStatusType = 'in-sync' | 'remote-ahead' | 'local-ahead' | 'diverged' | 'conflict' | 'error';

export function useGitHubSyncMonitor(intervalMs = 10000) {
  const [syncState, setSyncState] = useState<{
    hasUncommittedChanges: boolean;
    uncommittedCount: number;
    fileCount: number;
    lastSyncTimestamp: number;
    syncStatus: SyncStatusType;
    conflictingFiles: ConflictingFile[];
    remoteModifiedFiles: string[];
    remoteCommitSha: string | null;
    autoSyncEnabled: boolean;
    isChecking: boolean;
    isMirrorSyncing: boolean;
    repoUrl: string;
    error: string | null;
  }>({
    hasUncommittedChanges: false,
    uncommittedCount: 0,
    fileCount: 0,
    lastSyncTimestamp: 0,
    syncStatus: 'in-sync',
    conflictingFiles: [],
    remoteModifiedFiles: [],
    remoteCommitSha: null,
    autoSyncEnabled: true,
    isChecking: false,
    isMirrorSyncing: false,
    repoUrl: 'https://github.com/OuroborosCollective/SovAreAgentn1',
    error: null,
  });

  const checkSyncStatus = useCallback(async () => {
    setSyncState((prev) => ({ ...prev, isChecking: true }));
    try {
      const res = await fetch('/api/nexus/status');
      if (res.ok) {
        const data = await res.json();
        const status: SyncStatusType = data.syncStatus || (data.hasUncommittedChanges ? 'local-ahead' : 'in-sync');

        setSyncState((prev) => {
          const nextState = {
            hasUncommittedChanges: !!data.hasUncommittedChanges,
            uncommittedCount: data.uncommittedCount || 0,
            fileCount: data.fileCount || 0,
            lastSyncTimestamp: data.lastSyncTimestamp || 0,
            syncStatus: status,
            conflictingFiles: data.conflictingFiles || [],
            remoteModifiedFiles: data.remoteModifiedFiles || [],
            remoteCommitSha: data.remoteCommitSha || null,
            autoSyncEnabled: typeof data.autoSyncEnabled === 'boolean' ? data.autoSyncEnabled : prev.autoSyncEnabled,
            isChecking: false,
            isMirrorSyncing: prev.isMirrorSyncing,
            repoUrl: data.repoUrl || 'https://github.com/OuroborosCollective/SovAreAgentn1',
            error: null,
          };

          // Auto Mirror Sync logic: if remote is ahead and autoSyncEnabled and no conflicts, auto-trigger mirror-sync
          if (nextState.autoSyncEnabled && status === 'remote-ahead' && !prev.isMirrorSyncing && nextState.conflictingFiles.length === 0) {
            triggerMirrorSyncInternal();
          }

          return nextState;
        });
      } else {
        setSyncState((prev) => ({ ...prev, isChecking: false }));
      }
    } catch (err: any) {
      setSyncState((prev) => ({ ...prev, isChecking: false, error: err.message }));
    }
  }, []);

  const triggerMirrorSyncInternal = async () => {
    setSyncState((prev) => ({ ...prev, isMirrorSyncing: true }));
    try {
      const res = await fetch('/api/nexus/mirror-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPush: false })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncState((prev) => ({
          ...prev,
          isMirrorSyncing: false,
          syncStatus: data.syncStatus || 'in-sync',
          conflictingFiles: data.conflictingFiles || []
        }));
      } else {
        setSyncState((prev) => ({ ...prev, isMirrorSyncing: false, error: data.message }));
      }
    } catch (err: any) {
      setSyncState((prev) => ({ ...prev, isMirrorSyncing: false, error: err.message }));
    }
  };

  const triggerMirrorSync = async (autoPush = false) => {
    setSyncState((prev) => ({ ...prev, isMirrorSyncing: true }));
    try {
      const res = await fetch('/api/nexus/mirror-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPush })
      });
      const data = await res.json();
      await checkSyncStatus();
      setSyncState((prev) => ({ ...prev, isMirrorSyncing: false }));
      return data;
    } catch (err: any) {
      setSyncState((prev) => ({ ...prev, isMirrorSyncing: false, error: err.message }));
      throw err;
    }
  };

  const pullRemote = async (force = false) => {
    setSyncState((prev) => ({ ...prev, isMirrorSyncing: true }));
    try {
      const res = await fetch('/api/nexus/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      });
      const data = await res.json();
      await checkSyncStatus();
      setSyncState((prev) => ({ ...prev, isMirrorSyncing: false }));
      return data;
    } catch (err: any) {
      setSyncState((prev) => ({ ...prev, isMirrorSyncing: false, error: err.message }));
      throw err;
    }
  };

  const resolveConflict = async (strategy: 'use-local' | 'use-remote' | 'manual', files?: any) => {
    setSyncState((prev) => ({ ...prev, isMirrorSyncing: true }));
    try {
      const res = await fetch('/api/nexus/conflicts/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, files })
      });
      const data = await res.json();
      await checkSyncStatus();
      setSyncState((prev) => ({ ...prev, isMirrorSyncing: false }));
      return data;
    } catch (err: any) {
      setSyncState((prev) => ({ ...prev, isMirrorSyncing: false, error: err.message }));
      throw err;
    }
  };

  const toggleAutoSync = async () => {
    const nextVal = !syncState.autoSyncEnabled;
    setSyncState((prev) => ({ ...prev, autoSyncEnabled: nextVal }));
    try {
      await fetch('/api/nexus/mirror-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleAutoSync: nextVal })
      });
    } catch (e) {}
  };

  useEffect(() => {
    checkSyncStatus();
    const timer = setInterval(checkSyncStatus, intervalMs);
    const handleFocus = () => checkSyncStatus();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkSyncStatus, intervalMs]);

  return {
    ...syncState,
    checkSyncStatus,
    triggerMirrorSync,
    pullRemote,
    resolveConflict,
    toggleAutoSync
  };
}

export const HeaderGitHubPushSync: React.FC<HeaderGitHubPushSyncProps> = ({
  repoUrl = "https://github.com/OuroborosCollective/SovAreAgentn1"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [status, setStatus] = useState<{
    type: 'idle' | 'success' | 'error' | 'conflict';
    message?: string;
    commitSha?: string;
    filesPushed?: number;
    branch?: string;
  }>({ type: 'idle' });

  const syncMonitor = useGitHubSyncMonitor();

  const handlePush = async () => {
    setIsPushing(true);
    setStatus({ type: 'idle' });

    try {
      const storedToken = localStorage.getItem('n1_github_token') || localStorage.getItem('n1_nexus_access_token') || undefined;
      const msg = commitMessage.trim() || `feat: automatic repository mirror sync [${new Date().toISOString()}]`;

      const res = await fetch('/api/nexus/push-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          ...(storedToken ? { token: storedToken } : {}),
          repoUrl
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setStatus({
          type: 'success',
          message: data.message || 'Repository synchronized & pushed successfully',
          commitSha: data.commitSha,
          filesPushed: data.filesPushed || syncMonitor.fileCount,
          branch: data.branch || 'main'
        });
        setCommitMessage('');
        setTimeout(() => syncMonitor.checkSyncStatus(), 500);
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'Push sync failed. Verify repository permissions.'
        });
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Network error during GitHub push'
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    setIsPulling(true);
    setStatus({ type: 'idle' });

    try {
      const data = await syncMonitor.pullRemote();
      if (data.status === 'success') {
        setStatus({
          type: 'success',
          message: data.message || 'Successfully pulled remote repository changes into local workspace.',
          commitSha: data.remoteCommitSha
        });
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'Pull operation failed.'
        });
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Failed to pull remote changes.'
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleResolveConflict = async (strategy: 'use-local' | 'use-remote') => {
    setIsResolving(true);
    setStatus({ type: 'idle' });

    try {
      const data = await syncMonitor.resolveConflict(strategy);
      if (data.status === 'success') {
        setStatus({
          type: 'success',
          message: data.message || `Conflict resolved using strategy '${strategy}'.`
        });
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'Failed to resolve conflict.'
        });
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Error resolving conflict.'
      });
    } finally {
      setIsResolving(false);
    }
  };

  const isConflict = syncMonitor.syncStatus === 'conflict' || syncMonitor.conflictingFiles.length > 0;
  const isRemoteAhead = syncMonitor.syncStatus === 'remote-ahead';

  return (
    <>
      {/* Top Header Navigation Button with Dynamic Status Indicators */}
      <button
        onClick={() => {
          setIsOpen(true);
          syncMonitor.checkSyncStatus();
        }}
        className={`flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border ${
          isConflict
            ? 'border-red-500/80 shadow-red-500/20 bg-red-950/20'
            : isRemoteAhead
            ? 'border-indigo-500/80 shadow-indigo-500/20 bg-indigo-950/20'
            : syncMonitor.hasUncommittedChanges
            ? 'border-amber-500/60 shadow-amber-500/10'
            : 'border-zinc-700/80 hover:border-zinc-500'
        } text-zinc-100 font-medium rounded-xl transition-all shadow-sm group shrink-0 relative`}
        title={
          isConflict
            ? `${syncMonitor.conflictingFiles.length} Merge Conflict(s) Detected! Click to resolve`
            : isRemoteAhead
            ? "Remote updates available — Auto-pull ready"
            : syncMonitor.hasUncommittedChanges
            ? `${syncMonitor.uncommittedCount} uncommitted file change(s) detected — Click to push`
            : "Automatic Git Mirroring Active — Workspace synchronized"
        }
      >
        <div className="relative flex items-center justify-center">
          <Github size={15} className="text-white group-hover:scale-110 transition-transform" />
          
          {/* Status Ping Badges */}
          {isConflict ? (
            <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
          ) : isRemoteAhead ? (
            <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
            </span>
          ) : syncMonitor.hasUncommittedChanges ? (
            <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
          ) : null}
        </div>

        <span className="hidden sm:inline font-mono text-xs text-zinc-200">Git Mirror</span>

        {/* Dynamic Status Pills */}
        {isConflict ? (
          <span className="px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-300 font-mono font-bold rounded-full border border-red-500/40 flex items-center gap-1 animate-pulse">
            <ShieldAlert size={10} />
            <span>Conflict ({syncMonitor.conflictingFiles.length})</span>
          </span>
        ) : isRemoteAhead ? (
          <span className="px-1.5 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 font-mono font-bold rounded-full border border-indigo-500/40 flex items-center gap-1">
            <Download size={10} />
            <span>Pull Available</span>
          </span>
        ) : syncMonitor.hasUncommittedChanges ? (
          <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold rounded-full border border-amber-500/30 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>{syncMonitor.uncommittedCount} modified</span>
          </span>
        ) : (
          <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 font-mono rounded-full border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 size={10} />
            <span>Synced</span>
          </span>
        )}

        {syncMonitor.isMirrorSyncing || isPushing || isPulling ? (
          <RefreshCw size={12} className="animate-spin text-indigo-400 ml-0.5" />
        ) : (
          <ArrowUpRight size={12} className="text-zinc-400 group-hover:text-white transition-colors" />
        )}
      </button>

      {/* Sync & Mirror Management Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  isConflict 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}>
                  <GitMerge size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Git Repository Mirror Sync
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono truncate max-w-xs">
                    {repoUrl}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Auto-Sync Mirroring Toggle Controls */}
            <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <RefreshCw size={16} className={`text-indigo-400 ${syncMonitor.autoSyncEnabled ? 'animate-spin-slow' : ''}`} />
                <div>
                  <div className="text-xs font-bold text-zinc-100">Automatic Git Mirroring</div>
                  <div className="text-[10px] text-zinc-400">
                    {syncMonitor.autoSyncEnabled 
                      ? 'Periodically fetches remote changes every 10s & auto-pulls updates' 
                      : 'Automatic background synchronization is disabled'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={syncMonitor.toggleAutoSync}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                  syncMonitor.autoSyncEnabled
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {syncMonitor.autoSyncEnabled ? (
                  <>
                    <ToggleRight size={18} className="text-indigo-400" />
                    <span>Auto-Sync ON</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft size={18} className="text-zinc-500" />
                    <span>Auto-Sync OFF</span>
                  </>
                )}
              </button>
            </div>

            {/* Target Repo Info Card */}
            <div className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-500 text-[10px] uppercase">Target Repository</span>
                <span className="text-zinc-200 font-medium">OuroborosCollective/SovAreAgentn1</span>
              </div>
              <div className="flex items-center gap-3">
                {syncMonitor.remoteCommitSha && (
                  <span className="text-[11px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">
                    HEAD: <strong className="text-indigo-300">{syncMonitor.remoteCommitSha.slice(0, 7)}</strong>
                  </span>
                )}
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-[11px] underline"
                >
                  <span>Repo</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* MERGE CONFLICT INSPECTOR PANEL */}
            {isConflict && (
              <div className="p-4 bg-red-950/50 border border-red-500/50 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-red-500/30 pb-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <ShieldAlert size={18} />
                    <span>Merge Conflict Detected ({syncMonitor.conflictingFiles.length} file(s))</span>
                  </div>
                  <span className="text-[10px] text-red-300 font-mono bg-red-900/40 px-2 py-0.5 rounded border border-red-500/30">
                    Manual Action Required
                  </span>
                </div>

                <p className="text-xs text-red-200/90 leading-relaxed">
                  Local workspace files have uncommitted edits that conflict with updated commits on remote repository. Choose a resolution strategy below:
                </p>

                {/* Conflicting Files List */}
                <div className="bg-black/60 border border-red-900/60 rounded-lg p-2.5 max-h-36 overflow-y-auto flex flex-col gap-1.5 font-mono text-[11px]">
                  {syncMonitor.conflictingFiles.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between text-zinc-300 py-1 px-2 bg-red-900/20 rounded border border-red-800/30">
                      <span className="truncate text-red-300 font-medium">{c.path}</span>
                      <span className="text-[10px] text-zinc-400 shrink-0">Edit Conflict</span>
                    </div>
                  ))}
                </div>

                {/* Conflict Resolution Buttons */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleResolveConflict('use-remote')}
                    disabled={isResolving}
                    className="flex-1 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>Accept Remote Version</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolveConflict('use-local')}
                    disabled={isResolving}
                    className="flex-1 py-2 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>Keep Local & Prepare Push</span>
                  </button>
                </div>
              </div>
            )}

            {/* Live Sync Status Banner */}
            {!isConflict && (
              syncMonitor.hasUncommittedChanges ? (
                <div className="p-3.5 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300 font-mono">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                    <span>{syncMonitor.uncommittedCount} local uncommitted file edit(s)</span>
                  </div>
                  <span className="text-[10px] text-amber-400/80">Local Ahead</span>
                </div>
              ) : isRemoteAhead ? (
                <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs text-indigo-300 font-mono">
                  <div className="flex items-center gap-2">
                    <Download size={15} className="text-indigo-400 shrink-0" />
                    <span>Remote updates available for auto-pull</span>
                  </div>
                  <span className="text-[10px] text-indigo-400/80">Remote Ahead</span>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-300 font-mono">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Local & Remote are in sync ({syncMonitor.fileCount} files tracked)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">In Sync</span>
                </div>
              )
            )}

            {/* Status Feedback Display */}
            {status.type === 'success' && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex flex-col gap-1.5 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 size={16} />
                  <span>{status.message}</span>
                </div>
                {status.commitSha && (
                  <div className="font-mono text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>Commit: <strong className="text-emerald-300">{status.commitSha.slice(0, 7)}</strong></span>
                    {status.filesPushed && <span>{status.filesPushed} files synchronized</span>}
                  </div>
                )}
              </div>
            )}

            {status.type === 'error' && (
              <div className="p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>{status.message}</span>
              </div>
            )}

            {/* Commit Message Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                <span>Push Commit Message</span>
                <span className="text-[10px] text-zinc-500 font-mono">Optional</span>
              </label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="feat: automatic repository mirror sync"
                className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={isPushing || isPulling}
              />
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handlePull}
                disabled={isPulling || isPushing || isConflict}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 disabled:opacity-50 text-indigo-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isPulling ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-indigo-400" />
                    <span>Pulling...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Pull Remote Changes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePush}
                disabled={isPushing || isPulling || isConflict}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isPushing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Pushing All Files...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Push Codebase to GitHub</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

