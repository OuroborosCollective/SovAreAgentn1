import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Upload, Play, Square, FileText, ChevronRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { voiceService } from '../services/voiceService';
import { emotionEngine } from '../services/emotionEngine';
import { generateHiaVoiceResponse } from '../services/geminiService';
import { useNotification } from '../context/NotificationContext';

export interface UploadedBook {
  id: string;
  name: string;
  content: string;
  progress: number;
}

export const N1AudiobookReader: React.FC = () => {
  const [books, setBooks] = useState<UploadedBook[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotification();
  
  // Track read chunks for proactive questioning
  const [readChunks, setReadChunks] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('n1_books');
    if (saved) {
      try { setBooks(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveBooks = (newBooks: UploadedBook[]) => {
    setBooks(newBooks);
    localStorage.setItem('n1_books', JSON.stringify(newBooks));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Basic text extraction for now
      // In a real prod environment we'd use mammoth/pdfjs
      const text = await file.text();
      const newBook: UploadedBook = {
        id: `book-${Date.now()}`,
        name: file.name,
        content: text,
        progress: 0
      };
      saveBooks([...books, newBook]);
      addNotification(`Book "${file.name}" added successfully.`, 'success');
    } catch (err) {
      addNotification(`Failed to read file: ${err}`, 'error');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startReading = async (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    setActiveBookId(bookId);
    setIsReading(true);

    // Simple chunking by paragraph
    const paragraphs = book.content.split('\n\n').filter(p => p.trim().length > 10);
    const startIdx = book.progress || 0;
    
    if (startIdx >= paragraphs.length) {
       addNotification('Book finished!', 'info');
       setIsReading(false);
       return;
    }

    const textToRead = paragraphs[startIdx];
    
    emotionEngine.triggerEvent({
      eventId: `reading-${Date.now()}`,
      timestamp: Date.now(),
      sourceType: 'runtime_state',
      cause: 'Vorlesen',
      intensity: 0.6,
      durationMs: 15000,
      priority: 6,
      suggestedState: 'nachdenklich'
    });

    voiceService.speak(textToRead, 'N+1', 'ruhige-lesestimme' as any, 1.1, 1.05, true);

    // Update progress
    const updatedBooks = books.map(b => b.id === bookId ? { ...b, progress: startIdx + 1 } : b);
    saveBooks(updatedBooks);
    
    setReadChunks(prev => prev + 1);

    // Every few chunks, trigger proactive learning questions
    if (readChunks > 0 && readChunks % 3 === 0) {
       setTimeout(async () => {
         const questionContext = `Erzeuge basierend auf diesem Textabschnitt: "${textToRead.slice(0, 500)}..." maximal 3 neugierige Verständnisfragen, die ein kluges Kind seinem Papa stellen würde. Vergiss nicht das Stichwort 'Aha!' wenn du etwas Neues lernst. Nutze 'merke mir das' Logik. Antworte in JSON { "questions": ["q1", "q2", "q3"], "voiceText": "..." }`;
         const response = await generateHiaVoiceResponse(questionContext);
         voiceService.speak(response, 'N+1', 'neugierig' as any, 1.25, 1.1, true);
       }, 2000);
    }
  };

  const stopReading = () => {
    voiceService.stopSpeaking();
    setIsReading(false);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-950/50 border border-amber-800 text-amber-400 rounded-xl">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">N+1 Audiobook Reader & Learner</h2>
            <p className="text-xs text-zinc-500">Upload TXT, PDF, DOCX for reading and proactive learning.</p>
          </div>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-2"
        >
          {isProcessing ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
          Upload Book
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".txt,.pdf,.docx" 
          className="hidden" 
        />
      </div>

      <div className="space-y-4">
        {books.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs font-mono bg-zinc-900/30 rounded-2xl border border-zinc-800/50 border-dashed">
            No books uploaded. N+1 loves stories!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {books.map(book => (
                <motion.div 
                  key={book.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <FileText size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-white truncate max-w-[200px]" title={book.name}>{book.name}</h3>
                      <div className="text-[10px] text-zinc-500 font-mono mt-1">
                        Progress: Chunk {book.progress}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    {isReading && activeBookId === book.id ? (
                      <button 
                        onClick={stopReading}
                        className="flex-1 py-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Square size={12} /> Pause Reading
                      </button>
                    ) : (
                      <button 
                        onClick={() => startReading(book.id)}
                        className="flex-1 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Play size={12} /> Read Aloud
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
