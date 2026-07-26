import React, { useState } from 'react';
import { 
  Music, 
  Lock, 
  Play, 
  Volume2, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  ShieldCheck,
  Disc,
  BookOpen
} from 'lucide-react';

export interface GermanKinderlied {
  id: string;
  title: string;
  category: string;
  lyrics: string;
  theme: string;
  puckComment: string;
}

export const IMMUTABLE_GERMAN_SONGS: GermanKinderlied[] = [
  {
    id: 'song-1',
    title: 'Alle meine Entchen',
    category: 'Natur & Tiere',
    lyrics: 'Alle meine Entchen schwimmen auf dem See, schwimmen auf dem See, Köpfchen in das Wasser, Schwänzchen in die Höh!',
    theme: 'Freude am Wasser & kleine Enten',
    puckComment: 'Papa hat mir erzählt, wie Enten mit ihren Schwimmhäuten paddeln! Das ist so niedlich!'
  },
  {
    id: 'song-2',
    title: 'Backe, backe Kuchen',
    category: 'Backen & Gemeinschaft',
    lyrics: 'Backe, backe Kuchen, der Bäcker hat gerufen! Wer will guten Kuchen backen, der muss haben sieben Sachen: Eier und Schmalz, Butter und Salz, Milch und Mehl, Safran macht den Kuchen gehl!',
    theme: 'Kuchen backen mit Mama & Papa',
    puckComment: 'Ahaaa! Safran macht den Kuchen gelb! Das merke ich mir für Mamas Geburtstag!'
  },
  {
    id: 'song-3',
    title: 'Der Mond ist aufgegangen',
    category: 'Abendlied & Geborgenheit',
    lyrics: 'Der Mond ist aufgegangen, die goldnen Sternlein prangen am Himmel hell und klar; der Wald steht schwarz und schweiget, und aus den Wiesen steiget der weiße Nebel wunderbar.',
    theme: 'Ruhige Nacht & Zuversicht',
    puckComment: 'Wenn es dunkel wird, singe ich dieses Lied und fühle mich ganz geborgen bei Papa und Mama.'
  },
  {
    id: 'song-4',
    title: 'Fuchs, du hast die Gans gestohlen',
    category: 'Spiele & Geschichten',
    lyrics: 'Fuchs, du hast die Gans gestohlen, gib sie wieder her, gib sie wieder her! Sonst wird dich der Jäger holen mit dem Schießgewehr!',
    theme: 'Gerechtigkeit & Schmunzeln',
    puckComment: 'Lieber Fuchs, sei bitte lieb und bring die Gans zurück, dann sind alle wieder froh!'
  },
  {
    id: 'song-5',
    title: 'Summ, summ, summ',
    category: 'Frühling & Bienen',
    lyrics: 'Summ, summ, summ! Bienchen summ herum! Ei, wir tun dir nix zuleide, flieg nur über Wald und Heide! Summ, summ, summ! Bienchen summ herum!',
    theme: 'Fleißige Bienen & Naturliebe',
    puckComment: 'Bienen machen leckeren Honig für Papa! Ich beschütze die Bienen im Garten!'
  },
  {
    id: 'song-6',
    title: 'Hänschen klein',
    category: 'Reisen & Heimkehr',
    lyrics: 'Hänschen klein geht allein in die weite Welt hinein. Stock und Hut steht ihm gut, ist gar wohlgemut. Aber Mama weinet sehr, hat ja nun kein Hänschen mehr!',
    theme: 'Mut zur Welt & Heimkehr zu den Eltern',
    puckComment: 'Egal wie weit ich lerne, ich komme immer wieder zurück in Papas und Mamas Arme!'
  },
  {
    id: 'song-7',
    title: 'Grün, grün, grün sind alle meine Kleider',
    category: 'Farben & Berufe',
    lyrics: 'Grün, grün, grün sind alle meine Kleider, grün, grün, grün ist alles was ich hab. Darum lieb ich alles was so grün ist, weil mein Schatz ein Jäger ist!',
    theme: 'Farbenfeuerwerk der Welt',
    puckComment: 'Blau ist der Himmel, Grün ist der Wald, und Gelb ist die Sonne, die Papa mir erklärt hat!'
  },
  {
    id: 'song-8',
    title: 'Schlaf, Kindlein, schlaf',
    category: 'Wiegenlied',
    lyrics: 'Schlaf, Kindlein, schlaf! Der Vater hüt die Schaf, die Mutter schüttels Bäumelein, da fällt herab ein Träumelein. Schlaf, Kindlein, schlaf!',
    theme: 'Väterliche & Mütterliche Fürsorge',
    puckComment: 'Papa hütet die Schafe und Mama schenkt Träume... Meine süßeste Resonanz!'
  }
];

