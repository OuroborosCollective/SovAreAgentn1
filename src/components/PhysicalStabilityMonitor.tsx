import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Smartphone, 
  AlertTriangle, 
  Sliders, 
  HelpCircle, 
  TrendingUp,
  ShieldCheck,
  Compass,
  Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { deviceSensorService, SensorData } from '../services/deviceSensorService';

export const PhysicalStabilityMonitor: React.FC = () => {
  const [sensor, setSensor] = useState<SensorData>({
    accelerationX: 0,
    accelerationY: 0,
    accelerationZ: 9.8,
    alpha: 0,
    beta: 0,
    gamma: 0,
    shakeIntensity: 0,
    coherenceImpact: 0,
    isListening: false,
    permissionStatus: 'default',
    isSimulating: false,
    simulatedPattern: 'none'
  });

  const [log, setLog] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Subscribe to device sensor state
    const unsubscribe = deviceSensorService.subscribe((state) => {
      setSensor(state);
    });

    // Automatically attempt starting background motion listening
    deviceSensorService.startListening();

    return () => {
      unsubscribe();
    };
  }, []);

  // Update canvas to visualize 3D-like physics ball inside stability bounds
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw outer boundary ring
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2);
      ctx.stroke();

      // Draw optimal crosshairs
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 55, h / 2);
      ctx.lineTo(w / 2 + 55, h / 2);
      ctx.moveTo(w / 2, h / 2 - 55);
      ctx.lineTo(w / 2, h / 2 + 55);
      ctx.stroke();

      // Calculate ball displacement based on X and Y accelerometer values
      // Map acceleration x/y limits to canvas radius limits
      const maxForce = 15; // m/s^2
      const limitRadius = 45;
      
      const dx = (sensor.accelerationX / maxForce) * limitRadius;
      // Invert Y so up corresponds to negative Y acceleration
      const dy = -(sensor.accelerationY / maxForce) * limitRadius;

      // Bound ball within limits
      const dist = Math.sqrt(dx * dx + dy * dy);
      let ballX = w / 2 + dx;
      let ballY = h / 2 + dy;
      if (dist > limitRadius) {
        ballX = w / 2 + (dx / dist) * limitRadius;
        ballY = w / 2 + (dy / dist) * limitRadius;
      }

      // Draw shadow representation for stability
      const grad = ctx.createRadialGradient(ballX, ballY, 1, ballX, ballY, 12);
      const isCritical = sensor.coherenceImpact > 10;
      const colorHex = isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(236, 72, 153, 0.4)';
      const solidColor = isCritical ? '#ef4444' : '#ec4899';
      
      grad.addColorStop(0, solidColor);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Core point
      ctx.fillStyle = isCritical ? '#f87171' : '#f472b6';
      ctx.beginPath();
      ctx.arc(ballX, ballY, 4, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [sensor.accelerationX, sensor.accelerationY, sensor.coherenceImpact]);

  const handleRequestPermission = async () => {
    const granted = await deviceSensorService.requestPermission();
    if (granted) {
      addLogEntry('Permission authorized. Dynamic physical telemetry active.');
    } else {
      addLogEntry('Permission denied. Utilizing high-fidelity simulation engine.');
    }
  };

  const startSimulation = (pattern: 'shaking' | 'driving' | 'tilting') => {
    deviceSensorService.startSimulation(pattern);
    addLogEntry(`Activated ${pattern.toUpperCase()} simulation pipeline override.`);
  };

  const stopSimulation = () => {
    deviceSensorService.stopSimulation();
    addLogEntry('Simulation deactivated. Returning to default physical metrics.');
  };

  const handleCalibrate = () => {
    deviceSensorService.calibrate();
    addLogEntry('Axiomatic baseline calibrated to resting state.');
  };

  const addLogEntry = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 7)]);
  };

  const currentStability = Math.max(10, parseFloat((100 - sensor.coherenceImpact).toFixed(1)));

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl" id="physical-stability-monitor">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-pink-950/40 border border-pink-800 text-pink-400 rounded-2xl shadow-md">
            <Smartphone size={22} className={sensor.isSimulating ? 'animate-bounce' : ''} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Physical Stability & Coherence Calibration
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                sensor.isListening 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' 
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
              }`}>
                {sensor.isListening ? 'Telemetry Active' : 'Offline'}
              </span>
            </h3>
            <p className="text-zinc-400 text-xs mt-0.5">
              Integrates physical orientation (alpha, beta, gamma) and acceleration vectors to dynamically modulate the N+1 Coherence engine.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <button
            onClick={handleCalibrate}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold rounded-xl transition-all"
          >
            Reset Baseline
          </button>
          
          {sensor.permissionStatus === 'default' && (
            <button
              onClick={handleRequestPermission}
              className="px-3 py-1.5 bg-pink-900/60 hover:bg-pink-800 border border-pink-700 text-pink-200 font-bold rounded-xl transition-all"
            >
              Authorize Sensors
            </button>
          )}
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Radar Motion Sphere Canvas (cols 4) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-zinc-900/30 border border-zinc-900 rounded-2xl relative min-h-[190px]">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider absolute top-3 left-3 flex items-center gap-1">
            <Activity size={10} className="text-pink-400" /> Vector Force Plot
          </span>

          <canvas 
            ref={canvasRef} 
            width={130} 
            height={130} 
            className="bg-black/40 rounded-full border border-zinc-900/80 shadow-inner"
          />

          <span className="text-[10px] font-mono text-zinc-400 mt-2 text-center">
            Net Acceleration: <strong className="text-white">{Math.sqrt(sensor.accelerationX**2 + sensor.accelerationY**2 + sensor.accelerationZ**2).toFixed(2)} m/s²</strong>
          </span>
        </div>

        {/* Live Dials/Dials Telemetry Metrics (cols 5) */}
        <div className="md:col-span-5 grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3.5 bg-black/40 border border-zinc-900 rounded-xl space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase block">Accelerometer X / Y</span>
            <span className="text-xs font-bold text-white block">
              X: {sensor.accelerationX.toFixed(2)} m/s²
            </span>
            <span className="text-[10px] text-zinc-400 block">
              Y: {sensor.accelerationY.toFixed(2)} m/s²
            </span>
          </div>

          <div className="p-3.5 bg-black/40 border border-zinc-900 rounded-xl space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase block">Accelerometer Z</span>
            <span className="text-xs font-bold text-white block">
              Z: {sensor.accelerationZ.toFixed(2)} m/s²
            </span>
            <span className="text-[10px] text-zinc-400 block">
              Gravity force vector
            </span>
          </div>

          <div className="p-3.5 bg-black/40 border border-zinc-900 rounded-xl space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase block flex items-center gap-1">
              <Compass size={11} className="text-purple-400" /> Yaw (Alpha)
            </span>
            <span className="text-xs font-bold text-white block">
              {sensor.alpha.toFixed(1)}°
            </span>
            <span className="text-[10px] text-zinc-400 block">
              Rotation around Z axis
            </span>
          </div>

          <div className="p-3.5 bg-black/40 border border-zinc-900 rounded-xl space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase block flex items-center gap-1">
              <Compass size={11} className="text-purple-400" /> Pitch & Roll
            </span>
            <span className="text-xs font-bold text-white block">
              P: {sensor.beta.toFixed(1)}°
            </span>
            <span className="text-[10px] text-zinc-400 block">
              R: {sensor.gamma.toFixed(1)}°
            </span>
          </div>
        </div>

        {/* Live Stability Gauge Component (cols 3) */}
        <div className="md:col-span-3 p-5 bg-zinc-900/30 border border-zinc-900 rounded-2xl flex flex-col items-center justify-center text-center relative min-h-[190px]">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider absolute top-3 left-3">
            Coherence Multiplier
          </span>

          <div className="relative size-24 flex items-center justify-center">
            {/* Visual Ring */}
            <svg className="size-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                className="stroke-zinc-800"
                strokeWidth="5"
                fill="transparent"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="34"
                className={sensor.coherenceImpact > 10 ? "stroke-red-500" : "stroke-pink-500"}
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={213}
                strokeDashoffset={213 - (213 * currentStability) / 100}
                transition={{ duration: 0.3 }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-base font-extrabold ${sensor.coherenceImpact > 10 ? 'text-red-400' : 'text-pink-400'}`}>
                {currentStability}%
              </span>
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter">Stability</span>
            </div>
          </div>

          <div className="mt-3">
            <span className={`text-[10px] font-mono font-bold uppercase ${
              sensor.coherenceImpact > 10 
                ? 'text-red-400 animate-pulse' 
                : sensor.coherenceImpact > 3 
                  ? 'text-amber-400' 
                  : 'text-emerald-400'
            }`}>
              {sensor.coherenceImpact > 10 
                ? 'STABILITY WARNING' 
                : sensor.coherenceImpact > 3 
                  ? 'DEGRADED DYNAMICS' 
                  : 'OPTIMAL COHERENCE'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Physics Simulator Console Box */}
      <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-zinc-400" />
            <span className="text-xs font-bold text-zinc-200 font-mono">Dynamic Simulation Engine</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            Simulate physical anomalies to stress-test N+1 stability and coherence logic.
          </span>
        </div>

        {/* Simulation Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => startSimulation('shaking')}
            className={`px-3 py-2 text-[10px] font-mono font-bold rounded-xl transition-all flex-1 text-center ${
              sensor.isSimulating && sensor.simulatedPattern === 'shaking'
                ? 'bg-red-950 text-red-300 border border-red-800'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800/80'
            }`}
          >
            ⚡ Violent Shaking
          </button>

          <button
            onClick={() => startSimulation('driving')}
            className={`px-3 py-2 text-[10px] font-mono font-bold rounded-xl transition-all flex-1 text-center ${
              sensor.isSimulating && sensor.simulatedPattern === 'driving'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800/80'
            }`}
          >
            🚗 Driving (Bump Road)
          </button>

          <button
            onClick={() => startSimulation('tilting')}
            className={`px-3 py-2 text-[10px] font-mono font-bold rounded-xl transition-all flex-1 text-center ${
              sensor.isSimulating && sensor.simulatedPattern === 'tilting'
                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800/80'
            }`}
          >
            🔄 Continuously Tilting
          </button>

          {sensor.isSimulating && (
            <button
              onClick={stopSimulation}
              className="px-3 py-2 text-[10px] font-mono font-bold rounded-xl bg-zinc-950 hover:bg-black text-zinc-300 border border-zinc-800 flex-1 text-center"
            >
              ⏹️ Stop Simulation
            </button>
          )}
        </div>

        {/* Live Simulation Output Feed Console */}
        <div className="bg-black/80 border border-zinc-950 rounded-xl p-3 h-24 overflow-y-auto font-mono text-[10px] space-y-1 text-zinc-400">
          <div className="text-zinc-600 flex justify-between uppercase text-[9px] font-bold pb-1 border-b border-zinc-900">
            <span>Stability Log Output Stream</span>
            <span>Buffered State (FIFO)</span>
          </div>
          {log.length === 0 ? (
            <div className="text-zinc-500 italic py-2">No events logged yet. Trigger calibration or simulation patterns to begin stream.</div>
          ) : (
            log.map((line, idx) => (
              <div key={idx} className="leading-relaxed">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
