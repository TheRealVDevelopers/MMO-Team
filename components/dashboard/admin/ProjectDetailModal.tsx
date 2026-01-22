import React from 'react';
import { XMarkIcon, CalendarIcon, UserGroupIcon, MapPinIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { Project, ProjectStatus, User } from '../../../types';
import { formatCurrencyINR, formatDate } from '../../../constants';
import { USERS } from '../../../constants'; // MOCK DATA for user lookup

interface ProjectDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ isOpen, onClose, project }) => {
    if (!isOpen || !project) return null;

    // Helper to get user name
    const getUserName = (id?: string) => USERS.find(u => u.id === id)?.name || 'Unassigned';

    // Helper to process assigned team for display
    const getAssignedTeamList = () => {
        const team: { role: string; name: string; id: string }[] = [];
        if (project.assignedTeam) {
            if (project.assignedTeam.drawing) team.push({ role: 'Drawing', name: getUserName(project.assignedTeam.drawing), id: project.assignedTeam.drawing });
            if (project.assignedTeam.quotation) team.push({ role: 'Quotation', name: getUserName(project.assignedTeam.quotation), id: project.assignedTeam.quotation });
            if (project.assignedTeam.site_engineer) team.push({ role: 'Site Engineer', name: getUserName(project.assignedTeam.site_engineer), id: project.assignedTeam.site_engineer });
            // Handle execution array if needed, skipping for simple display
        }
        return team;
    };

    const teamMembers = getAssignedTeamList();

    return (
        <div className="fixed inset-0 z-[1000] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 z-[1000] transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>

                <div className="inline-block align-middle bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl w-full relative z-[1010] p-6">
                    <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
                        <div>
                            <h3 className="text-2xl font-serif font-bold text-text-primary">
                                {project.projectName}
                            </h3>
                            <p className="text-text-secondary mt-1">{project.clientName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-subtle-background transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6 text-text-tertiary" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Column 1: Core Details */}
                        <div className="space-y-6">
                            <div className="bg-subtle-background rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-text-secondary">
                                    <MapPinIcon className="w-5 h-5 flex-shrink-0" />
                                    <span className="truncate">{project.clientAddress || 'Location not set'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-text-secondary">
                                    <BanknotesIcon className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-bold text-text-primary">{formatCurrencyINR(project.budget)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-text-secondary">
                                    <CalendarIcon className="w-5 h-5 flex-shrink-0" />
                                    <span>Started: {formatDate(project.startDate)}</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-text-tertiary mb-3">Project Status</h4>
                                <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase ${project.status === ProjectStatus.IN_EXECUTION ? 'bg-blue-100 text-blue-700' :
                                    project.status === ProjectStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>
                        </div>

                        {/* Column 2: Team Assignment */}
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-text-tertiary mb-4 flex items-center gap-2">
                                <UserGroupIcon className="w-4 h-4" />
                                Assigned Team
                            </h4>
                            <div className="space-y-4">
                                {teamMembers.map((member) => (
                                    <div key={member.role} className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
                                        <div>
                                            <p className="text-xs text-text-tertiary uppercase font-bold">{member.role}</p>
                                            <p className="font-medium text-text-primary capitalize">{member.name}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-black">
                                            {member.name.charAt(0)}
                                        </div>
                                    </div>
                                ))}
                                {teamMembers.length === 0 && (
                                    <p className="text-sm text-text-secondary italic">No team members assigned.</p>
                                )}
                            </div>
                        </div>

                        {/* Column 3: Timeline & Milestones (Mocked for now) */}
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-text-tertiary mb-4">Project Timeline</h4>
                            <div className="relative border-l-2 border-border pl-4 space-y-6">
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                                    <p className="text-sm font-bold text-text-primary">Project Initiated</p>
                                    <p className="text-xs text-text-secondary">
                                        {formatDate(project.startDate)}
                                    </p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-white animate-pulse"></div>
                                    <p className="text-sm font-bold text-text-primary">Current Phase</p>
                                    <p className="text-xs text-text-secondary">Execution in progress</p>
                                </div>
                                {project.deadline && (
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-border border-2 border-white"></div>
                                        <p className="text-sm font-bold text-text-primary">Target Completion</p>
                                        <p className="text-xs text-text-secondary">{project.deadline}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-text-secondary hover:text-text-primary hover:bg-subtle-background rounded-lg transition-colors"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailModal;
