import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';

export interface NexusErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

export interface NexusErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class NexusErrorBoundary extends Component<NexusErrorBoundaryProps, NexusErrorBoundaryState> {
  public state: NexusErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  constructor(props: NexusErrorBoundaryProps) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): NexusErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Nexus Bridge Error Boundary Caught Exception]:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public handleReset = async () => {
    try {
      await fetch('/api/self-heal', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      console.warn('[SelfHeal] Network self-heal call failed silently, proceeding with local reset.');
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-zinc-950 border border-rose-900/60 rounded-3xl space-y-4 shadow-2xl my-4">
          <div className="flex items-center gap-3 border-b border-rose-900/40 pb-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {this.props.fallbackTitle || 'Nexus Bridge Component Exception'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded font-bold">
                  CONTAINED EXCEPTION
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                The OAuth handshake or Nexus component encountered an exception. The parent application remains healthy.
              </p>
            </div>
          </div>

          <div className="p-4 bg-black/80 border border-zinc-800 rounded-2xl font-mono text-xs space-y-2">
            <div className="text-rose-400 font-bold flex items-center gap-1.5">
              <AlertTriangle size={14} />
              <span>{this.state.error?.name || 'Exception'}: {this.state.error?.message || 'Unknown OAuth runtime error'}</span>
            </div>
            {this.state.error?.stack && (
              <pre className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-zinc-400 text-[10px] overflow-x-auto max-h-40 scrollbar-thin">
                {this.state.error.stack}
              </pre>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-500 font-mono">
              Self-Healing Active • Error isolated from App Root
            </span>

            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
            >
              <RefreshCw size={14} />
              <span>Reset & Retry Nexus Bridge</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
