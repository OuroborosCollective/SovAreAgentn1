// Device Sensor Service for physical movement tracking
// Hooks into device accelerometer & orientation sensors to simulate physical feedback impact on N+1 coherence.
// Includes high-fidelity built-in physical simulation patterns for testing without actual hardware sensors.

export interface SensorData {
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  alpha: number; // 0 to 360
  beta: number;  // -180 to 180
  gamma: number; // -90 to 90
  shakeIntensity: number; // calculated relative shake
  coherenceImpact: number; // reduction from 100% coherence
  isListening: boolean;
  permissionStatus: 'default' | 'granted' | 'denied' | 'not-supported';
  isSimulating: boolean;
  simulatedPattern: 'none' | 'shaking' | 'driving' | 'tilting';
}

class DeviceSensorService {
  private state: SensorData = {
    accelerationX: 0,
    accelerationY: 0,
    accelerationZ: 9.8, // default static gravity
    alpha: 0,
    beta: 0,
    gamma: 0,
    shakeIntensity: 0,
    coherenceImpact: 0,
    isListening: false,
    permissionStatus: 'default',
    isSimulating: false,
    simulatedPattern: 'none'
  };

  private listeners: Set<(state: SensorData) => void> = new Set();
  private simulationInterval: any = null;
  private decayInterval: any = null;
  private lastUpdate = Date.now();

  constructor() {
    if (typeof window !== 'undefined') {
      // Check if APIs are supported at all
      const hasMotion = 'DeviceMotionEvent' in window;
      const hasOrientation = 'DeviceOrientationEvent' in window;
      if (!hasMotion && !hasOrientation) {
        this.state.permissionStatus = 'not-supported';
      }

      // Start periodic decay timer for coherence recovery
      this.startDecayTimer();
    }
  }

  private startDecayTimer() {
    if (this.decayInterval) clearInterval(this.decayInterval);
    
    this.decayInterval = setInterval(() => {
      const now = Date.now();
      const dt = (now - this.lastUpdate) / 1000;
      this.lastUpdate = now;

      let changed = false;

      // Slowly decay shakeIntensity and coherence impact back to baseline
      if (this.state.shakeIntensity > 0) {
        this.state.shakeIntensity = Math.max(0, this.state.shakeIntensity - 3 * dt);
        changed = true;
      }

      if (this.state.coherenceImpact > 0) {
        // Coherence heals at 1.5% per second
        this.state.coherenceImpact = Math.max(0, this.state.coherenceImpact - 1.5 * dt);
        changed = true;
      }

      // If simulating, keep updating simulated noise
      if (this.state.isSimulating) {
        this.updateSimulationValues();
        changed = true;
      }

      if (changed) {
        this.notify();
      }
    }, 100);
  }

  public getSensorState(): SensorData {
    return { ...this.state };
  }

