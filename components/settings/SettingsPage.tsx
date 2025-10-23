import React from 'react';
import ProfileCard from './ProfileCard';
import ThemeSelector from './ThemeSelector';
import NotificationSettings from './NotificationSettings';

const SettingsPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Settings</h1>
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