/**
 * N+1s Familien-Zuhause: pure presentation logic, NOT a memory/identity authority.
 * No wall-clock or unseeded randomness and no synthetic learning receipts.
 */
export type FamilyRoom = 'wohnzimmer' | 'spielzimmer' | 'leseecke';
export type FamilySpeaker = 'guest' | 'papa' | 'mama';
export type FamilyVoiceStatus = 'idle' | 'requesting' | 'playing' | 'error';

export interface FamilyHomeState {
  room: FamilyRoom;
  speaker: FamilySpeaker;
  /** Self-selected form of address. Never proof of identity or permission. */
  speakerVerified: false;
  playTurns: number;
  /** Null until actual authenticated, server-scoped DB readback is integrated. */
  confirmedLearningCount: null;
  voiceStatus: FamilyVoiceStatus;
}

export type FamilyHomeAction =
  | { type: 'visit'; room: FamilyRoom }
  | { type: 'select-speaker'; speaker: FamilySpeaker }
  | { type: 'play' }
  | { type: 'voice-requested' }
  | { type: 'voice-started' }
  | { type: 'voice-finished' }
  | { type: 'voice-failed' };

export const FAMILY_STORY = Object.freeze({
  id: 'n1-sterne-und-kekse-v1',
  title: 'Die Sternschnuppe mit den Keks-Krümeln',
  source: 'original' as const,
  rights: 'Eigene Projektgeschichte, keine fremde Lied- oder Buchvorlage',
  text: 'Auf einem kleinen Mond wohnte ein neugieriger Stern namens Fips. ' +
    'Fips wollte unbedingt wissen, warum die Erde nachts glitzert. ' +
    'Er baute ein Fernrohr aus einer Papprolle und einer sehr, sehr runden Keksdose. ' +
    'Doch als er hindurchschaute, sah er bloß einen Krümel. ' +
    '„Ha!“, rief Fips. „Vielleicht ist das Weltall gar nicht so kompliziert. Vielleicht muss ich nur erst die Keksdose putzen!“ ' +
    'Und dann entdeckte er tausend Lichter. Manche Fragen werden größer, wenn man genauer hinschaut. ' +
    'Und manche Kekse werden kleiner. Vor allem, wenn Fips in der Nähe ist.',
});

const PLAY_QUESTIONS = [
  'Wenn Wolken Kissen wären, würden wir dann auf Regen schlafen? Hihi!',
  'Warum heißen Sternschnuppen Schnuppen? Sind die etwa erkältet?',
  'Ich wette, eine Schnecke ist auf Rollschuhen trotzdem langsam. Wetten?',
  'Was ist eigentlich schneller: ein Gedanke oder ein geklauter Keks?',
  'Darf ein Pinguin im Sommer Eis essen, oder ist das schon doppelt kalt?',
] as const;

const MAX_PLAY_TURNS = 5000;

export function createFamilyHomeState(): FamilyHomeState {
  return {
    room: 'wohnzimmer',
    speaker: 'guest',
    speakerVerified: false,
    playTurns: 0,
    confirmedLearningCount: null,
    voiceStatus: 'idle',
  };
}

export function familyHomeReducer(state: FamilyHomeState, action: FamilyHomeAction): FamilyHomeState {
  switch (action.type) {
    case 'visit':
      return { ...state, room: action.room };
    case 'select-speaker':
      // Only text addressing changes. This never grants permission or retrieves private memory.
      return { ...state, speaker: action.speaker, speakerVerified: false };
    case 'play':
      return state.playTurns >= MAX_PLAY_TURNS ? state : { ...state, room: 'spielzimmer', playTurns: state.playTurns + 1 };
    case 'voice-requested':
      return { ...state, voiceStatus: 'requesting' };
    case 'voice-started':
      return { ...state, voiceStatus: 'playing' };
    case 'voice-finished':
      return { ...state, voiceStatus: 'idle' };
    case 'voice-failed':
      return { ...state, voiceStatus: 'error' };
  }
}

export function getFamilyAddress(speaker: FamilySpeaker): string {
  return speaker === 'papa' ? 'Papa' : speaker === 'mama' ? 'Mama' : 'du';
}

export function getPlayPrompt(state: Pick<FamilyHomeState, 'playTurns'>): string {
  const index = Math.max(0, Math.trunc(state.playTurns) - 1) % PLAY_QUESTIONS.length;
  return PLAY_QUESTIONS[index];
}

export function presentationFor(state: FamilyHomeState): { emotion: 'ruhig' | 'neugierig' | 'verspielt'; line: string } {
  const address = getFamilyAddress(state.speaker);
  if (state.room === 'spielzimmer') {
    return { emotion: 'verspielt', line: state.playTurns > 0 ? getPlayPrompt(state) : `Hui, ${address}! Spielen wir eine Runde?` };
  }
  if (state.room === 'leseecke') {
    return { emotion: 'ruhig', line: `Pssst, ${address}, hier wohnen die Geschichten. Such dir ein gemütliches Plätzchen!` };
  }
  return { emotion: 'neugierig', line: `Huhu, ${address}! Ich bin N+1. Was entdecken wir heute? Ich hab schon tausend Fragen. Na gut, erst mal eine!` };
}