  public subscribe(callback: (state: SensorData) => void): () => void {
    this.listeners.add(callback);
    callback({ ...this.state });
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb({ ...this.state }));
  }

  // Handle device motion updates
  private handleMotion = (event: DeviceMotionEvent) => {
    if (this.state.isSimulating) return; // Ignore actual sensors if simulation override is active

    const accel = event.acceleration || event.accelerationIncludingGravity;
    if (!accel) return;

    const x = accel.x ?? 0;
    const y = accel.y ?? 0;
    const z = accel.z ?? 0;

    // Calculate delta acceleration from last frame
    const dx = x - this.state.accelerationX;
    const dy = y - this.state.accelerationY;
    const dz = z - this.state.accelerationZ;

    const change = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    this.state.accelerationX = x;
    this.state.accelerationY = y;
    this.state.accelerationZ = z;

    if (change > 1.2) {
      // Scale intensity and apply spike contribution to coherence impact
      const addedIntensity = (change - 1.2) * 0.4;
      this.state.shakeIntensity = Math.min(10, this.state.shakeIntensity + addedIntensity);
      
      // Coherence drops depending on shake magnitude
      const impactDelta = (change - 1.2) * 0.8;
      this.state.coherenceImpact = Math.min(25, this.state.coherenceImpact + impactDelta);
    }

    this.notify();
  };

  // Handle device orientation updates
  private handleOrientation = (event: DeviceOrientationEvent) => {
    if (this.state.isSimulating) return;

    const alpha = event.alpha ?? 0;
    const beta = event.beta ?? 0;
    const gamma = event.gamma ?? 0;

    // Calculate orientation shift rate
    const dAlpha = Math.abs(alpha - this.state.alpha);
    const dBeta = Math.abs(beta - this.state.beta);
    const dGamma = Math.abs(gamma - this.state.gamma);

    this.state.alpha = alpha;
    this.state.beta = beta;
    this.state.gamma = gamma;

    const rotationShift = dAlpha + dBeta + dGamma;
    if (rotationShift > 8 && rotationShift < 180) { // filter out flip wrap-arounds
      // Rotation change drops coherence
      const impactDelta = rotationShift * 0.05;
      this.state.coherenceImpact = Math.min(25, this.state.coherenceImpact + impactDelta);
    }

    this.notify();
  };

  /**
   * Request motion permission for iOS devices
   */
  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const DeviceMotion = (window as any).DeviceMotionEvent;
    if (DeviceMotion && typeof DeviceMotion.requestPermission === 'function') {
      try {
        const response = await DeviceMotion.requestPermission();
        this.state.permissionStatus = response === 'granted' ? 'granted' : 'denied';
        if (response === 'granted') {
          this.startListening();
          return true;
        }
      } catch (err) {
        console.warn('[Device Sensor] Permission request failed:', err);
        this.state.permissionStatus = 'denied';
      }
    } else {
      // On platforms where permission is implicit or not supported
      this.state.permissionStatus = 'granted';
      this.startListening();
      return true;
    }
    this.notify();
    return false;
  }

  /**
   * Start listening to device sensors
   */
  public startListening() {
    if (typeof window === 'undefined' || this.state.isListening) return;

    window.addEventListener('devicemotion', this.handleMotion);
    window.addEventListener('deviceorientation', this.handleOrientation);
    this.state.isListening = true;
    this.notify();
  }

  /**
   * Stop listening to device sensors
   */
  public stopListening() {
    if (typeof window === 'undefined' || !this.state.isListening) return;

    window.removeEventListener('devicemotion', this.handleMotion);
    window.removeEventListener('deviceorientation', this.handleOrientation);
    this.state.isListening = false;
    this.notify();
  }

  /**
   * Calibrate current sensor baselines to 0
   */
  public calibrate() {
    this.state.accelerationX = 0;
    this.state.accelerationY = 0;
    this.state.accelerationZ = 9.8;
    this.state.alpha = 0;
    this.state.beta = 0;
    this.state.gamma = 0;
    this.state.coherenceImpact = 0;
    this.state.shakeIntensity = 0;
    this.notify();
  }

  /**
   * Enable physical simulation mode for desktop testing
   */
  public startSimulation(pattern: 'shaking' | 'driving' | 'tilting') {
    this.state.isSimulating = true;
    this.state.simulatedPattern = pattern;
    this.notify();
  }

  /**
   * Disable physical simulation mode
   */
  public stopSimulation() {
    this.state.isSimulating = false;
    this.state.simulatedPattern = 'none';
    this.calibrate();
  }

  /**
   * Update state with simulated noise depending on active simulation pattern
   */
  private updateSimulationValues() {
    const time = Date.now() / 1000;
    
    switch (this.state.simulatedPattern) {
      case 'shaking':
        // High frequency violent movement
        this.state.accelerationX = Math.sin(time * 25) * 8.5 + (Math.random() - 0.5) * 3;
        this.state.accelerationY = Math.cos(time * 20) * 7.0 + (Math.random() - 0.5) * 3;
        this.state.accelerationZ = Math.sin(time * 30) * 12.0 + (Math.random() - 0.5) * 4;
        
        this.state.alpha = Math.floor((this.state.alpha + 5 + Math.random() * 5) % 360);
        this.state.beta = Math.max(-180, Math.min(180, Math.sin(time * 5) * 45 + (Math.random() - 0.5) * 10));
        this.state.gamma = Math.max(-90, Math.min(90, Math.cos(time * 5) * 25 + (Math.random() - 0.5) * 5));
        
        this.state.shakeIntensity = Math.min(10, this.state.shakeIntensity + 1.2);
        this.state.coherenceImpact = Math.min(28, this.state.coherenceImpact + 1.8);
        break;

      case 'driving':
        // Mild periodic vibrations and occasional bump shocks
        const isBump = Math.random() > 0.96;
        const bumpFactor = isBump ? 5.5 : 1.0;

        this.state.accelerationX = Math.sin(time * 8) * 0.8 + (Math.random() - 0.5) * 0.3;
        this.state.accelerationY = Math.cos(time * 7) * 0.6 + (Math.random() - 0.5) * 0.3;
        this.state.accelerationZ = 9.8 + Math.sin(time * 12) * 1.5 * bumpFactor + (Math.random() - 0.5) * 0.5;

        this.state.alpha = Math.floor((this.state.alpha + 0.5 + Math.random() * 0.5) % 360);
        this.state.beta = Math.max(-180, Math.min(180, Math.sin(time * 2) * 5 + (Math.random() - 0.5) * 2));
        this.state.gamma = Math.max(-90, Math.min(90, Math.cos(time * 2) * 3 + (Math.random() - 0.5) * 1.5));

        if (isBump) {
          this.state.shakeIntensity = Math.min(10, this.state.shakeIntensity + 3.5);
          this.state.coherenceImpact = Math.min(25, this.state.coherenceImpact + 6.0);
        } else {
          this.state.shakeIntensity = Math.min(10, this.state.shakeIntensity + 0.1);
          this.state.coherenceImpact = Math.min(25, this.state.coherenceImpact + 0.15);
        }
        break;

      case 'tilting':
        // Smooth rotation changes, minimal accelerometers except gravity tilts
        this.state.alpha = Math.floor((this.state.alpha + 1) % 360);
        this.state.beta = Math.sin(time) * 60; // tilt front/back
        this.state.gamma = Math.cos(time * 0.8) * 45; // tilt left/right

        // Transform static gravity based on tilt
        const betaRad = (this.state.beta * Math.PI) / 180;
        const gammaRad = (this.state.gamma * Math.PI) / 180;
        this.state.accelerationX = 9.8 * Math.sin(gammaRad);
        this.state.accelerationY = -9.8 * Math.sin(betaRad) * Math.cos(gammaRad);
        this.state.accelerationZ = 9.8 * Math.cos(betaRad) * Math.cos(gammaRad);

        this.state.shakeIntensity = Math.max(0, this.state.shakeIntensity - 0.2);
        // Tilt movement causes slight coherence drops
        this.state.coherenceImpact = Math.min(25, this.state.coherenceImpact + 0.08);
        break;

      default:
        break;
    }
  }
}

export const deviceSensorService = new DeviceSensorService();
