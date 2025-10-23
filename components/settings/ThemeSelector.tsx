import React from 'react';
import Card from '../shared/Card';
import { useTheme, themes } from '../../context/ThemeContext';
import { CheckCircleIcon, PaintBrushIcon } from '../icons/IconComponents';

const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <h2 className="text-lg font-bold text-text-primary flex items-center">
        <PaintBrushIcon className="w-6 h-6 mr-2" />
        Appearance
      </h2>
      <p className="text-sm text-text-secondary mt-1">Choose a theme to personalize your experience.</p>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(themes).map(([key, themeOption]) => (
          <div key={key} onClick={() => setTheme(key)} className="cursor-pointer">
            <div className={`relative border-2 rounded-lg p-2 ${theme === key ? 'border-primary' : 'border-transparent'}`}>
              <div className="h-16 w-full rounded-md flex overflow-hidden">
                <div style={{ background: `rgb(${themeOption.colors.background})`}} className="w-1/3 h-full"></div>
                <div style={{ background: `rgb(${themeOption.colors.surface})`}} className="w-2/3 h-full p-2 flex flex-col justify-between">
                    <div style={{ background: `rgb(${themeOption.colors.primary})`}} className="h-2 w-3/4 rounded-sm"></div>
                     <div style={{ background: `rgb(${themeOption.colors.secondary})`}} className="h-2 w-1/2 rounded-sm self-end"></div>
                </div>
              </div>
              {theme === key && (
                <CheckCircleIcon className="w-6 h-6 text-primary absolute -top-2 -right-2 bg-surface rounded-full" />
              )}
            </div>
            <p className="text-center text-sm font-medium mt-2 text-text-primary">{themeOption.name}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ThemeSelector;
