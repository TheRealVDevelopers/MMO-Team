
import React, { useState } from 'react';
import Modal from '../../shared/Modal';
import { Project, Document } from '../../../types';
import { USERS } from '../../../constants';
import ProgressBar from '../../shared/ProgressBar';
import { 
    ClockIcon, FireIcon, PaperClipIcon, PlusIcon, UsersIcon, MapPinIcon, 
    PhoneIcon, ListBulletIcon, CheckCircleIcon, ArrowUturnLeftIcon, 
    BuildingOfficeIcon, PaintBrushIcon 
} from '../../icons/IconComponents';

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-150 ${isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'}`}>
        {label}
    </button>
);

const InfoCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-subtle-background p-4 rounded-lg">
        <h4 className="font-bold text-text-primary mb-2 flex items-center text-sm"><span className="mr-2">{icon}</span>{title}</h4>
        <div className="text-xs text-text-secondary space-y-1">{children}</div>
    </div>
);

const Checklist: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
     <div>
        <h4 className="font-bold text-text-primary mb-2 text-sm">{title}</h4>
        <ul className="space-y-2">
            {items.map((item, index) => (
                <li key={item} className="flex items-center p-2 bg-subtle-background rounded-md">
                    <input id={`check-${title}-${index}`} type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-border bg-transparent rounded" /> 
                    <label htmlFor={`check-${title}-${index}`} className="ml-3 text-sm text-text-primary">{item}</label>
                </li>
            ))}
        </ul>
    </div>
);


const BriefTab: React.FC<{ project: Project }> = ({ project }) => {
    const salesperson = USERS.find(u => u.id === project.salespersonId);
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoCard title="Client Information" icon={<UsersIcon className="w-4 h-4" />}>
                <p><strong>Client:</strong> {project.clientName}</p>
                <p><strong>Contact:</strong> {project.clientContact.name}</p>
                <p><strong>Phone:</strong> {project.clientContact.phone}</p>
                <p><strong>Address:</strong> {project.clientAddress}</p>
            </InfoCard>
            <InfoCard title="Site Information" icon={<MapPinIcon className="w-4 h-4" />}>
                <p><strong>Project Type:</strong> Office</p>
                <p><strong>Status:</strong> Measurements complete</p>
                <p><strong>Limitations:</strong> One structural column in center.</p>
                <a href="#" className="text-primary font-semibold">View Site Report & Photos</a>
            </InfoCard>
            <InfoCard title="Sales Team Requirements" icon={<PaintBrushIcon className="w-4 h-4" />}>
                <p><strong>Budget:</strong> ~${project.budget.toLocaleString()}</p>
                <p><strong>Timeline:</strong> {project.deadline}</p>
                <p><strong>Key Request:</strong> Modern, open-plan layout.</p>
                <p><strong>Sales Contact:</strong> {salesperson?.name || 'N/A'}</p>
            </InfoCard>
            <div className="lg:col-span-3">
                 <Checklist title="Design Requirement Checklist" items={["Open-plan for 50 staff", "2 private meeting rooms", "Modern industrial style", "Include biophilic elements"]} />
            </div>
        </div>
    );
};

