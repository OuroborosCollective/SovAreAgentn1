/**
 * N+1 Playroom Animations - Rich Visual Effects
 * Shapes, Colors, Movements responding to Emotions, Voice, Learning & Memory
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { N1EmotionState } from '../services/emotionEngine';

// Emotion to Color Mapping
export const EMOTION_COLORS: Record<N1EmotionState, string[]> = {
  ruhig: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],        // Greens - calm
  fröhlich: ['#fbbf24', '#fcd34d', '#fde68a', '#fef08a'],   // Yellows/Golds - happy
  neugierig: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],   // Blues - curious
  verspielt: ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8'],   // Pinks - playful
  nachdenklich: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'], // Purples - thoughtful
  überrascht: ['#f97316', '#fb923c', '#fdba74', '#fed7aa'],   // Oranges - surprised
  stolz: ['#eab308', '#facc15', '#fde047', '#fef9c3'],       // Golds - proud
  tröstend: ['#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'],   // Teals - comforting
  müde: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'],       // Indigos - tired
  'offline/unsicher': ['#ef4444', '#f87171', '#fca5a5', '#fecaca'], // Reds - unsure
};

// Shape Types
export type ShapeType = 
  | 'blob'      // Organic blob shape
  | 'star'      // Star shape
  | 'heart'     // Heart shape
  | 'cloud'     // Cloud shape
  | 'bubble'    // Bubble/circle
  | 'spring'    // Spring/coil shape
  | 'diamond'   // Diamond shape
  | 'wave'      // Wave shape
  | 'sparkle'   // Sparkle/star burst
  | 'rainbow';  // Rainbow arc

// Emotion to Shape Mapping
export const EMOTION_SHAPES: Record<N1EmotionState, ShapeType[]> = {
  ruhig: ['cloud', 'bubble', 'wave'],
  fröhlich: ['star', 'sparkle', 'heart', 'bubble'],
  neugierig: ['diamond', 'star', 'bubble'],
  verspielt: ['spring', 'bubble', 'star', 'sparkle'],
  nachdenklich: ['cloud', 'wave', 'diamond'],
  überrascht: ['star', 'sparkle', 'bubble'],
  stolz: ['star', 'sparkle', 'heart'],
  tröstend: ['heart', 'cloud', 'bubble'],
  müde: ['cloud', 'bubble', 'wave'],
  'offline/unsicher': ['diamond', 'cloud', 'wave'],
};

// Motion Patterns
export type MotionPattern = 
  | 'float'      // Gentle floating
  | 'bounce'      // Happy bouncing
  | 'spin'        // Spinning
  | 'pulse'       // Pulsing
  | 'wave'        // Wavy movement
  | 'wiggle'      // Wiggling
  | 'drift'       // Drifting
  | 'tremble'     // Trembling (uncertain)
  | 'jump'        // Jumping for joy
  | 'sleep';      // Sleepy movement

export const EMOTION_MOTIONS: Record<N1EmotionState, MotionPattern[]> = {
  ruhig: ['float', 'drift', 'wave', 'pulse'],
  fröhlich: ['bounce', 'jump', 'spin', 'wiggle'],
  neugierig: ['drift', 'float', 'wiggle'],
  verspielt: ['bounce', 'spin', 'jump', 'wiggle'],
  nachdenklich: ['wave', 'float', 'drift'],
  überrascht: ['jump', 'bounce', 'spin'],
  stolz: ['bounce', 'spin', 'sparkle'],
  tröstend: ['float', 'drift', 'wave', 'pulse'],
  müde: ['sleep', 'float', 'drift'],
  'offline/unsicher': ['tremble', 'wave', 'drift'],
};

// Learning Celebration Effects
export interface LearningCelebration {
  type: 'aha' | 'correction' | 'repeat' | 'new';
  emoji: string;
  shapes: ShapeType[];
  colors: string[];
  duration: number;
}

export const LEARNING_CELEBRATIONS: Record<string, LearningCelebration> = {
  aha: {
    type: 'aha',
    emoji: '💡',
    shapes: ['sparkle', 'star', 'bubble'],
    colors: ['#fbbf24', '#fcd34d', '#fef08a', '#ffffff'],
    duration: 3000,
  },
  correction: {
    type: 'correction',
    emoji: '🤗',
    shapes: ['heart', 'bubble', 'cloud'],
    colors: ['#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'],
    duration: 2500,
  },
  repeat: {
    type: 'repeat',
    emoji: '✨',
    shapes: ['star', 'sparkle', 'diamond'],
    colors: ['#eab308', '#facc15', '#fde047', '#fef9c3'],
    duration: 2000,
  },
  new: {
    type: 'new',
    emoji: '🌟',
    shapes: ['star', 'sparkle', 'heart', 'bubble'],
    colors: ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8'],
    duration: 3500,
  },
};

// Voice Reaction Effects
export interface VoiceReaction {
  emotion: N1EmotionState;
  intensity: number;
  shapes: ShapeType[];
  motion: MotionPattern;
  duration: number;
}

export const VOICE_REACTIONS: Record<string, VoiceReaction> = {
  greeting: { emotion: 'fröhlich', intensity: 0.9, shapes: ['star', 'sparkle', 'heart'], motion: 'bounce', duration: 2000 },
  question: { emotion: 'neugierig', intensity: 0.7, shapes: ['diamond', 'bubble'], motion: 'wiggle', duration: 1500 },
  explanation: { emotion: 'überrascht', intensity: 0.8, shapes: ['star', 'sparkle'], motion: 'jump', duration: 2000 },
  correction: { emotion: 'nachdenklich', intensity: 0.6, shapes: ['cloud', 'wave'], motion: 'drift', duration: 1500 },
  goodnight: { emotion: 'müde', intensity: 0.5, shapes: ['cloud', 'bubble'], motion: 'sleep', duration: 3000 },
  happy: { emotion: 'fröhlich', intensity: 1.0, shapes: ['star', 'sparkle', 'heart', 'bubble'], motion: 'jump', duration: 2500 },
  sad: { emotion: 'tröstend', intensity: 0.7, shapes: ['heart', 'cloud'], motion: 'float', duration: 2000 },
  confused: { emotion: 'offline/unsicher', intensity: 0.6, shapes: ['diamond', 'cloud'], motion: 'tremble', duration: 1500 },
};

// Main Animation Component Props
export interface PlayroomAnimationProps {
  emotion: N1EmotionState;
  isActive: boolean;
  currentMotif?: string;
  learningCelebration?: LearningCelebration | null;
  voiceReaction?: VoiceReaction | null;
  learnedCount?: number;
  showChildQuestion?: string | null;
}

// Shape Component
const AnimatedShape: React.FC<{
  type: ShapeType;
  color: string;
  size: number;
  motion: MotionPattern;
  delay?: number;
}> = ({ type, color, size, motion, delay = 0 }) => {
  
  const getMotionVariants = () => {
    const base = {
      initial: { scale: 0, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
    };
    
    switch (motion) {
      case 'float':
        return {
          ...base,
          animate: {
            scale: [1, 1.1, 1],
            y: [0, -15, 0],
            opacity: [0.8, 1, 0.8],
          },
        };
      case 'bounce':
        return {
          ...base,
          animate: {
            scale: [1, 1.2, 1],
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
          },
        };
      case 'spin':
        return {
          ...base,
          animate: {
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          },
        };
      case 'pulse':
        return {
          ...base,
          animate: {
            scale: [0.8, 1.2, 0.8],
            opacity: [0.6, 1, 0.6],
          },
        };
      case 'wave':
        return {
          ...base,
          animate: {
            x: [-10, 10, -10],
            rotate: [0, 5, -5, 0],
          },
        };
      case 'wiggle':
        return {
          ...base,
          animate: {
            rotate: [-10, 10, -10, 10, 0],
            scale: [1, 1.05, 1],
          },
        };
      case 'drift':
        return {
          ...base,
          animate: {
            x: [-20, 20, -20],
            y: [-10, 10, -10],
          },
        };
      case 'tremble':
        return {
          ...base,
          animate: {
            x: [-2, 2, -2, 2, 0],
            y: [-1, 1, -1, 1, 0],
          },
        };
      case 'jump':
        return {
          ...base,
          animate: {
            y: [0, -30, 0],
            scale: [1, 1.3, 1],
          },
        };
      case 'sleep':
        return {
          ...base,
          animate: {
            y: [0, -5, 0],
            opacity: [0.5, 0.8, 0.5],
          },
        };
      default:
        return base;
    }
  };

  const variants = getMotionVariants();

  const renderShape = () => {
    const style: React.CSSProperties = {
      width: size,
      height: size,
      backgroundColor: color,
      filter: `drop-shadow(0 0 ${size/4}px ${color})`,
    };

    switch (type) {
      case 'blob':
        return <motion.div style={{ ...style, borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }} />;
      case 'star':
        return (
          <motion.div style={{ ...style, clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        );
      case 'heart':
        return (
          <motion.div style={{ ...style, clipPath: 'path("M50% 88.5C25% 70% 0% 50% 0% 30C0% 10% 20% 0% 50% 35C80% 0% 100% 10% 100% 30C100% 50% 75% 70% 50% 88.5Z")' }} />
        );
      case 'cloud':
        return (
          <motion.div style={{ ...style, borderRadius: '50%', filter: `blur(2px) drop-shadow(0 0 ${size/3}px ${color})` }} />
        );
      case 'bubble':
        return (
          <motion.div 
            style={{ 
              ...style, 
              borderRadius: '50%',
              border: `2px solid ${color}`,
              backgroundColor: 'transparent',
            }} 
          />
        );
      case 'spring':
        return (
          <motion.div 
            style={{ 
              ...style, 
              borderRadius: '50%',
              background: `conic-gradient(from 0deg, ${color}, transparent, ${color})`,
            }} 
          />
        );
      case 'diamond':
        return (
          <motion.div style={{ ...style, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
        );
      case 'wave':
        return (
          <motion.div 
            style={{ 
              ...style, 
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              opacity: 0.7,
            }} 
          />
        );
      case 'sparkle':
        return (
          <motion.div style={{ ...style, clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}>
            <motion.div 
              style={{ 
                position: 'absolute', 
                inset: 0, 
                backgroundColor: color,
                filter: `blur(${size/3}px)`,
                opacity: 0.5,
              }} 
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.8, 1.2, 0.8] }}
            />
          </motion.div>
        );
      case 'rainbow':
        return (
          <motion.div 
            style={{ 
              width: size * 1.5, 
              height: size * 0.75,
              borderRadius: '0 0 50% 50% / 0 0 100% 100%',
              background: `linear-gradient(180deg, #ef4444, #fbbf24, #22c55e, #3b82f6, #8b5cf6)`,
              opacity: 0.8,
            }} 
          />
        );
      default:
        return <motion.div style={style} />;
    }
  };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      transition={{
        duration: 2 + Math.random(),
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    >
      {renderShape()}
    </motion.div>
  );
};

// Learning Celebration Effect
const LearningCelebrationEffect: React.FC<{ celebration: LearningCelebration }> = ({ celebration }) => {
  const shapes = Array.from({ length: 12 }, (_, i) => ({
    type: celebration.shapes[i % celebration.shapes.length],
    color: celebration.colors[i % celebration.colors.length],
    size: 20 + Math.random() * 40,
    position: {
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
    },
    delay: Math.random() * 0.5,
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {shapes.map((shape, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
              x: shape.position.x * 3,
              y: shape.position.y * 3 - 50,
              rotate: Math.random() * 360,
            }}
            transition={{
              duration: celebration.duration / 1000,
              delay: shape.delay,
              ease: 'easeOut',
            }}
            className="absolute"
          >
            <AnimatedShape
              type={shape.type}
              color={shape.color}
              size={shape.size}
              motion="float"
            />
          </motion.div>
        ))}
      </AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: celebration.duration / 1000, times: [0, 0.3, 0.7, 1] }}
        className="absolute text-6xl"
      >
        {celebration.emoji}
      </motion.div>
    </div>
  );
};

// Child Question Bubble
const ChildQuestionBubble: React.FC<{ question: string }> = ({ question }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0, y: 20 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0, opacity: 0, y: -20 }}
    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-xl max-w-xs"
  >
    <div className="text-sm font-medium text-center">{question}</div>
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
      <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-amber-500" />
    </div>
  </motion.div>
);

// Learned Counter Display
const LearnedCounter: React.FC<{ count: number }> = ({ count }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg"
  >
    <div className="flex items-center gap-2">
      <span className="text-white text-sm font-bold">{count}</span>
      <span className="text-white/80 text-xs">🌟 heute gelernt</span>
    </div>
  </motion.div>
);

// Main Playroom Animation Component
export const PlayroomAnimations: React.FC<PlayroomAnimationProps> = ({
  emotion,
  isActive,
  currentMotif,
  learningCelebration,
  voiceReaction,
  learnedCount = 0,
  showChildQuestion,
}) => {
  const colors = EMOTION_COLORS[emotion];
  const shapes = EMOTION_SHAPES[emotion];
  const motions = EMOTION_MOTIONS[emotion];

  const [particles, setParticles] = useState<
    Array<{
      id: number;
      type: ShapeType;
      color: string;
      size: number;
      x: number;
      y: number;
      motion: MotionPattern;
      delay: number;
    }>
  >([]);

  // Generate ambient particles
  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: Date.now() + i,
      type: shapes[i % shapes.length],
      color: colors[i % colors.length],
      size: 15 + Math.random() * 35,
      x: Math.random() * 100,
      y: Math.random() * 100,
      motion: motions[i % motions.length],
      delay: Math.random() * 2,
    }));

    setParticles(newParticles);
  }, [isActive, emotion, shapes, colors, motions]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Learned Counter */}
      <AnimatePresence>
        {learnedCount > 0 && <LearnedCounter count={learnedCount} />}
      </AnimatePresence>

      {/* Child Question Bubble */}
      <AnimatePresence>
        {showChildQuestion && <ChildQuestionBubble question={showChildQuestion} />}
      </AnimatePresence>

      {/* Learning Celebration Effect */}
      <AnimatePresence>
        {learningCelebration && <LearningCelebrationEffect celebration={learningCelebration} />}
      </AnimatePresence>

      {/* Ambient Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: particle.delay,
          }}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <AnimatedShape
            type={particle.type}
            color={particle.color}
            size={particle.size}
            motion={particle.motion}
            delay={particle.delay}
          />
        </motion.div>
      ))}

      {/* Center Glow Effect */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          background: [
            `radial-gradient(circle, ${colors[0]}20 0%, transparent 50%)`,
            `radial-gradient(circle, ${colors[1]}30 0%, transparent 60%)`,
            `radial-gradient(circle, ${colors[0]}20 0%, transparent 50%)`,
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Emotion State Label */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-4 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full"
      >
        <span className="text-white/80 text-sm font-medium">
          {emotion} {currentMotif && `• ${currentMotif}`}
        </span>
      </motion.div>
    </div>
  );
};

export default PlayroomAnimations;
