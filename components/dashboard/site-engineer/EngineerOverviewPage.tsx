import React from 'react';
import Card from '../../shared/Card';
import { useAuth } from '../../../context/AuthContext';
import { SITE_VISITS } from '../../../constants';
import { SiteVisit, SiteVisitStatus } from '../../../types';
import { MapPinIcon, ClipboardDocumentCheckIcon, ClockIcon } from '../../icons/IconComponents';
import StatusPill from '../../shared/StatusPill';

const KpiCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
    <Card>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
    </Card>
);

const EngineerOverviewPage: React.FC<{ onVisitSelect: (visit: SiteVisit) => void }> = ({ onVisitSelect }) => {
    const { currentUser } = useAuth();
    if (!currentUser) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todaysVisits = SITE_VISITS.filter(v => v.date >= today && v.date < tomorrow);
    const pendingReports = SITE_VISITS.filter(v => v.status === SiteVisitStatus.COMPLETED).length;

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-text-primary">Site Engineer Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Today's Visits" value={todaysVisits.length.toString()} />
                <KpiCard title="Upcoming Visits" value={SITE_VISITS.filter(v => v.date >= tomorrow).length.toString()} />
                <KpiCard title="Pending Reports" value={pendingReports.toString()} />
                <KpiCard title="Reports Submitted" value={SITE_VISITS.filter(v => v.status === SiteVisitStatus.REPORT_SUBMITTED).length.toString()} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-bold">Today's Schedule</h3>
                        <div className="mt-4 flow-root">
                            {todaysVisits.length > 0 ? (
                                <ul role="list" className="-my-4 divide-y divide-border">
                                    {todaysVisits.map((visit) => (
                                        <li key={visit.id} onClick={() => onVisitSelect(visit)} className="flex items-center justify-between py-4 space-x-3 cursor-pointer hover:bg-subtle-background px-2 -mx-2 rounded-md">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-text-primary truncate">{visit.projectName}</p>
                                                <p className="text-sm text-text-secondary truncate">{visit.clientName}</p>
                                            </div>
                                            <div className="flex-shrink-0 font-bold text-primary flex items-center">
                                                <ClockIcon className="w-4 h-4 mr-1.5" />
                                                {visit.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center py-8 text-text-secondary">No visits scheduled for today.</p>
                            )}
                        </div>
                    </Card>
                </div>
                 <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h3 className="text-lg font-bold flex items-center"><MapPinIcon className="w-5 h-5 mr-2 text-primary" /> Site Locations</h3>
                        <div className="mt-4 h-48 bg-subtle-background rounded-md flex items-center justify-center">
                            <p className="text-text-secondary">Map Placeholder</p>
                        </div>
                    </Card>
                     <Card>
                        <h3 className="text-lg font-bold flex items-center"><ClipboardDocumentCheckIcon className="w-5 h-5 mr-2" /> My Tasks</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li className="p-2 bg-subtle-background rounded-md">Upload report for "Pantry Renovation"</li>
                             <li className="p-2 bg-subtle-background rounded-md">Verify measurements for "HQ Remodel"</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EngineerOverviewPage;