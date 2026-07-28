/**
 * InputMutexController
 * 
 * Strict serialized FIFO queue & locking mechanism for voice commands and API handshakes.
 * Prevents overlapping concurrent voice responses, multiple "command recognized" voices,
 * or concurrent conflicting API handshakes across the Nexus Bridge ecosystem.
 */

export type MutexTaskType = 'VOICE_COMMAND' | 'API_HANDSHAKE' | 'NEXUS_SYNC';

export interface MutexTask {
  id: string;
  label: string;
  type: MutexTaskType;
  fn: () => Promise<any>;
  createdAt: string;
}

export interface MutexState {
  isLocked: boolean;
  activeTask: MutexTask | null;
  queue: MutexTask[];
  completedCount: number;
}

type MutexSubscriber = (state: MutexState) => void;

class InputMutexController {
  private queue: MutexTask[] = [];
  private activeTask: MutexTask | null = null;
  private isLocked: boolean = false;
  private completedCount: number = 0;
  private subscribers: Set<MutexSubscriber> = new Set();

  public subscribe(callback: MutexSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public getState(): MutexState {
    return {
      isLocked: this.isLocked,
      activeTask: this.activeTask,
      queue: [...this.queue],
      completedCount: this.completedCount
    };
  }

  private notify() {
    const state = this.getState();
    this.subscribers.forEach(cb => {
      try { cb(state); } catch (e) { console.error('[Mutex Listener Error]:', e); }
    });
  }

  /**
   * Enqueues an async task into the serialized Mutex pipeline.
   * Ensures execution is strictly sequential (FIFO).
   */
  public enqueue<T>(label: string, type: MutexTaskType, taskFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const wrappedTask: MutexTask = {
        id: taskId,
        label,
        type,
        createdAt: new Date().toLocaleTimeString(),
        fn: async () => {
          try {
            const result = await taskFn();
            resolve(result);
            return result;
          } catch (err) {
            reject(err);
            throw err;
          }
        }
      };

      this.queue.push(wrappedTask);
      this.notify();
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isLocked || this.queue.length === 0) {
      return;
    }

    this.isLocked = true;
    this.activeTask = this.queue.shift() || null;
    this.notify();

    if (this.activeTask) {
      try {
        await this.activeTask.fn();
      } catch (error) {
        console.warn(`[Input Mutex Task Failed] ${this.activeTask.label}:`, error);
      } finally {
        this.completedCount++;
        this.activeTask = null;
        this.isLocked = false;
        this.notify();
        // Continue to next task in queue asynchronously
        setTimeout(() => this.processQueue(), 50);
      }
    } else {
      this.isLocked = false;
      this.notify();
    }
  }

  /**
   * Clears all pending tasks in the queue and releases locks.
   */
  public purgeQueue() {
    this.queue = [];
    this.isLocked = false;
    this.activeTask = null;
    this.notify();
  }
}

export const inputMutex = new InputMutexController();
