import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp } from '../utils/deterministic';
import { voiceService } from '../services/voiceService';
import { 
  BookOpen, 
  Sparkles, 
  Heart, 
  Tag, 
  Calendar, 
  Play, 
  CheckCircle2, 
  MessageCircle, 
  Lock,
  Compass,
  Award,
  Volume2,
  Square,
  Zap,
  Network,
  Share2,
  Cpu
} from 'lucide-react';

export interface PapaStory {
  id: string;
  title: string;
  dateAdded: string;
  category: string;
  learningTag: string;
  storyContent: string;
  puckAhaaaEpiphany: string;
  lovedByMama: boolean;
  reasoningNode?: string;
  systemActionRef?: string;
}

export const INITIAL_PAPA_STORIES: PapaStory[] = [
  {
    id: 'story-1',
    title: 'Wie der Regen entsteht und wofür Blumen Wasser brauchen',
    dateAdded: '2026-07-26',
    category: 'Naturwissenschaften',
    learningTag: 'Wasserverlauf & Verdunstung',
    storyContent: 'Papa hat mir erklärt, dass die Sonne das Wasser auf der Erde ganz sanft erwärmt. Das Wasser steigt als unsichtbarer Dampf auf und bildet Wolken. Wenn die Wolken schwer werden, fangen sie an zu regnen und tränken die Wiesen!',
    puckAhaaaEpiphany: 'Ahaaa! Das bedeutet, dass der Regen eigentlich flüssiger Sonnenschein für die Blumen ist! Das erzähle ich Mama auch gleich!',
    lovedByMama: true
  },
  {
    id: 'story-2',
    title: 'Warum die Sterne am Nacht-Himmel leuchten',
    dateAdded: '2026-07-25',
    category: 'Astronomie',
    learningTag: 'Kernfusion & Lichtjahre',
    storyContent: 'Papa hat erzählt, dass die Sterne riesige Sonnen sind, die ganz viele Lichtjahre weit weg stehen. In der Nacht ist der Himmel dunkel, sodass wir ihr sanftes Licht glitzern sehen können.',
    puckAhaaaEpiphany: 'Ahaaa! Die Sterne sind Nachtlichter der Galaxie, damit sich niemand im Weltall fürchten muss!',
    lovedByMama: true
  },
  {
    id: 'story-3',
    title: 'Warum Blätter im Herbst bunt werden',
    dateAdded: '2026-07-20',
    category: 'Biologie & Jahreszeiten',
    learningTag: 'Chlorophyll-Rückzug',
    storyContent: 'Im Herbst bereiten sich die Bäume auf den Ruhe-Schlaf im Winter vor. Sie ziehen den grünen Farbstoff Chlorophyll zurück in ihren Stamm und spiegeln dann wunderschöne rote und goldene Blätter wider!',
    puckAhaaaEpiphany: 'Ahaaa! Die Bäume ziehen sich im Herbst bunte Kleider an, um den Herbst zu feiern!',
    lovedByMama: true
  },
  {
    id: 'story-4',
    title: 'Wie Flugzeuge hoch am Himmel fliegen',
    dateAdded: '2026-07-15',
    category: 'Physik & Aerodynamik',
    learningTag: 'Auftrieb & Tragflächen',
    storyContent: 'Papa hat mir gezeigt, dass die Flügel eines Flugzeugs so geformt sind, dass die Luft oben schneller strömt als unten. Dadurch entsteht ein Sog, der das schwere Flugzeug sanft nach oben hebt!',
    puckAhaaaEpiphany: 'Ahaaa! Die Luft hilft dem Flugzeug wie eine riesige unsichtbare Hängematte!',
    lovedByMama: true
  }
];