const WorkspaceTab: React.FC<{ project: Project }> = ({ project }) => {
    const designPhases = [
        { name: 'Concept Development', completed: true },
        { name: 'Detailed Design', completed: true },
        { name: '3D Visualization', completed: false },
        { name: 'Final Documentation', completed: false },
        { name: 'Client Review', completed: false },
    ];
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-bold text-text-primary mb-2 text-sm">Design Progress Tracker</h4>
                <ul className="space-y-3">
                    {designPhases.map(phase => (
                        <li key={phase.name} className="flex items-center">
                            <CheckCircleIcon className={`w-5 h-5 mr-3 ${phase.completed ? 'text-secondary' : 'text-border'}`} />
                            <span className={`text-sm ${phase.completed ? 'text-text-secondary line-through' : 'text-text-primary'}`}>{phase.name}</span>
                        </li>
                    ))}
                </ul>
                <div className="mt-4">
                     <button className="w-full text-sm font-medium bg-secondary text-white py-2 rounded-md hover:opacity-90">Mark Current Phase Complete</button>
                </div>
            </div>
             <div>
                <h4 className="font-bold text-text-primary mb-2 text-sm">File Management</h4>
                <div className="p-3 bg-subtle-background rounded-lg space-y-2">
                    {project.documents?.map(doc => (
                         <div key={doc.id} className="flex items-center justify-between p-2 bg-surface rounded-md border border-border">
                            <div>
                                <a href={doc.url} className="text-xs font-semibold text-primary hover:underline">{doc.name}</a>
                                <p className="text-xs text-text-secondary">Size: {doc.size}</p>
                            </div>
                            <span className="text-xs text-text-secondary">v1.0</span>
                         </div>
                    ))}
                </div>
                <button className="mt-2 w-full text-sm font-medium bg-primary/20 text-primary py-2 rounded-md hover:bg-primary/30">
                    <PlusIcon className="w-4 h-4 inline mr-1"/> Upload New Version
                </button>
            </div>
        </div>
    );
};

const CollaborationTab: React.FC<{ project: Project }> = ({ project }) => {
    return (
        <div className="flex flex-col h-full min-h-[40vh]">
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                {project.communication?.map(msg => (
                    <div key={msg.id} className="flex items-start space-x-2">
                        <img src={msg.avatar} alt={msg.user} className="w-8 h-8 rounded-full" />
                        <div className="flex-1 bg-subtle-background p-2 rounded-lg">
                            <p className="text-sm font-semibold">{msg.user}</p>
                            <p className="text-sm">{msg.message}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex items-center border-t border-border pt-4">
                <input type="text" placeholder="Type a message to the team..." className="w-full text-sm p-2 border border-border rounded-l-md bg-surface" />
                <button className="p-2 bg-primary text-white rounded-r-md"><ArrowUturnLeftIcon className="w-5 h-5 -rotate-90" /></button>
            </div>
        </div>
    );
};


const ProjectDetailModal: React.FC<{ project: Project; isOpen: boolean; onClose: () => void }> = ({ project, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('brief');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Workspace" size="4xl">
        <div className="space-y-4">
            {/* Header */}
            <div>
                 <h3 className="text-lg font-bold text-text-primary">{project.projectName}</h3>
                 <div className="flex items-center space-x-4 text-sm text-text-secondary mt-1">
                    <div className="flex items-center"><BuildingOfficeIcon className="w-4 h-4 mr-1"/> {project.clientName}</div>
                    {project.priority === 'High' && <div className="flex items-center text-error"><FireIcon className="w-4 h-4 mr-1"/> High Priority</div>}
                    <div className="flex items-center"><ClockIcon className="w-4 h-4 mr-1"/> Deadline: {project.deadline}</div>
                 </div>
                 <div className="mt-2">
                    <ProgressBar progress={project.progress} />
                 </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-border">
                <nav className="-mb-px flex space-x-4">
                    <TabButton label="Project Brief" isActive={activeTab === 'brief'} onClick={() => setActiveTab('brief')} />
                    <TabButton label="Design Workspace" isActive={activeTab === 'workspace'} onClick={() => setActiveTab('workspace')} />
                    <TabButton label="Collaboration" isActive={activeTab === 'collaboration'} onClick={() => setActiveTab('collaboration')} />
                </nav>
            </div>

            {/* Tab Content */}
            <div className="pt-4">
                {activeTab === 'brief' && <BriefTab project={project} />}
                {activeTab === 'workspace' && <WorkspaceTab project={project} />}
                {activeTab === 'collaboration' && <CollaborationTab project={project} />}
            </div>
        </div>
    </Modal>
  );
};

export default ProjectDetailModal;