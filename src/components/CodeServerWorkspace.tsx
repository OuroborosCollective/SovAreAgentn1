import React, { useState } from 'react';
import { Terminal, GitBranch, FolderTree, FileCode, Play, Save, Cloud, CheckCircle2, RefreshCw, Cpu, Activity, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export const CodeServerWorkspace: React.FC = () => {
  const [activeFile, setActiveFile] = useState('server.ts');
  const [fileContent, setFileContent] = useState(`import express from "express";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.get("/api/runtime/status", (req, res) => {
  res.json({ 
    status: "optimal", 
    resonance_frequency_hz: 432.0,
    active_agents: 14,
    runtime: "Node.js ESM + Vite + PGVector"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(\`[CodeServer] Runtime active on port \${PORT}\`);
});`);
  const [gitStatus, setGitStatus] = useState<'clean' | 'modified' | 'pushed'>('modified');
  const [commitMessage, setCommitMessage] = useState('feat: integrate code-server workspace with resonance engine runtime');
  const [isPushing, setIsPushing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resonanceHz, setResonanceHz] = useState(432.0);

  const files = [
    { name: 'server.ts', type: 'ts', size: '28.4 KB' },
    { name: 'src/App.tsx', type: 'tsx', size: '14.1 KB' },
    { name: 'src/components/AgentCommandCenter.tsx', type: 'tsx', size: '8.2 KB' },
    { name: 'src/components/HiaResonanceVoice.tsx', type: 'tsx', size: '12.5 KB' },
    { name: 'package.json', type: 'json', size: '1.2 KB' },
  ];

  const handlePushToGit = async () => {
    setIsPushing(true);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/nexus/push-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage })
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.details 
          ? `${data.message} (${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)})`
          : (data.message || 'Failed to push');
        throw new Error(errorMsg);
      }
      
      setGitStatus('pushed');
      setSuccessMsg('Successfully pushed code and manifest updates to remote repository via Nexus Git bridge.');
    } catch (e: any) {
      setGitStatus('modified');
      setSuccessMsg(null);
      alert(`Error pushing to remote: ${e.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  const triggerResonancePulse = () => {
    setResonanceHz(prev => Number((prev + 12.5).toFixed(1)));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <Terminal size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Code-Server Workspace & Git Nexus</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Integrated browser-based code editing, version control, and live resonance engine runtime connection.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerResonancePulse}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-300 rounded-xl font-bold transition-all text-sm"
          >
            <Activity size={16} />
            <span>Resonance Pulse ({resonanceHz} Hz)</span>
          </button>
          <button
            onClick={handlePushToGit}
            disabled={isPushing}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg text-sm"
          >
            {isPushing ? <RefreshCw className="animate-spin" size={18} /> : <GitBranch size={18} />}
            <span>{isPushing ? 'Syncing Git...' : 'Commit & Push to Remote'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-sm text-emerald-300 flex items-center gap-3">
          <CheckCircle2 size={20} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: File Tree & Git Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FolderTree size={18} className="text-indigo-400" />
              <span>Workspace Files</span>
            </h3>
            <div className="space-y-1">
              {files.map((file) => (
                <button
                  key={file.name}
                  onClick={() => {
                    setActiveFile(file.name);
                    if (file.name === 'server.ts') {
                      setFileContent(`import express from "express";\nimport { createServer as createViteServer } from "vite";\n\nconst app = express();\nconst PORT = 3000;\n\napp.get("/api/runtime/status", (req, res) => {\n  res.json({ status: "optimal", resonance_frequency_hz: ${resonanceHz} });\n});\n\napp.listen(PORT, "0.0.0.0");`);
                    } else if (file.name === 'package.json') {
                      setFileContent(`{\n  "name": "n+1-workspace",\n  "version": "1.0.0",\n  "dependencies": {\n    "@google/genai": "^1.41.0",\n    "express": "^5.2.1"\n  }\n}`);
                    } else {
                      setFileContent(`// Code-server editor buffer for ${file.name}\nexport const ${file.name.replace(/[^a-zA-Z0-9]/g, '')}Component = () => {\n  return null;\n};`);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-mono text-xs transition-all ${
                    activeFile === file.name
                      ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/20'
                      : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FileCode size={16} className="text-indigo-400" />
                    {file.name}
                  </span>
                  <span className="text-zinc-600">{file.size}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <GitBranch size={18} className="text-indigo-400" />
              <span>Git & Resonance State</span>
            </h3>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <span className="text-zinc-400">Current Branch</span>
                <span className="text-emerald-400">main (HEAD)</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <span className="text-zinc-400">Resonance Runtime</span>
                <span className="text-purple-400">{resonanceHz} Hz [ACTIVE]</span>
              </div>
              <div className="space-y-1 pt-1">
                <label className="text-zinc-400 text-[11px]">Commit Message</label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={e => setCommitMessage(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Code Editor & Runtime View */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-zinc-950 px-6 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <FileCode size={16} className="text-indigo-400" />
                {activeFile}
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-mono text-emerald-400">Runtime Connected</span>
              </div>
            </div>

            <div className="p-6 bg-[#0d1117] overflow-x-auto">
              <textarea
                value={fileContent}
                onChange={e => setFileContent(e.target.value)}
                rows={18}
                className="w-full bg-transparent text-zinc-200 font-mono text-xs leading-relaxed focus:outline-none resize-none"
                spellCheck={false}
              />
            </div>

            <div className="bg-zinc-950 px-6 py-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>UTF-8 | TypeScript | Tab Size: 2</span>
              <button
                onClick={() => setSuccessMsg(`Buffer saved successfully for ${activeFile}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"
              >
                <Save size={14} />
                <span>Save Buffer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