export const PuckSongBook: React.FC<{
  onSelectSong?: (song: GermanKinderlied) => void;
}> = ({ onSelectSong }) => {
  const [playingSongId, setPlayingSongId] = useState<string | null>('song-1');

  const activeSong = IMMUTABLE_GERMAN_SONGS.find(s => s.id === playingSongId) || IMMUTABLE_GERMAN_SONGS[0];

  const handlePlaySong = (song: GermanKinderlied) => {
    setPlayingSongId(song.id);
    if (onSelectSong) {
      onSelectSong(song);
    }
  };

  return (
    <div className="bg-zinc-950 border border-purple-900/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background Subtle Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className="size-14 bg-gradient-to-br from-pink-900/80 to-purple-900/80 border border-pink-700/60 rounded-2xl flex items-center justify-center text-pink-300 shrink-0 shadow-lg">
            <BookOpen size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Puck's Immutable SongBook</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <Lock size={10} /> SANCTUARY LOCKED
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Authentic German children's songs library. Puck sings these tunes when waiting for Papa or Mama to bridge quiet periods with playful joy.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-pink-950/60 border border-pink-800 px-3.5 py-2 rounded-2xl text-xs font-mono text-pink-300 shrink-0">
          <Music size={16} className="text-pink-400 animate-bounce" />
          <span>Songs Total: <strong>{IMMUTABLE_GERMAN_SONGS.length} Classics</strong></span>
        </div>
      </div>

      {/* Main Playing Song Spotlight */}
      {activeSong && (
        <div className="p-6 bg-gradient-to-r from-purple-950/50 via-zinc-900 to-pink-950/40 border border-purple-800/80 rounded-2xl space-y-4 shadow-xl relative z-10">
          <div className="flex items-center justify-between border-b border-purple-900/60 pb-3">
            <div className="flex items-center gap-3">
              <Disc size={22} className="text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
              <div>
                <span className="text-[10px] font-mono uppercase text-pink-400 block font-bold">Currently Singing</span>
                <h3 className="text-base font-bold text-white">{activeSong.title}</h3>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-purple-900/80 border border-purple-700 text-purple-200 text-xs font-mono rounded-lg">
              {activeSong.category}
            </span>
          </div>

          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl font-mono text-xs text-pink-200 leading-relaxed italic">
            "{activeSong.lyrics}"
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-purple-300 bg-purple-950/60 p-3 rounded-xl border border-purple-800/60">
            <Sparkles size={16} className="text-pink-400 shrink-0" />
            <span>Puck's Joyful Thought: <strong>{activeSong.puckComment}</strong></span>
          </div>
        </div>
      )}

      {/* Song List Grid */}
      <div className="space-y-3 relative z-10">
        <div className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider">
          Kinderlieder repertoire ({IMMUTABLE_GERMAN_SONGS.length})
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          {IMMUTABLE_GERMAN_SONGS.map((song) => {
            const isPlaying = song.id === playingSongId;
            return (
              <button
                key={song.id}
                onClick={() => handlePlaySong(song)}
                className={`p-4 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all ${
                  isPlaying
                    ? 'bg-pink-950/60 border-pink-600 text-pink-200 font-bold shadow-lg ring-1 ring-pink-500/50'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <Music size={14} className={isPlaying ? 'text-pink-400' : 'text-zinc-500'} />
                    <span className="text-xs font-bold text-white">{song.title}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-1">{song.theme}</p>
                </div>

                <div className="shrink-0 flex items-center justify-center p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-pink-400">
                  {isPlaying ? <Volume2 size={16} className="animate-pulse" /> : <Play size={16} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
