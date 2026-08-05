import React, { useRef } from 'react';

export const MountTracker: React.FC<{ id: string, children: React.ReactNode }> = ({ id, children }) => {
  const start = useRef(performance.now());
  
  React.useLayoutEffect(() => {
    const duration = performance.now() - start.current;
    try {
      const historyStr = localStorage.getItem('tti_metrics') || '[]';
      let history = JSON.parse(historyStr);
      history.push({ id, duration, timestamp: Date.now() });
      if (history.length > 200) history = history.slice(-200);
      localStorage.setItem('tti_metrics', JSON.stringify(history));
    } catch(e) {}
  }, [id]);
  
  return <>{children}</>;
};
