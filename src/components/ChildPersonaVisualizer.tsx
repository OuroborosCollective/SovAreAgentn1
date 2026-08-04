import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChildEmotion } from '../hooks/useChildPersona';
import { Smile, Sparkles, Compass, Heart, BookOpen } from 'lucide-react';

interface ChildPersonaVisualizerProps {
  emotion: ChildEmotion;
  joyLevel: number;
  playfulnessLevel: number;
  curiosityLevel: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  angle: number;
}

export const ChildPersonaVisualizer: React.FC<ChildPersonaVisualizerProps> = ({
  emotion,
  joyLevel,
  playfulnessLevel,
  curiosityLevel
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const emotionConfig: Record<ChildEmotion, { primaryColor: string; hexColor: string; glowColor: string; icon: any; label: string; particleCount: number; speedMultiplier: number }> = {
    joy: { primaryColor: 'from-amber-500 to-yellow-400', hexColor: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.3)', icon: Smile, label: 'Strahlende Freude', particleCount: 28, speedMultiplier: 1.0 },
    playfulness: { primaryColor: 'from-pink-500 to-rose-400', hexColor: '#ec4899', glowColor: 'rgba(236, 72, 153, 0.35)', icon: Sparkles, label: 'Verspielte Energie', particleCount: 38, speedMultiplier: 1.8 },
    curiosity: { primaryColor: 'from-sky-400 to-blue-500', hexColor: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.3)', icon: Compass, label: 'Neugieriger Entdecker', particleCount: 32, speedMultiplier: 1.3 },
    affection: { primaryColor: 'from-rose-500 to-pink-600', hexColor: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.3)', icon: Heart, label: 'Herzliche Zuneigung', particleCount: 24, speedMultiplier: 0.8 },
    wonder: { primaryColor: 'from-purple-500 to-indigo-500', hexColor: '#a855f7', glowColor: 'rgba(168, 85, 247, 0.3)', icon: Sparkles, label: 'Kosmisches Staunen', particleCount: 35, speedMultiplier: 1.1 },
    study: { primaryColor: 'from-emerald-400 to-teal-500', hexColor: '#34d399', glowColor: 'rgba(52, 211, 153, 0.3)', icon: BookOpen, label: 'Lern- und Fokusmodus', particleCount: 20, speedMultiplier: 0.6 }
  };

  const config = emotionConfig[emotion] || emotionConfig.joy;
  const Icon = config.icon;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 200);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initialize particles
    const particles: Particle[] = Array.from({ length: config.particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.5 * config.speedMultiplier,
      vy: (Math.random() - 0.5) * 1.5 * config.speedMultiplier,
      radius: 1.5 + Math.random() * 3,
      color: config.hexColor,
      alpha: 0.3 + Math.random() * 0.5,
      pulseSpeed: 0.02 + Math.random() * 0.04,
      angle: Math.random() * Math.PI * 2
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render connecting lines for curiosity/wonder
      if (emotion === 'curiosity' || emotion === 'wonder') {
        ctx.strokeStyle = config.glowColor;
        ctx.lineWidth = 0.6;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Update & draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.angle += p.pulseSpeed;
        const currentRadius = p.radius + Math.sin(p.angle) * 0.8;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [emotion, config]);

  return (
    <div className="relative w-full h-48 bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 shadow-inner">
      {/* HTML5 Canvas Particle Overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Dynamic Background Radial Glow */}
      <div 
        className="absolute inset-0 transition-all duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${config.glowColor} 0%, transparent 75%)` }}
      />

      {/* Central Animated Emotional Core */}
      <motion.div
        className="relative z-10 flex flex-col items-center space-y-3"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.primaryColor} flex items-center justify-center shadow-2xl text-zinc-950 font-bold border border-white/20`}>
          <Icon size={28} className="text-white drop-shadow-md" />
        </div>

        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-white tracking-wide block drop-shadow">
            {config.label}
          </span>
          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
            <span>Joy: {(joyLevel * 100).toFixed(0)}%</span>
            <span>•</span>
            <span>Play: {(playfulnessLevel * 100).toFixed(0)}%</span>
            <span>•</span>
            <span>Curiosity: {(curiosityLevel * 100).toFixed(0)}%</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
