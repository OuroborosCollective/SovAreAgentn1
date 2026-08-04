import { AREKappaRuntimeLibrary, WolframSystemStatus, MockViolation } from './arekappaRuntimeLibrary';

export interface RepairLog {
  filePath: string;
  issueSnippet: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

export class AREKappaBackgroundService {
  private static isScanning = false;
  private static serviceStatus: 'IDLE' | 'SCANNING' | 'REPAIRING' | 'ERROR' = 'IDLE';
  private static lastScanReport: WolframSystemStatus | null = null;
  private static repairLogs: RepairLog[] = [];
  private static circuitBreakerState: 'CLOSED' | 'TRIPPED' = 'CLOSED';
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Starts the persistent idle background service daemon.
   * Wakes up every 30 seconds to perform an idle check of workspace integrations.
   */
  public static startDaemon() {
    if (this.intervalId) {
      console.log('[AREKappa Background Daemon] Service is already running.');
      return;
    }

    console.log('[AREKappa Background Daemon] Initializing persistent idle monitoring service...');
    this.serviceStatus = 'IDLE';

    // Wake up every 45 seconds to perform check (low footprint, idle mode)
    this.intervalId = setInterval(async () => {
      try {
        await this.runIdleScan();
      } catch (e) {
        console.error('[AREKappa Background Daemon] Error during idle scan:', e);
      }
    }, 45000);

    // Run first scan instantly
    this.runIdleScan().catch(console.error);
  }

  /**
   * Stop the daemon if needed.
   */
  public static stopDaemon() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[AREKappa Background Daemon] Idle monitoring service stopped.');
    }
  }

  /**
   * Performs an autonomic idle scan of the codebase.
   * If critical fake/mock files are found, it trips the circuit breaker and initiates repair.
   */
  public static async runIdleScan(): Promise<WolframSystemStatus> {
    if (this.isScanning) {
      return this.lastScanReport || {
        totalFilesScanned: 0,
        mockViolations: [],
        systemHealthy: false,
        timestamp: new Date().toISOString()
      };
    }

    this.isScanning = true;
    this.serviceStatus = 'SCANNING';
    console.log('[AREKappa Background Daemon] Waking up. Performing code verification scan...');

    try {
      const report = AREKappaRuntimeLibrary.runWolframSystemScan();
      this.lastScanReport = report;

      // Trip circuit breaker if any critical mock violation is found
      const hasCriticalViolation = report.mockViolations.some(v => v.severity === 'CRITICAL');
      if (hasCriticalViolation) {
        this.circuitBreakerState = 'TRIPPED';
        console.warn(`[AREKappa Background Daemon] CRITICAL Mock/Facade Violation detected! Circuit Breaker TRIPPED to prevent downstream failure.`);
      } else {
        this.circuitBreakerState = 'CLOSED';
      }

      this.serviceStatus = 'IDLE';
      this.isScanning = false;
      return report;
    } catch (err) {
      this.serviceStatus = 'ERROR';
      this.isScanning = false;
      throw err;
    }
  }

  /**
   * Self-repairs a mock violation using the smallest capable Gemini LLM.
   */
  public static async repairViolation(filePath: string, issueSnippet: string): Promise<boolean> {
    this.serviceStatus = 'REPAIRING';
    console.log(`[AREKappa Background Daemon] Devising repair prompt & dispatching to smallest capable Gemini model for file: ${filePath}`);

    try {
      const result = await AREKappaRuntimeLibrary.executeGeminiSelfRepair(filePath, issueSnippet);
      
      if (result.success) {
        console.log(`[AREKappa Background Daemon] Autonomic repair SUCCESSFUL for: ${filePath}. Done.`);
        this.repairLogs.push({
          filePath,
          issueSnippet,
          timestamp: new Date().toISOString(),
          status: 'SUCCESS'
        });

        // Trigger a fresh scan to update state
        await this.runIdleScan();
        return true;
      } else {
        throw new Error(result.error || 'Autonomic rewrite returned empty file contents.');
      }
    } catch (err: any) {
      console.error(`[AREKappa Background Daemon] Repair failure for ${filePath}:`, err);
      this.repairLogs.push({
        filePath,
        issueSnippet,
        timestamp: new Date().toISOString(),
        status: 'FAILED',
        error: err.message || 'Model translation error'
      });
      this.serviceStatus = 'IDLE';
      return false;
    }
  }

  /**
   * Retrieves overall background service telemetry.
   */
  public static getTelemetry() {
    return {
      status: this.serviceStatus,
      circuitBreakerState: this.circuitBreakerState,
      totalFilesScanned: this.lastScanReport?.totalFilesScanned || 0,
      violationsCount: this.lastScanReport?.mockViolations.length || 0,
      mockViolations: this.lastScanReport?.mockViolations || [],
      repairLogs: this.repairLogs,
      lastScanTime: this.lastScanReport?.timestamp || null,
      daemonActive: !!this.intervalId
    };
  }
}
