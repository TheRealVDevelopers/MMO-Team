
import React from 'react';
import Card from '../shared/Card';
import { ArrowLeftIcon, WrenchScrewdriverIcon } from '../icons/IconComponents';

interface PlaceholderDashboardProps {
  role: string;
  message?: string;
  subMessage?: string;
  setCurrentPage?: (page: string) => void;
}

const PlaceholderDashboard: React.FC<PlaceholderDashboardProps> = ({ role, message, subMessage, setCurrentPage }) => {
  return (
    <Card className="relative h-full">
      {setCurrentPage && (
        <div className="absolute top-6 left-6">
            <button onClick={() => setCurrentPage('overview')} className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back</span>
            </button>
        </div>
      )}
      <div className="text-center py-12 h-full flex flex-col justify-center items-center">
        <WrenchScrewdriverIcon className="w-12 h-12 text-text-secondary/50 mb-4" />
        <h2 className="text-2xl font-bold text-text-primary">{role}</h2>
        <p className="mt-2 text-slate-500 max-w-md mx-auto">{message || 'This dashboard is currently under construction.'}</p>
        <p className="mt-1 text-sm text-slate-400">{subMessage || 'Check back soon for updates!'}</p>
      </div>
    </Card>
  );
};

export default PlaceholderDashboard;
