import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';

export interface Theme {
  name: string;
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
    'slate-subtle-background': string;
    'slate-subtle-text': string;
  };
}

export const themes: Record<string, Theme> = {
  'default-light': {
    name: 'Corporate Blue',
    colors: {
      primary: '59 130 246',
      secondary: '22 163 74',
      accent: '245 158 11',
      error: '220 38 38',
      purple: '139 92 246',
      background: '243 244 246',
      surface: '255 255 255',
      'text-primary': '17 24 39',
      'text-secondary': '107 114 128',
      border: '229 231 235',
      'subtle-background': '249 250 251',
      'toggle-background': '209 213 219',
      'primary-subtle-background': '219 234 254',
      'primary-subtle-text': '37 99 235',
      'secondary-subtle-background': '220 252 231',
      'secondary-subtle-text': '21 128 61',
      'accent-subtle-background': '254 243 199',
      'accent-subtle-text': '217 119 6',
      'error-subtle-background': '254 226 226',
      'error-subtle-text': '185 28 28',
      'purple-subtle-background': '233 213 255',
      'purple-subtle-text': '126 34 206',
      'slate-subtle-background': '241 245 249',
      'slate-subtle-text': '71 85 105',
    },
  },
  'forest-green': {
    name: 'Minty Fresh',
    colors: {
      primary: '13 148 136',
      secondary: '96 165 250',
      accent: '234 179 8',
      error: '220 38 38',
      purple: '192 132 252',
      background: '240 253 250',
      surface: '255 255 255',
      'text-primary': '15 23 42',
      'text-secondary': '71 85 105',
      border: '226 232 240',
      'subtle-background': '240 253 250',
      'toggle-background': '209 213 219',
      'primary-subtle-background': '204 251 241',
      'primary-subtle-text': '15 118 110',
      'secondary-subtle-background': '219 234 254',
      'secondary-subtle-text': '59 130 246',
      'accent-subtle-background': '254 252 232',
      'accent-subtle-text': '202 138 4',
      'error-subtle-background': '254 226 226',
      'error-subtle-text': '185 28 28',
      'purple-subtle-background': '245 232 255',
      'purple-subtle-text': '168 85 247',
      'slate-subtle-background': '241 245 249',
      'slate-subtle-text': '71 85 105',
    },
  },
  'midnight-dark': {
    name: 'Deep Space',
    colors: {
      primary: '34 211 238',
      secondary: '139 92 246',
      accent: '251 146 60',
      error: '248 113 113',
      purple: '167 139 250',
      background: '15 23 42',
      surface: '30 41 59',
      'text-primary': '241 245 249',
      'text-secondary': '148 163 184',
      border: '51 65 85',
      'subtle-background': '40 52 72',
      'toggle-background': '71 85 105',
      'primary-subtle-background': '34 211 238 / 0.1',
      'primary-subtle-text': '34 211 238',
      'secondary-subtle-background': '139 92 246 / 0.1',
      'secondary-subtle-text': '139 92 246',
      'accent-subtle-background': '251 146 60 / 0.1',
      'accent-subtle-text': '251 146 60',
      'error-subtle-background': '248 113 113 / 0.1',
      'error-subtle-text': '248 113 113',
      'purple-subtle-background': '167 139 250 / 0.1',
      'purple-subtle-text': '167 139 250',
      'slate-subtle-background': '71 85 105 / 0.2',
      'slate-subtle-text': '148 163 184',
    },
  },
  'slate-rose': {
    name: 'Slate & Rose',
    colors: {
      primary: '219 39 119',
      secondary: '14 165 233',
      accent: '52 211 153',
      error: '248 113 113',
      purple: '168 85 247',
      background: '17 24 39',
      surface: '31 41 55',
      'text-primary': '229 231 235',
      'text-secondary': '156 163 175',
      border: '55 65 81',
      'subtle-background': '41 52 69',
      'toggle-background': '75 85 99',
      'primary-subtle-background': '219 39 119 / 0.1',
      'primary-subtle-text': '249 168 212',
      'secondary-subtle-background': '14 165 233 / 0.1',
      'secondary-subtle-text': '56 189 248',
      'accent-subtle-background': '52 211 153 / 0.1',
      'accent-subtle-text': '110 231 183',
      'error-subtle-background': '248 113 113 / 0.1',
      'error-subtle-text': '252 165 165',
      'purple-subtle-background': '168 85 247 / 0.1',
      'purple-subtle-text': '192 132 252',
      'slate-subtle-background': '71 85 105 / 0.2',
      'slate-subtle-text': '156 163 175',
    },
  },
};

interface ThemeContextType {
  theme: string;
  setTheme: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
        // Ensure that a valid theme is loaded, otherwise default
        const savedTheme = localStorage.getItem('app-theme');
        return savedTheme && themes[savedTheme] ? savedTheme : 'default-light';
    }
    return 'default-light';
  });

  useEffect(() => {
    const selectedTheme = themes[theme];
    if (selectedTheme) {
      const root = document.documentElement;
      Object.entries(selectedTheme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
      localStorage.setItem('app-theme', theme);
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
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