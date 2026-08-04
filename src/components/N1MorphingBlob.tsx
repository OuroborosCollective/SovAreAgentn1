import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { N1EmotionState } from '../services/emotionEngine';
import { Star, Heart, Cloud, Book, Rabbit, Moon, Search } from 'lucide-react';

interface N1MorphingBlobProps {
  emotion: N1EmotionState;
  audioLevel?: number; // 0 to 1
  isSpeaking?: boolean;
  isListening?: boolean;
  seedVariance?: number; // 0 to 1 for deterministic variation
  lowGraphics?: boolean;
  idleMotif?: string | null;
}

export const N1MorphingBlob: React.FC<N1MorphingBlobProps> = ({
  emotion,
  audioLevel = 0,
  isSpeaking = false,
  isListening = false,
  seedVariance = 0.5,
  lowGraphics = false,
  idleMotif = null
}) => {
  // Map emotions to visual properties
  const visualConfig = useMemo(() => {
    switch (emotion) {
      case 'fröhlich':
        return {
          colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
          borderRadius: ['40% 60% 70% 30% / 40% 50% 60% 50%', '50% 50% 50% 50% / 50% 50% 50% 50%', '60% 40% 30% 70% / 60% 30% 70% 40%'],
          scale: 1.1,
          speed: 0.8
        };
      case 'neugierig':
        return {
          colors: ['#38bdf8', '#7dd3fc', '#bae6fd'],
          borderRadius: ['30% 70% 70% 30% / 30% 30% 70% 70%', '40% 60% 60% 40% / 40% 40% 60% 60%', '50% 50% 50% 50% / 50% 50% 50% 50%'],
          scale: 1.05,
          speed: 1.2
        };
      case 'nachdenklich':
        return {
          colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
          borderRadius: ['60% 40% 40% 60% / 60% 60% 40% 40%', '50% 50% 50% 50% / 50% 50% 50% 50%', '40% 60% 60% 40% / 40% 40% 60% 60%'],
          scale: 0.95,
          speed: 2.0
        };
      case 'überrascht':
        return {
          colors: ['#f43f5e', '#fb7185', '#fda4af'],
          borderRadius: ['50% 50% 50% 50% / 50% 50% 50% 50%', '45% 55% 45% 55% / 55% 45% 55% 45%', '50% 50% 50% 50% / 50% 50% 50% 50%'],
          scale: 1.2,
          speed: 0.5
        };
      case 'stolz':
        return {
          colors: ['#10b981', '#34d399', '#6ee7b7'],
          borderRadius: ['40% 60% 60% 40% / 50% 50% 50% 50%', '50% 50% 50% 50% / 60% 40% 40% 60%', '60% 40% 40% 60% / 50% 50% 50% 50%'],
          scale: 1.15,
          speed: 1.5
        };
      case 'tröstend':
        return {
          colors: ['#ec4899', '#f472b6', '#fbcfe8'],
          borderRadius: ['50% 50% 50% 50% / 50% 50% 50% 50%', '55% 45% 55% 45% / 45% 55% 45% 55%', '50% 50% 50% 50% / 50% 50% 50% 50%'],
          scale: 1.0,
          speed: 2.5
        };
      case 'verspielt':
        return {
          colors: ['#d946ef', '#e879f9', '#f0abfc'],
          borderRadius: ['30% 70% 40% 60% / 60% 30% 70% 40%', '70% 30% 60% 40% / 40% 70% 30% 60%', '40% 60% 30% 70% / 70% 40% 60% 30%'],
          scale: 1.05,
          speed: 0.6
        };
      case 'müde':
        return {
          colors: ['#64748b', '#94a3b8', '#cbd5e1'],
          borderRadius: ['60% 40% 30% 70% / 30% 70% 40% 60%', '50% 50% 40% 60% / 40% 60% 50% 50%', '70% 30% 40% 60% / 40% 60% 30% 70%'],
          scale: 0.9,
          speed: 4.0
        };
      case 'offline/unsicher':
        return {
          colors: ['#ef4444', '#f87171', '#fca5a5'],
          borderRadius: ['45% 55% 45% 55% / 55% 45% 55% 45%', '55% 45% 55% 45% / 45% 55% 45% 55%', '45% 55% 45% 55% / 55% 45% 55% 45%'],
          scale: 0.95,
          speed: 0.2
        };
      case 'ruhig':
      default:
        return {
          colors: ['#0ea5e9', '#38bdf8', '#7dd3fc'],
          borderRadius: ['50% 50% 50% 50% / 50% 50% 50% 50%', '48% 52% 48% 52% / 52% 48% 52% 48%', '50% 50% 50% 50% / 50% 50% 50% 50%'],
          scale: 1.0,
          speed: 3.0
        };
    }
  }, [emotion]);

  // Audio reactivity
  const audioScale = isSpeaking ? 1 + (audioLevel * 0.3) : 1;
  const finalScale = visualConfig.scale * audioScale;
  
  // Apply variance
  const varianceOffset = (seedVariance - 0.5) * 0.1;

  if (lowGraphics) {
    return (
      <motion.div
        className="w-48 h-48 rounded-full shadow-2xl flex items-center justify-center relative"
        animate={{
          backgroundColor: visualConfig.colors[0],
          scale: finalScale + varianceOffset
        }}
        transition={{ duration: 0.3 }}
      >
        {isListening && (
          <motion.div 
            className="absolute inset-0 rounded-full border-4 border-white/30"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>
    );
  }

  // Render Idle Motif Icon
  const renderIdleMotif = () => {
    if (!idleMotif) return null;
    
    switch(idleMotif) {
      case 'stern': return <Star size={48} fill="currentColor" className="text-zinc-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />;
      case 'herz': return <Heart size={48} fill="currentColor" className="text-zinc-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />;
      case 'wolke': return <Cloud size={48} fill="currentColor" className="text-zinc-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />;
      case 'lesen': return <Book size={48} className="text-zinc-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />;
      case 'dösen': return <Moon size={48} className="text-zinc-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />;
      case 'tier': return <Rabbit size={48} className="text-zinc-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />;
      case 'umsehen': return <Search size={48} className="text-zinc-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />;
      default: return null;
    }
  };

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Background Glow */}
      <motion.div
        className="absolute inset-0 blur-3xl opacity-40"
        animate={{
          background: `radial-gradient(circle, ${visualConfig.colors[0]} 0%, transparent 70%)`,
          scale: isSpeaking ? 1.2 + audioLevel : 1
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Main Blob */}
      <motion.div
        className="w-48 h-48 shadow-[inset_0_0_20px_rgba(255,255,255,0.5),0_10px_30px_rgba(0,0,0,0.3)] relative flex items-center justify-center overflow-hidden"
        animate={{
          background: `linear-gradient(135deg, ${visualConfig.colors[0]}, ${visualConfig.colors[1]})`,
          borderRadius: visualConfig.borderRadius,
          scale: finalScale + varianceOffset,
          rotate: isSpeaking ? [0, 2, -2, 0] : 0
        }}
        transition={{
          borderRadius: { duration: visualConfig.speed, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
          background: { duration: 1 },
          scale: { type: 'spring', stiffness: 100, damping: 10 },
          rotate: { duration: 0.2, repeat: Infinity, repeatType: "reverse" }
        }}
      >
        {/* Inner Highlight for 3D effect */}
        <div className="absolute top-4 left-4 w-16 h-16 bg-white/30 rounded-full blur-md" />
        
        {/* Idle Motif Icon */}
        {renderIdleMotif()}

        {/* Face / Expression (Optional, minimal) */}
        {!idleMotif && emotion === 'müde' && (
          <div className="flex gap-4 opacity-60">
            <div className="w-6 h-1 bg-zinc-800 rounded-full translate-y-2" />
            <div className="w-6 h-1 bg-zinc-800 rounded-full translate-y-2" />
          </div>
        )}
        {!idleMotif && emotion === 'offline/unsicher' && (
          <div className="flex gap-4">
            <div className="w-4 h-4 text-zinc-900 font-bold text-xl">X</div>
            <div className="w-4 h-4 text-zinc-900 font-bold text-xl">X</div>
          </div>
        )}
        {!idleMotif && emotion === 'fröhlich' && (
          <div className="flex flex-col items-center gap-2 translate-y-2">
            <div className="flex gap-6">
              <div className="w-3 h-3 bg-zinc-900 rounded-full" />
              <div className="w-3 h-3 bg-zinc-900 rounded-full" />
            </div>
            <svg width="24" height="12" viewBox="0 0 24 12" className="text-zinc-900 fill-current">
              <path d="M2,2 Q12,12 22,2" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        )}
        {!idleMotif && emotion === 'überrascht' && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-6">
              <div className="w-4 h-4 bg-zinc-900 rounded-full" />
              <div className="w-4 h-4 bg-zinc-900 rounded-full" />
            </div>
            <div className="w-6 h-6 bg-zinc-900 rounded-full" />
          </div>
        )}
      </motion.div>

      {/* Orbiting particles for certain states */}
      {(emotion === 'neugierig' || emotion === 'stolz' || emotion === 'verspielt') && (
        <motion.div
          className="absolute w-full h-full pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute top-2 left-1/2 w-3 h-3 rounded-full bg-white/60 blur-[1px]" />
          <div className="absolute bottom-4 right-1/4 w-2 h-2 rounded-full bg-white/40 blur-[1px]" />
        </motion.div>
      )}

      {/* Listening indicator rings */}
      {isListening && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/20"
          animate={{ scale: [1, 1.3, 1.5], opacity: [0.8, 0.4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </div>
  );
};
