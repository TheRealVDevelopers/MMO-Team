import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { User, UserRole, LeadPipelineStatus, ActivityStatus } from '../../../types';
import { ACTIVITIES, LEADS, PROJECTS, ATTENDANCE_DATA, formatCurrencyINR, formatDateTime } from '../../../constants';
import { ChartBarSquareIcon, CheckCircleIcon, DocumentCheckIcon, FunnelIcon, UserCircleIcon, CalendarDaysIcon, PhoneIcon, ArrowDownIcon, ArrowUpIcon, ClockIcon } from '../../icons/IconComponents';
import AttendanceCalendar from './AttendanceCalendar';

const TabButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 ${
            isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-subtle-background p-3 rounded-lg flex items-start space-x-3">
        <div className="flex-shrink-0 text-primary">{icon}</div>
        <div>
            <p className="text-sm text-text-secondary">{title}</p>
            <p className="text-xl font-bold text-text-primary">{value}</p>
        </div>
    </div>
);


const TeamMemberDetailView: React.FC<{ user: User }> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'attendance'>('overview');

    const userActivities = useMemo(() => 
        ACTIVITIES.filter(a => a.userId === user.id).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [user.id]);

    const userKPIs = useMemo(() => {
        if (user.role === UserRole.SALES_TEAM_MEMBER) {
            const memberLeads = LEADS.filter(l => l.assignedTo === user.id);
            const wonLeads = memberLeads.filter(l => l.status === LeadPipelineStatus.WON).length;
            const conversionRate = memberLeads.length > 0 ? (wonLeads / memberLeads.length) * 100 : 0;
            const revenue = memberLeads.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + l.value, 0);
            return [
                { title: 'Leads Assigned', value: memberLeads.length, icon: <FunnelIcon className="w-6 h-6" /> },
                { title: 'Conversion Rate', value: `${conversionRate.toFixed(1)}%`, icon: <ChartBarSquareIcon className="w-6 h-6" /> },
                { title: 'Revenue Generated', value: formatCurrencyINR(revenue), icon: <ArrowUpIcon className="w-6 h-6 text-secondary"/> },
            ];
        }
        if (user.role === UserRole.DRAWING_TEAM) {
             const memberProjects = PROJECTS.filter(p => p.assignedTeam.drawing === user.id);
             const completed = memberProjects.filter(p => p.status === 'Completed').length;
             return [
                { title: 'Projects Assigned', value: memberProjects.length, icon: <DocumentCheckIcon className="w-6 h-6" /> },
                { title: 'Designs Completed', value: completed, icon: <CheckCircleIcon className="w-6 h-6 text-secondary" /> },
                { title: 'Avg. Turnaround', value: '3.5 Days', icon: <ClockIcon className="w-6 h-6" /> },
             ];
        }
        return [];
    }, [user.id, user.role]);

    const attendanceForMonth = ATTENDANCE_DATA[user.id] || [];

    return (
        <Card className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start space-x-4 pb-4">
                <img className="w-16 h-16 rounded-full" src={user.avatar} alt={user.name} />
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-text-primary">{user.name}</h3>
                    <p className="text-sm text-text-secondary">{user.role}</p>
                    <div className="text-xs text-text-secondary mt-1 flex items-center space-x-2">
                         <PhoneIcon className="w-3 h-3"/>
                         <span>{user.phone}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
                <nav className="-mb-px flex space-x-4">
                    <TabButton label="Overview" icon={<UserCircleIcon className="w-5 h-5"/>} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <TabButton label="Work History" icon={<ClockIcon className="w-5 h-5"/>} isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                    <TabButton label="Attendance" icon={<CalendarDaysIcon className="w-5 h-5"/>} isActive={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
                </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-grow overflow-y-auto pt-4 -mr-4 pr-4">
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <h4 className="font-bold text-text-primary">Key Performance Indicators</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {userKPIs.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
                        </div>
                         <h4 className="font-bold text-text-primary pt-2">Current Task</h4>
                        <div className="p-3 bg-subtle-background rounded-lg">
                            <p className="text-sm italic">"{user.currentTask}"</p>
                        </div>
                    </div>
                )}
                {activeTab === 'history' && (
                    <div className="flow-root">
                        <ul role="list" className="-mb-8">
                           {userActivities.map((activity, idx) => (
                             <li key={activity.id}>
                               <div className="relative pb-8">
                                 {idx !== userActivities.length - 1 ? <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" /> : null}
                                 <div className="relative flex space-x-3">
                                   <div>
                                     <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-surface ${activity.status === ActivityStatus.DONE ? 'bg-secondary-subtle-background' : 'bg-accent-subtle-background'}`}>
                                       <CheckCircleIcon className={`h-5 w-5 ${activity.status === ActivityStatus.DONE ? 'text-secondary' : 'text-accent'}`} aria-hidden="true" />
                                     </span>
                                   </div>
                                   <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                     <div>
                                       <p className="text-sm text-text-primary">{activity.description}</p>
                                     </div>
                                     <div className="whitespace-nowrap text-right text-sm text-text-secondary">
                                        {formatDateTime(activity.timestamp)}
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             </li>
                           ))}
                        </ul>
                    </div>
                )}
                {activeTab === 'attendance' && (
                    <AttendanceCalendar attendanceData={attendanceForMonth} />
                )}
            </div>
        </Card>
    );
};

export default TeamMemberDetailView;