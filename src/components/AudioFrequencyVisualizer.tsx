import React from 'react';
import { motion } from 'framer-motion';

interface AudioFrequencyVisualizerProps {
  frequencyData: Uint8Array;
  color?: string; // hex or tailwind class based
  bars?: number;
}

export const AudioFrequencyVisualizer: React.FC<AudioFrequencyVisualizerProps> = ({ 
  frequencyData, 
  color = '#ec4899', // pink-500
  bars = 32
}) => {
  // Ensure we have enough data or pad with 0s
  const data = Array.from(frequencyData).slice(0, bars);
  while (data.length < bars) data.push(0);

  return (
    <div className="flex items-end justify-center h-16 gap-[2px] w-full overflow-hidden">
      {data.map((val, i) => {
        // Normalize value (0 to 255) to a height percentage
        const heightPct = Math.max(5, (val / 255) * 100);
        
        return (
          <motion.div
            key={i}
            className="w-full max-w-[8px] rounded-t-sm"
            style={{ backgroundColor: color }}
            animate={{ height: `${heightPct}%` }}
            transition={{ type: 'tween', duration: 0.1, ease: 'linear' }}
          />
        );
      })}
    </div>
  );
};
