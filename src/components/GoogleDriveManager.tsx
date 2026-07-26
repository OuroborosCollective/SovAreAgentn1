import React from 'react';
import { Cloud, AlertTriangle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export const GoogleDriveManager: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto py-12">
      <header className="text-center space-y-4">
        <div className="size-20 bg-amber-950/30 border border-amber-900/50 rounded-3xl flex items-center justify-center text-amber-500 mx-auto mb-6 shadow-2xl">
          <Cloud size={40} />
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Google Drive Manager</h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Manage your axiomatic knowledge backups and cloud-synced assets directly from your N+1 Matrix workspace.
        </p>
      </header>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 space-y-6">
          <div className="size-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
            <AlertTriangle size={32} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Integration Unavailable</h2>
            <p className="text-zinc-500 max-w-md mx-auto">
              Google Drive connectivity requires Firebase Authentication and specific OAuth scopes which have been deinstalled for security compliance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-500">
              <Shield size={14} className="text-emerald-500" />
              STATUS: DEINSTALLED
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-3">
          <h3 className="font-bold text-white">Why is this unavailable?</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">
            To ensure maximum axiomatic purity and data sovereignty, the application has moved away from Firebase-dependent integrations. Local ZIP exports and PostgreSQL backups are recommended for data persistence.
          </p>
        </div>
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-3">
          <h3 className="font-bold text-white">Alternative Solutions</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Use the <strong>System Backups</strong> tab to generate full axiomatic core archives that can be downloaded locally or transferred via secure S3/SFTP protocols.
          </p>
        </div>
      </div>
    </div>
  );
};
