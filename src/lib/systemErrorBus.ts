export interface SystemErrorEventDetail {
  errorLog: string;
  source: 'WINDOW' | 'CONSOLE' | 'PREDICTIVE_INFERENCE' | 'SIMULATED' | 'FIRESTORE';
  ruleApplied?: string;
  astFixApplied?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp?: string;
}

type ErrorListener = (detail: SystemErrorEventDetail) => void;

class SystemErrorBus {
  private listeners: ErrorListener[] = [];
  private isInitialized = false;

  public initGlobalListeners() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Listen to global uncaught errors
    window.addEventListener('error', (event) => {
      const msg = event.message || 'Uncaught TypeError in React execution thread';
      this.dispatchError({
        errorLog: msg,
        source: 'WINDOW',
        severity: 'HIGH',
        timestamp: new Date().toLocaleTimeString()
      });
    });

    // Listen to unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason ? String(event.reason?.message || event.reason) : 'UnhandledPromiseRejection';
      if (
        reason.includes('WebSocket') || 
        reason.includes('Failed to fetch') || 
        reason.includes('Load failed') ||
        reason.includes('abort')
      ) {
        return;
      }
      this.dispatchError({
        errorLog: reason,
        source: 'FIRESTORE',
        severity: 'MEDIUM',
        timestamp: new Date().toLocaleTimeString()
      });
    });
  }

  public subscribe(listener: ErrorListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public dispatchError(detail: SystemErrorEventDetail) {
    this.listeners.forEach(listener => {
      try {
        listener(detail);
      } catch (e) {
        console.warn('Error bus listener error:', e);
      }
    });

    // Also dispatch custom DOM event for decoupling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('n1:system-error-intercepted', { detail }));
    }
  }
}

export const systemErrorBus = new SystemErrorBus();
