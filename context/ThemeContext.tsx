
import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';

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
  'luxury-heritage': {
    name: 'Luxury Heritage',
    type: 'light',
    colors: {
      primary: '196 163 90', // #C4A35A
      secondary: '122 90 58', // #7A5A3A
      accent: '191 194 184', // #BFC2B8
      error: '185 28 28',
      purple: '109 40 217',
      background: '246 244 240', // #F6F4F0
      surface: '255 255 255',
      'text-primary': '42 42 42',
      'text-secondary': '110 110 110',
      border: '224 224 224',
      'subtle-background': '238 234 227',
      'toggle-background': '200 200 200',

      'primary-subtle-background': '245 240 230',
      'primary-subtle-text': '196 163 90',
      'secondary-subtle-background': '240 235 230',
      'secondary-subtle-text': '122 90 58',
      'accent-subtle-background': '240 242 240',
      'accent-subtle-text': '100 100 100',
      'error-subtle-background': '254 242 242',
      'error-subtle-text': '153 27 27',
      'purple-subtle-background': '243 232 255',
      'purple-subtle-text': '107 33 168',
      'slate-subtle-background': '241 245 249',
      'slate-subtle-text': '51 65 85',
    },
  },
  'corporate-classic': {
    name: 'Corporate Classic',
    type: 'light',
    colors: {
      primary: '37 99 235', // Blue 600
      secondary: '71 85 105', // Slate 600
      accent: '14 165 233', // Sky 500
      error: '220 38 38',
      purple: '124 58 237',
      background: '248 250 252', // Slate 50
      surface: '255 255 255',
      'text-primary': '15 23 42', // Slate 900
      'text-secondary': '100 116 139', // Slate 500
      border: '226 232 240', // Slate 200
      'subtle-background': '241 245 249', // Slate 100
      'toggle-background': '203 213 225',

      'primary-subtle-background': '239 246 255', // Blue 50
      'primary-subtle-text': '37 99 235',
      'secondary-subtle-background': '241 245 249', // Slate 100
      'secondary-subtle-text': '71 85 105',
      'accent-subtle-background': '224 242 254', // Sky 100
      'accent-subtle-text': '14 165 233',
      'error-subtle-background': '254 242 242',
      'error-subtle-text': '185 28 28',
      'purple-subtle-background': '243 232 255',
      'purple-subtle-text': '107 33 168',
      'slate-subtle-background': '241 245 249',
      'slate-subtle-text': '71 85 105',
    },
  },
  'modern-minimal': {
    name: 'Modern Minimal',
    type: 'light',
    colors: {
      primary: '24 24 27', // Zinc 900
      secondary: '82 82 91', // Zinc 600
      accent: '113 113 122', // Zinc 500
      error: '220 38 38',
      purple: '88 28 135',
      background: '255 255 255',
      surface: '250 250 250', // Zinc 50
      'text-primary': '9 9 11', // Zinc 950
      'text-secondary': '113 113 122', // Zinc 500
      border: '228 228 231', // Zinc 200
      'subtle-background': '244 244 245', // Zinc 100
      'toggle-background': '212 212 216',

      'primary-subtle-background': '228 228 231',
      'primary-subtle-text': '24 24 27',
      'secondary-subtle-background': '244 244 245',
      'secondary-subtle-text': '82 82 91',
      'accent-subtle-background': '244 244 245',
      'accent-subtle-text': '113 113 122',
      'error-subtle-background': '254 242 242',
      'error-subtle-text': '185 28 28',
      'purple-subtle-background': '250 232 255',
      'purple-subtle-text': '107 33 168',
      'slate-subtle-background': '244 244 245',
      'slate-subtle-text': '82 82 91',
    },
  },
  'midnight-executive': {
    name: 'Midnight Executive',
    type: 'dark',
    colors: {
      primary: '129 140 248', // Indigo 400
      secondary: '148 163 184', // Slate 400
      accent: '99 102 241', // Indigo 500
      error: '248 113 113', // Red 400
      purple: '167 139 250', // Violet 400
      background: '15 23 42', // Slate 900
      surface: '30 41 59', // Slate 800
      'text-primary': '248 250 252', // Slate 50
      'text-secondary': '148 163 184', // Slate 400
      border: '51 65 85', // Slate 700
      'subtle-background': '51 65 85', // Slate 700
      'toggle-background': '71 85 105',

      // Semantic subtle states for Dark Mode
      'primary-subtle-background': '49 46 129', // Indigo 900
      'primary-subtle-text': '199 210 254', // Indigo 200
      'secondary-subtle-background': '30 41 59', // Slate 800
      'secondary-subtle-text': '203 213 225', // Slate 200
      'accent-subtle-background': '49 46 129',
      'accent-subtle-text': '165 180 252',
      'error-subtle-background': '69 10 10', // Red 950
      'error-subtle-text': '252 165 165', // Red 300
      'purple-subtle-background': '76 29 149', // Violet 900
      'purple-subtle-text': '221 214 254', // Violet 200
      'slate-subtle-background': '30 41 59',
      'slate-subtle-text': '148 163 184',
    },
  },
  'obsidian-gold': {
    name: 'Obsidian Gold',
    type: 'dark',
    colors: {
      primary: '252 211 77', // Amber 300
      secondary: '214 211 209', // Stone 300
      accent: '168 162 158', // Stone 400
      error: '248 113 113',
      purple: '192 132 252',
      background: '12 10 9', // Stone 950
      surface: '28 25 23', // Stone 900
      'text-primary': '250 250 249', // Stone 50
      'text-secondary': '168 162 158', // Stone 400
      border: '68 64 60', // Stone 700
      'subtle-background': '41 37 36', // Stone 800
      'toggle-background': '87 83 78',

      'primary-subtle-background': '66 32 6', // Yellow 950
      'primary-subtle-text': '253 230 138', // Amber 200
      'secondary-subtle-background': '41 37 36',
      'secondary-subtle-text': '214 211 209',
      'accent-subtle-background': '41 37 36',
      'accent-subtle-text': '168 162 158',
      'error-subtle-background': '69 10 10',
      'error-subtle-text': '252 165 165',
      'purple-subtle-background': '88 28 135',
      'purple-subtle-text': '233 213 255',
      'slate-subtle-background': '41 37 36',
      'slate-subtle-text': '168 162 158',
    },
  },
  'cyber-slate': {
    name: 'Cyber Slate',
    type: 'dark',
    colors: {
      primary: '56 189 248', // Sky 400
      secondary: '45 212 191', // Teal 400
      accent: '14 165 233', // Sky 500
      error: '248 113 113',
      purple: '168 85 247',
      background: '15 23 42', // Slate 900
      surface: '30 41 59', // Slate 800
      'text-primary': '241 245 249', // Slate 100
      'text-secondary': '148 163 184', // Slate 400
      border: '51 65 85', // Slate 700
      'subtle-background': '51 65 85',
      'toggle-background': '71 85 105',

      'primary-subtle-background': '12 74 110', // Sky 900
      'primary-subtle-text': '186 230 253', // Sky 200
      'secondary-subtle-background': '19 78 74', // Teal 900
      'secondary-subtle-text': '153 242 230', // Teal 200
      'accent-subtle-background': '12 74 110',
      'accent-subtle-text': '186 230 253',
      'error-subtle-background': '69 10 10',
      'error-subtle-text': '252 165 165',
      'purple-subtle-background': '88 28 135',
      'purple-subtle-text': '233 213 255',
      'slate-subtle-background': '30 41 59',
      'slate-subtle-text': '148 163 184',
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
      // Try to load from local storage first, fallback to 'luxury-heritage'
      return typeof window !== 'undefined' ? localStorage.getItem('app-theme') || 'luxury-heritage' : 'luxury-heritage';
  });

  useEffect(() => {
    const selectedTheme = themes[theme] || themes['luxury-heritage'];
    if (selectedTheme) {
      const root = document.documentElement;
      // Add or remove 'dark' class for Tailwind dark mode if needed (optional)
      if (selectedTheme.type === 'dark') {
          root.classList.add('dark');
      } else {
          root.classList.remove('dark');
      }

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
