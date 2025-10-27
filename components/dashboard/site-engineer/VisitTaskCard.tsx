
import React from 'react';
import Card from '../../shared/Card';
import { SiteVisit, SiteVisitStatus } from '../../../types';
import { MapPinIcon, ClockIcon, FireIcon } from '../../icons/IconComponents';
import { formatDateTime } from '../../../constants';
import StatusPill from '../../shared/StatusPill';

interface VisitTaskCardProps {
    visit: SiteVisit;
    onSelect: () => void;
}

const VisitTaskCard: React.FC<VisitTaskCardProps> = ({ visit, onSelect }) => {
    
    const getStatusInfo = (): { pillColor: 'blue' | 'amber' | 'green' | 'slate' | 'purple', text: string } => {
        switch (visit.status) {
            case SiteVisitStatus.SCHEDULED: return { pillColor: 'blue', text: 'Scheduled' };
            case SiteVisitStatus.TRAVELING: return { pillColor: 'amber', text: 'Traveling' };
            case SiteVisitStatus.ON_SITE: return { pillColor: 'amber', text: 'On Site' };
            case SiteVisitStatus.COMPLETED: return { pillColor: 'purple', text: 'Completed' };
            case SiteVisitStatus.REPORT_SUBMITTED: return { pillColor: 'green', text: 'Report Submitted' };
            default: return { pillColor: 'slate', text: 'Unknown' };
        }
    }
    
    const { pillColor, text } = getStatusInfo();

    return (
        <Card onClick={onSelect} className="cursor-pointer hover:shadow-lg hover:border-primary transition-all border border-transparent">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-text-primary">{visit.projectName}</h3>
                            <p className="text-sm text-text-secondary">{visit.clientName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             {visit.priority === 'High' && <FireIcon className="w-5 h-5 text-error" />}
                            <StatusPill color={pillColor}>{text}</StatusPill>
                        </div>
                    </div>
                    <div className="text-sm text-text-secondary space-y-1 border-t border-border pt-2">
                        <p className="flex items-center"><ClockIcon className="w-4 h-4 mr-2" />{formatDateTime(visit.date)}</p>
                        <p className="flex items-center"><MapPinIcon className="w-4 h-4 mr-2" />{visit.siteAddress || 'Address not specified'}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default VisitTaskCard;