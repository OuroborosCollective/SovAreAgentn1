import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'dark' | 'high-contrast' | 'minimalist';

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  description: string;
  badge: string;
  previewBg: string;
  previewBorder: string;
  previewText: string;
  accentColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    name: "System's Default (Dark)",
    description: "Standard Axiomatic dark workspace canvas with balanced contrast, subtle border glow, and rich cybernetic accents.",
    badge: 'DEFAULT',
    previewBg: 'bg-zinc-950',
    previewBorder: 'border-zinc-800',
    previewText: 'text-zinc-200',
    accentColor: 'text-cyan-400 border-cyan-500'
  },
  {
    id: 'high-contrast',
    name: "Axiomatic High-Contrast",
    description: "Ultra-crisp high legibility pitch black layout with stark white borders, vivid amber accents, and maximal visual punch.",
    badge: 'HIGH LEGIBILITY',
    previewBg: 'bg-black',
    previewBorder: 'border-white',
    previewText: 'text-white',
    accentColor: 'text-amber-400 border-amber-400'
  },
  {
    id: 'minimalist',
    name: "Minimalist",
    description: "Calm, ultra-clean slate monochrome environment with muted borders, minimal visual noise, and relaxed typography.",
    badge: 'MINIMAL',
    previewBg: 'bg-slate-950',
    previewBorder: 'border-slate-800',
    previewText: 'text-slate-300',
    accentColor: 'text-emerald-400 border-emerald-500'
  }
];

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  getThemeLabel: (id: ThemeMode) => string;
  getThemeOption: (id: ThemeMode) => ThemeOption;
  lastSynced: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'n1_system_theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'high-contrast' || saved === 'minimalist' || saved === 'dark') {
        return saved as ThemeMode;
      }
    } catch (e) {
      console.warn('Failed to read theme from localStorage:', e);
    }
    return 'dark';
  });

  const [lastSynced, setLastSynced] = useState<string>(() => new Date().toLocaleTimeString());

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    const now = new Date().toLocaleTimeString();
    setLastSynced(now);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
      localStorage.setItem('n1_theme_last_synced', now);
    } catch (e) {
      console.warn('Failed to persist theme to localStorage:', e);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-high-contrast', 'theme-minimalist');
    root.classList.add(`theme-${theme}`);
    root.setAttribute('data-theme', theme);

    // Dynamic style tag injection for global high-contrast and minimalist overrides
    let styleEl = document.getElementById('n1-theme-global-styles') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'n1-theme-global-styles';
      document.head.appendChild(styleEl);
    }

    if (theme === 'high-contrast') {
      styleEl.textContent = `
        .theme-high-contrast {
          --bg-main: #000000 !important;
          color: #ffffff !important;
        }
        .theme-high-contrast .bg-zinc-950,
        .theme-high-contrast .bg-zinc-900,
        .theme-high-contrast .bg-slate-950 {
          background-color: #000000 !important;
        }
        .theme-high-contrast .border-zinc-800,
        .theme-high-contrast .border-zinc-900,
        .theme-high-contrast .border-slate-800 {
          border-color: #ffffff !important;
        }
        .theme-high-contrast .text-zinc-400,
        .theme-high-contrast .text-zinc-500 {
          color: #e4e4e7 !important;
        }
        .theme-high-contrast button {
          font-weight: 700 !important;
        }
      `;
    } else if (theme === 'minimalist') {
      styleEl.textContent = `
        .theme-minimalist {
          --bg-main: #090d16 !important;
          color: #cbd5e1 !important;
        }
        .theme-minimalist .bg-zinc-950 {
          background-color: #090d16 !important;
        }
        .theme-minimalist .bg-zinc-900 {
          background-color: #0f172a !important;
        }
        .theme-minimalist .border-zinc-800,
        .theme-minimalist .border-zinc-900 {
          border-color: #1e293b !important;
        }
        .theme-minimalist .neon-glow {
          text-shadow: none !important;
        }
      `;
    } else {
      styleEl.textContent = '';
    }
  }, [theme]);

  const getThemeLabel = (id: ThemeMode): string => {
    const opt = THEME_OPTIONS.find(o => o.id === id);
    return opt ? opt.name : "System's Default (Dark)";
  };

  const getThemeOption = (id: ThemeMode): ThemeOption => {
    return THEME_OPTIONS.find(o => o.id === id) || THEME_OPTIONS[0];
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, getThemeLabel, getThemeOption, lastSynced }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
