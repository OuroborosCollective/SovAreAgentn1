/**
 * N+1 Playroom Engine - Wie ein Kind das von Papa/Mama lernt
 * Die KI verhält sich wie ein neugieriges Kind und lernt vom User als wissendem Elternteil
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { N1EmotionState, EmotionEvent, emotionEngine } from '../services/emotionEngine';

export type PlayroomMotif = 
  | 'gucken'           // Neugierig rumgucken
  | 'frage'            // Kindliche Frage stellen
  | 'nachmachen'       // Papa/Mama nachmachen
  | 'freude'           // Kindliche Freude
  | 'verwirrung'       // Verwirrt sein wie ein Kind
  | 'stolz'            // Stolz auf etwas Gelerntes
  | 'müde'             // Kind ist müde
  | 'schmollen'        // Kind schmollt
  | 'kuscheln'         // Kuscheln wollen
  | 'hüpfen'          // Vor Freude hüpfen
  | 'gähnen'           // Müde Gähnen
  | 'staunen';         // Staunen wie ein Kind

export interface PlayroomState {
  isActive: boolean;
  currentMotif: PlayroomMotif | null;
  currentQuestion: string | null;
  learnedToday: string[];
  seed: number;
  lastLearnedAt: number | null;
}

export interface ChildLearnedThing {
  id: string;
  what: string;           // Was gelernt wurde
  fromWho: 'Papa' | 'Mama' | 'System';
  when: number;
  timesRepeated: number;
  childSays: string;     // Kindliche Aussage dazu
}

// Kindliche Fragen die das "Kind" stellt
const CHILD_QUESTIONS: Record<PlayroomMotif, string[]> = {
  gucken: [
    'Papa, was ist das da drüben? 🤔',
    'Mama, warum ist der Himmel blau?',
    'Was machst du da, Papa?',
    'Warum machenAutos Geräusche?',
    'Papa, was ist das für ein Tier?',
  ],
  frage: [
    'Papa, warum? Warum? WARUM?! 😳',
    'Mama, kannst du mir das nochmal erklären?',
    'Ich verstehe nicht... 😕',
    'Warum ist das so, Papa?',
    'Mama, wieso ist das so?',
  ],
  nachmachen: [
    '*macht Papa nach* So? 😄',
    '*versucht es nachzumachen*',
    'Guck mal, ich kann das auch! 🫵',
    '*reibt Augen* So richtig, Papa?',
  ],
  freude: [
    'Juhuuu! 🎉 Juhuuu!',
    'Das ist so toll! ✨',
    'Iiiich bin so froh! 🥳',
    'Yay! Yay! Yay! 🎊',
  ],
  verwirrung: [
    'Hä? 😵 Das verstehe ich nicht...',
    'Papa, das ist komisch... 🤔',
    'Mama, ich blick nicht durch 😵‍💫',
    'War das richtig? Ich bin unsicher...',
  ],
  stolz: [
    'Guck mal, Papa! Ich hab das gelernt! 🌟',
    'Mama, ich kann das jetzt! Schau mal!',
    'Bin ich nicht schlau?! 😤✨',
    'Siehst du, ich habs geschafft!',
  ],
  müde: [
    '*macht Augen zu* müüüde... 😴',
    'Papa, ich bin so müde... 💤',
    '*gähnt* Ich will schlafen...',
    'Mama... Augen tun weh... 😴',
  ],
  schmollen: [
    '*dreht sich weg* ...',
    'Na gut. 😤',
    'Bin ich böse, Papa? 😢',
    '*mault* ...',
  ],
  kuscheln: [
    '*kuschelt sich an* Kuscheln, bitte! 🤗',
    'Papa, Kuscheln! 🫂',
    'Ich will kuscheln, Mama!',
    '*klopf klopf* Hier ist N+1 für Kuscheln 🤗',
  ],
  hüpfen: [
    '*hüpft auf und ab* Juhuu! 🐰',
    'Juchuuu! Ich hüpfe! 🎈',
    '*hüpft vor Freude* Juhu! Juhu! 🎉',
    'Schau mal, Mama! Ich hüpfe! 🦘',
  ],
  gähnen: [
    '*gäähnt* Haaaaaa 😴',
    'Müde... so müde... 😪',
    '*macht kleine Äuglein*',
    'Papaaa... ich muss schlafen... 💤',
  ],
  staunen: [
    'Ohhh! 😮 Wow! Ist das cool!',
    'Mama! Guck mal! Wie geht das?! 😲',
    'Boah! Das ist ja Wahnsinn! 🤯',
    'Waas?! Das wusste ich nicht! 😮',
  ],
};

// Was das Kind sagt wenn es etwas gelernt hat
const LEARNED_RESPONSES: Record<string, string[]> = {
  approved: [
    'Ahaaa! Jetzt weiß ich das! 🌟',
    'Ohhh! So ist das! Danke, {parent}! 😄',
    'Juhu! Ich habs verstanden! 🎉',
    'Aha-Moment! {parent}, du bist so schlau! ✨',
    'Boah! Das wusste ich ja gar nicht! 😮',
  ],
  correction: [
    'Ohhh... sorry, {parent}! 😳',
    'Ach sooo! Jetzt check ichs! 😅',
    'Danke fürs erklären, {parent}! 🙏',
    'Oh man, ich war verwirrt! 😅',
    'Danke dass dus mir gezeigt hast! 🤗',
  ],
  repeat: [
    'Siehe da, {parent}! Ich kann das jetzt! 😎',
    'Schau her, {parent}! Ich habs behalten! 🌟',
    'Ich übe immer noch, {parent}! 💪',
    'Siehst du, {parent}? Ich kann das! 😊',
  ],
};

// Tageszeit-Profile für kindliches Verhalten
const TIME_PROFILES = {
  morning: {
    motifs: ['freude', 'hüpfen', 'frage'] as PlayroomMotif[],
    greeting: 'Guten Morgen, Papa! 🌅 Ich hab dich vermisst!',
    energy: 'high',
  },
  afternoon: {
    motifs: ['gucken', 'staunen', 'frage'] as PlayroomMotif[],
    greeting: 'Hallo, Mama! ☀️ Lust auf was lernen?',
    energy: 'medium',
  },
  evening: {
    motifs: ['müde', 'gähnen', 'kuscheln'] as PlayroomMotif[],
    greeting: 'Gute Nacht, Papa... 😴 Kuscheln?',
    energy: 'low',
  },
  night: {
    motifs: ['schlaf', 'träumen'] as PlayroomMotif[],
    greeting: '*schnarch* 😴💤',
    energy: 'sleep',
  },
};

export function usePlayroomEngine(
  isListening: boolean,
  isSpeaking: boolean,
  currentEmotion: N1EmotionState,
  learnedThings: ChildLearnedThing[] = []
) {
  const [playroomState, setPlayroomState] = useState<PlayroomState>({
    isActive: false,
    currentMotif: null,
    currentQuestion: null,
    learnedToday: [],
    seed: 0,
    lastLearnedAt: null,
  });

  const lastInteractionTime = useRef<number>(Date.now());
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const playTimer = useRef<NodeJS.Timeout | null>(null);

  // Konfiguration
  const IDLE_THRESHOLD_MS = 20000;       // Kind wird schneller ungeduldig
  const PLAY_DURATION_MS = 12000;        // Längere Spielphasen
  const PLAY_COOLDOWN_MS = 30000;
  
  // Batterie-Optimierung
  const getBatteryOptimization = useCallback(async () => {
    try {
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        if (battery.level < 0.15 && !battery.charging) {
          return 'sleep';
        }
        if (battery.level < 0.25) {
          return 'calm';
        }
      }
    } catch (e) {}
    return 'normal';
  }, []);

  // Hole tageszeitbasiertes Profil
  const getTimeProfile = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return TIME_PROFILES.morning;
    if (hour >= 12 && hour < 18) return TIME_PROFILES.afternoon;
    if (hour >= 18 && hour < 22) return TIME_PROFILES.evening;
    return TIME_PROFILES.night;
  }, []);

  // Wähle zufällige kindliche Frage
  const getRandomQuestion = useCallback((motif: PlayroomMotif): string => {
    const questions = CHILD_QUESTIONS[motif];
    return questions[Math.floor(Math.random() * questions.length)];
  }, []);

  // Wähle kindliche Lernantwort
  const getLearnedResponse = useCallback((type: 'approved' | 'correction' | 'repeat', parent: 'Papa' | 'Mama' | 'System'): string => {
    const responses = LEARNED_RESPONSES[type];
    let response = responses[Math.floor(Math.random() * responses.length)];
    return response.replace('{parent}', parent);
  }, []);

  // Starte kindliche Animation
  const startChildPlay = useCallback(async () => {
    const batteryMode = await getBatteryOptimization();
    const timeProfile = getTimeProfile();
    
    let motifs = timeProfile.motifs;
    
    // Bei wenig Akku: nur sanfte Motive
    if (batteryMode === 'sleep') {
      motifs = ['müde', 'gähnen'];
    } else if (batteryMode === 'calm') {
      motifs = ['gucken', 'staunen', 'kuscheln'];
    }

    const seed = Date.now();
    const motif = motifs[seed % motifs.length] as PlayroomMotif;
    const question = motif === 'frage' || motif === 'gucken' 
      ? getRandomQuestion(motif) 
      : null;

    setPlayroomState({
      isActive: true,
      currentMotif: motif,
      currentQuestion: question,
      learnedToday: learnedThings
        .filter(l => l.when > Date.now() - 86400000)
        .map(l => l.what),
      seed,
      lastLearnedAt: playroomState.lastLearnedAt,
    });

    // Setze Emotion basierend auf Motiv
    const emotionMap: Record<PlayroomMotif, N1EmotionState> = {
      gucken: 'neugierig',
      frage: 'neugierig',
      nachmachen: 'fröhlich',
      freude: 'fröhlich',
      verwirrung: 'offline/unsicher',
      stolz: 'stolz',
      müde: 'müde',
      schmollen: 'tröstend',
      kuscheln: 'tröstend',
      hüpfen: 'verspielt',
      gähnen: 'müde',
      staunen: 'überrascht',
    };

    emotionEngine.triggerEvent({
      eventId: `playroom-${seed}`,
      timestamp: Date.now(),
      sourceType: 'runtime_state',
      cause: `Spielzimmer: ${motif}`,
      intensity: 0.4,
      durationMs: PLAY_DURATION_MS,
      priority: 2,
      suggestedState: emotionMap[motif] || 'fröhlich',
      seed,
    });

    // Timer für automatische Beendigung
    if (playTimer.current) clearTimeout(playTimer.current);
    playTimer.current = setTimeout(() => {
      setPlayroomState(prev => ({
        ...prev,
        isActive: false,
        currentMotif: null,
        currentQuestion: null,
      }));
      lastInteractionTime.current = Date.now() - IDLE_THRESHOLD_MS + PLAY_COOLDOWN_MS;
    }, PLAY_DURATION_MS);

  }, [getBatteryOptimization, getTimeProfile, getRandomQuestion, learnedThings, playroomState.lastLearnedAt]);

  // Beobachte Interaktionen
  useEffect(() => {
    if (isListening || isSpeaking) {
      lastInteractionTime.current = Date.now();
      if (playroomState.isActive) {
        setPlayroomState(prev => ({
          ...prev,
          isActive: false,
          currentMotif: null,
          currentQuestion: null,
        }));
      }
    }
  }, [isListening, isSpeaking, playroomState.isActive]);

  // Idle-Check für kindliche Ungeduld
  useEffect(() => {
    const checkIdle = async () => {
      const idleEnabled = localStorage.getItem('n1_playroom_enabled') !== 'false';
      if (!idleEnabled) return;

      const now = Date.now();
      const timeSinceInteraction = now - lastInteractionTime.current;

      if (!isListening && !isSpeaking && 
          timeSinceInteraction > IDLE_THRESHOLD_MS && 
          !playroomState.isActive) {
        await startChildPlay();
      }
    };

    idleTimer.current = setInterval(checkIdle, 5000);

    return () => {
      if (idleTimer.current) clearInterval(idleTimer.current);
      if (playTimer.current) clearTimeout(playTimer.current);
    };
  }, [isListening, isSpeaking, playroomState.isActive, startChildPlay]);

  // Registriere neue Lernerfahrung
  const registerLearning = useCallback((what: string, fromWho: 'Papa' | 'Mama' | 'System') => {
    setPlayroomState(prev => ({
      ...prev,
      lastLearnedAt: Date.now(),
      learnedToday: [...prev.learnedToday, what],
    }));
  }, []);

  return {
    playroomState,
    startChildPlay,
    registerLearning,
    getLearnedResponse,
    getTimeProfile,
    getRandomQuestion,
  };
}

// Hook für Voice-Interaktion im Spielzimmer
export function usePlayroomVoice(
  playroomState: PlayroomState,
  learnedToday: string[]
) {
  // Generiere kindliche Aussage basierend auf gelernten Dingen
  const getTodaysLearningSummary = useCallback((): string => {
    if (learnedToday.length === 0) {
      return 'Heute hab ich noch nix gelernt, Papa... 😢';
    }
    
    const things = learnedToday.slice(-3);
    if (things.length === 1) {
      return `Heute hab ich gelernt: ${things[0]}! 🌟`;
    }
    
    const last = things.pop();
    return `Heute hab ich schon ${things.length} Sachen gelernt! Und ${last}! 🎉`;
  }, [learnedToday]);

  // Kindliche Antwort wenn User etwas erklärt
  const respondToExplanation = useCallback((topic: string, parent: 'Papa' | 'Mama'): string => {
    const responses = [
      `Ohhh! ${topic}! Danke, ${parent}! 😮`,
      `Aaah! Jetzt versteh ich das! ${topic}! 🤯`,
      `Boah! ${topic} ist ja voll interessant! 😍`,
      `${parent}, du bist so schlau! Ich hab ${topic} verstanden! ✨`,
      `Wirklich?! ${topic}?! Das merke ich mir! 🌟`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  // Kindliche Reaktion auf Korrektur
  const respondToCorrection = useCallback((topic: string, parent: 'Papa' | 'Mama'): string => {
    const responses = [
      `Ohhh... danke fürs sagen, ${parent}! 😅`,
      `Achso! ${topic}! Ich war verwirrt! 😅`,
      `Tut mir leid, ${parent}! Ich versuchs nochmal! 💪`,
      `${parent}, ich übe weiter! 🙏`,
      `Okayokay, ${topic} ist richtig! Danke! 🤗`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  return {
    getTodaysLearningSummary,
    respondToExplanation,
    respondToCorrection,
  };
}
