
import React, { useMemo } from 'react';
import Card from '../../shared/Card';
import { useAuth } from '../../../context/AuthContext';
import { SiteVisit, SiteVisitStatus } from '../../../types';
import { formatDateTime } from '../../../constants';
import { CalendarDaysIcon, DocumentCheckIcon, ClockIcon, FireIcon, ChevronRightIcon } from '../../icons/IconComponents';

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card>
        <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-subtle-background text-primary">{icon}</div>
            <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">{title}</p>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
            </div>
        </div>
    </Card>
);

interface SiteEngineerKPIPageProps {
    visits: SiteVisit[];
    setCurrentPage: (page: string) => void;
}

const SiteEngineerKPIPage: React.FC<SiteEngineerKPIPageProps> = ({ visits, setCurrentPage }) => {
    const { currentUser } = useAuth();

    const { visitsToday, pendingReports, urgentVisits } = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todays = visits.filter(v => {
            const visitDate = new Date(v.date);
            return visitDate >= todayStart && visitDate <= todayEnd;
        });
        
        const pending = visits.filter(v => v.status === SiteVisitStatus.COMPLETED).length;
        const urgent = todays.filter(v => v.priority === 'High');

        return { visitsToday: todays.length, pendingReports: pending, urgentVisits: urgent };
    }, [visits]);

    if (!currentUser) return null;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Welcome back, {currentUser.name.split(' ')[0]}!</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <KpiCard title="Visits Today" value={visitsToday} icon={<CalendarDaysIcon />} />
                <KpiCard title="Pending Reports" value={pendingReports} icon={<DocumentCheckIcon />} />
                <KpiCard title="Avg. Visit Time" value="1.2 Hrs" icon={<ClockIcon className="w-6 h-6"/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Urgent Visits Today</h3>
                            <button onClick={() => setCurrentPage('schedule')} className="text-sm font-semibold text-primary hover:underline">View Full Schedule</button>
                        </div>
                        {urgentVisits.length > 0 ? (
                            <ul className="mt-4 space-y-3">
                                {urgentVisits.map(visit => (
                                    <li key={visit.id} className="flex items-center justify-between p-2 bg-subtle-background rounded-md">
                                        <div>
                                            <p className="font-semibold">{visit.projectName}</p>
                                            <p className="text-xs text-text-secondary">{formatDateTime(visit.date)}</p>
                                        </div>
                                        <FireIcon className="w-5 h-5 text-error" />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-text-secondary">No high-priority visits scheduled for today.</p>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-bold">Quick Actions</h3>
                        <div className="mt-4 space-y-2">
                           <button onClick={() => setCurrentPage('schedule')} className="w-full flex justify-between items-center p-3 bg-subtle-background hover:bg-border rounded-md">
                                <span className="font-medium">View Today's Schedule</span>
                                <ChevronRightIcon />
                           </button>
                           <button onClick={() => setCurrentPage('expenses')} className="w-full flex justify-between items-center p-3 bg-subtle-background hover:bg-border rounded-md">
                                <span className="font-medium">My Expense Claims</span>
                                <ChevronRightIcon />
                           </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SiteEngineerKPIPage;