
import React, { useMemo } from 'react';
import { SiteVisit } from '../../../types';
import VisitTaskCard from './VisitTaskCard';
import { ArrowLeftIcon } from '../../icons/IconComponents';

interface EngineerOverviewPageProps {
    visits: SiteVisit[];
    onSelectVisit: (visit: SiteVisit) => void;
    setCurrentPage: (page: string) => void;
}

const EngineerOverviewPage: React.FC<EngineerOverviewPageProps> = ({ visits, onSelectVisit, setCurrentPage }) => {
    
    const todaysVisits = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        return visits
            .filter(v => {
                const visitDate = new Date(v.date);
                return visitDate >= todayStart && visitDate <= todayEnd;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [visits]);

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4">
                <button onClick={() => setCurrentPage('dashboard')} className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <h2 className="text-2xl font-bold text-text-primary">Today's Schedule</h2>
            </div>

            {todaysVisits.length > 0 ? (
                 <div className="space-y-4">
                    {todaysVisits.map(visit => (
                        <VisitTaskCard 
                            key={visit.id} 
                            visit={visit} 
                            onSelect={() => onSelectVisit(visit)}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-20 bg-subtle-background rounded-lg">
                    <h3 className="text-lg font-bold text-text-primary">No visits scheduled for today.</h3>
                    <p className="mt-2 text-sm text-text-secondary">Your schedule is clear. Check back later for updates.</p>
                </div>
            )}
        </div>
    );
};

export default EngineerOverviewPage;