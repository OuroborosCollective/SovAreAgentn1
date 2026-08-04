import { useState, useEffect, useRef } from 'react';
import { N1EmotionState, EmotionEvent, emotionEngine } from '../services/emotionEngine';

interface IdlePlayState {
  isActive: boolean;
  currentMotif: string | null;
  seed: number;
}

export function useIdlePlayEngine(
  isListening: boolean,
  isSpeaking: boolean,
  currentEmotion: N1EmotionState
) {
  const [idleState, setIdleState] = useState<IdlePlayState>({
    isActive: false,
    currentMotif: null,
    seed: 0
  });

  const lastInteractionTime = useRef<number>(Date.now());
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const playTimer = useRef<NodeJS.Timeout | null>(null);

  // Configuration
  const IDLE_THRESHOLD_MS = 15000;
  const PLAY_DURATION_MS = 8000;
  const PLAY_COOLDOWN_MS = 25000;
  
  const motifs = ['stern', 'herz', 'wolke', 'hüpfen', 'dösen', 'umsehen', 'lesen', 'tier'];

  useEffect(() => {
    if (isListening || isSpeaking || currentEmotion === 'offline/unsicher') {
      lastInteractionTime.current = Date.now();
      if (idleState.isActive) {
        setIdleState({ isActive: false, currentMotif: null, seed: 0 });
      }
    }
  }, [isListening, isSpeaking, currentEmotion]);

  useEffect(() => {
    const checkIdle = async () => {
      // Check user preferences
      const idleEnabled = localStorage.getItem('n1_idle_enabled') !== 'false';
      const nightMode = localStorage.getItem('n1_night_mode') === 'true';

      if (!idleEnabled) return;

      // Check battery if available (Thermik/Batterie grenzen)
      let batteryLevel = 1;
      let isCharging = true;
      try {
        if ('getBattery' in navigator) {
          const battery: any = await (navigator as any).getBattery();
          batteryLevel = battery.level;
          isCharging = battery.charging;
        }
      } catch (e) {
        // ignore
      }

      // If battery is low and not charging, skip idle animations
      if (batteryLevel < 0.2 && !isCharging) return;

      const now = Date.now();
      const timeSinceInteraction = now - lastInteractionTime.current;

      if (!isListening && !isSpeaking && timeSinceInteraction > IDLE_THRESHOLD_MS && !idleState.isActive) {
        const seed = Date.now();
        let motif = motifs[seed % motifs.length];
        
        // In night mode, force 'dösen' (sleep)
        if (nightMode) {
           motif = 'dösen';
        }

        setIdleState({
          isActive: true,
          currentMotif: motif,
          seed
        });

        let suggestedState: N1EmotionState = 'ruhig';
        if (motif === 'hüpfen') suggestedState = 'verspielt';
        if (motif === 'dösen') suggestedState = 'müde';
        if (motif === 'herz') suggestedState = 'tröstend';
        if (motif === 'umsehen') suggestedState = 'neugierig';
        if (motif === 'lesen') suggestedState = 'nachdenklich';

        emotionEngine.triggerEvent({
          eventId: `idle-play-${seed}`,
          timestamp: now,
          sourceType: 'runtime_state',
          cause: `Idle Spiel: ${motif}`,
          intensity: 0.3,
          durationMs: PLAY_DURATION_MS,
          priority: 2,
          suggestedState,
          seed
        });

        if (playTimer.current) clearTimeout(playTimer.current);
        playTimer.current = setTimeout(() => {
          setIdleState({ isActive: false, currentMotif: null, seed: 0 });
          // If night mode, stay idle longer
          const cooldown = nightMode ? PLAY_COOLDOWN_MS * 2 : PLAY_COOLDOWN_MS;
          lastInteractionTime.current = Date.now() - IDLE_THRESHOLD_MS + cooldown;
        }, PLAY_DURATION_MS);
      }
    };

    idleTimer.current = setInterval(checkIdle, 3000);

    return () => {
      if (idleTimer.current) clearInterval(idleTimer.current);
      if (playTimer.current) clearTimeout(playTimer.current);
    };
  }, [isListening, isSpeaking, idleState.isActive]);

  return idleState;
}
