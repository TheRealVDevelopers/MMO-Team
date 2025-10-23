
import React from 'react';
import Card from '../shared/Card';
import { BellIcon } from '../icons/IconComponents';

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onToggle: () => void; }> = ({ label, enabled, onToggle }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <button
            type="button"
            className={`${
                enabled ? 'bg-primary' : 'bg-toggle-background'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
            role="switch"
            aria-checked={enabled}
            onClick={onToggle}
        >
            <span
                aria-hidden="true"
                className={`${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    </div>
)


const NotificationSettings: React.FC = () => {
    const [notifications, setNotifications] = React.useState({
        newLead: true,
        milestoneDue: true,
        dailySummary: false,
    });

    const handleToggle = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    }

  return (
    <Card>
      <h2 className="text-lg font-bold text-text-primary flex items-center">
        <BellIcon className="w-6 h-6 mr-2" />
        Notifications
      </h2>
      <p className="text-sm text-text-secondary mt-1">Control how you receive important updates.</p>
      <div className="mt-4 space-y-4">
        <ToggleSwitch label="New lead assigned" enabled={notifications.newLead} onToggle={() => handleToggle('newLead')} />
        <ToggleSwitch label="Project milestone is due" enabled={notifications.milestoneDue} onToggle={() => handleToggle('milestoneDue')} />
        <ToggleSwitch label="Daily summary email" enabled={notifications.dailySummary} onToggle={() => handleToggle('dailySummary')} />
      </div>
    </Card>
  );
};

export default NotificationSettings;