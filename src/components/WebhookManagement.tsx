import React, { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, Activity, Globe, Shield, RefreshCw, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WebhookEndpoint {
  id: string;
  url: string;
  description: string;
  events: string[];
  secret: string;
  status: 'active' | 'inactive' | 'error';
  lastTriggered?: any;
  createdAt: any;
}

const AVAILABLE_EVENTS = [
  'agent.created',
  'agent.deleted',
  'knowledge.updated',
  'system.alert',
  'integration.connected'
];

export const WebhookManagement: React.FC = () => {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Fallback to localStorage since Firebase is deinstalled
    const saved = localStorage.getItem('axiom_webhooks');
    if (saved) {
      try {
        setEndpoints(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse webhooks from localStorage');
      }
    }
    setIsLoading(false);
  }, []);

  const generateSecret = () => {
    return 'whsec_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleAddEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    try {
      const newEndpoint: WebhookEndpoint = {
        id: `local-${Date.now()}`,
        url,
        description,
        events: selectedEvents.length > 0 ? selectedEvents : ['*'],
        secret: generateSecret(),
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      const updated = [...endpoints, newEndpoint];
      setEndpoints(updated);
      localStorage.setItem('axiom_webhooks', JSON.stringify(updated));
      
      setUrl('');
      setDescription('');
      setSelectedEvents([]);
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding webhook:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updated = endpoints.filter(e => e.id !== id);
      setEndpoints(updated);
      localStorage.setItem('axiom_webhooks', JSON.stringify(updated));
    } catch (error) {
      console.error("Error deleting webhook:", error);
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const copySecret = (secret: string, id: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const testWebhook = async (endpoint: WebhookEndpoint) => {
    try {
      const updated = endpoints.map(e => {
        if (e.id === endpoint.id) {
          return { ...e, lastTriggered: new Date().toISOString(), status: 'active' as const };
        }
        return e;
      });
      setEndpoints(updated);
      localStorage.setItem('axiom_webhooks', JSON.stringify(updated));
      
      // We would normally call our backend to trigger this webhook.
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointId: endpoint.id })
      });
      
      if (!res.ok) {
        const errorUpdated = endpoints.map(e => e.id === endpoint.id ? { ...e, status: 'error' as const } : e);
        setEndpoints(errorUpdated);
        localStorage.setItem('axiom_webhooks', JSON.stringify(errorUpdated));
      }
    } catch (err) {
      console.error("Error testing webhook:", err);
      const errorUpdated = endpoints.map(e => e.id === endpoint.id ? { ...e, status: 'error' as const } : e);
      setEndpoints(errorUpdated);
      localStorage.setItem('axiom_webhooks', JSON.stringify(errorUpdated));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Webhook className="text-emerald-500" size={32} />
            Webhook Management
          </h1>
          <p className="text-zinc-400 mt-2">
            Register and manage endpoints for receiving event notifications from external partner applications.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium"
        >
          {isAdding ? <Activity size={18} /> : <Plus size={18} />}
          {isAdding ? 'Cancel' : 'New Endpoint'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Register New Endpoint</h2>
              <form onSubmit={handleAddEndpoint} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Endpoint URL *</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="url"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://api.yourdomain.com/webhooks/events"
                      className="w-full pl-10 pr-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="E.g., Production billing event listener"
                    className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-3">Events to Send</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {AVAILABLE_EVENTS.map(event => (
                      <button
                        type="button"
                        key={event}
                        onClick={() => toggleEvent(event)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                          selectedEvents.includes(event)
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                            : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                          selectedEvents.includes(event) ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                        }`}>
                          {selectedEvents.includes(event) && <Check size={12} className="text-black" />}
                        </div>
                        {event}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">If no events are selected, the endpoint will receive all events (*).</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
                  >
                    Register Endpoint
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="text-zinc-600 animate-spin" size={32} />
        </div>
      ) : endpoints.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl border-dashed">
          <Webhook className="mx-auto text-zinc-700 mb-4" size={48} />
          <h3 className="text-lg font-medium text-white mb-2">No Webhooks Registered</h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
            Register endpoints to allow external partner applications to receive real-time event notifications from your workspace.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Plus size={18} /> Add First Endpoint
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {endpoints.map((endpoint) => (
            <motion.div
              key={endpoint.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors flex flex-col md:flex-row gap-6 md:items-center justify-between group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-base font-semibold text-white truncate">
                    {endpoint.url}
                  </h3>
                  <div className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider flex items-center gap-1 ${
                    endpoint.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    endpoint.status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}>
                    {endpoint.status === 'active' && <CheckCircle2 size={12} />}
                    {endpoint.status === 'error' && <AlertCircle size={12} />}
                    {endpoint.status}
                  </div>
                </div>
                {endpoint.description && (
                  <p className="text-sm text-zinc-400 mb-3">{endpoint.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-black px-2 py-1 rounded border border-zinc-800">
                    <Shield size={12} />
                    <span className="font-mono">{endpoint.secret.substring(0, 12)}...</span>
                    <button 
                      onClick={() => copySecret(endpoint.secret, endpoint.id)}
                      className="ml-1 text-zinc-400 hover:text-white"
                      title="Copy Secret"
                    >
                      {copiedId === endpoint.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  
                  <div className="text-xs text-zinc-500 flex gap-1">
                    <span className="bg-zinc-800 px-1.5 py-0.5 rounded">
                      {endpoint.events.includes('*') ? 'All Events' : `${endpoint.events.length} events`}
                    </span>
                  </div>

                  {endpoint.lastTriggered && (
                    <div className="text-xs text-zinc-500 ml-auto flex items-center gap-1">
                      <Activity size={12} />
                      Last triggered: {new Date(endpoint.lastTriggered?.toDate?.() || Date.now()).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => testWebhook(endpoint)}
                  className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Test
                </button>
                <button
                  onClick={() => handleDelete(endpoint.id)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  title="Delete Endpoint"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
