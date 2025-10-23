import React from 'react';
import { Project } from '../../../types';
import { PaperClipIcon } from '../../icons/IconComponents';

const ProjectCard: React.FC<{ project: Project, isSelected: boolean, onClick: () => void }> = ({ project, isSelected, onClick }) => {
    
    const getStatusColor = () => {
        const today = new Date();
        const endDate = new Date(project.endDate);
        const daysRemaining = (endDate.getTime() - today.getTime()) / (1000 * 3600 * 24);

        if (daysRemaining < 0) return 'bg-error'; // Overdue
        if (daysRemaining < 7) return 'bg-accent'; // Nearing deadline
        return 'bg-secondary'; // On track
    };
    
    return (
    <div 
        onClick={onClick}
        className={`bg-surface p-3 rounded-md border space-y-3 cursor-pointer transition-all duration-200 ${isSelected ? 'border-primary shadow-lg' : 'border-border hover:border-gray-300'}`}
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-bold text-text-primary">{project.projectName}</p>
                <p className="text-xs text-text-secondary">{project.clientName}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-text-secondary">
            <span>Progress: {project.progress}%</span>
            <span>Due: {new Date(project.endDate).toLocaleDateString()}</span>
        </div>

        <div className="flex justify-between items-center border-t border-border pt-2">
            <div className="flex items-center space-x-1">
                <PaperClipIcon className="w-4 h-4 text-text-secondary" />
                <span className="text-xs text-text-secondary">3</span>
            </div>
            <div className="flex -space-x-2">
                <img className="inline-block h-6 w-6 rounded-full ring-2 ring-surface" src="https://i.pravatar.cc/150?u=user-8" alt="Chris"/>
                <img className="inline-block h-6 w-6 rounded-full ring-2 ring-surface" src="https://i.pravatar.cc/150?u=teammate-1" alt="Teammate 1"/>
            </div>
        </div>
    </div>
)};

export default ProjectCard;
