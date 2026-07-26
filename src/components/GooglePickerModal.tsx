import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface GooglePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected?: (file: { name: string; id: string; mimeType: string }) => void;
}

export const GooglePickerModal: React.FC<GooglePickerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className="size-16 bg-amber-950/30 border border-amber-900/50 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Integration Unavailable</h2>
          <p className="text-zinc-400">
            Google Drive integration requires Firebase Auth and Scopes, which have been deinstalled from this environment.
          </p>
          
          <button
            onClick={onClose}
            className="mt-8 px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all w-full"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
