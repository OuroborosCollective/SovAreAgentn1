import { AuditLogEntry } from '../../types';

class SystemAuditLogService {
  private logs: AuditLogEntry[] = [];
  private listeners: ((log: AuditLogEntry) => void)[] = [];

  log(module: string, action: string, status: AuditLogEntry['status'], hash: string = 'N/A') {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      module,
      action,
      status,
      hash
    };
    this.logs.push(entry);
    this.notify(entry);
    
    // Persist to local storage for persistence across reloads
    try {
        const existing = JSON.parse(localStorage.getItem('ouroboros_audit_log') || '[]');
        existing.push(entry);
        localStorage.setItem('ouroboros_audit_log', JSON.stringify(existing.slice(-100)));
    } catch (e) {
        console.warn('Failed to persist audit log', e);
    }
  }

  getLogs(): AuditLogEntry[] {
    return this.logs;
  }

  subscribe(listener: (log: AuditLogEntry) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(log: AuditLogEntry) {
    this.listeners.forEach(l => l(log));
  }
}

export const SystemAuditLog = new SystemAuditLogService();