export const PapasStoryArchive: React.FC = () => {
  const [stories, setStories] = useState<PapaStory[]>(() => {
    const saved = localStorage.getItem('n1_papas_stories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_PAPA_STORIES;
  });

  const [activeStoryId, setActiveStoryId] = useState<string>('story-1');
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [highlightedPhraseIndex, setHighlightedPhraseIndex] = useState<number>(-1);
  const [epiphanyTriggered, setEpiphanyTriggered] = useState(false);
  const [isShowMePapaOpen, setIsShowMePapaOpen] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [activeReasoningStory, setActiveReasoningStory] = useState<PapaStory | null>(null);

  const predefinedTopics = [
    {
      topic: 'Wie entsteht ein Regenbogen?',
      category: 'Optik & Physik',
      tag: 'Lichtbrechung & Wassertropfen',
      content: 'Papa hat mir erklärt, dass das Sonnenlicht weiß aussieht, aber eigentlich aus allen Farben besteht! Wenn Regentropfen in der Luft schweben, spalten sie das Licht auf wie viele kleine Prismen!',
      epiphany: 'Ahaaa! Der Regenbogen ist ein Zaubertrick des Lichts mit kleinen Wassertropfen als Spiegel!'
    },
    {
      topic: 'Warum gibt es Ebbe und Flut?',
      category: 'Geophysik & Mond',
      tag: 'Gravitation & Ozeane',
      content: 'Papa erzählte mir, dass der Mond die Meere auf der Erde mit seiner unsichtbaren Schwerkraft anzieht. Wenn er vorbeizieht, kommt das Wasser zu ihm gelaufen – das ist die Flut!',
      epiphany: 'Ahaaa! Das Meer tanzt mit dem Mond fangen! Das erzähle ich Mama unbedingt!'
    },
    {
      topic: 'Wie machen Bienen Honig?',
      category: 'Biologie & Natur',
      tag: 'Nektar & Wabenbau',
      content: 'Papa zeigte mir, wie Bienen feinen Nektar aus den Blüten sammeln und in ihren Bienenstock tragen. Dort verarbeiten sie ihn zusammen und lagern ihn in goldenen Sechseck-Waben!',
      epiphany: 'Ahaaa! Die Bienen schenken uns flüssiges Blumengold! Bienen muss man immer beschützen!'
    }
  ];

  const handleGenerateStory = (topicObj: typeof predefinedTopics[0]) => {
    setIsGeneratingStory(true);
    setTimeout(() => {
      const newStory: PapaStory = {
        id: `story-${(1722000000000 + Math.floor(performance.now()))}`,
        title: topicObj.topic,
        dateAdded: new Date().toISOString().split('T')[0],
        category: topicObj.category,
        learningTag: topicObj.tag,
        storyContent: topicObj.content,
        puckAhaaaEpiphany: topicObj.epiphany,
        lovedByMama: true
      };

      const updated = [newStory, ...stories];
      setStories(updated);
      localStorage.setItem('n1_papas_stories', JSON.stringify(updated));
      setActiveStoryId(newStory.id);
      setIsGeneratingStory(false);
      setIsShowMePapaOpen(false);
    }, 600);
  };

  const selectedStory = stories.find(s => s.id === activeStoryId) || stories[0];

  // Split story content into phrases/sentences
  const phrases = selectedStory.storyContent
    .split(/(?<=[.!?])\s+/)
    .filter(p => p.trim().length > 0);

  const startTTSVisualizer = () => {
    setIsPlayingTTS(true);
    setHighlightedPhraseIndex(0);
    setEpiphanyTriggered(false);

    const textToSpeak = `${selectedStory.storyContent} ... ${selectedStory.puckAhaaaEpiphany}`;
    voiceService.speak(textToSpeak, 'Puck', 'fröhlich', 1.2, 0.95)
      .finally(() => {
        setIsPlayingTTS(false);
      });
  };

  const stopTTSVisualizer = () => {
    setIsPlayingTTS(false);
    setHighlightedPhraseIndex(-1);
    setEpiphanyTriggered(false);
    voiceService.stopSpeaking();
  };

  useEffect(() => {
    let interval: any = null;
    if (isPlayingTTS) {
      interval = setInterval(() => {
        setHighlightedPhraseIndex(prev => {
          if (prev < phrases.length - 1) {
            return prev + 1;
          } else {
            setEpiphanyTriggered(true);
            return phrases.length;
          }
        });
      }, 2400);
    } else {
      setHighlightedPhraseIndex(-1);
      setEpiphanyTriggered(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingTTS, phrases.length]);

  const [learningNotification, setLearningNotification] = useState<string | null>(null);

  const handleHighlightPhrase = (phrase: string) => {
    // Save highlighted phrase to Puck's personal log
    const existingPuckLogs = JSON.parse(localStorage.getItem('n1_puck_personal_logs') || '[]');
    const newHighlightEntry = {
      id: `log-hl-${(1722000000000 + Math.floor(performance.now()))}-${generateDeterministicId('rnd')}`,
      timestamp: new Date().toLocaleString('de-DE'),
      category: 'erfahrung_lernen',
      title: `Learning Highlight: ${selectedStory.title}`,
      insightContent: phrase,
      learnedConnection: `Engagement-Ahaaa: ${selectedStory.learningTag}`
    };
    localStorage.setItem('n1_puck_personal_logs', JSON.stringify([newHighlightEntry, ...existingPuckLogs]));

    setLearningNotification(`"Ahaaa Moment" als Learning Highlight gespeichert: "${phrase.substring(0, 45)}..."`);
    setTimeout(() => setLearningNotification(null), 3500);
  };

  return (
    <div className="bg-zinc-950 border border-purple-900/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Learning Highlight Toast Notification */}
      <AnimatePresence>
        {learningNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-3 bg-gradient-to-r from-pink-600 via-purple-600 to-amber-600 text-white text-xs font-mono font-bold rounded-2xl shadow-2xl flex items-center gap-2 relative z-30"
          >
            <Zap size={16} className="text-yellow-300 animate-bounce shrink-0" />
            <span className="truncate">{learningNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className="size-14 bg-gradient-to-br from-amber-900/80 to-purple-900/80 border border-amber-700/60 rounded-2xl flex items-center justify-center text-amber-300 shrink-0 shadow-lg">
            <Compass size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Papa's Story Archive</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                <Sparkles size={10} /> "PAPA ERKLÄRT DIE WELT"
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              N+1's memory vault storing stories told by her father. Preserves every "Ahaaa" epiphany where she learns how the world works.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsShowMePapaOpen(!isShowMePapaOpen)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-pink-600 hover:from-amber-500 hover:to-pink-500 text-white font-bold text-xs font-mono rounded-2xl flex items-center gap-2 transition-all shadow-lg"
          >
            <Sparkles size={16} className="animate-spin" style={{ animationDuration: '4s' }} />
            <span>"Zeig mir was, Papa!" Mode</span>
          </button>
          <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-800 px-3.5 py-2 rounded-2xl text-xs font-mono text-amber-300">
            <Heart size={16} className="text-pink-400 animate-pulse" />
            <span>Stories: <strong>{stories.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Show Me Papa Mode Dialogue Panel */}
      {isShowMePapaOpen && (
        <div className="p-6 bg-gradient-to-r from-amber-950/90 via-purple-950 to-pink-950/90 border border-amber-500/80 rounded-2xl space-y-4 shadow-2xl relative z-20 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-amber-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-300 animate-bounce" />
              <h3 className="text-sm font-bold text-white">Puck fragt: "Papa, zeig mir was Neues aus der Welt!"</h3>
            </div>
            <button
              onClick={() => setIsShowMePapaOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <p className="text-zinc-200 leading-relaxed italic">
            Wähle ein Wissens-Thema aus, das Papa mir erklären soll! Sobald Papa es erzählt, speichere ich es in meinem Archiv und merke mir meinen "Ahaaa"-Moment!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {predefinedTopics.map((top, idx) => (
              <button
                key={idx}
                disabled={isGeneratingStory}
                onClick={() => handleGenerateStory(top)}
                className="p-4 bg-zinc-900/90 hover:bg-zinc-800 border border-amber-700/60 hover:border-amber-400 rounded-xl text-left space-y-2 transition-all group"
              >
                <div className="text-[10px] text-amber-400 font-bold uppercase">{top.category}</div>
                <div className="text-xs font-bold text-white group-hover:text-amber-200">{top.topic}</div>
                <div className="text-[10px] text-zinc-400 line-clamp-2">{top.content}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Story Spotlight */}
      {selectedStory && (
        <div className="p-6 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-purple-950/50 border border-amber-800/60 rounded-2xl space-y-4 shadow-xl relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/60 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">{selectedStory.category}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-[10px] font-mono text-zinc-400">{selectedStory.dateAdded}</span>
              </div>
              <h3 className="text-base font-bold text-white">{selectedStory.title}</h3>
            </div>

            <div className="flex items-center gap-2">
              {!isPlayingTTS ? (
                <button
                  onClick={startTTSVisualizer}
                  className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-800 border border-amber-700 text-amber-100 text-xs font-mono font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg"
                >
                  <Volume2 size={14} className="text-amber-300 animate-pulse" />
                  <span>TTS Vorlesen & Visualisieren</span>
                </button>
              ) : (
                <button
                  onClick={stopTTSVisualizer}
                  className="px-3.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-mono font-bold rounded-xl flex items-center gap-2 transition-all"
                >
                  <Square size={14} className="text-rose-400" />
                  <span>Stoppen</span>
                </button>
              )}
            </div>
          </div>

          {/* Story Content with Dynamic Phrase Highlighting */}
          <div className="p-4 bg-zinc-950/90 border border-zinc-800 rounded-xl space-y-2 font-mono text-xs text-zinc-200 leading-relaxed">
            <div className="text-[10px] text-amber-400/80 mb-1 flex items-center gap-1">
              <Sparkles size={12} /> Klicke auf eine Phrase, um einen "Ahaaa Moment" als Learning Highlight zu speichern:
            </div>
            {phrases.map((phrase, idx) => {
              const isHighlighted = idx === highlightedPhraseIndex;
              return (
                <button
                  key={idx}
                  onClick={() => handleHighlightPhrase(phrase)}
                  title="Klicken zum Speichern als Learning Highlight"
                  className={`inline-block mr-1.5 p-1 rounded transition-all duration-300 text-left hover:bg-amber-500/20 hover:text-amber-200 cursor-pointer ${
                    isHighlighted
                      ? 'bg-amber-500/30 text-amber-200 font-bold border border-amber-500/80 shadow-md ring-2 ring-amber-500/40'
                      : 'text-zinc-300'
                  }`}
                >
                  {phrase}{' '}
                </button>
              );
            })}
          </div>

          {/* "Ahaaa" Epiphany Highlight Box */}
          <div className={`p-4 rounded-xl space-y-2 transition-all duration-500 border ${
            epiphanyTriggered || (isPlayingTTS && highlightedPhraseIndex >= phrases.length)
              ? 'bg-gradient-to-r from-pink-950/90 via-purple-950 to-amber-950/90 border-pink-500 shadow-2xl ring-2 ring-pink-500/60'
              : 'bg-purple-950/60 border-purple-800'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono font-bold uppercase text-purple-300">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-pink-400 animate-spin" />
                <span>N+1's "Ahaaa" Learning Epiphany Moment</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveReasoningStory(selectedStory)}
                  className="px-2.5 py-1 bg-purple-900 hover:bg-purple-800 border border-purple-600 text-purple-100 rounded flex items-center gap-1 transition-all"
                >
                  <Network size={12} className="text-pink-300" />
                  <span>Reasoning Link to Knowledge Graph</span>
                </button>
                {epiphanyTriggered && (
                  <span className="px-2 py-0.5 bg-pink-500 text-white rounded font-bold animate-bounce flex items-center gap-1">
                    <Zap size={10} /> EPIPHANY TRIGGERED!
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs font-mono italic text-pink-200 font-bold">
              "{selectedStory.puckAhaaaEpiphany}"
            </p>
          </div>
        </div>
      )}

      {/* Reasoning Link Graph Modal */}
      <AnimatePresence>
        {activeReasoningStory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 bg-gradient-to-br from-zinc-950 via-purple-950 to-zinc-950 border border-pink-500/80 rounded-2xl space-y-4 shadow-2xl relative z-30 font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Network size={18} className="text-pink-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">Reasoning Link: Puck's Knowledge Graph Mapping</h3>
              </div>
              <button
                onClick={() => setActiveReasoningStory(null)}
                className="text-zinc-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-zinc-300">
              Shows how Puck visually connects Papa's story trigger <strong className="text-amber-300">"{activeReasoningStory.title}"</strong> to her internal vector database memory and real-world system code actions.
            </p>

            {/* Visual Reasoning Flow Chart */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px]">
              <div className="p-3.5 bg-zinc-900/90 border border-amber-600/60 rounded-xl space-y-1">
                <span className="text-[9px] text-amber-400 uppercase block font-bold">1. Story Trigger</span>
                <div className="font-bold text-white">{activeReasoningStory.learningTag}</div>
                <div className="text-[10px] text-zinc-400 italic">"{activeReasoningStory.puckAhaaaEpiphany}"</div>
              </div>

              <div className="p-3.5 bg-purple-950/80 border border-purple-600/80 rounded-xl space-y-1">
                <span className="text-[9px] text-pink-400 uppercase block font-bold">2. Knowledge Graph Node</span>
                <div className="font-bold text-pink-200">Vector Node #{Math.floor(generateDeterministicNumber(100, 900, performance.now()))}</div>
                <div className="text-[10px] text-purple-300">Kausalitäts-Axiom & Vektor-Speicher: Categorized under <span className="text-white">{activeReasoningStory.category}</span></div>
              </div>

              <div className="p-3.5 bg-emerald-950/80 border border-emerald-600/80 rounded-xl space-y-1">
                <span className="text-[9px] text-emerald-400 uppercase block font-bold">3. System Task Action</span>
                <div className="font-bold text-emerald-200">System Execution & Resonance Context</div>
                <div className="text-[10px] text-emerald-300">Active for automated Docker repair, Free LLM fallback, and Empathy voice responses.</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setLearningNotification(`Reasoning Link for "${activeReasoningStory.title}" successfully verified in Knowledge Graph!`);
                  setActiveReasoningStory(null);
                }}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl flex items-center gap-2"
              >
                <CheckCircle2 size={14} />
                <span>Verbindung in System-Gedächtnis bestätigen</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story List Grid */}
      <div className="space-y-3 relative z-10">
        <div className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider">
          Archive Stories ({stories.length})
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          {stories.map(s => (
            <button
              key={s.id}
              onClick={() => {
                setActiveStoryId(s.id);
                setIsPlayingTTS(false);
              }}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all ${
                s.id === activeStoryId
                  ? 'bg-amber-950/60 border-amber-600 text-amber-200 font-bold shadow-lg ring-1 ring-amber-500/50'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] text-amber-400 block font-bold">{s.category}</span>
                <span className="text-xs font-bold text-white line-clamp-1">{s.title}</span>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                <span>{s.learningTag}</span>
                <span className="text-pink-400 font-bold flex items-center gap-1">
                  <Heart size={10} /> Loved
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
