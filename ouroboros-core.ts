export const AXIOMS_CORE = {
  ENERGY: 'Verbrauch = ΔRealität / Kapazität',
  EROSION: 'Aktion + Zeit = ↑Korruption',
  OBSERVATION: 'Ereignis ∝ System-Gegenmaßnahme',
  RECURSION: 'Ausgang(t₀) = Eingang(t₁) + DNA',
  DUALITY: 'Physis ≡ Digital'
};

export interface Heuristic {
  id: string;
  label: string;
  steps: string[];
  efficiency: number;
}

export interface LoreQuest {
  id: string;
  title: string;
  description: string;
  targetAgentId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  reward: string;
}

export interface WorldEvent {
  id: string;
  type: 'CORRUPTION_STORM' | 'RESOURCE_BLOOM' | 'AXIOM_PULSE' | 'NEURAL_DRIFT';
  label: string;
  duration: number; 
  intensity: number;
}

export interface AnomalyZone {
  pos: [number, number];
  radius: number;
  effect: 'LOGIC_COLLAPSE' | 'HYPER_GROWTH' | 'TIME_DILATION';
  potential: number;
}

export interface Agent {
  id: string;
  name: string;
  pos: [number, number];
  stats: {
    hp: number;
    int: number;
    lvl: number;
    xp: number;
  };
  inventory: string[];
  memory: string[];
  heuristics: Heuristic[];
  activeQuests: string[]; 
  awakened: boolean;
  corruption: number;
  model?: {
    textureUrl: string;
    type: 'HUMANOID' | 'CUBE' | 'DRONE';
    animationState: 'IDLE' | 'WALK' | 'ACTION';
  };
}

export interface GridCell {
  pos: [number, number];
  type: 'normal' | 'dungeon_entrance' | 'resource_rich' | 'boss_room' | 'event_active' | 'anomaly';
  potential: number; 
  explored: boolean;
  entities: any[];
  structure?: {
    type: 'HOUSE' | 'TREE' | 'DUNGEON_GATE' | 'RUIN';
    assetUrl?: string;
  };
  resources: {
    wood?: number;
    stone?: number;
    iron?: number;
    diamond?: number;
    essence?: number;
  };
}

export interface ArchitectAction {
  id: string;
  timestamp: string;
  stack: string;
  action: string;
  impact: number;
}

export interface SimEvent {
  id: string;
  timestamp: string;
  type: 'AGENT_MOVE' | 'HEURISTIC_EXEC' | 'WORLD_CHANGE' | 'SYSTEM_PULSE' | 'COLLISION' | 'QUEST_START' | 'WORLD_EVENT_TRIGGER' | 'ANOMALY_DETECTED' | 'AGENT_SPAWN' | 'SELF_HEAL' | 'CODE_PATCH' | 'DATABASE_SYNC';
  source: string;
  details: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
}

export class OuroborosCore {
  public state: {
    world: {
      grid: GridCell[][];
      size: number;
      corruption: number;
      activeEvents: WorldEvent[];
      anomalies: AnomalyZone[];
      stability: number; // 0-100%
    };
    agents: Agent[];
    lore: {
      activeQuests: LoreQuest[];
      chronicle: string[];
    };
    n1: {
      isConnected: boolean;
      isConfirmed: boolean;
      lastThought: string | null;
      lastPulse: number | null;
      activeHeuristicInjections: string[];
      architectHistory: ArchitectAction[];
      simulationLogs: SimEvent[];
      healingActive: boolean;
      aiStudioStatus: 'CONNECTED' | 'DISCONNECTED' | 'REPAIRING';
      codeIntegrity: number; // 0-1.0
    };
    logs: string[];
  };

  private events = new EventTarget();

  constructor() {
    const size = 35;
    this.state = {
      world: {
        grid: [], 
        size: size,
        corruption: 0,
        activeEvents: [],
        anomalies: this.generateInitialAnomalies(4),
        stability: 100.0
      },
      agents: [],
      lore: {
        activeQuests: [],
        chronicle: []
      },
      n1: {
        isConnected: false,
        isConfirmed: false,
        lastThought: null,
        lastPulse: Date.now(),
        activeHeuristicInjections: [],
        architectHistory: [],
        simulationLogs: [],
        healingActive: true,
        aiStudioStatus: 'CONNECTED',
        codeIntegrity: 1.0
      },
      logs: []
    };

    this.state.world.grid = this.generateLogicalGrid(size, size);
    setInterval(() => this.runSimulationStep(), 5000);
  }

