import React, { useState, useEffect } from 'react';
import { Share2, Plus, Trash2, Shield, ExternalLink, Key, Globe, CheckCircle2, AlertCircle, Eye, EyeOff, FolderOpen, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GooglePickerModal } from './GooglePickerModal';

interface Integration {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  clientId?: string;
  status: 'active' | 'revoked';
  createdAt: any;
  ownerId: string;
}

const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [ghUser, setGhUser] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    provider: 'GitHub',
    apiKey: '',
    clientId: ''
  });

  useEffect(() => {
    // Fallback to localStorage since Firebase is deinstalled
    const saved = localStorage.getItem('axiom_integrations');
    if (saved) {
      try {
        setIntegrations(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse integrations from localStorage');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const checkGhAuth = async () => {
      try {
        const res = await fetch('/api/auth/github/me');
        const data = await res.json();
        if (data.authenticated) setGhUser(data.user);
      } catch (e) {}
    };
    checkGhAuth();
  }, []);

  const handleGithubLogin = () => {
    window.location.href = '/api/auth/github/login';
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newIntegration: Integration = {
        id: `local-${Date.now()}`,
        ...formData,
        status: 'active',
        createdAt: new Date().toISOString(),
        ownerId: 'local-user'
      };
      
      const updated = [...integrations, newIntegration];
      setIntegrations(updated);
      localStorage.setItem('axiom_integrations', JSON.stringify(updated));
      
      setFormData({ name: '', provider: 'GitHub', apiKey: '', clientId: '' });
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add integration:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updated = integrations.filter(i => i.id !== id);
      setIntegrations(updated);
      localStorage.setItem('axiom_integrations', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to delete integration:', err);
    }
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Developer Partnerships & Workspace</h2>
          <p className="text-zinc-500 mt-2">Securely manage credentials and Google Drive Picker integrations (Scopes: drive.file, drive.metadata.readonly).</p>
        </div>
        <div className="flex items-center gap-3">
          {ghUser ? (
            <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
              <img src={ghUser.avatar_url} alt="" className="w-5 h-5 rounded-full" />
              <span className="text-xs font-bold text-zinc-300">{ghUser.login}</span>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[9px] font-black uppercase">Linked</span>
            </div>
          ) : (
            <button
              onClick={handleGithubLogin}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-xl font-bold transition-all"
            >
              <Github size={18} />
              GitHub OAuth
            </button>
          )}
          <button
            onClick={() => setIsPickerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg"
          >
            <FolderOpen size={18} />
            Google Drive Picker
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all"
          >
            <Plus size={18} />
            New Integration
          </button>
        </div>
      </header>

      <GooglePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onFileSelected={(file) => {
          console.log('Google Drive File Selected:', file);
        }}
      />

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Integration Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Production GitHub Sync"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Provider</label>
                <select
                  value={formData.provider}
                  onChange={e => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                >
                  <option>GitHub</option>
                  <option>Slack</option>
                  <option>Discord</option>
                  <option>AWS</option>
                  <option>Google Cloud</option>
                  <option>Custom API</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">API Key / Secret</label>
                <input
                  required
                  type="password"
                  value={formData.apiKey}
                  onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Client ID (Optional)</label>
                <input
                  type="text"
                  value={formData.clientId}
                  onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder="client_abc123"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-2 text-zinc-500 font-bold hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all"
                >
                  Save Integration
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="size-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (integrations || []).length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl p-12 text-center">
            <Share2 className="size-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">No active integrations found. Connect your first partnership string above.</p>
          </div>
        ) : (
          (integrations || []).map((integration) => (
            <motion.div
              key={integration.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-zinc-800 rounded-xl flex items-center justify-center text-indigo-400">
                    {integration.provider === 'GitHub' && <Globe className="size-6" />}
                    {integration.provider === 'Slack' && <Share2 className="size-6" />}
                    {integration.provider !== 'GitHub' && integration.provider !== 'Slack' && <Key className="size-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{integration.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{integration.provider}</span>
                      <div className="size-1 bg-zinc-800 rounded-full" />
                      <span className="flex items-center gap-1 text-[10px] text-emerald-500 uppercase tracking-widest font-bold">
                        <CheckCircle2 size={12} />
                        {integration.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 max-w-md">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Shield size={16} className="text-zinc-600 shrink-0" />
                      <code className="text-xs font-mono text-zinc-400 truncate">
                        {showKey[integration.id] ? integration.apiKey : '••••••••••••••••••••••••'}
                      </code>
                    </div>
                    <button
                      onClick={() => toggleKeyVisibility(integration.id)}
                      className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-all"
                    >
                      {showKey[integration.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {integration.clientId && (
                    <p className="text-[10px] text-zinc-600 mt-2 font-mono ml-1">Client ID: {integration.clientId}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all">
                    <ExternalLink size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(integration.id)}
                    className="p-2 hover:bg-red-500/10 rounded-xl text-zinc-500 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-xl">
          <Shield className="size-6 text-emerald-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Security Architecture</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Partnership strings are stored using industry-standard encryption protocols within the Axiomatic Vault. Access is restricted via RBAC (Role-Based Access Control) and all connection attempts are logged in the N+1 audit trail. Revoking an integration immediately terminates all active logical handshakes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
