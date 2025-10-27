import React from 'react';
import ProfileCard from './ProfileCard';
import ThemeSelector from './ThemeSelector';
import NotificationSettings from './NotificationSettings';
import { ArrowLeftIcon } from '../icons/IconComponents';

interface SettingsPageProps {
  onClose: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onClose}
          className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <ProfileCard />
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <ThemeSelector />
          <NotificationSettings />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
