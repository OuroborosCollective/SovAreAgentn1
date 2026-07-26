import { useState, useEffect } from 'react';
import { SystemAuditLog } from './systemAudit';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      SystemAuditLog.log('NETWORK', 'STATUS_CHANGE', 'HEALED', 'NET_RESTORED');
    };
    const handleOffline = () => {
      setIsOnline(false);
      SystemAuditLog.log('NETWORK', 'STATUS_CHANGE', 'WARNING', 'NET_LOST');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
