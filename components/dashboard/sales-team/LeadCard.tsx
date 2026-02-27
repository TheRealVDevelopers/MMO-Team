import React, { useMemo } from 'react';
import { Lead, LeadPipelineStatus } from '../../../types';
import ProgressBar from '../../shared/ProgressBar';
import { USERS } from '../../../constants';
import { FireIcon } from '../../icons/IconComponents';

interface LeadCardProps {
    lead: Lead;
    onClick: () => void;
}

const statusConfig: Record<LeadPipelineStatus, { color: string, progress: number, nextAction: string }> = {
    [LeadPipelineStatus.NEW_NOT_CONTACTED]: { color: 'bg-error', progress: 10, nextAction: 'Initial Contact' },
    [LeadPipelineStatus.CONTACTED_CALL_DONE]: { color: 'bg-accent', progress: 25, nextAction: 'Schedule Site Visit' },
    [LeadPipelineStatus.SITE_VISIT_SCHEDULED]: { color: 'bg-purple', progress: 40, nextAction: 'Await Visit Report' },
    [LeadPipelineStatus.SITE_VISIT_RESCHEDULED]: { color: 'bg-orange-500', progress: 40, nextAction: 'Await Visit Report' },
    [LeadPipelineStatus.WAITING_FOR_DRAWING]: { color: 'bg-slate-500', progress: 50, nextAction: 'Await Drawing' },
    [LeadPipelineStatus.DRAWING_IN_PROGRESS]: { color: 'bg-blue-500', progress: 55, nextAction: 'Upload Drawing' },
    [LeadPipelineStatus.DRAWING_REVISIONS]: { color: 'bg-yellow-500', progress: 55, nextAction: 'Address Revisions' },
    [LeadPipelineStatus.WAITING_FOR_QUOTATION]: { color: 'bg-slate-500', progress: 60, nextAction: 'Await Quotation' },
    [LeadPipelineStatus.QUOTATION_SENT]: { color: 'bg-primary', progress: 65, nextAction: 'Follow Up on Quote' },
    [LeadPipelineStatus.NEGOTIATION]: { color: 'bg-accent', progress: 80, nextAction: 'Finalize Deal' },
    [LeadPipelineStatus.IN_PROCUREMENT]: { color: 'bg-purple-500', progress: 90, nextAction: 'Monitor Procurement' },
    [LeadPipelineStatus.IN_EXECUTION]: { color: 'bg-purple-600', progress: 95, nextAction: 'Monitor Execution' },
    [LeadPipelineStatus.WON]: { color: 'bg-secondary', progress: 100, nextAction: 'Project Started' },
    [LeadPipelineStatus.LOST]: { color: 'bg-slate-400', progress: 0, nextAction: 'Archived' },
};


const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick }) => {
    const assignedUser = useMemo(() => USERS.find(u => u.id === lead.assignedTo), [lead.assignedTo]);
    const config = statusConfig[lead.status] || { color: 'bg-slate-400', progress: 0, nextAction: 'N/A' };

    return (
        <div onClick={onClick} className="bg-surface p-3 rounded-md border border-border space-y-3 cursor-pointer hover:shadow-lg hover:border-primary transition-all duration-200">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-text-primary truncate">{lead.projectName}</p>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded truncate ${lead.leadType === 'MFD' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                            {lead.leadType || 'SFD'}
                        </span>
                    </div>
                    <p className="text-xs text-text-secondary">{lead.clientName}</p>
                </div>
                {lead.priority === 'High' && <FireIcon className="text-error w-5 h-5 flex-shrink-0 ml-2" />}
            </div>

            <div>
                <div className="flex justify-between items-center text-xs text-text-secondary mb-1">
                    <span>{lead.status}</span>
                    <span>{config.progress}%</span>
                </div>
                <ProgressBar progress={config.progress} colorClass={config.color} />
            </div>

            <div className="flex justify-between items-center border-t border-border pt-2">
                <div className="text-xs">
                    <span className="text-text-secondary">Next Action: </span>
                    <span className="font-semibold text-primary">{config.nextAction}</span>
                </div>
                {assignedUser && (
                    <img
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-surface"
                        src={assignedUser.avatar}
                        alt={assignedUser.name}
                        title={`Assigned to ${assignedUser.name}`}
                    />
                )}
            </div>
        </div>
    );
};

export default LeadCard;
