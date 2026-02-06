
import React from 'react';
import SiteEngineerProjectBoard from './site-engineer/SiteEngineerProjectBoard';

const SiteEngineerDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = () => {
  // We ignore currentPage as we are unifying the view into a single board
  return (
    <>
      <SiteEngineerProjectBoard />
    </>
  );
};

export default SiteEngineerDashboard;
