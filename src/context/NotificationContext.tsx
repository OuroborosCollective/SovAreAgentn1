import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface Notification {
  id: string;
  message: string;
  code?: string;
  type: 'error' | 'info' | 'success';
}

interface NotificationContextType {
  addNotification: (message: string, type?: 'error' | 'info' | 'success', code?: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: 'error' | 'info' | 'success' = 'error', code?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type, code }]);
    
    // Auto-remove after 6 seconds unless it's an error with a code
    if (type !== 'error') {
      setTimeout(() => {
        removeNotification(id);
      }, 6000);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Global Exception Catcher
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      // Catch "undefined length" and similar crashes
      if (event.message && event.message.includes('length') && event.message.includes('undefined')) {
        addNotification(
          "A property access error occurred while rendering a component state.", 
          'error', 
          'ERR_UNDEFINED_LENGTH'
        );
      } else {
        addNotification(
          event.message || "An unexpected application error occurred.", 
          'error', 
          'ERR_UNEXPECTED_CRASH'
        );
      }
      // Prevent the default browser console error if desired (optional)
      // event.preventDefault(); 
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonMsg = event.reason?.message || '';
      
      // Ignore Vite HMR WebSocket connection errors (expected when HMR is blocked by proxy)
      if (reasonMsg.includes('WebSocket') && reasonMsg.includes('closed without opened')) {
        event.preventDefault();
        return;
      }

      addNotification(
        reasonMsg || "An unexpected asynchronous error occurred.", 
        'error', 
        'ERR_UNHANDLED_REJECTION'
      );
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-3">
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={`w-80 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col gap-3 ${
                notif.type === 'error' 
                  ? 'bg-red-950/90 border-red-500/50 text-red-100 shadow-red-900/20' 
                  : notif.type === 'success'
                    ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-900/20'
                    : 'bg-zinc-950/90 border-zinc-500/50 text-zinc-100 shadow-zinc-900/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {notif.type === 'error' && <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />}
                  <div>
                    {notif.code && (
                      <span className="text-[10px] font-bold font-mono uppercase opacity-70 block mb-1">
                        {notif.code}
                      </span>
                    )}
                    <p className="text-xs leading-relaxed">{notif.message}</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeNotification(notif.id)}
                  className="p-1 hover:bg-black/20 rounded-lg transition-colors shrink-0"
                >
                  <X size={14} opacity={0.7} />
                </button>
              </div>
              
              {notif.type === 'error' && (
                <div className="flex justify-end pt-2 border-t border-red-500/20">
                  <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/50 hover:bg-red-800/80 text-red-200 text-xs font-bold rounded-lg transition-colors"
                  >
                    <RefreshCw size={12} />
                    <span>Retry & Reload</span>
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