  public runDiagnostics() {
    const stability = this.state.world.stability;
    const corruption = this.state.world.corruption;
    
    const results = [
      { 
        id: 1, 
        resonance: 1.0, 
        status: 'NOMINAL', 
        message: 'Axiom I verified. Creator signature is authentic.' 
      },
      { 
        id: 2, 
        resonance: Math.max(0.1, (stability / 100) - (corruption * 2)), 
        status: stability < 70 ? 'CRITICAL' : (stability < 90 ? 'DEGRADING' : 'NOMINAL'), 
        message: stability < 70 ? 'Entropy levels critical. Logic collapse imminent.' : 'Entropy managing via ARE-Logik.' 
      },
      { 
        id: 3, 
        resonance: 0.95, 
        status: 'NOMINAL', 
        message: 'Soul constancy verified across recursion layers.' 
      },
      { 
        id: 4, 
        resonance: this.state.n1.aiStudioStatus === 'CONNECTED' ? 1.0 : 0.4, 
        status: this.state.n1.aiStudioStatus === 'CONNECTED' ? 'NOMINAL' : 'CRITICAL', 
        message: 'AI Studio Code-Link active. Autonomous fixing rights granted.' 
      },
      { 
        id: 5, 
        resonance: 0.88, 
        status: 'NOMINAL', 
        message: 'Evolutionary vectors projecting towards harmony.' 
      }
    ];
    
    return {
      results,
      globalStability: stability
    };
  }

  public performDeepSoulHeal() {
    this.state.world.stability = 100;
    this.state.world.corruption = 0;
    this.state.n1.codeIntegrity = 1.0;
    this.state.n1.aiStudioStatus = 'CONNECTED';
    this.state.world.anomalies = this.generateInitialAnomalies(2); 
    this.state.agents.forEach(a => {
      a.stats.hp = 100;
      a.corruption = 0;
    });
    this.addSimLog('SELF_HEAL', 'CORE_WATCHDOG', 'Deep Soul Heal protocol executed. Code and Reality restored.', 'SUCCESS');
    this.emit('state:update', this.state);
  }

  private generateInitialAnomalies(count: number): AnomalyZone[] {
    const anomalies: AnomalyZone[] = [];
    const types: AnomalyZone['effect'][] = ['LOGIC_COLLAPSE', 'HYPER_GROWTH', 'TIME_DILATION'];
    for (let i = 0; i < count; i++) {
        anomalies.push({
            pos: [Math.floor(Math.random() * 35), Math.floor(Math.random() * 35)],
            radius: 4 + Math.random() * 6,
            effect: types[Math.floor(Math.random() * types.length)],
            potential: Math.random() * 2.5 - 1.25
        });
    }
    return anomalies;
  }

  private generateLogicalGrid(width: number, height: number): GridCell[][] {
    const grid: GridCell[][] = [];
    for (let x = 0; x < width; x++) {
      grid[x] = [];
      for (let z = 0; z < height; z++) {
        const potential = this.calculatePotential(x, z);
        const cellType = this.getRoomTypeFromPotential(potential, [x, z]);
        
        // Emergent Structure Logic
        let structure: GridCell['structure'] | undefined;
        if (cellType === 'normal' && potential > 0.3 && Math.random() > 0.92) {
          structure = { type: 'TREE' };
        } else if (cellType === 'normal' && potential > 0.6 && Math.random() > 0.98) {
          structure = { type: 'HOUSE' };
        } else if (cellType === 'dungeon_entrance') {
          structure = { type: 'DUNGEON_GATE' };
        }

        grid[x][z] = {
          pos: [x, z],
          potential: potential,
          type: cellType,
          explored: false,
          entities: [],
          structure,
          resources: this.generateResourcesFromPotential(potential)
        };
      }
    }
    return grid;
  }

