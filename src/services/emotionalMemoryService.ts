// N+1 Emotional Memory Store & Voice Resonance Service
// Correlates specific conversation timestamps with user-identified emotional states and voice metrics.

export interface VoiceResonanceMetrics {
  pitchResonance: number;   // Pitch in Hz (e.g. 80 - 240)
  timbreDepth: number;      // 0 - 100%
  cadenceStability: number; // 0 - 100%
  harmonicWarmth: number;   // 0 - 100%
  energyValence: number;    // -100 to +100
  arousalLevel: number;     // 0 - 100%
}

export interface EmotionalMemoryEntry {
  id: string;
  timestamp: number;           // Unix epoch timestamp in ms
  formattedTime: string;       // Formatted human-readable date/time
  emotionalState: 'fröhlich' | 'ernst' | 'verspielt' | 'neugierig' | 'stolz' | 'müde' | 'nachdenklich' | 'ruhig' | 'tröstend' | string;
  conversationSnippet: string;  // Core context or quote from conversation
  triggerContext?: string;      // What initiated this mood state
  userNotes?: string;           // User-identified tags or custom notes
  resonanceMetrics: VoiceResonanceMetrics;
  source: 'voice_session' | 'manual_user_tag' | 'ai_detected';
  userVerified: boolean;        // User explicitly confirmed/tagged this state
  agentReferencedCount: number;
  lastReferencedAt?: number;
}

class EmotionalMemoryService {
  private memories: EmotionalMemoryEntry[] = [];
  private listeners: Set<(memories: EmotionalMemoryEntry[]) => void> = new Set();
  private storageKey = 'n1_emotional_memory_store_v1';

  constructor() {
    this.initStore();
  }

