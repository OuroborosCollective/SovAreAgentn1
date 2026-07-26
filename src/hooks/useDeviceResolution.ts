import { useState, useEffect } from 'react';

export interface DeviceTelemetry {
  width: number;
  height: number;
  dpr: number;
  orientation: 'portrait' | 'landscape';
  touchCapable: boolean;
  deviceType: 'mobile' | 'phablet' | 'samsung-tab-a9' | 'tablet-large' | 'desktop' | 'ultrawide';
  deviceName: string;
  recommendedLayout: 'compact-touch' | 'tablet-split' | 'desktop-full' | 'ultrawide-bento';
  aspectRatio: string;
}

export function useDeviceResolution(): DeviceTelemetry {
  const getTelemetry = (): DeviceTelemetry => {
    if (typeof window === 'undefined') {
      return {
        width: 1280,
        height: 800,
        dpr: 2,
        orientation: 'landscape',
        touchCapable: true,
        deviceType: 'samsung-tab-a9',
        deviceName: 'Samsung Galaxy Tab A9+ Baseline (Default)',
        recommendedLayout: 'tablet-split',
        aspectRatio: '16:10'
      };
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const orientation: 'portrait' | 'landscape' = w >= h ? 'landscape' : 'portrait';

    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(w, h);
    const aspectStr = `${Math.round(w / divisor)}:${Math.round(h / divisor)}`;

    let deviceType: DeviceTelemetry['deviceType'] = 'desktop';
    let deviceName = 'PC Desktop Monitor';
    let recommendedLayout: DeviceTelemetry['recommendedLayout'] = 'desktop-full';

    if (w < 640) {
      deviceType = 'mobile';
      deviceName = 'Mobile Smartphone (Compact)';
      recommendedLayout = 'compact-touch';
    } else if (w >= 640 && w < 800) {
      deviceType = 'phablet';
      deviceName = 'Phablet / Small Tablet';
      recommendedLayout = 'compact-touch';
    } else if (w >= 800 && w <= 1280) {
      // Samsung Galaxy Tab A9 / A9+ Target Spec (8.7" / 11" 1200x1920 / 800x1340)
      deviceType = 'samsung-tab-a9';
      deviceName = 'Samsung Galaxy Tab A9 / A9+ (Target Tablet)';
      recommendedLayout = 'tablet-split';
    } else if (w > 1280 && w <= 1600) {
      deviceType = 'tablet-large';
      deviceName = 'Pro Tablet / High-Res Laptop';
      recommendedLayout = 'desktop-full';
    } else if (w > 1600 && w <= 2200) {
      deviceType = 'desktop';
      deviceName = 'PC Monitor (1080p / 1440p)';
      recommendedLayout = 'desktop-full';
    } else {
      deviceType = 'ultrawide';
      deviceName = 'Ultra-Wide Workstation Monitor (21:9 / 4K)';
      recommendedLayout = 'ultrawide-bento';
    }

    return {
      width: w,
      height: h,
      dpr: Math.round(dpr * 100) / 100,
      orientation,
      touchCapable: isTouch,
      deviceType,
      deviceName,
      recommendedLayout,
      aspectRatio: aspectStr
    };
  };

  const [telemetry, setTelemetry] = useState<DeviceTelemetry>(getTelemetry());

  useEffect(() => {
    const handleResize = () => {
      const currentTelemetry = getTelemetry();
      setTelemetry(currentTelemetry);

      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        const { width: w, height: h, dpr, touchCapable: isTouch } = currentTelemetry;

        root.style.setProperty('--screen-w', `${w}px`);
        root.style.setProperty('--screen-h', `${h}px`);
        root.style.setProperty('--device-dpr', `${dpr}`);
        root.style.setProperty('--touch-min-target', isTouch ? '44px' : '36px');

        let fluidFontSize = '14px';
        let fluidLineHeight = '1.5';
        let cardPadding = '16px';
        let uiGap = '12px';

        if (w < 380) {
          fluidFontSize = 'calc(11px + 0.8vw)';
          fluidLineHeight = '1.35';
          cardPadding = '10px';
          uiGap = '8px';
        } else if (w < 640) {
          fluidFontSize = 'calc(12px + 0.6vw)';
          fluidLineHeight = '1.4';
          cardPadding = '12px';
          uiGap = '10px';
        } else if (w <= 1280) {
          // Samsung Tab A9 / A9+ Tablet optimized scale
          fluidFontSize = 'calc(13px + 0.4vw)';
          fluidLineHeight = '1.5';
          cardPadding = '16px';
          uiGap = '12px';
        } else {
          fluidFontSize = 'calc(14px + 0.2vw)';
          fluidLineHeight = '1.55';
          cardPadding = '20px';
          uiGap = '16px';
        }

        root.style.setProperty('--fluid-base-font-size', fluidFontSize);
        root.style.setProperty('--fluid-line-height', fluidLineHeight);
        root.style.setProperty('--card-padding-fluid', cardPadding);
        root.style.setProperty('--ui-gap-fluid', uiGap);
      }
    };

    handleResize(); // Initial injection

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return telemetry;
}
