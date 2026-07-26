import React, { useState } from 'react';
import { Tablet, Smartphone, Monitor, Tv, Cpu, RefreshCw, CheckCircle2, Sliders, ChevronDown, ChevronUp, Eye, RotateCcw } from 'lucide-react';
import { useDeviceResolution, DeviceTelemetry } from '../hooks/useDeviceResolution';

export const DeviceResolutionBanner: React.FC = () => {
  const telemetry = useDeviceResolution();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePreset, setActivePreset] = useState<'auto' | 'mobile' | 'samsung-tab-a9' | 'desktop' | 'ultrawide'>('auto');

  const presets = [
    { id: 'auto', label: 'Auto Detect', icon: Cpu, width: telemetry.width, height: telemetry.height, dpr: telemetry.dpr, isTouch: telemetry.touchCapable },
    { id: 'mobile', label: 'Mobile (375x812)', icon: Smartphone, width: 375, height: 812, dpr: 3, isTouch: true },
    { id: 'samsung-tab-a9', label: 'Samsung Tab A9 (1280x800)', icon: Tablet, width: 1280, height: 800, dpr: 2, isTouch: true },
    { id: 'desktop', label: 'Desktop (1920x1080)', icon: Monitor, width: 1920, height: 1080, dpr: 1, isTouch: false },
    { id: 'ultrawide', label: 'Ultrawide 4K (2560x1080)', icon: Tv, width: 2560, height: 1080, dpr: 1, isTouch: false },
  ];

  const handleApplyPreset = (presetId: 'auto' | 'mobile' | 'samsung-tab-a9' | 'desktop' | 'ultrawide') => {
    setActivePreset(presetId);
    const selected = presets.find(p => p.id === presetId) || presets[0];

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const w = selected.width;
      const h = selected.height;
      
      root.style.setProperty('--screen-w', `${w}px`);
      root.style.setProperty('--screen-h', `${h}px`);
      root.style.setProperty('--device-dpr', `${selected.dpr}`);
      root.style.setProperty('--touch-min-target', selected.isTouch ? '44px' : '36px');

      let fluidFontSize = '14px';
      let cardPadding = '16px';
      let uiGap = '12px';

      if (w < 640) {
        fluidFontSize = 'calc(11px + 0.8vw)';
        cardPadding = '10px';
        uiGap = '8px';
      } else if (w <= 1280) {
        fluidFontSize = 'calc(13px + 0.4vw)';
        cardPadding = '16px';
        uiGap = '12px';
      } else {
        fluidFontSize = 'calc(14px + 0.2vw)';
        cardPadding = '20px';
        uiGap = '16px';
      }

      root.style.setProperty('--fluid-base-font-size', fluidFontSize);
      root.style.setProperty('--card-padding-fluid', cardPadding);
      root.style.setProperty('--ui-gap-fluid', uiGap);
    }
  };

  const getDeviceIcon = (type: DeviceTelemetry['deviceType']) => {
    switch (type) {
      case 'mobile':
      case 'phablet':
        return <Smartphone size={16} className="text-emerald-400" />;
      case 'samsung-tab-a9':
      case 'tablet-large':
        return <Tablet size={16} className="text-amber-400" />;
      case 'desktop':
        return <Monitor size={16} className="text-blue-400" />;
      case 'ultrawide':
        return <Tv size={16} className="text-purple-400" />;
    }
  };

  const currentWidth = activePreset === 'auto' ? telemetry.width : presets.find(p => p.id === activePreset)?.width;
  const currentHeight = activePreset === 'auto' ? telemetry.height : presets.find(p => p.id === activePreset)?.height;

  return (
    <div className="bg-zinc-950 border-b border-zinc-800 text-xs px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-md">
      <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg shrink-0">
          {getDeviceIcon(telemetry.deviceType)}
          <span className="font-bold text-white text-[11px] truncate">
            {activePreset === 'auto' ? telemetry.deviceName : `Preview Mode: ${presets.find(p => p.id === activePreset)?.label}`}
          </span>
          <span className={`px-1.5 py-0.2 text-[9px] font-mono uppercase border rounded ${
            activePreset === 'auto' 
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
              : 'bg-indigo-950 text-indigo-300 border-indigo-800'
          }`}>
            {activePreset === 'auto' ? 'AUTO DETECTED' : 'PREVIEW OVERRIDE'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 shrink-0">
          <div>Res: <strong className="text-zinc-200">{currentWidth}x{currentHeight}px</strong></div>
          <div>DPR: <strong className="text-zinc-200">{telemetry.dpr}x</strong></div>
          <div className="hidden sm:block">Aspect: <strong className="text-zinc-200">{telemetry.aspectRatio}</strong></div>
          <div className="hidden sm:block">Orientation: <strong className="text-zinc-200 capitalize">{telemetry.orientation}</strong></div>
          <div>Touch: <strong className={telemetry.touchCapable ? 'text-emerald-400' : 'text-zinc-500'}>{telemetry.touchCapable ? 'Yes' : 'No'}</strong></div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-auto shrink-0 overflow-x-auto custom-scrollbar">
        {/* Quick Resolution Switch Buttons */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          {presets.map(p => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p.id as any)}
              className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition-all ${
                activePreset === p.id 
                  ? 'bg-indigo-600 text-white font-bold shadow' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title={`Preview ${p.label}`}
            >
              <p.icon size={12} />
              <span className="hidden lg:inline">{p.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-all shrink-0"
        >
          <Sliders size={12} />
          <span>Specs</span>
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {isExpanded && (
        <div className="w-full mt-2 pt-2 border-t border-zinc-900 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-mono text-zinc-400">
          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 block">Baseline Target</span>
            <strong className="text-amber-300">Samsung Tab A9 Tablet (8.7" / 11")</strong>
          </div>
          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 block">Layout Mode</span>
            <strong className="text-indigo-300 capitalize">{telemetry.recommendedLayout}</strong>
          </div>
          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 block">Touch Target Spec</span>
            <strong className="text-emerald-300">{telemetry.touchCapable ? '44px+ Min Target' : 'Cursor Precision'}</strong>
          </div>
          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 block">Auto-Scaling</span>
            <strong className="text-purple-300">Fluid Responsive Grid Active</strong>
          </div>
        </div>
      )}
    </div>
  );
};
