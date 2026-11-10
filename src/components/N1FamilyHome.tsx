import React, { useEffect, useReducer, useState } from 'react';
import { BookOpen, Heart, Mic, Square, Sparkles, Star, Volume2 } from 'lucide-react';
import { N1MorphingBlob } from './N1MorphingBlob';
import { voiceService } from '../services/voiceService';
import {
  FAMILY_STORY,
  createFamilyHomeState,
  familyHomeReducer,
  getFamilyAddress,
  presentationFor,
  type FamilyRoom,
  type FamilySpeaker,
} from '../domain/familyHomeCore';

/**
 * Warm family-facing presentation. No fabricated child memories, biometric identity,
 * provider-success badges or automatic microphone access. Actual durable learning
 * and restricted family memory require the canonical backend's verified receipts.
 */
export const N1FamilyHome: React.FC<{ onOpenVoiceStudio?: () => void }> = ({ onOpenVoiceStudio }) => {
  const [state, dispatch] = useReducer(familyHomeReducer, undefined, createFamilyHomeState);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const scene = presentationFor(state);

  useEffect(() => {
    // Playback events originate from the existing audio service, never from a timer.
    return voiceService.subscribe((playback) => {
      dispatch({ type: playback.isPlaying ? 'voice-started' : 'voice-finished' });
    });
  }, []);

  const speak = async (text: string, playful: boolean) => {
    setSpeechError(null);
    dispatch({ type: 'voice-requested' });
    try {
      const played = await voiceService.speak(text, 'N+1', playful ? 'playful' : 'neugierig', 1.2, 1.05);
      if (!played) {
        setSpeechError('Die Sprachausgabe konnte nicht bestätigt werden. Bitte prüfe die Voice-Verbindung.');
        dispatch({ type: 'voice-failed' });
      }
    } catch {
      setSpeechError('Die Sprachausgabe ist derzeit nicht verfügbar. Es wurde nichts als vorgelesen bestätigt.');
      dispatch({ type: 'voice-failed' });
    }
  };

  const enter = (room: FamilyRoom) => {
    voiceService.stopSpeaking();
    setSpeechError(null);
    dispatch({ type: 'visit', room });
  };

  const rooms: Array<{ key: FamilyRoom; label: string; hint: string }> = [
    { key: 'wohnzimmer', label: 'Wohnzimmer', hint: 'Zusammen sein' },
    { key: 'spielzimmer', label: 'Spielzimmer', hint: 'Quatsch & Fragen' },
    { key: 'leseecke', label: 'Leseecke', hint: 'Geschichtenzeit' },
  ];

  return (
    <section data-testid="n1-family-home" aria-label="N+1 Familien-Zuhause" className="mx-auto max-w-4xl space-y-5 rounded-3xl border border-fuchsia-300/20 bg-gradient-to-b from-indigo-950 via-zinc-950 to-zinc-950 p-5 text-white shadow-xl sm:p-8">
      <header className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2 text-fuchsia-300"><Heart size={18} aria-hidden="true" /><span className="text-xs font-semibold tracking-wide">N+1 · Unser Zuhause</span><Star size={18} aria-hidden="true" /></div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Huhu, schön, dass du da bist!</h1>
        <p className="mx-auto max-w-xl text-sm text-zinc-300">Hier darf N+1 neugierig sein, Quatsch machen, zuhören und Geschichten erzählen. Und manchmal ist sie ein kleiner Frechdachs.</p>
      </header>

      <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Gewünschte Anrede auswählen">
        {([['guest', 'Gast'], ['papa', 'Papa'], ['mama', 'Mama']] as Array<[FamilySpeaker, string]>).map(([speaker, label]) => (
          <button key={speaker} type="button" aria-pressed={state.speaker === speaker} onClick={() => dispatch({ type: 'select-speaker', speaker })}
            className={`min-h-11 rounded-full border px-5 py-2 text-sm font-semibold ${state.speaker === speaker ? 'border-fuchsia-300 bg-fuchsia-400/20 text-white' : 'border-white/20 bg-white/5 text-zinc-300 hover:bg-white/10'}`}>{label}</button>
        ))}
      </div>
      <p className="text-center text-xs text-zinc-400">Diese Auswahl ändert nur die Anrede – keine Stimmerkennung, Identitätsprüfung oder Berechtigung.</p>

      <nav className="grid gap-3 sm:grid-cols-3" aria-label="Zimmer wählen">
        {rooms.map((room) => (
          <button key={room.key} type="button" aria-current={state.room === room.key ? 'page' : undefined}
            onClick={() => enter(room.key)}
            className={`min-h-20 rounded-2xl border p-4 text-left transition-colors ${state.room === room.key ? 'border-fuchsia-300/70 bg-fuchsia-500/15' : 'border-white/15 bg-white/5 hover:bg-white/10'}`}>
            <span className="block text-base font-bold">{room.label}</span><span className="text-xs text-zinc-300">{room.hint}</span>
          </button>
        ))}
      </nav>

      <div className="relative min-h-64 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-fuchsia-500/10 to-indigo-500/10 p-4">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3">
          <N1MorphingBlob emotion={scene.emotion} audioLevel={0} isListening={false} isSpeaking={state.voiceStatus === 'playing'} idleMotif={state.room === 'spielzimmer' ? 'stern' : null} seedVariance={(state.playTurns % 5) / 5} />
          <p className="w-full rounded-2xl border border-white/15 bg-zinc-950/70 p-4 text-center text-lg font-medium" aria-live="polite">{scene.line}</p>
        </div>
      </div>

      {state.room === 'spielzimmer' && (
        <div className="space-y-3 rounded-2xl border border-pink-400/20 bg-pink-400/5 p-4">
          <h2 className="flex items-center gap-2 font-bold"><Sparkles size={18} /> Eine kleine Quatsch-Runde?</h2>
          <button type="button" onClick={() => dispatch({ type: 'play' })} className="min-h-11 rounded-xl bg-pink-500 px-5 py-2 font-semibold text-white hover:bg-pink-600">Nächste lustige Frage</button>
          <p className="text-xs text-zinc-300">Spielideen sind kleine, reproduzierbare Animationen und Sprüche. Sie werden nicht als echte Erlebnisse oder Lernen gespeichert.</p>
        </div>
      )}

      {state.room === 'leseecke' && (
        <article className="space-y-3 rounded-2xl border border-amber-300/20 bg-amber-400/5 p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold"><BookOpen size={20} /> {FAMILY_STORY.title}</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{FAMILY_STORY.text}</p>
          <p className="text-xs text-zinc-400">{FAMILY_STORY.rights}</p>
        </article>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => void speak(state.room === 'leseecke' ? FAMILY_STORY.text : scene.line, state.room === 'spielzimmer')}
          className="flex min-h-12 items-center gap-2 rounded-2xl bg-fuchsia-500 px-5 py-3 font-semibold text-white hover:bg-fuchsia-600">
          {state.room === 'leseecke' ? <BookOpen size={19} /> : <Volume2 size={19} />} {state.room === 'leseecke' ? 'Geschichte vorlesen' : 'N+1 sprechen lassen'}
        </button>
        <button type="button" onClick={() => { voiceService.stopSpeaking(); dispatch({ type: 'voice-finished' }); }} className="flex min-h-12 items-center gap-2 rounded-2xl border border-white/25 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"><Square size={16} /> Stopp</button>
        {onOpenVoiceStudio && <button type="button" onClick={onOpenVoiceStudio} className="flex min-h-12 items-center gap-2 rounded-2xl border border-white/25 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"><Mic size={18} /> Gespräch öffnen</button>}
      </div>
      <p role="status" className="text-center text-xs text-zinc-300">{state.voiceStatus === 'playing' ? 'Audioausgabe vom Voice-Dienst gemeldet' : state.voiceStatus === 'requesting' ? 'Sprachausgabe angefragt – noch nicht bestätigt' : speechError || 'Mikrofon aus. Sprache nur nach deiner Aktion.'}</p>

      <aside className="space-y-1 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm text-zinc-200">
        <h2 className="font-semibold">Wachsen, Lernen und Erinnern</h2>
        <p>Bestätigte Erinnerungen und Lernfortschritte: <strong>noch nicht verbunden</strong>. Kein erfundener Lernstand, keine heimliche Aufnahme. Das Familiengedächtnis wird erst nach sicherer Sprecherfreigabe, Datenbank-Readback und Widerruf angeschlossen.</p>
        <div className="grid gap-2 text-xs sm:grid-cols-3" aria-label="Getrennte Lernbereiche">
          <p className="rounded-xl border border-white/10 p-3"><strong className="block">Familiengedächtnis</strong> Einwilligung, gesicherte Identität und DB-Readback ausstehend.</p>
          <p className="rounded-xl border border-white/10 p-3"><strong className="block">Wissen</strong> Quellenprüfung und Freigabe ausstehend.</p>
          <p className="rounded-xl border border-white/10 p-3"><strong className="block">Virtuelle Fähigkeiten</strong> Nur geprüfte Spielzimmer-Sandbox; kein Robotermodell geladen.</p>
        </div>
        <p className="text-xs text-zinc-400">Anrede: {getFamilyAddress(state.speaker)} · unverifiziert. Storys und Spiele sind aktuell flüchtige Interaktionen; niemand wird als Mama oder Papa authentifiziert.</p>
      </aside>
    </section>
  );
};