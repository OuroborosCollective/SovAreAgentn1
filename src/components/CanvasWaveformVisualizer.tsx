import React, { useRef, useEffect } from 'react';

export interface CanvasWaveformVisualizerProps {
  frequencyData: Uint8Array;
  isPlaying?: boolean;
  isListening?: boolean;
  voiceDataSource?: string; // e.g. 'CACHED_SQLITE' | 'REALTIME'
  coherenceDropDetected?: boolean;
  primaryColor?: string; // hex or CSS color
  secondaryColor?: string;
  height?: number; // pixel height, e.g. 140
  showGrid?: boolean;
  showPeakHud?: boolean;
}

export const CanvasWaveformVisualizer: React.FC<CanvasWaveformVisualizerProps> = ({
  frequencyData,
  isPlaying = false,
  isListening = false,
  voiceDataSource = 'REALTIME',
  coherenceDropDetected = false,
  primaryColor,
  secondaryColor,
  height = 130,
  showGrid = true,
  showPeakHud = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Determine colors based on stream status & props
    let mainStrokeColor = primaryColor || '#ec4899'; // pink-500
    let mainFillStart = 'rgba(236, 72, 153, 0.35)';
    let mainFillEnd = 'rgba(236, 72, 153, 0.0)';
    let glowColor = '#ec4899';

    if (coherenceDropDetected) {
      mainStrokeColor = '#ef4444'; // red-500
      mainFillStart = 'rgba(239, 68, 68, 0.4)';
      glowColor = '#f87171';
    } else if (voiceDataSource === 'CACHED_SQLITE') {
      mainStrokeColor = '#06b6d4'; // cyan-500
      mainFillStart = 'rgba(6, 182, 212, 0.4)';
      glowColor = '#22d3ee';
    } else if (isPlaying) {
      mainStrokeColor = primaryColor || '#f43f5e'; // rose-500
      mainFillStart = 'rgba(244, 63, 94, 0.35)';
      glowColor = '#fb7185';
    } else if (isListening) {
      mainStrokeColor = '#a855f7'; // purple-500
      mainFillStart = 'rgba(168, 85, 247, 0.3)';
      glowColor = '#c084fc';
    }

    const render = () => {
      // Handle canvas resizing for sharp retina display
      const width = canvas.parentElement?.clientWidth || 400;
      const h = height;
      if (canvas.width !== width || canvas.height !== h) {
        canvas.width = width;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, width, h);

      // Draw subtle background grid scanlines
      if (showGrid) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        const gridSpacing = 20;
        for (let x = 0; x < width; x += gridSpacing) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSpacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Calculate audio energy metrics
      let totalEnergy = 0;
      let peakVal = 0;
      const safeFreqData = frequencyData && frequencyData.length > 0 ? frequencyData : new Uint8Array(64);
      
      for (let i = 0; i < safeFreqData.length; i++) {
        const val = safeFreqData[i] || 0;
        totalEnergy += val;
        if (val > peakVal) peakVal = val;
      }
      const avgEnergy = safeFreqData.length > 0 ? totalEnergy / safeFreqData.length : 0;
      const isActive = isPlaying || isListening || avgEnergy > 5;

      // Update phase motion
      phaseRef.current += isActive ? 0.08 : 0.02;
      const phase = phaseRef.current;

      const centerY = h / 2;
      const pointsCount = 80;
      const step = (width > 0) ? width / (pointsCount - 1) : 1;

      // Generate waveform coordinates
      const points: { x: number; y: number }[] = [];
      const secondaryPoints: { x: number; y: number }[] = [];

      for (let i = 0; i < pointsCount; i++) {
        const x = i * step;
        const freqIdx = Math.floor((i / pointsCount) * Math.min(safeFreqData.length, 64));
        const rawAmp = safeFreqData[freqIdx] || 0;
        const normalizedAmp = (rawAmp / 255);

        // Windowing envelope (attenuate at left and right edges for clean tapering)
        const envelope = Math.sin((i / (pointsCount - 1)) * Math.PI);

        // Sine wave harmonic calculation
        const baseWave = Math.sin(i * 0.15 + phase) * 8 * envelope;
        const detailWave = Math.cos(i * 0.35 - phase * 1.5) * 4 * envelope;
        
        let audioOffset = 0;
        if (isActive) {
          audioOffset = (normalizedAmp * (h * 0.38) + baseWave + detailWave) * envelope;
        } else {
          audioOffset = (Math.sin(i * 0.1 + phase) * 3) * envelope;
        }

        const y = Number.isFinite(centerY - audioOffset) ? centerY - audioOffset : centerY;
        const ySec = Number.isFinite(centerY + (audioOffset * 0.7)) ? centerY + (audioOffset * 0.7) : centerY;

        points.push({ x, y });
        secondaryPoints.push({ x, y: ySec });
      }

      // Draw Fill Area under Main Waveform
      ctx.save();
      const fillGradient = ctx.createLinearGradient(0, 0, 0, h);
      fillGradient.addColorStop(0, mainFillStart);
      fillGradient.addColorStop(1, mainFillEnd);

      ctx.fillStyle = fillGradient;
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(width, points[points.length - 1].y);
      ctx.lineTo(width, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw Secondary Translucent Harmonic Wave
      ctx.save();
      ctx.strokeStyle = secondaryColor || 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(secondaryPoints[0].x, secondaryPoints[0].y);
      for (let i = 0; i < secondaryPoints.length - 1; i++) {
        const xc = (secondaryPoints[i].x + secondaryPoints[i + 1].x) / 2;
        const yc = (secondaryPoints[i].y + secondaryPoints[i + 1].y) / 2;
        ctx.quadraticCurveTo(secondaryPoints[i].x, secondaryPoints[i].y, xc, yc);
      }
      ctx.stroke();
      ctx.restore();

      // Draw Main Glowing Waveform Line
      ctx.save();
      ctx.strokeStyle = mainStrokeColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isActive ? 12 : 4;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
      ctx.restore();

      // Draw Peak Frequency Energy Nodes (Glow Dots along wave peaks)
      if (isActive) {
        ctx.save();
        for (let i = 0; i < points.length; i += 6) {
          const pt = points[i];
          const amp = Math.abs(centerY - pt.y);
          if (amp > 8) {
            ctx.fillStyle = mainStrokeColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, Math.min(4, Math.max(1.5, amp * 0.15)), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // Draw Peak HUD telemetry overlay
      if (showPeakHud) {
        ctx.save();
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        
        const rms = Math.round((avgEnergy / 255) * 100);
        const peakPct = Math.round((peakVal / 255) * 100);

        const statusLabel = isPlaying 
          ? (voiceDataSource === 'CACHED_SQLITE' ? 'SQLITE STREAM' : 'OUTGOING VOICE STREAM')
          : isListening 
          ? 'MIC INCOMING STREAM' 
          : 'STANDBY WAVE';

        ctx.fillText(`STREAM: ${statusLabel}`, 10, 16);
        ctx.fillText(`RMS: ${rms}% | PEAK: ${peakPct}%`, width - 110, 16);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [frequencyData, isPlaying, isListening, voiceDataSource, coherenceDropDetected, primaryColor, secondaryColor, height, showGrid, showPeakHud]);

  return (
    <div className="w-full relative rounded-2xl overflow-hidden bg-zinc-950/80 border border-zinc-800/80 shadow-inner">
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};
