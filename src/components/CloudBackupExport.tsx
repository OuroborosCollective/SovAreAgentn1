import React, { useState } from 'react';
import { Database, Download, Upload, CheckCircle2, AlertTriangle, Shield, RefreshCw } from 'lucide-react';

export const CloudBackupExport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [manifestData, setManifestData] = useState<any>(null);
  
  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backup/export');
      const data = await res.json();
      setManifestData(data);
      setMessage('Export erfolgreich generiert.');
    } catch (e) {
      setMessage('Fehler beim Export.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!manifestData) return;
    const blob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `n1-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const manifest = JSON.parse(text);

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest })
      });
      const data = await res.json();
      
      if (data.error) {
        setMessage(`Restore fehlgeschlagen: ${data.error}`);
      } else {
        setMessage(`Restore erfolgreich! ${data.restored_events} Erinnerungen geladen.`);
      }
    } catch (e) {
      setMessage('Ungültiges Backup-Format oder Netzwerkfehler.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-700 rounded-3xl space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <Database size={24} className="text-indigo-400" />
        <div>
          <h2 className="text-lg font-bold text-white">Verschlüsseltes Backup & Disaster Recovery</h2>
          <p className="text-xs text-zinc-400">Offline-Export und Import für Familien-Datensouveränität (Fail-Closed)</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-3 ${message.includes('fehler') || message.includes('fehlgeschlagen') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
          {message.includes('fehler') || message.includes('fehlgeschlagen') ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield size={16} className="text-emerald-400" />
            Sicheren Snapshot erstellen
          </h3>
          <p className="text-xs text-zinc-400">
            Erzeugt ein kanonisches Export-Manifest inklusive Checksummen. Flüchtig markierte Audiodaten und Provider-Tokens werden strikt exkludiert.
          </p>
          
          <button 
            onClick={handleExport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />}
            1. Snapshot generieren
          </button>

          {manifestData && (
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/30 p-2 rounded border border-emerald-900/50 break-all">
                Checksum: {manifestData.checksum}
              </div>
              <button 
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all border border-zinc-700"
              >
                <Download size={16} />
                2. Snapshot als .json herunterladen
              </button>
            </div>
          )}
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Upload size={16} className="text-indigo-400" />
            Disaster Recovery (Restore)
          </h3>
          <p className="text-xs text-zinc-400">
            Lädt ein vorhandenes Manifest. Bricht bei fehlerhaften Checksummen ab (Fail-Closed).
          </p>
          
          <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all border border-zinc-700 cursor-pointer">
            <Upload size={16} />
            Backup-Datei (.json) auswählen
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
