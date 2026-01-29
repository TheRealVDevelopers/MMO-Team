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
      primary: '#22C55E',       // Green-500 (softer)
      secondary: '#16A34A',     // Green-600
      accent: '#4ADE80',        // Green-400
      error: '#EF4444',         // Red-500
      purple: '#A855F7',        // Purple-500 (for accents)

      // Backgrounds
      background: '#FFFFFF',    // White
      surface: '#F9FAFB',       // Gray-50 (very light)
      'subtle-background': '#F3F4F6', // Gray-100

      // Text
      'text-primary': '#111827',     // Gray-900
      'text-secondary': '#4B5563',   // Gray-600
      'text-tertiary': '#9CA3AF',    // Gray-400

      // UI Elements
      border: '#E5E7EB',        // Gray-200
      'toggle-background': '#D1D5DB',

      // Subtle States
      'primary-subtle-background': '#F0FDF4',
      'primary-subtle-text': '#166534',
      'secondary-subtle-background': '#DCF2E7',
      'secondary-subtle-text': '#14532D',
      'accent-subtle-background': '#ECFDF5',
      'accent-subtle-text': '#059669',
      'error-subtle-background': '#FEF2F2',
      'error-subtle-text': '#B91C1C',
      'purple-subtle-background': '#F3E8FF',
      'purple-subtle-text': '#7C3AED',
    },
  },
  'dark': {
    name: 'Dark (Purple & Black)',
    type: 'dark',
    colors: {
      // Purple Theme on Black
      primary: '#A855F7',        // Purple-500
      secondary: '#9333EA',      // Purple-600
      accent: '#C084FC',         // Purple-400
      error: '#F87171',          // Red-400
      purple: '#C4B5FD',         // Purple-300 (lighter for dark)

      // Backgrounds - Pure Black Theme
      background: '#000000',     // Pure Black
      surface: '#171717',        // Very Dark Gray
      'subtle-background': '#262626',

      // Text - High Contrast
      'text-primary': '#FAFAFA',      // Almost White
      'text-secondary': '#A3A3A3',    // Gray-400
      'text-tertiary': '#737373',     // Gray-500

      // UI Elements
      border: '#404040',
      'toggle-background': '#525252',

      // Subtle States - Purple tints
      'primary-subtle-background': '#581C87',
      'primary-subtle-text': '#E9D5FF',
      'secondary-subtle-background': '#4C1D95',
      'secondary-subtle-text': '#DDD6FE',
      'accent-subtle-background': '#6B21A8',
      'accent-subtle-text': '#F3E8FF',
      'error-subtle-background': '#7F1D1D',
      'error-subtle-text': '#FCA5A5',
      'purple-subtle-background': '#581C87',
      'purple-subtle-text': '#E9D5FF',
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
