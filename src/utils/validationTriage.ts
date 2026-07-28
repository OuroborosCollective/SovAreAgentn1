import { runCompleteRuntimeValidation, ValidationTestResult } from './runtimeValidator';

export interface TriageFailureEvent {
  id: string;
  timestamp: string;
  testName: string;
  category: string;
  details: string;
  status: 'CAPTURED' | 'TRIAGED' | 'HEALING_INITIATED' | 'RESOLVED';
  assignedErrorCategory: string;
  repairRoutine: string;
}

class ValidationTriageManager {
  private failureLog: TriageFailureEvent[] = [];
  private listeners: Set<(events: TriageFailureEvent[]) => void> = new Set();

  public subscribe(cb: (events: TriageFailureEvent[]) => void) {
    this.listeners.add(cb);
    cb(this.failureLog);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.failureLog));
  }

  public async runAndCaptureFailures(): Promise<{ results: ValidationTestResult[]; triageEvents: TriageFailureEvent[] }> {
    const report = await runCompleteRuntimeValidation();
    const newFailures: TriageFailureEvent[] = [];

    for (const test of report.results) {
      if (!test.success) {
        const failureEvent: TriageFailureEvent = {
          id: `triage-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: new Date().toISOString(),
          testName: test.testName,
          category: test.category,
          details: test.details,
          status: 'TRIAGED',
          assignedErrorCategory: this.mapCategoryToFamily(test.category),
          repairRoutine: this.recommendRepairRoutine(test.testName)
        };
        newFailures.push(failureEvent);
        this.failureLog.unshift(failureEvent);

        // Automatically route to SystemBugHunt backend service
        this.dispatchToBugHuntService(failureEvent).catch(err => {
          console.warn('[ValidationTriage]: Failed to dispatch failure event to backend bug hunt service:', err);
        });
      }
    }

    if (newFailures.length > 0) {
      this.notify();
    }

    return { results: report.results, triageEvents: this.failureLog };
  }

  private mapCategoryToFamily(category: string): string {
    switch (category) {
      case 'API_ENDPOINT': return 'Fehlerfamilie 4: Docker & Sockets / HTTP';
      case 'VOICE_SERVICE': return 'Fehlerfamilie 3: Token-Buffer & Voice Stream';
      case 'BUFFER_STATE': return 'Fehlerfamilie 1: Sync- & Buffer-Anomalien';
      case 'DETERMINISTIC_ROUTER': return 'Fehlerfamilie 2: Rekursive Heuristik & Router';
      default: return 'Fehlerfamilie 5: Null-Reference & Logic Defect';
    }
  }

  private recommendRepairRoutine(testName: string): string {
    if (testName.includes('freellm')) return 'Re-initialize FreeLLM proxy router and flush token queue';
    if (testName.includes('Voice') || testName.includes('Buffer')) return 'Reset audio context stream buffer and re-sync millisecond offset';
    if (testName.includes('429')) return 'Apply exponential backoff and activate fallback routing tier';
    return 'Acquire Distributed Mutex Lock & Flush In-Memory Write-Ahead Log';
  }

  private async dispatchToBugHuntService(event: TriageFailureEvent) {
    try {
      await fetch('/api/bughunt/autofix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_id: event.id,
          test_name: event.testName,
          category: event.assignedErrorCategory,
          repair_routine: event.repairRoutine,
          source: 'SystemValidationTestbed'
        })
      });
      event.status = 'HEALING_INITIATED';
      this.notify();
    } catch (e) {
      console.warn('[ValidationTriage]: Network error dispatching to bug hunt service:', e);
    }
  }

  public getFailureEvents(): TriageFailureEvent[] {
    return this.failureLog;
  }

  public clearEvents() {
    this.failureLog = [];
    this.notify();
  }
}

export const validationTriageManager = new ValidationTriageManager();
