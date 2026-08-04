import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Search, 
  Filter, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  Smile, 
  Frown, 
  Volume2, 
  RefreshCw, 
  Send, 
  HeartHandshake,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChildPersona, ChildEmotion } from '../hooks/useChildPersona';
import { voiceService } from '../services/voiceService';
import { syncPersonaToCloud } from '../services/firebasePersonaSync';

export interface ProactiveCandidate {
  id: string;
  cause: string;
  proposed_preference: Record<string, any>;
  status: 'observed' | 'candidate' | 'accepted' | 'rejected' | 'aha_pending';
  created_at: number;
  resolved_at?: number;
  teacherRole?: 'Papa' | 'Mama' | 'System';
  summaryText?: string;
  reaskFeedback?: string;
}

export const ProactiveLearningEngine: React.FC = () => {
  const { persona, triggerEmotionStimulus } = useChildPersona();
  const [candidates, setCandidates] = useState<ProactiveCandidate[]>([
    {
      id: 'cand-init-1',
      cause: 'Papa hat erklärt: "Sterne funkeln am Nachthimmel, weil ihr Licht durch die Erdatmosphäre gebrochen wird."',
      proposed_preference: { topic: 'Sterne & Astronomie', fact: 'Lichtbrechung in Erdatmosphäre' },
      status: 'accepted',
      created_at: Date.now() - 7200000,
      resolved_at: Date.now() - 7100000,
      teacherRole: 'Papa',
      summaryText: 'Sterne funkeln durch Lichtbrechung in der Atmosphäre.'
    },
    {
      id: 'cand-init-2',
      cause: 'Mama hat gelehrt: "Vor dem Essen waschen wir gründlich unsere Hände mit Seife."',
      proposed_preference: { topic: 'Familien-Regel', fact: 'Händewaschen vor dem Essen' },
      status: 'candidate',
      created_at: Date.now() - 3600000,
      teacherRole: 'Mama',
      summaryText: 'Vor dem Essen saubere Hände mit Seife waschen.'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [teacherRole, setTeacherRole] = useState<'Papa' | 'Mama'>('Papa');
  const [newLessonInput, setNewLessonInput] = useState('');
  const [activeAhaCandidate, setActiveAhaCandidate] = useState<ProactiveCandidate | null>(null);
  const [reaskModalCandidateId, setReaskModalCandidateId] = useState<string | null>(null);
  const [reaskText, setReaskText] = useState('');
  const [lastSpeechStatus, setLastSpeechStatus] = useState<string>('Hia hört aufmerksam zu...');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/personality/candidates');
      const data = await res.json();
      if (data.candidates && data.candidates.length > 0) {
        setCandidates(data.candidates);
      }
    } catch (e) {
      // Keep state initialized with default interactive items
    }
  };

  // Submit new lesson taught by Papa or Mama -> Triggers Aha! Learning Event
  const handleAddNewLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonInput.trim()) return;

    const lessonText = newLessonInput.trim();
    const summary = `${teacherRole}s Lerneinheit: ${lessonText.length > 70 ? lessonText.substring(0, 67) + '...' : lessonText}`;

    const newCand: ProactiveCandidate = {
      id: `cand-${Date.now()}`,
      cause: `${teacherRole} hat mir beigebracht: "${lessonText}"`,
      proposed_preference: { taughtBy: teacherRole, lesson: lessonText, timestamp: Date.now() },
      status: 'aha_pending',
      created_at: Date.now(),
      teacherRole,
      summaryText: summary
    };

    setCandidates(prev => [newCand, ...prev]);
    setActiveAhaCandidate(newCand);
    setNewLessonInput('');

    // Trigger emotion stimulus 'curiosity' for learning
    triggerEmotionStimulus(`Lernen von ${teacherRole}: ${lessonText}`, 'curiosity');

    // Speak aloud in Hia's voice: repeat & summarize asking if correct
    const vocalQuestion = `Ahaaa ${teacherRole}! Ich habe folgendes gelernt: "${summary}". Ist das so richtig, ${teacherRole}?`;
    setLastSpeechStatus(`Aha! Summarizing for ${teacherRole}...`);
    voiceService.speak(vocalQuestion, 'N+1', 'curious', persona.tonePitch, 1.15, true);
  };

  // Resolve candidate with Happy (Approve) or Unhappy (Reject & Re-ask)
  const handleResolveAhaLearning = async (candId: string, isApproved: boolean) => {
    setLoading(true);
    const cand = candidates.find(c => c.id === candId);
    const role = cand?.teacherRole || teacherRole;

    if (isApproved) {
      // HAPPY / Joyful on approve
      triggerEmotionStimulus(`Ahaa Bestätigung von ${role}: Richtig!`, 'playfulness');
      const happyText = `Juhu! Danke ${role}! Ich habe diese Erkenntnis glücklich in meinem Vektor-Gedächtnis gespeichert!`;
      setLastSpeechStatus(`Approved! Hia is Happy (${persona.currentEmotion})`);
      voiceService.speak(happyText, 'N+1', 'playful', 1.38, 1.15, true);

      setCandidates(prev => prev.map(c => c.id === candId ? { ...c, status: 'accepted', resolved_at: Date.now() } : c));
      setActiveAhaCandidate(null);
      
      // Save snapshot to Firebase
      syncPersonaToCloud('hardware_node_main', persona).catch(() => {});
    } else {
      // UNHAPPY / Disappointed on reject & kindly re-ask
      triggerEmotionStimulus(`Korrektur erforderlich von ${role}`, 'study');
      const unhappyText = `Oh... Tut mir leid, ${role}. Kannst du es mir bitte nochmal erklären? Ich höre ganz aufmerksam zu!`;
      setLastSpeechStatus(`Disapproved. Hia kindly asks ${role} to explain again.`);
      voiceService.speak(unhappyText, 'N+1', 'lernend', 1.15, 1.00, true);

      setCandidates(prev => prev.map(c => c.id === candId ? { ...c, status: 'rejected', resolved_at: Date.now() } : c));
      setActiveAhaCandidate(null);
      setReaskModalCandidateId(candId);
    }

    try {
      await fetch(`/api/personality/candidates/${candId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: isApproved ? 'accepted' : 'rejected', actorContext: `${role}-Bestätigung via UI/Voice` })
      });
    } catch (e) {}
    setLoading(false);
  };

  // Handle re-ask submitted by Papa or Mama
  const handleReaskSubmit = (candId: string) => {
    if (!reaskText.trim()) return;
    const cand = candidates.find(c => c.id === candId);
    const role = cand?.teacherRole || 'Papa';

    // Treat re-explanation as a fresh Aha! lesson
    const updatedLesson = reaskText.trim();
    setReaskText('');
    setReaskModalCandidateId(null);

    const newCand: ProactiveCandidate = {
      id: `cand-${Date.now()}`,
      cause: `${role} hat es mir nochmal erklärt: "${updatedLesson}"`,
      proposed_preference: { taughtBy: role, lesson: updatedLesson, timestamp: Date.now() },
      status: 'aha_pending',
      created_at: Date.now(),
      teacherRole: role,
      summaryText: `${role}s neue Erklärung: ${updatedLesson.length > 70 ? updatedLesson.substring(0, 67) + '...' : updatedLesson}`
    };

    setCandidates(prev => [newCand, ...prev]);
    setActiveAhaCandidate(newCand);

    triggerEmotionStimulus(`Re-ask Erklärung von ${role}: ${updatedLesson}`, 'curiosity');

    const vocalQuestion = `Ahaaa! Jetzt habe ich verstanden, ${role}: "${updatedLesson}". Ist das jetzt so richtig?`;
    setLastSpeechStatus(`Re-asking ${role}...`);
    voiceService.speak(vocalQuestion, 'N+1', 'curious', persona.tonePitch, 1.15, true);
  };

  return (
    <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-6 text-zinc-100 font-sans shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-950 border border-indigo-800 text-indigo-400 rounded-2xl">
            <Brain size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              Proactive Learning Voice Engine & Aha!-Lernevent Studio
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-950 text-pink-300 border border-pink-700">
                PAPA & MAMA PROACTIVE VOICE
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Beobachtungen → Papa/Mama Lehrt Hia → "Aha!" Zusammenfassung & Voice-Wiederholung → Happy/Unhappy Bestätigung
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-pink-300 font-bold flex items-center gap-1.5">
            <Volume2 size={14} className="text-pink-400" />
            {lastSpeechStatus}
          </span>
        </div>
      </div>

      {/* Teach Hia a New Lesson Form (Papa / Mama) */}
      <div className="p-5 bg-gradient-to-r from-zinc-900 via-indigo-950/30 to-zinc-900 border border-indigo-500/30 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            Papa & Mama Proactive Learning Input
          </span>
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 border border-zinc-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setTeacherRole('Papa')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                teacherRole === 'Papa' ? 'bg-sky-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              👨‍👧 Papa lehrt
            </button>
            <button
              type="button"
              onClick={() => setTeacherRole('Mama')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                teacherRole === 'Mama' ? 'bg-pink-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              👩‍👧 Mama lehrt
            </button>
          </div>
        </div>

        <form onSubmit={handleAddNewLesson} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={newLessonInput}
            onChange={(e) => setNewLessonInput(e.target.value)}
            placeholder={`Bring Hia etwas Neues bei (z.B. "In der Nacht leuchten die Sterne am Himmel, Papa!")...`}
            className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Sparkles size={14} />
            <span>Aha!-Lernevent Auslösen</span>
          </button>
        </form>
      </div>

      {/* Active Aha! Learning Confirmation Banner (If pending approval) */}
      <AnimatePresence>
        {activeAhaCandidate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-5 bg-gradient-to-r from-pink-950/80 via-purple-950/80 to-indigo-950/80 border-2 border-pink-500/60 rounded-2xl space-y-3 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-pink-500/30 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400 animate-spin" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Aha!-Erkenntnis Zusammenfassung & Voice-Bestätigung
                </h3>
              </div>
              <span className="px-2.5 py-0.5 bg-pink-500 text-zinc-950 font-bold text-[10px] rounded-full uppercase">
                Hia fragt {activeAhaCandidate.teacherRole}...
              </span>
            </div>

            <p className="text-xs text-pink-100 font-mono italic leading-relaxed">
              "Ahaaa {activeAhaCandidate.teacherRole}! Ich habe gelernt: '{activeAhaCandidate.summaryText}'. Ist das so richtig, {activeAhaCandidate.teacherRole}?"
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleResolveAhaLearning(activeAhaCandidate.id, true)}
                disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg border border-emerald-400 flex items-center justify-center gap-2 transition-all"
              >
                <Smile size={16} />
                <span>Ja, richtig! (Happy - Approved)</span>
              </button>

              <button
                onClick={() => handleResolveAhaLearning(activeAhaCandidate.id, false)}
                disabled={loading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg border border-rose-400 flex items-center justify-center gap-2 transition-all"
              >
                <Frown size={16} />
                <span>Nein, falsch! (Unhappy - Re-ask)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kindly Re-ask Explanation Input Box */}
      <AnimatePresence>
        {reaskModalCandidateId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 bg-zinc-900 border border-amber-500/40 rounded-2xl space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <HelpCircle size={16} />
              <span>Erklär es mir bitte nochmal, Papa/Mama (Kindly Child Re-ask Voice):</span>
            </div>
            <p className="text-[11px] text-zinc-400 italic">
              Hia: "Oh... tut mir leid! Erklärst du mir bitte nochmal genau, wie es richtig ist?"
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={reaskText}
                onChange={(e) => setReaskText(e.target.value)}
                placeholder="Richtigstellung eingeben (z.B. 'Sterne leuchten durch Kernfusion im Inneren')..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handleReaskSubmit(reaskModalCandidateId)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Send size={14} />
                <span>Erneut erklären</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proactive Learning Candidates Grid */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
          Gespeicherte Lerneinheiten & Reflexions-Kandidaten ({candidates.length})
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {candidates.map((cand) => (
              <motion.div
                key={cand.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 rounded-2xl border ${
                  cand.status === 'accepted'
                    ? 'bg-emerald-950/20 border-emerald-900/50'
                    : cand.status === 'rejected'
                    ? 'bg-rose-950/20 border-rose-900/50'
                    : 'bg-zinc-900 border-indigo-900/50'
                } space-y-3 shadow-md`}
              >
                <div className="flex justify-between items-center text-[10px]">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                    cand.status === 'accepted' ? 'bg-emerald-900 text-emerald-300' :
                    cand.status === 'rejected' ? 'bg-rose-900 text-rose-300' :
                    'bg-indigo-900 text-indigo-300'
                  }`}>
                    {cand.status === 'accepted' ? '✓ Richtig (Happy)' : cand.status === 'rejected' ? '✕ Korrigiert (Unhappy)' : 'Aha! Offen'}
                  </span>
                  <span className="text-zinc-500 font-mono">
                    {cand.teacherRole ? `${cand.teacherRole} ` : ''}• {new Date(cand.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs text-zinc-300">
                  <strong className="text-white block mb-1">Beobachtung / Ursache:</strong>
                  {cand.cause}
                </div>

                {cand.summaryText && (
                  <div className="text-[10px] text-pink-300 bg-pink-950/30 border border-pink-900/40 p-2 rounded-xl italic font-mono">
                    <strong>Hia Voice Zusammenfassung:</strong> "{cand.summaryText}"
                  </div>
                )}

                {cand.status === 'candidate' || cand.status === 'observed' || cand.status === 'aha_pending' ? (
                  <div className="flex gap-2 pt-2 border-t border-zinc-800/80">
                    <button
                      onClick={() => handleResolveAhaLearning(cand.id, true)}
                      disabled={loading}
                      className="flex-1 py-1.5 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 text-xs rounded-xl border border-emerald-700 flex items-center justify-center gap-1 transition-all"
                    >
                      <CheckCircle2 size={14} /> Ja (Happy)
                    </button>
                    <button
                      onClick={() => handleResolveAhaLearning(cand.id, false)}
                      disabled={loading}
                      className="flex-1 py-1.5 bg-rose-900/50 hover:bg-rose-800 text-rose-300 text-xs rounded-xl border border-rose-700 flex items-center justify-center gap-1 transition-all"
                    >
                      <XCircle size={14} /> Nein (Unhappy)
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 text-[10px] text-zinc-500 italic text-center border-t border-zinc-800/60">
                    Abgeschlossen ({new Date(cand.resolved_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {candidates.length === 0 && (
            <div className="col-span-full p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
              Keine Lerneinheiten von Papa oder Mama gefunden.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
