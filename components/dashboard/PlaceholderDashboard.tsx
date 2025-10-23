
import React from 'react';
import Card from '../shared/Card';

interface PlaceholderDashboardProps {
  role: string;
}

const PlaceholderDashboard: React.FC<PlaceholderDashboardProps> = ({ role }) => {
  return (
    <Card>
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-text-primary">{role} Dashboard</h2>
        <p className="mt-2 text-slate-500">This dashboard is currently under construction.</p>
        <p className="mt-1 text-sm text-slate-400">Check back soon for updates!</p>
      </div>
    </Card>
  );
};

export default PlaceholderDashboard;
