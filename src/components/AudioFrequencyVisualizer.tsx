import React from 'react';
import { CanvasWaveformVisualizer } from './CanvasWaveformVisualizer';

interface AudioFrequencyVisualizerProps {
  frequencyData: Uint8Array;
  color?: string; // hex or tailwind class based
  bars?: number;
  height?: number;
  isPlaying?: boolean;
  isListening?: boolean;
}

export const AudioFrequencyVisualizer: React.FC<AudioFrequencyVisualizerProps> = ({ 
  frequencyData, 
  color = '#ec4899', // pink-500
  height = 80,
  isPlaying = true,
  isListening = false
}) => {
  return (
    <CanvasWaveformVisualizer
      frequencyData={frequencyData}
      primaryColor={color}
      height={height}
      isPlaying={isPlaying}
      isListening={isListening}
      showPeakHud={false}
      showGrid={true}
    />
  );
};