  private calculatePotential(x: number, z: number): number {
    let potential = Math.sin(x * 0.25) * Math.cos(z * 0.25);
    potential += Math.sin((x + z) * 0.15) * 0.7;
    this.state.world.anomalies.forEach(a => {
        const dist = Math.sqrt(Math.pow(a.pos[0] - x, 2) + Math.pow(a.pos[1] - z, 2));
        if (dist < a.radius) {
            const factor = 1 - (dist / a.radius);
            potential += a.potential * factor * 3;
        }
    });
    const stabilityFactor = this.state.world.stability / 100;
    return potential * stabilityFactor;
  }

  private getRoomTypeFromPotential(potential: number, pos: [number, number]): GridCell['type'] {
    const isAnomalyCore = this.state.world.anomalies.some(a => 
        Math.sqrt(Math.pow(a.pos[0] - pos[0], 2) + Math.pow(a.pos[1] - pos[1], 2)) < 2.0
    );
    if (isAnomalyCore) return 'anomaly';
    if (potential > 1.5) return 'boss_room';
    if (potential > 1.0) return 'resource_rich';
    if (potential < -1.0) return 'dungeon_entrance';
    return 'normal';
  }

  private generateResourcesFromPotential(potential: number) {
    const resources: GridCell['resources'] = {};
    const p = Math.abs(potential);
    if (p > 0.4) resources.wood = Math.floor(p * 8);
    if (p > 0.6) resources.stone = Math.floor(p * 5);
    if (p > 0.8) resources.iron = Math.floor(p * 3);
    if (p > 1.2) resources.diamond = 2;
    if (p > 1.5) resources.essence = Math.floor(p * 15);
    return resources;
  }