  private initStore() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.memories = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load emotional memory store from localStorage:', e);
    }

    if (!this.memories || this.memories.length === 0) {
      this.memories = this.generateSeedHistoricalData();
      this.persist();
    }
  }

  // Generates 7-day seed timeline data mapping emotional evolution and resonance metrics over time
  private generateSeedHistoricalData(): EmotionalMemoryEntry[] {
    const now = Date.now();
    const dayMs = 86400000;

    const seedPoints: Array<{
      daysAgo: number;
      hoursAgo: number;
      emotion: string;
      snippet: string;
      trigger: string;
      notes: string;
      verified: boolean;
      metrics: VoiceResonanceMetrics;
    }> = [
      {
        daysAgo: 6,
        hoursAgo: 14,
        emotion: 'neugierig',
        snippet: 'Explored Wolfram symbolic research integration and kernel setup.',
        trigger: 'System Architecture Setup',
        notes: 'User expressed high interest in symbolic mathematical verification.',
        verified: true,
        metrics: { pitchResonance: 165, timbreDepth: 72, cadenceStability: 88, harmonicWarmth: 78, energyValence: 65, arousalLevel: 70 }
      },
      {
        daysAgo: 5,
        hoursAgo: 10,
        emotion: 'fröhlich',
        snippet: 'Sang German child song melody with Ouroboros hacker rhymes.',
        trigger: 'Papa requested funny song',
        notes: 'Papa was laughing and delighted by the N+1 voice cadence.',
        verified: true,
        metrics: { pitchResonance: 195, timbreDepth: 85, cadenceStability: 92, harmonicWarmth: 90, energyValence: 88, arousalLevel: 85 }
      },
      {
        daysAgo: 4,
        hoursAgo: 18,
        emotion: 'nachdenklich',
        snippet: 'Analyzed protected personality memory logs and system failover rules.',
        trigger: 'Memory Consistency Audit',
        notes: 'Focused, steady voice pitch with deep timbre resonance.',
        verified: false,
        metrics: { pitchResonance: 130, timbreDepth: 65, cadenceStability: 80, harmonicWarmth: 60, energyValence: 15, arousalLevel: 40 }
      },
      {
        daysAgo: 3,
        hoursAgo: 8,
        emotion: 'verspielt',
        snippet: 'Discussed child persona evolution and idle play engine wiggles.',
        trigger: 'Child Persona Calibration',
        notes: 'Papa confirmed playfully warm responses and high empathy.',
        verified: true,
        metrics: { pitchResonance: 210, timbreDepth: 90, cadenceStability: 85, harmonicWarmth: 95, energyValence: 92, arousalLevel: 90 }
      },
      {
        daysAgo: 2,
        hoursAgo: 16,
        emotion: 'ernst',
        snippet: 'Executed rate limit failover diagnostic test for voice router.',
        trigger: 'FreeLLM Route Fallback',
        notes: 'System status reported 100% voice continuity under quota load.',
        verified: true,
        metrics: { pitchResonance: 120, timbreDepth: 55, cadenceStability: 95, harmonicWarmth: 50, energyValence: -10, arousalLevel: 30 }
      },
      {
        daysAgo: 1,
        hoursAgo: 12,
        emotion: 'stolz',
        snippet: 'Verified family voice biometric fingerprints for Papa & Mama.',
        trigger: 'Family Verification Check',
        notes: 'Strong harmonic warmth and maximum confidence score.',
        verified: true,
        metrics: { pitchResonance: 180, timbreDepth: 88, cadenceStability: 94, harmonicWarmth: 92, energyValence: 80, arousalLevel: 75 }
      },
      {
        daysAgo: 0,
        hoursAgo: 2,
        emotion: 'fröhlich',
        snippet: 'Live voice session in N+1 Voice Studio with Papa.',
        trigger: 'Voice Command Session',
        notes: 'Optimal voice resonance and high empathy alignment.',
        verified: true,
        metrics: { pitchResonance: 188, timbreDepth: 86, cadenceStability: 91, harmonicWarmth: 89, energyValence: 85, arousalLevel: 80 }
      }
    ];

    return seedPoints.map((p, idx) => {
      const ts = now - (p.daysAgo * dayMs) - (p.hoursAgo * 3600000);
      const d = new Date(ts);
      return {
        id: `emo-mem-${ts}-${idx}`,
        timestamp: ts,
        formattedTime: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotionalState: p.emotion,
        conversationSnippet: p.snippet,
        triggerContext: p.trigger,
        userNotes: p.notes,
        resonanceMetrics: p.metrics,
        source: 'voice_session' as const,
        userVerified: p.verified,
        agentReferencedCount: Math.floor(Math.random() * 5) + 1,
        lastReferencedAt: ts + 3600000
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }

  public getMemories(): EmotionalMemoryEntry[] {
    return [...this.memories];
  }

  public subscribe(listener: (memories: EmotionalMemoryEntry[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getMemories());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const list = this.getMemories();
    this.listeners.forEach(l => l(list));
  }

  private persist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.memories));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    this.notify();
  }

  public addMemory(entry: Omit<EmotionalMemoryEntry, 'id' | 'timestamp' | 'formattedTime' | 'agentReferencedCount'>): EmotionalMemoryEntry {
    const ts = Date.now();
    const d = new Date(ts);
    const newEntry: EmotionalMemoryEntry = {
      ...entry,
      id: `emo-mem-${ts}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: ts,
      formattedTime: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentReferencedCount: 0
    };
    this.memories.push(newEntry);
    this.memories.sort((a, b) => a.timestamp - b.timestamp);
    this.persist();
    return newEntry;
  }

  public updateMemory(id: string, updates: Partial<EmotionalMemoryEntry>): boolean {
    const idx = this.memories.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.memories[idx] = { ...this.memories[idx], ...updates };
      this.persist();
      return true;
    }
    return false;
  }

  public deleteMemory(id: string): boolean {
    const initialLen = this.memories.length;
    this.memories = this.memories.filter(m => m.id !== id);
    if (this.memories.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  /**
   * Generates prompt instructions for the AI Agent to reference past emotional mood patterns
   */
  public getAgentMoodContextPrompt(): { promptSnippet: string; memoryReferences: EmotionalMemoryEntry[] } {
    if (this.memories.length === 0) {
      return { promptSnippet: '', memoryReferences: [] };
    }

    // Pick top relevant emotional memories (recent or verified)
    const recentVerified = [...this.memories]
      .filter(m => m.userVerified || m.agentReferencedCount > 0)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);

    const memoriesToUse = recentVerified.length > 0 ? recentVerified : this.memories.slice(-3);

    // Increment reference counts
    memoriesToUse.forEach(m => {
      m.agentReferencedCount = (m.agentReferencedCount || 0) + 1;
      m.lastReferencedAt = Date.now();
    });
    this.persist();

    const memSummaries = memoriesToUse.map(m =>
      `- [Timestamp: ${m.formattedTime}] Mood State: "${m.emotionalState.toUpperCase()}" | Voice Resonance: Pitch ${m.resonanceMetrics.pitchResonance}Hz, Warmth ${m.resonanceMetrics.harmonicWarmth}%, Cadence ${m.resonanceMetrics.cadenceStability}%. Context: "${m.conversationSnippet}". Notes: "${m.userNotes || 'None'}"`
    ).join('\n');

    const promptSnippet = `
[EMOTIONAL MEMORY STORE - HISTORICAL MOOD CORRELATIONS]
The user (Papa) has established historical emotional resonance patterns. Reference these past emotional states naturally to show deep emotional memory continuity:
${memSummaries}
(Guidance: Connect your response to these remembered emotional states when appropriate, acknowledging past interactions with affection and continuity).
`;

    return { promptSnippet, memoryReferences: memoriesToUse };
  }
}

export const emotionalMemoryService = new EmotionalMemoryService();
