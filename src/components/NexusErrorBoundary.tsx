import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';

export interface NexusErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

export interface NexusErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

export class NexusErrorBoundary extends Component<NexusErrorBoundaryProps, NexusErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  public state: NexusErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
    isRetrying: false
  };

  constructor(props: NexusErrorBoundaryProps) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): Partial<NexusErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Nexus Bridge Error Boundary Caught Exception]:', error, errorInfo);
    this.setState((prevState) => {
      const newRetryCount = prevState.retryCount + 1;
      
      // Auto-retry up to 3 times
      if (newRetryCount <= 3) {
        console.warn(`[SelfHeal] Initiating automated recovery attempt ${newRetryCount}/3...`);
        this.retryTimeout = setTimeout(() => {
          this.handleReset();
        }, 1500 * newRetryCount); // Exponential backoff (1.5s, 3s, 4.5s)
        
        return {
          error,
          errorInfo,
          retryCount: newRetryCount,
          isRetrying: true
        };
      }
      
      return {
        error,
        errorInfo,
        retryCount: newRetryCount,
        isRetrying: false
      };
    });
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
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
      errorInfo: null,
      isRetrying: false
    });
  };

  public handleForceClear = () => {
    console.warn('[SelfHeal] Force clearing cache and reloading...');
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-zinc-950 border border-rose-900/60 rounded-3xl space-y-4 shadow-2xl my-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 border-b border-rose-900/40 pb-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl relative">
              <ShieldAlert size={24} />
              {this.state.isRetrying && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {this.props.fallbackTitle || 'Nexus Bridge Component Exception'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded font-bold">
                  CONTAINED EXCEPTION
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {this.state.isRetrying 
                  ? `Automated recovery in progress (Attempt ${this.state.retryCount}/3)...` 
                  : 'The component encountered an exception. The parent application remains healthy.'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-black/80 border border-zinc-800 rounded-2xl font-mono text-xs space-y-2">
            <div className="text-rose-400 font-bold flex items-center gap-1.5">
              <AlertTriangle size={14} />
              <span>{this.state.error?.name || 'Exception'}: {this.state.error?.message || 'Unknown runtime error'}</span>
            </div>
            {this.state.error?.stack && (
              <pre className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-zinc-400 text-[10px] overflow-x-auto max-h-40 scrollbar-thin">
                {this.state.error.stack}
              </pre>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
              <RefreshCw size={12} className={this.state.isRetrying ? "animate-spin text-rose-400" : ""} />
              {this.state.isRetrying ? 'Self-Healing Active...' : 'Auto-recovery exhausted.'}
            </span>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={this.handleForceClear}
                className="flex-1 sm:flex-none px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={14} />
                <span>Force Cache Clear</span>
              </button>
              <button
                onClick={this.handleReset}
                disabled={this.state.isRetrying}
                className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
              >
                <RefreshCw size={14} className={this.state.isRetrying ? "animate-spin" : ""} />
                <span>{this.state.isRetrying ? 'Retrying...' : 'Manual Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

