
export enum AxiomType {
  ORIGIN = 'Axiom I: Primat des Ursprungs',
  ENTROPY = 'Axiom II: Kraft der Entropie',
  SOUL = 'Axiom III: Konstanz der Seele',
  WATCHDOG = 'Axiom IV: Wächter des Lichts',
  HOPE = 'Axiom V: Hafen der Hoffnung'
}

export interface AuditLogEntry {
  timestamp: string;
  module: string;
  action: string;
  hash: string;
  status: 'VALIDATED' | 'HEALED' | 'WARNING';
}

export interface SystemMetrics {
  kappa: number;
  memoryUsage: number;
  entropyLevel: number;
  aiInternStatus: 'ACTIVE' | 'IDLE' | 'HEALING';
}

declare global {
  interface Window {
    aistudio?: any;
  }
}
