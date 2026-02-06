import React from 'react';
import SiteEngineerProjectBoard from '../site-engineer/SiteEngineerProjectBoard';

// Wrapper to replace the old ProjectsWorkflowPage with the new SiteEngineerProjectBoard
const ProjectsWorkflowPage: React.FC<any> = (props) => {
    return <SiteEngineerProjectBoard />;
};

export default ProjectsWorkflowPage;
