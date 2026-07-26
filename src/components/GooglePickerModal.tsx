import React, { useState, useEffect } from 'react';
import { Cloud, X, FileText, Folder, Table, Search, Check, RefreshCw } from 'lucide-react';

interface GooglePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected?: (file: { name: string; id: string; mimeType: string }) => void;
}

export const GooglePickerModal: React.FC<GooglePickerModalProps> = ({ isOpen, onClose, onFileSelected }) => {
  const [search, setSearch] = useState('');
  const [files, setFiles] = useState<Array<{ id: string; name: string; mimeType: string }>>([
    { id: 'file_1', name: 'N1_Axiomatic_State_Backup_2026.json', mimeType: 'application/json' },
    { id: 'file_2', name: 'Matrix_Vector_Knowledge_Graph.gdoc', mimeType: 'application/vnd.google-apps.document' },
    { id: 'file_3', name: 'System_Telemetry_Log.gsheet', mimeType: 'application/vnd.google-apps.spreadsheet' },
    { id: 'file_4', name: 'Self_Aware_Toolchain_Config.json', mimeType: 'application/json' }
  ]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const handleConfirmSelect = () => {
    const selected = files.find(f => f.id === selectedFileId);
    if (selected && onFileSelected) {
      onFileSelected(selected);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-950/50 border border-blue-800/50 text-blue-400 rounded-xl">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Select from Google Drive</h2>
              <p className="text-[10px] text-zinc-500 font-mono">Google Drive Workspace File Picker</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search files in Drive..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* File List */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              onClick={() => setSelectedFileId(file.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedFileId === file.id
                  ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                  : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText size={16} className={selectedFileId === file.id ? 'text-blue-400' : 'text-zinc-500'} />
                <div className="text-xs font-medium truncate">{file.name}</div>
              </div>
              {selectedFileId === file.id && <Check size={16} className="text-blue-400" />}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSelect}
            disabled={!selectedFileId}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-blue-900/30"
          >
            Import File
          </button>
        </div>
      </div>
    </div>
  );
};
