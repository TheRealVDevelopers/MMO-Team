import React, { useState } from 'react';
import { Project, ChecklistItem, Issue } from '../../../types';
import { ListBulletIcon, ExclamationCircleIcon, ChatBubbleOvalLeftEllipsisIcon, ArrowUturnLeftIcon } from '../../icons/IconComponents';

const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center p-2 text-xs font-medium border-b-2 transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
        {icon}
        <span className="mt-1">{label}</span>
    </button>
);

const Checklist: React.FC<{ title: string, items: ChecklistItem[] }> = ({ title, items }) => (
    <div>
        <h4 className="font-bold text-sm mb-2">{title}</h4>
        <ul className="space-y-2">
            {items.map(item => (
                <li key={item.id} className="flex items-center p-2 bg-subtle-background rounded-md">
                    <input id={item.id} type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-border rounded" defaultChecked={item.completed} />
                    <label htmlFor={item.id} className={`ml-3 text-sm text-text-primary ${item.completed ? 'line-through text-text-secondary' : ''}`}>{item.text}</label>
                </li>
            ))}
        </ul>
    </div>
);

const IssueItem: React.FC<{ issue: Issue }> = ({ issue }) => (
    <div className="p-2 border-l-4 rounded-r-md bg-subtle-background" style={{ borderLeftColor: issue.priority === 'High' ? 'var(--color-error)' : issue.priority === 'Medium' ? 'var(--color-accent)' : 'var(--color-border)' }}>
        <p className="text-sm font-medium">{issue.title}</p>
        <p className="text-xs text-text-secondary">{issue.status} - Reported by {issue.reportedBy}</p>
    </div>
)

const ProjectDetailPane: React.FC<{ project: Project }> = ({ project }) => {
    const [activeTab, setActiveTab] = useState<'tasks' | 'issues' | 'chat'>('tasks');

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
                <h3 className="font-bold text-lg text-text-primary">{project.projectName}</h3>
                <p className="text-sm text-text-secondary">{project.clientName}</p>
            </div>

            <div className="flex border-b border-border">
                <TabButton icon={<ListBulletIcon />} label="Tasks" isActive={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
                <TabButton icon={<ExclamationCircleIcon />} label="Issues" isActive={activeTab === 'issues'} onClick={() => setActiveTab('issues')} />
                <TabButton icon={<ChatBubbleOvalLeftEllipsisIcon />} label="Chat" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === 'tasks' && (
                    <div className="space-y-6">
                        <Checklist title="Daily Tasks" items={project.checklists?.daily || []} />
                        <Checklist title="Quality Control Checklist" items={project.checklists?.quality || []} />
                    </div>
                )}
                {activeTab === 'issues' && (
                    <div className="space-y-3">
                        {project.issues?.length ? project.issues.map(issue => <IssueItem key={issue.id} issue={issue} />) : <p className="text-sm text-text-secondary text-center py-4">No issues reported.</p>}
                    </div>
                )}
                {activeTab === 'chat' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-4">
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
                        <div className="mt-4 flex items-center">
                            <input type="text" placeholder="Type a message..." className="w-full text-sm p-2 border border-border rounded-l-md bg-surface" />
                            <button className="p-2 bg-primary text-white rounded-r-md"><ArrowUturnLeftIcon className="w-5 h-5 -rotate-90" /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectDetailPane;
