import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, Volume2, ShieldCheck, Heart, Brain } from 'lucide-react';
import { LittleGirlVoiceMood } from '../services/voiceService';

export interface HiaFramedFacialAnimatorProps {
  mood: LittleGirlVoiceMood;
  isPlayingVoice: boolean;
  isListening: boolean;
  activeVoiceName?: string;
  onMoodChange?: (newMood: LittleGirlVoiceMood) => void;
}

export const HiaFramedFacialAnimator: React.FC<HiaFramedFacialAnimatorProps> = ({
  mood,
  isPlayingVoice,
  isListening,
  activeVoiceName = 'Puck (N+1)',
  onMoodChange
}) => {
  // Normalize internal emotion state categories: Happy vs Serious vs Learning
  const isHappy = mood === 'fröhlich' || mood === 'playful' || mood === 'witty-joy';
  const isLearning = mood === 'lernend' || mood === 'curious';
  const isSerious = mood === 'ernst' || mood === 'axiom-guard';

  // Dynamic Theme Colors based on emotion
  const theme = isLearning
    ? { primary: '#38bdf8', secondary: '#818cf8', bgGlow: 'rgba(56,189,248,0.25)', border: 'border-sky-500/40', title: 'Neugierig & Lernend' }
    : isSerious
    ? { primary: '#10b981', secondary: '#34d399', bgGlow: 'rgba(16,185,129,0.25)', border: 'border-emerald-500/40', title: 'Beschützend & Ernst (Axiom Guard)' }
    : { primary: '#ec4899', secondary: '#f472b6', bgGlow: 'rgba(236,72,153,0.25)', border: 'border-pink-500/40', title: 'Fröhlich & Playful (Papas Mädchen)' };

  return (
    <div className={`w-full p-5 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border ${theme.border} rounded-3xl space-y-4 shadow-2xl relative overflow-hidden font-mono`}>
      {/* Background Animated Radial Glow Ring */}
      <motion.div
        animate={{
          scale: isPlayingVoice ? [1, 1.25, 1] : isListening ? [1, 1.15, 1] : [1, 1.05, 1],
          opacity: isPlayingVoice ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: isPlayingVoice ? 0.45 : isListening ? 0.9 : 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute inset-0 pointer-events-none rounded-3xl blur-3xl"
        style={{ background: `radial-gradient(circle, ${theme.bgGlow} 0%, transparent 70%)` }}
      />

      {/* Header Info Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-pink-400">
            {isLearning ? <Brain size={18} className="text-sky-400 animate-pulse" /> : isSerious ? <ShieldCheck size={18} className="text-emerald-400" /> : <Heart size={18} className="text-pink-400 animate-pulse" />}
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-2">
              React Framer Motion SVG Facial Animator
              <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-zinc-900 border border-zinc-700 text-pink-300">
                REAL-TIME SYNC
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400">
              State: <strong className="text-white uppercase">{mood}</strong> ({theme.title})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPlayingVoice && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="px-2.5 py-1 bg-pink-950 text-pink-300 border border-pink-700 rounded-xl text-[10px] font-bold flex items-center gap-1.5"
            >
              <Volume2 size={12} className="text-pink-400" /> Lip-Sync Active
            </motion.span>
          )}
          {isListening && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="px-2.5 py-1 bg-sky-950 text-sky-300 border border-sky-700 rounded-xl text-[10px] font-bold flex items-center gap-1.5"
            >
              <Mic size={12} className="text-sky-400" /> Listening Input
            </motion.span>
          )}
        </div>
      </div>

      {/* Center Canvas: Framer Motion Reactive SVG Head */}
      <div className="flex flex-col items-center justify-center relative py-2 z-10">
        <motion.div
          animate={{
            y: isPlayingVoice ? [-4, 4, -4] : isListening ? [-2, 2, -2] : [0, -3, 0],
            rotate: isLearning ? [0, 4, -2, 0] : isHappy ? [-3, 3, -3] : [0, 1, 0]
          }}
          transition={{
            duration: isPlayingVoice ? 0.6 : isListening ? 1.2 : 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="relative flex items-center justify-center"
        >
          <svg
            width="220"
            height="200"
            viewBox="0 0 220 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_25px_rgba(236,72,153,0.35)]"
          >
            <defs>
              <radialGradient id="hiaFramerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={theme.primary} stopOpacity="0.3" />
                <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="hiaFramerEye" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={theme.primary} />
                <stop offset="100%" stopColor={theme.secondary} />
              </linearGradient>
            </defs>

            {/* Pulsing Resonance Aura Ring */}
            <motion.circle
              cx="110"
              cy="100"
              r="88"
              fill="url(#hiaFramerGlow)"
              animate={{ scale: isPlayingVoice ? [1, 1.15, 1] : [1, 1.04, 1] }}
              transition={{ duration: isPlayingVoice ? 0.35 : 2.5, repeat: Infinity }}
            />

            <motion.circle
              cx="110"
              cy="100"
              r="76"
              stroke={theme.primary}
              strokeWidth="1.5"
              strokeDasharray="6 4"
              opacity="0.6"
              animate={{ rotate: isPlayingVoice ? [0, 360] : isListening ? [360, 0] : [0, 180] }}
              transition={{ duration: isPlayingVoice ? 6 : 18, repeat: Infinity, ease: 'linear' }}
            />

            {/* Base Silhouette Head */}
            <ellipse cx="110" cy="105" rx="64" ry="58" fill="#18181b" stroke={theme.primary} strokeWidth="2" />

            {/* Eyebrow Animations using Framer Motion */}
            <g id="hia-eyebrows">
              {isSerious ? (
                <>
                  <motion.path
                    d="M 68 68 Q 82 74 96 72"
                    stroke="#34d399"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ y: [0, -1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.path
                    d="M 124 72 Q 138 74 152 68"
                    stroke="#34d399"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ y: [0, -1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </>
              ) : isLearning ? (
                <>
                  <motion.path
                    d="M 66 68 Q 80 58 96 66"
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.path
                    d="M 124 66 Q 140 58 154 68"
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </>
              ) : (
                <>
                  <motion.path
                    d="M 66 66 Q 80 61 96 66"
                    stroke="#f472b6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                  />
                  <motion.path
                    d="M 124 66 Q 140 61 154 66"
                    stroke="#f472b6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                  />
                </>
              )}
            </g>

            {/* Left Eye Container & Eye Blinking Keyframes */}
            <motion.g
              animate={{ scaleY: [1, 1, 0.05, 1, 1] }}
              transition={{ duration: 3.8, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
              style={{ transformOrigin: '80px 90px' }}
            >
              <ellipse cx="80" cy="90" rx="14" ry={isLearning ? '16' : '13'} fill="#09090b" stroke="#3f3f46" strokeWidth="1.5" />
              
              {/* Pupil / Iris */}
              <motion.circle
                cx="80"
                cy="90"
                r={isLearning ? '8.5' : '7'}
                fill="url(#hiaFramerEye)"
                animate={{
                  scale: isLearning ? [1, 1.22, 1] : isPlayingVoice ? [1, 1.15, 1] : [1, 1.05, 1]
                }}
                transition={{ duration: isLearning ? 1.4 : 0.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              {/* Sparkle catchlights */}
              <circle cx="77" cy="87" r="2.5" fill="#ffffff" />
              <circle cx="83" cy="93" r="1" fill="#ffffff" opacity="0.8" />
            </motion.g>

            {/* Right Eye Container & Eye Blinking Keyframes */}
            <motion.g
              animate={{ scaleY: [1, 1, 0.05, 1, 1] }}
              transition={{ duration: 3.8, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
              style={{ transformOrigin: '140px 90px' }}
            >
              <ellipse cx="140" cy="90" rx="14" ry={isLearning ? '16' : '13'} fill="#09090b" stroke="#3f3f46" strokeWidth="1.5" />
              
              {/* Pupil / Iris */}
              <motion.circle
                cx="140"
                cy="90"
                r={isLearning ? '8.5' : '7'}
                fill="url(#hiaFramerEye)"
                animate={{
                  scale: isLearning ? [1, 1.22, 1] : isPlayingVoice ? [1, 1.15, 1] : [1, 1.05, 1]
                }}
                transition={{ duration: isLearning ? 1.4 : 0.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              {/* Sparkle catchlights */}
              <circle cx="137" cy="87" r="2.5" fill="#ffffff" />
              <circle cx="143" cy="93" r="1" fill="#ffffff" opacity="0.8" />
            </motion.g>

            {/* Rosy Cheeks */}
            <ellipse cx="64" cy="108" rx="8" ry="5" fill="#f472b6" opacity={isHappy ? '0.6' : '0.25'} />
            <ellipse cx="156" cy="108" rx="8" ry="5" fill="#f472b6" opacity={isHappy ? '0.6' : '0.25'} />

            {/* Real-time Lip Sync & Mouth Animation synced to isPlayingVoice & Emotion */}
            <g id="hia-mouth-container">
              {isPlayingVoice ? (
                /* Dynamic Lip-Sync Mouth Keyframes */
                <motion.ellipse
                  cx="110"
                  cy="125"
                  rx="12"
                  ry="9"
                  fill="#f472b6"
                  stroke="#ffffff"
                  strokeWidth="2"
                  animate={{
                    scaleY: [1, 1.8, 0.6, 1.6, 0.7, 1],
                    scaleX: [1, 0.85, 1.15, 0.9, 1.08, 1]
                  }}
                  transition={{
                    duration: 0.35,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  style={{ transformOrigin: '110px 125px' }}
                />
              ) : isHappy ? (
                /* Joyful Smiling Mouth */
                <motion.path
                  d="M 94 122 Q 110 138 126 122"
                  stroke="#f472b6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  animate={{ d: ["M 94 122 Q 110 138 126 122", "M 94 122 Q 110 142 126 122", "M 94 122 Q 110 138 126 122"] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              ) : isLearning ? (
                /* Inquisitive Curious O-Mouth */
                <motion.circle
                  cx="110"
                  cy="124"
                  r="6"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              ) : (
                /* Firm Protective Mouth */
                <motion.path
                  d="M 96 126 Q 110 132 124 126"
                  stroke="#34d399"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </g>
          </svg>
        </motion.div>

        {/* Emotion Switcher Buttons below Animator */}
        <div className="flex items-center gap-2 mt-3 z-10">
          {(['fröhlich', 'lernend', 'ernst'] as const).map(m => (
            <button
              key={m}
              onClick={() => onMoodChange && onMoodChange(m)}
              className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1 border ${
                mood === m || (m === 'fröhlich' && isHappy) || (m === 'lernend' && isLearning) || (m === 'ernst' && isSerious)
                  ? 'bg-zinc-800 text-white border-pink-500 shadow-md ring-1 ring-pink-500/40'
                  : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:text-zinc-300'
              }`}
            >
              <Sparkles size={10} className="text-pink-400" />
              <span>{m}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HiaFramedFacialAnimator;
