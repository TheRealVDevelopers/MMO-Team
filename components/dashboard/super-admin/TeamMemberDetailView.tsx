import React, { useState, useMemo } from 'react';
import { User, UserRole, LeadPipelineStatus, ActivityStatus } from '../../../types';
import { ACTIVITIES, LEADS, PROJECTS, ATTENDANCE_DATA, formatCurrencyINR, formatDateTime } from '../../../constants';
import {
    PresentationChartBarIcon,
    CheckCircleIcon,
    DocumentCheckIcon,
    FunnelIcon,
    UserCircleIcon,
    CalendarIcon,
    PhoneIcon,
    ArrowTrendingUpIcon,
    ClockIcon,
    BriefcaseIcon
} from '@heroicons/react/24/outline';
import AttendanceCalendar from './AttendanceCalendar';
import { ContentCard, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';

const TabButton: React.FC<{
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative",
            isActive
                ? "text-primary"
                : "text-text-tertiary hover:text-text-primary"
        )}
    >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        {isActive && (
            <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
        )}
    </button>
);

const UserMetric: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-subtle-background p-4 rounded-2xl border border-border/40 group hover:border-primary/20 transition-all">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">{title}</p>
        </div>
        <p className="text-xl font-serif font-black text-text-primary tracking-tight">{value}</p>
    </div>
);


const TeamMemberDetailView: React.FC<{ user: User }> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'attendance'>('overview');

    const userActivities = useMemo(() =>
        ACTIVITIES.filter(a => a.userId === user.id).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        [user.id]);

    const userKPIs = useMemo(() => {
        if (user.role === UserRole.SALES_TEAM_MEMBER) {
            const memberLeads = LEADS.filter(l => l.assignedTo === user.id);
            const wonLeads = memberLeads.filter(l => l.status === LeadPipelineStatus.WON).length;
            const conversionRate = memberLeads.length > 0 ? (wonLeads / memberLeads.length) * 100 : 0;
            const revenue = memberLeads.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + l.value, 0);
            return [
                { title: 'Leads Pipeline', value: memberLeads.length, icon: FunnelIcon },
                { title: 'Yield Rate', value: `${conversionRate.toFixed(1)}%`, icon: PresentationChartBarIcon },
                { title: 'Revenue Flow', value: formatCurrencyINR(revenue), icon: ArrowTrendingUpIcon },
            ];
        }
        if (user.role === UserRole.DRAWING_TEAM) {
            const memberProjects = PROJECTS.filter(p => p.assignedTeam.drawing === user.id);
            const completed = memberProjects.filter(p => p.status === ProjectStatus.COMPLETED).length;
            return [
                { title: 'Project Load', value: memberProjects.length, icon: DocumentCheckIcon },
                { title: 'Design Release', value: completed, icon: CheckCircleIcon },
                { title: 'Velocity', value: '3.5 Days', icon: ClockIcon },
            ];
        }
        return [];
    }, [user.id, user.role]);

    const attendanceForMonth = ATTENDANCE_DATA[user.id] || [];

    return (
        <ContentCard className="h-full flex flex-col !p-0 overflow-hidden">
            {/* Header */}
            <div className="p-8 pb-6 border-b border-border/40 bg-subtle-background/30">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <img className="w-20 h-20 rounded-3xl object-cover ring-4 ring-surface" src={user.avatar} alt={user.name} />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-secondary flex items-center justify-center text-white border-2 border-surface">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-2xl font-serif font-black text-text-primary tracking-tight">{user.name}</h3>
                            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                {user.role}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-text-tertiary">
                                <PhoneIcon className="w-3.5 h-3.5" />
                                <span className="text-xs font-semibold">{user.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-text-tertiary">
                                <ClockIcon className="w-3.5 h-3.5" />
                                <span className="text-xs font-semibold italic">Active profile</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-surface border-b border-border/40 px-4">
                <nav className="flex space-x-2">
                    <TabButton label="Tactical View" icon={UserCircleIcon} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <TabButton label="Deployment History" icon={ClockIcon} isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                    <TabButton label="Attendance" icon={CalendarIcon} isActive={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
                </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <BriefcaseIcon className="w-4 h-4 text-primary" />
                                    <h4 className="text-sm font-black uppercase tracking-widest text-text-primary">Performance Vectors</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {userKPIs.map(kpi => <UserMetric key={kpi.title} icon={kpi.icon} title={kpi.title} value={kpi.value} />)}
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <ClockIcon className="w-4 h-4 text-accent" />
                                    <h4 className="text-sm font-black uppercase tracking-widest text-text-primary">Operational Focus</h4>
                                </div>
                                <div className="p-6 bg-accent/5 border border-accent/20 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                        <BriefcaseIcon className="w-32 h-32" />
                                    </div>
                                    <p className="text-base font-serif italic text-text-primary leading-relaxed relative z-10">
                                        "{user.currentTask}"
                                    </p>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="space-y-4 relative">
                                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/40" />
                                {userActivities.map((activity, idx) => (
                                    <div key={activity.id} className="relative pl-10">
                                        <div className={cn(
                                            "absolute left-0 top-1.5 w-8 h-8 rounded-xl border-4 border-surface shadow-sm flex items-center justify-center",
                                            activity.status === ActivityStatus.DONE ? "bg-secondary text-white" : "bg-accent/20 text-accent"
                                        )}>
                                            <CheckCircleIcon className="w-4 h-4" />
                                        </div>
                                        <div className="bg-subtle-background/40 p-4 rounded-2xl border border-border/20 group hover:border-primary/20 transition-all">
                                            <div className="flex justify-between items-start gap-4">
                                                <p className="text-sm font-semibold text-text-primary leading-snug">{activity.description}</p>
                                                <span className="text-[10px] font-black uppercase tracking-tighter text-text-tertiary whitespace-nowrap">
                                                    {formatDateTime(activity.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'attendance' && (
                        <motion.div
                            key="attendance"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <AttendanceCalendar attendanceData={attendanceForMonth} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ContentCard>
    );
};

export default TeamMemberDetailView;