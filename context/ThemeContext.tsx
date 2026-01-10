import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export interface Theme {
  name: string;
  type: 'light' | 'dark';
  colors: {
    'primary': string;
    'secondary': string;
    'accent': string;
    'error': string;
    'purple': string;
    'background': string;
    'surface': string;
    'text-primary': string;
    'text-secondary': string;
    'text-tertiary': string;
    'border': string;
    'subtle-background': string;
    'toggle-background': string;

    'primary-subtle-background': string;
    'primary-subtle-text': string;
    'secondary-subtle-background': string;
    'secondary-subtle-text': string;
    'accent-subtle-background': string;
    'accent-subtle-text': string;
    'error-subtle-background': string;
    'error-subtle-text': string;
    'purple-subtle-background': string;
    'purple-subtle-text': string;
  };
}

export const themes: Record<string, Theme> = {
  'light': {
    name: 'Light (Soft Green)',
    type: 'light',
    colors: {
      // Soft Green Theme (Professional)
      primary: '34 197 94',       // #22C55E - Green-500 (softer)
      secondary: '22 163 74',     // #16A34A - Green-600
      accent: '74 222 128',       // #4ADE80 - Green-400
      error: '239 68 68',         // Red-500
      purple: '168 85 247',       // Purple-500 (for accents)

      // Backgrounds
      background: '255 255 255',  // White
      surface: '249 250 251',     // Gray-50 (very light)
      'subtle-background': '243 244 246', // Gray-100

      // Text
      'text-primary': '17 24 39',     // Gray-900
      'text-secondary': '75 85 99',   // Gray-600
      'text-tertiary': '156 163 175', // Gray-400

      // UI Elements
      border: '229 231 235',      // Gray-200
      'toggle-background': '209 213 219',

      // Subtle States
      'primary-subtle-background': '240 253 244',
      'primary-subtle-text': '22 101 52',
      'secondary-subtle-background': '220 252 231',
      'secondary-subtle-text': '20 83 45',
      'accent-subtle-background': '236 253 245',
      'accent-subtle-text': '5 150 105',
      'error-subtle-background': '254 242 242',
      'error-subtle-text': '185 28 28',
      'purple-subtle-background': '243 232 255',
      'purple-subtle-text': '124 58 237',
    },
  },
  'dark': {
    name: 'Dark (Purple & Black)',
    type: 'dark',
    colors: {
      // Purple Theme on Black
      primary: '168 85 247',      // #A855F7 - Purple-500
      secondary: '147 51 234',    // #9333EA - Purple-600
      accent: '192 132 252',      // #C084FC - Purple-400
      error: '248 113 113',       // Red-400
      purple: '196 181 253',      // Purple-300 (lighter for dark)

      // Backgrounds - Pure Black Theme
      background: '0 0 0',        // #000000 - Pure Black
      surface: '23 23 23',        // #171717 - Very Dark Gray
      'subtle-background': '38 38 38', // #262626

      // Text - High Contrast
      'text-primary': '250 250 250',   // Almost White
      'text-secondary': '163 163 163', // Gray-400
      'text-tertiary': '115 115 115',  // Gray-500

      // UI Elements
      border: '64 64 64',         // #404040
      'toggle-background': '82 82 82',

      // Subtle States - Purple tints
      'primary-subtle-background': '88 28 135',
      'primary-subtle-text': '233 213 255',
      'secondary-subtle-background': '76 29 149',
      'secondary-subtle-text': '221 214 254',
      'accent-subtle-background': '107 33 168',
      'accent-subtle-text': '243 232 255',
      'error-subtle-background': '127 29 29',
      'error-subtle-text': '252 165 165',
      'purple-subtle-background': '88 28 135',
      'purple-subtle-text': '233 213 255',
    },
  },
};

interface ThemeContextType {
  currentTheme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (themeName: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentThemeName, setCurrentThemeName] = useState<string>(() => {
    // Load theme preference from localStorage
    const saved = localStorage.getItem('theme-preference');
    return saved || 'light';
  });

  const currentTheme = themes[currentThemeName] || themes['light'];
  const isDark = currentTheme.type === 'dark';

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;

    // Add or remove dark class
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply all color variables
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Save preference
    localStorage.setItem('theme-preference', currentThemeName);
  }, [currentThemeName, currentTheme, isDark]);

  const toggleTheme = () => {
    console.log('Toggle theme called, current:', currentThemeName);
    setCurrentThemeName(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      console.log('Switching from', prev, 'to', next);
      return next;
    });
  };

  const setTheme = (themeName: string) => {
    if (themes[themeName]) {
      setCurrentThemeName(themeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
