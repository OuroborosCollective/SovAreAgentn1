import { generateDeterministicId, generateDeterministicNumber, getDeterministicTimestamp } from '../utils/deterministic';
import React, { useState } from 'react';
import JSZip from 'jszip';
import { Download, Upload, RefreshCw, CheckCircle2, AlertCircle, X, FileArchive, Layers, Database, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlobalDataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AgentExportData {
  agent_id: string;
  learn_effect_score: number;
  status: string;
  heuristics?: string[];
  skills?: string[];
  last_trained?: string;
  metadata?: Record<string, any>;
}

export const GlobalDataSyncModal: React.FC<GlobalDataSyncModalProps> = ({ isOpen, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [importStats, setImportStats] = useState<{ imported: number; failed: number } | null>(null);

  const addLog = (msg: string) => {
    setSyncLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleExportCompressedPackage = async () => {
    setIsExporting(true);
    setSyncLogs([]);
    setImportStats(null);
    addLog('Initiating bulk query of agent configurations from localStorage...');

    try {
      const saved = localStorage.getItem('axiom_agents');
      const agentsList: AgentExportData[] = saved ? JSON.parse(saved) : [];

      addLog(`Retrieved ${agentsList.length} agent records. Generating ZIP bundle...`);

      const zip = new JSZip();

      // Package manifest
      zip.file('manifest.json', JSON.stringify({
        package_name: 'N1_Agent_Configurations_Bulk_Export',
        created_at: new Date().toISOString(),
        total_agents: agentsList.length,
        version: '1.0.0',
        schema: 'ARE_LOGIK_HEURISTIC_V1'
      }, null, 2));

      // Individual agent JSONs
      const agentsFolder = zip.folder('agents');
      agentsList.forEach(agent => {
        const safeFilename = (agent.agent_id || 'unnamed_agent').replace(/[^a-z0-9_-]/gi, '_');
        agentsFolder?.file(`${safeFilename}.json`, JSON.stringify(agent, null, 2));
      });

      // Combined master registry file inside zip
      zip.file('master_registry.json', JSON.stringify(agentsList, null, 2));

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `n1-agents-sync-package-${(1722000000000 + Math.floor(performance.now()))}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      addLog(`Package exported successfully! (${(blob.size / 1024).toFixed(1)} KB compressed)`);
    } catch (err: any) {
      console.error('Export error:', err);
      addLog(`EXPORT ERROR: ${err.message || String(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportCompressedPackage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setSyncLogs([]);
    setImportStats(null);
    addLog(`Reading file package: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);

    let importedCount = 0;
    let failedCount = 0;

    try {
      if (file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const zipContents = await zip.loadAsync(file);

        addLog('ZIP package loaded. Unpacking configuration files...');

        const agentFiles = Object.keys(zipContents.files).filter(filename => 
          filename.startsWith('agents/') && filename.endsWith('.json') && !zipContents.files[filename].dir
        );

        if (agentFiles.length > 0) {
          addLog(`Found ${agentFiles.length} agent files inside ZIP.`);
          for (const filePath of agentFiles) {
            try {
              const textContent = await zipContents.files[filePath].async('text');
              const parsed = JSON.parse(textContent);
              if (parsed.agent_id) {
                // Get existing from localStorage
                const saved = localStorage.getItem('axiom_agents');
                const agents = saved ? JSON.parse(saved) : [];
                const index = agents.findIndex((a: any) => a.id === parsed.agent_id || a.agent_id === parsed.agent_id);
                
                const newAgent = {
                  id: parsed.agent_id,
                  agent_id: parsed.agent_id,
                  learn_effect_score: parsed.learn_effect_score ?? 0.88,
                  status: parsed.status || 'ACTIVE',
                  heuristics: parsed.heuristics || [],
                  skills: parsed.skills || [],
                  last_trained: parsed.last_trained || new Date().toISOString(),
                  importedAt: new Date().toISOString()
                };

                if (index >= 0) {
                  agents[index] = { ...agents[index], ...newAgent };
                } else {
                  agents.push(newAgent);
                }
                
                localStorage.setItem('axiom_agents', JSON.stringify(agents));
                importedCount++;
                addLog(`Imported: ${parsed.agent_id}`);
              }
            } catch (itemErr: any) {
              failedCount++;
              addLog(`Failed to import item from ${filePath}: ${itemErr.message}`);
            }
          }
        } else if (zipContents.files['master_registry.json']) {
          addLog('Found master_registry.json in ZIP. Processing bundle...');
          const textContent = await zipContents.files['master_registry.json'].async('text');
          const registry = JSON.parse(textContent);
          if (Array.isArray(registry)) {
            const saved = localStorage.getItem('axiom_agents');
            let agents = saved ? JSON.parse(saved) : [];
            
            for (const item of registry) {
              if (item.agent_id) {
                const index = agents.findIndex((a: any) => a.id === item.agent_id || a.agent_id === item.agent_id);
                const newAgent = {
                  id: item.agent_id,
                  agent_id: item.agent_id,
                  learn_effect_score: item.learn_effect_score ?? 0.88,
                  status: item.status || 'ACTIVE',
                  heuristics: item.heuristics || [],
                  skills: item.skills || [],
                  last_trained: item.last_trained || new Date().toISOString(),
                  importedAt: new Date().toISOString()
                };

                if (index >= 0) {
                  agents[index] = { ...agents[index], ...newAgent };
                } else {
                  agents.push(newAgent);
                }
                importedCount++;
              }
            }
            localStorage.setItem('axiom_agents', JSON.stringify(agents));
            addLog(`Imported ${importedCount} agents from master registry.`);
          }
        } else {
          addLog('No valid agent configurations found in ZIP.');
        }
      } else if (file.name.endsWith('.json')) {
        addLog('Parsing single JSON configuration file...');
        const text = await file.text();
        const parsed = JSON.parse(text);

        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (item.agent_id) {
            const existing = localStorage.getItem('axiom_agents') ? JSON.parse(localStorage.getItem('axiom_agents')!) : [];
            const newAgent = {
              agent_id: item.agent_id,
              learn_effect_score: item.learn_effect_score ?? 0.88,
              status: item.status || 'ACTIVE',
              heuristics: item.heuristics || [],
              skills: item.skills || [],
              last_trained: item.last_trained || new Date().toISOString(),
              importedAt: new Date().toISOString()
            };
            const index = existing.findIndex((a: any) => a.agent_id === item.agent_id);
            if (index >= 0) existing[index] = newAgent;
            else existing.push(newAgent);
            localStorage.setItem('axiom_agents', JSON.stringify(existing));
            importedCount++;
            addLog(`Imported: ${item.agent_id}`);
          }
        }
      }

      setImportStats({ imported: importedCount, failed: failedCount });
      addLog(`Bulk import complete: ${importedCount} agents synchronized.`);
    } catch (err: any) {
      console.error('Import error:', err);
      addLog(`IMPORT FAILURE: ${err.message || String(err)}`);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                <FileArchive size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Global Data Sync</h3>
                <p className="text-xs text-zinc-400">Bulk import & export agent configurations via compressed JSON ZIP packages.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Action Area */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export Button Card */}
              <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col justify-between hover:border-indigo-500/30 transition-all group">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Download size={18} />
                    <span>Export Package</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Download all registered agent configurations, heuristics, and skills into a compressed ZIP package.
                  </p>
                </div>
                <button
                  onClick={handleExportCompressedPackage}
                  disabled={isExporting}
                  className="mt-4 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isExporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>{isExporting ? 'Packaging...' : 'Export ZIP Package'}</span>
                </button>
              </div>

              {/* Import Button Card */}
              <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col justify-between hover:border-purple-500/30 transition-all group">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <Upload size={18} />
                    <span>Import Package</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Upload a ZIP package or JSON file to bulk-import agent heuristics and sync with Firestore.
                  </p>
                </div>
                <label className="mt-4 w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/20">
                  {isImporting ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  <span>{isImporting ? 'Importing...' : 'Upload ZIP / JSON'}</span>
                  <input
                    type="file"
                    accept=".zip,.json"
                    onChange={handleImportCompressedPackage}
                    disabled={isImporting}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Sync Progress & Logs Console */}
            {syncLogs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>Sync Audit Trail</span>
                  {importStats && (
                    <span className="text-emerald-400 font-bold">
                      Synced: {importStats.imported} | Failed: {importStats.failed}
                    </span>
                  )}
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl h-36 overflow-y-auto font-mono text-[11px] text-zinc-400 space-y-1 scrollbar-thin">
                  {syncLogs.map((log, index) => (
                    <div
                      key={index}
                      className={
                        log.includes('ERROR') || log.includes('FAILURE')
                          ? 'text-red-400'
                          : log.includes('Imported:') || log.includes('successfully')
                          ? 'text-emerald-400'
                          : 'text-zinc-400'
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
