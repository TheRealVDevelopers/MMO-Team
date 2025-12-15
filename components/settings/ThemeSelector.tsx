
import React from 'react';
import Card from '../shared/Card';
import { useTheme, themes } from '../../context/ThemeContext';
import { CheckCircleIcon, PaintBrushIcon, MoonIcon, SunIcon } from '../icons/IconComponents';

const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <h2 className="text-lg font-bold text-text-primary flex items-center">
        <PaintBrushIcon className="w-6 h-6 mr-2" />
        Appearance
      </h2>
      <p className="text-sm text-text-secondary mt-1">Choose a theme to personalize your experience.</p>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(themes).map(([key, themeOption]) => (
          <div 
            key={key} 
            onClick={() => setTheme(key)} 
            className="cursor-pointer group"
          >
            <div className={`relative border-2 rounded-lg p-2 transition-all duration-200 ${theme === key ? 'border-primary ring-2 ring-primary/20' : 'border-border group-hover:border-primary/50'}`}>
              <div className="h-20 w-full rounded-md flex overflow-hidden shadow-sm">
                {/* Background Preview */}
                <div style={{ background: `rgb(${themeOption.colors.background})`}} className="w-1/3 h-full flex items-end justify-center pb-2">
                    {themeOption.type === 'dark' ? <MoonIcon className="w-4 h-4 text-text-secondary opacity-50" /> : <SunIcon className="w-4 h-4 text-text-secondary opacity-50" />}
                </div>
                {/* Surface Preview */}
                <div style={{ background: `rgb(${themeOption.colors.surface})`}} className="w-2/3 h-full p-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                        <div style={{ background: `rgb(${themeOption.colors.primary})`}} className="h-2 w-3/4 rounded-sm"></div>
                        <div style={{ background: `rgb(${themeOption.colors['text-secondary']})`}} className="h-1.5 w-1/2 rounded-sm opacity-50"></div>
                    </div>
                     <div style={{ background: `rgb(${themeOption.colors.secondary})`}} className="h-2 w-1/3 rounded-sm self-end"></div>
                </div>
              </div>
              {theme === key && (
                <div className="absolute -top-2 -right-2 bg-surface rounded-full shadow-md">
                    <CheckCircleIcon className="w-6 h-6 text-primary" />
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
                <p className={`text-sm font-bold ${theme === key ? 'text-primary' : 'text-text-primary'}`}>{themeOption.name}</p>
                <p className="text-xs text-text-secondary capitalize">{themeOption.type} Theme</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ThemeSelector;