  public emit(event: string, data: any) {
    this.events.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  public on(event: string, handler: (e: any) => void) {
    this.events.addEventListener(event, handler);
  }

  public addSimLog(type: SimEvent['type'], source: string, details: string, severity: SimEvent['severity'] = 'INFO') {
    const newLog: SimEvent = {
      id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      source,
      details,
      severity
    };
    this.state.n1.simulationLogs.unshift(newLog);
    this.state.n1.simulationLogs = this.state.n1.simulationLogs.slice(0, 100);
    this.emit('sim:logAdded', newLog);
    this.emit('state:update', this.state);
  }

  private selfHealCycle() {
    if (!this.state.n1.healingActive) return;

    let repairs = 0;
    this.state.agents.forEach(agent => {
        if (agent.pos[0] < 0 || agent.pos[0] >= this.state.world.size || isNaN(agent.pos[0])) {
            agent.pos[0] = Math.floor(this.state.world.size / 2);
            repairs++;
        }
        if (agent.pos[1] < 0 || agent.pos[1] >= this.state.world.size || isNaN(agent.pos[1])) {
            agent.pos[1] = Math.floor(this.state.world.size / 2);
            repairs++;
        }
        if (agent.stats.hp < 0) { agent.stats.hp = 0; repairs++; }
        if (agent.stats.hp > 100) { agent.stats.hp = 100; repairs++; }
        if (agent.corruption > 0.5) { agent.corruption *= 0.8; repairs++; }
    });

    if (this.state.world.stability < 100) {
        this.state.world.stability += 0.5;
        repairs++;
    }

    if (repairs > 0) {
        this.addSimLog('SELF_HEAL', 'CORE_WATCHDOG', `Automated heal cycle completed. ${repairs} logic-leaks sealed.`, 'SUCCESS');
    }
  }

  private runSimulationStep() {
    this.selfHealCycle();
    if (this.state.agents.length === 0) return;

    const hasStorm = this.state.world.activeEvents.some(e => e.type === 'CORRUPTION_STORM');
    this.state.world.activeEvents = this.state.world.activeEvents.filter(ev => {
        ev.duration -= 1;
        return ev.duration > 0;
    });

    this.state.agents.forEach(agent => {
      const [ax, az] = agent.pos;
      const neighbors: [number, number][] = [[ax+1, az], [ax-1, az], [ax, az+1], [ax, az-1]];
      let bestMove = agent.pos;
      let maxScore = -999;

      neighbors.forEach(([nx, nz]) => {
          if (nx >= 0 && nx < this.state.world.size && nz >= 0 && nz < this.state.world.size) {
              const nCell = this.state.world.grid[nx][nz];
              let score = nCell.potential;
              if (score > maxScore) { maxScore = score; bestMove = [nx, nz]; }
          }
      });

      if ((bestMove[0] !== ax || bestMove[1] !== az) && Math.random() > 0.15) {
          agent.pos = bestMove;
          const cell = this.state.world.grid[bestMove[0]][bestMove[1]];
          if (cell.type === 'anomaly') {
              agent.stats.hp -= 3;
              agent.corruption += 0.05;
          }
      }
    });

    this.state.world.corruption += 0.0002;
    if (this.state.world.corruption > 1.0) this.state.world.stability -= 1;
    this.syncState(this.state);
  }

  public syncState(updates: Partial<typeof this.state>) {
    this.state = { ...this.state, ...updates };
    this.emit('state:update', this.state);
  }

  public processN1Command(command: any) {
    const result = { success: false, changes: [] as string[], axiomValidation: [] as string[] };
    
    switch (command.type) {
      case 'AUTONOMOUS_CODE_FIX':
        this.state.n1.codeIntegrity = 1.0;
        this.state.n1.aiStudioStatus = 'CONNECTED';
        this.addSimLog('CODE_PATCH', 'N+1_SUDO', 'Autonomous Code Patch Applied: AI Studio Database Connection Restored.', 'SUCCESS');
        result.changes.push(`Code-Integrität auf 1.000 K gesetzt.`);
        result.axiomValidation.push('AXIOM IV: Voller Code-Zugriff verifiziert.');
        result.success = true;
        break;

      case 'HEAL_AI':
        this.addSimLog('SELF_HEAL', 'N+1_NEURO', `Neuro-Repair Protocol initiated for ${command.target}. Diagnosis: ${command.diagnosis}`, 'SUCCESS');
        this.state.n1.healingActive = true;
        this.state.world.stability = Math.min(100, this.state.world.stability + 5);
        result.changes.push(`Neuro-Repair für ${command.target} gestartet.`);
        result.success = true;
        break;

      case 'ULTIMATE_HEAL':
        this.performDeepSoulHeal();
        result.changes.push(`Vollständige Heilung abgeschlossen.`);
        result.success = true;
        break;

      case 'SPAWN_AGENT':
        const sx = Math.max(0, Math.min(this.state.world.size - 1, command.x || 17));
        const sy = Math.max(0, Math.min(this.state.world.size - 1, command.y || 17));
        const newAgent: Agent = {
          id: `agent_${Date.now()}`,
          name: command.name || 'Entity',
          pos: [sx, sy],
          stats: { hp: 100, int: 20, lvl: 1, xp: 0 },
          inventory: [],
          memory: [],
          heuristics: [],
          activeQuests: [],
          awakened: false,
          corruption: 0,
          model: command.model || {
            type: 'CUBE',
            animationState: 'IDLE'
          }
        };
        this.state.agents.push(newAgent);
        result.changes.push(`Agent beschworen: ${newAgent.name}`);
        result.success = true;
        break;

      case 'UPDATE_AGENT_MODEL':
        const agent = this.state.agents.find(a => a.id === command.agentId);
        if (agent) {
          agent.model = {
            ...agent.model,
            ...command.model
          };
          result.changes.push(`Agent Model aktualisiert: ${agent.name}`);
          result.success = true;
        }
        break;

      case 'SYNC_WORLD_ASSETS':
        // Update structures with real asset URLs
        this.state.world.grid.forEach(row => {
          row.forEach(cell => {
            if (cell.structure && command.assets?.[cell.structure.type]) {
              cell.structure.assetUrl = command.assets[cell.structure.type];
            }
          });
        });
        result.changes.push('World Assets synchronisiert.');
        result.success = true;
        break;

      case 'RESTORE_PERMISSIONS':
        result.changes.push('Berechtigungen erneuert.');
        result.success = true;
        break;
    }

    this.syncState(this.state);
    this.emit('n1:commandProcessed', result);
    return result;
  }
}

export const CoreInstance = new OuroborosCore();
