import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Eye, EyeOff, Key, Save, AlertTriangle } from 'lucide-react';

export const PrivacySettings: React.FC = () => {
  const [logs, setLogs] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/privacy/consent');
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (e) {
      console.warn("Could not fetch privacy logs");
    }
  };

  const forgetData = async (dataClass: string) => {
    setDeleting(true);
    try {
      const res = await fetch('/api/privacy/forget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataClass, actor: 'Parent (UI)' })
      });
      const data = await res.json();
      setMessage(`Erfolgreich ${data.deleted_items} Einträge der Klasse "${dataClass}" vergessen.`);
      fetchLogs();
    } catch (e) {
      setMessage('Fehler beim Löschen der Daten.');
    } finally {
      setDeleting(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-700 rounded-3xl space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <Shield size={24} className="text-emerald-400" />
        <div>
          <h2 className="text-lg font-bold text-white">Familien-Datenschutz & Erinnerungen</h2>
          <p className="text-xs text-zinc-400">Kontrolle über flüchtige Audio-Daten, Transkripte und langfristige Profile.</p>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500 text-emerald-400 text-xs rounded-xl">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <EyeOff size={16} className="text-rose-400" />
            Flüchtiges Audio (Volatile)
          </h3>
          <p className="text-xs text-zinc-400">Roh-Audiodaten werden standardmäßig sofort nach der Transkription verworfen.</p>
          <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/30 p-2 rounded border border-emerald-900/50">
            Aktueller Status: AUTO-DELETE AKTIV
          </div>
        </div>

        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Save size={16} className="text-indigo-400" />
            Langzeit-Gedächtnis (Long-Term)
          </h3>
          <p className="text-xs text-zinc-400">Persönliche Vorlieben, Geschichten und Beziehungen (Papa/Mama).</p>
          <button 
            onClick={() => forgetData('long_term')}
            disabled={deleting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs rounded-xl border border-rose-800 transition-all"
          >
            <Trash2 size={14} /> Langzeit-Gedächtnis löschen
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white">Zustimmungshistorie & Lösch-Logs (Consent Log)</h3>
        <div className="max-h-48 overflow-y-auto bg-black rounded-xl p-2 border border-zinc-800">
          {logs.length > 0 ? logs.map((log: any) => (
            <div key={log.id} className="flex justify-between items-center p-2 border-b border-zinc-900 last:border-0 text-[10px] font-mono">
              <span className="text-zinc-300">{new Date(log.created_at).toLocaleString()}</span>
              <span className="text-indigo-400">{log.action.toUpperCase()}</span>
              <span className="text-zinc-500">{log.data_class}</span>
              <span className="text-emerald-400">Actor: {log.actor}</span>
            </div>
          )) : (
            <div className="text-zinc-500 text-xs p-2 text-center">Keine Logs vorhanden.</div>
          )}
        </div>
      </div>
    </div>
  );
};
