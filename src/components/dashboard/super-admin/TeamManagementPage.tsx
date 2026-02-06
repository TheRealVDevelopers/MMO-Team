import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../../../types';
import { useStaffPerformance } from '../../../hooks/useStaffPerformance';
import {
    ChevronRightIcon,
    UsersIcon,
    ArrowLeftIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    SignalIcon,
    FlagIcon
} from '@heroicons/react/24/outline';
import TeamMemberDetailView from './TeamMemberDetailView';
import { ContentCard, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';

const TeamManagementPage: React.FC<{ setCurrentPage: (page: string) => void; initialMemberId?: string; initialTab?: 'history'; initialDate?: string }> = ({ setCurrentPage, initialMemberId, initialTab, initialDate }) => {
    const { staff, loading } = useStaffPerformance();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Initial Selection Effect
    React.useEffect(() => {
        if (!loading && staff.length > 0) {
            if (initialMemberId) {
                const targetUser = staff.find(u => u.id === initialMemberId);
                if (targetUser) {
                    setSelectedUser(targetUser);
                    return;
                }
            }

            // Fallback to first user only if no user is currently selected (e.g. first load)
            if (!selectedUser) {
                setSelectedUser(staff[0]);
            }
        }
    }, [staff, loading, initialMemberId]); // Don't include selectedUser to allow changing selection manually without reset

    const filteredUsers = useMemo(() => {
        return staff.filter(user =>
            (user.name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (roleFilter === 'all' || user.role === roleFilter)
        );
    }, [staff, searchTerm, roleFilter]);

    const getStatusColor = (flag?: string) => {
        switch (flag) {
            case 'red': return 'text-error bg-error/10 border-error/20';
            case 'yellow': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'green': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            default: return 'text-text-tertiary bg-subtle-background border-border';
        }
    };

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8"
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentPage('overview')}
                    className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-subtle-background hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest text-text-tertiary shadow-sm"
                >
                    <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    <span>Command</span>
                </button>
                <div className="h-6 w-px bg-border/40 mx-2" />
                <h2 className="text-3xl font-serif font-black text-text-primary tracking-tight">Personnel HUB</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-[750px] items-stretch">
                {/* Personnel Directory */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <ContentCard className="flex flex-col h-full !p-0 overflow-hidden shadow-2xl">
                        <div className="p-6 bg-subtle-background/30 border-b border-border/40">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <UsersIcon className="w-5 h-5 text-primary" />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Registry</h3>
                                </div>
                                <span className="text-[10px] font-black text-text-tertiary bg-surface px-2 py-1 rounded-md border border-border">
                                    {filteredUsers.length} Active
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="relative group">
                                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Identification..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-text-tertiary shadow-inner"
                                    />
                                </div>
                                <div className="relative group">
                                    <AdjustmentsHorizontalIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-primary transition-colors" />
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value as any)}
                                        className="w-full pl-11 pr-10 py-3 bg-surface border border-border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none appearance-none transition-all shadow-inner"
                                    >
                                        <option value="all">Sectors: All</option>
                                        {Object.values(UserRole).filter(r => r !== UserRole.SUPER_ADMIN).map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
                            {loading ? (
                                <div className="flex justify-center pt-10">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredUsers.map((user, idx) => {
                                        const statusColor = getStatusColor(user.performanceFlag);
                                        return (
                                            <motion.div
                                                key={user.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                onClick={() => setSelectedUser(user)}
                                                className={cn(
                                                    "group p-3 mb-2 rounded-2xl cursor-pointer transition-all border",
                                                    selectedUser?.id === user.id
                                                        ? "bg-primary/5 border-primary/20 shadow-sm"
                                                        : "bg-transparent border-transparent hover:bg-subtle-background hover:border-border/40"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <img className="w-10 h-10 rounded-xl object-cover shadow-sm bg-surface" src={user.avatar} alt={user.name} />

                                                        {/* Status Dot */}
                                                        <div className={cn(
                                                            "absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface flex items-center justify-center",
                                                            user.attendanceStatus === 'CLOCKED_IN' ? "bg-emerald-500" :
                                                                user.attendanceStatus === 'ON_BREAK' ? "bg-amber-500" : "bg-subtle-background border-border"
                                                        )} title={user.attendanceStatus?.replace('_', ' ')}>
                                                            {/* Performance Warning Layer */}
                                                            {user.performanceFlag === 'red' && <FlagIcon className="w-2 h-2 text-white" />}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-0.5">
                                                            <p className={cn(
                                                                "text-sm font-bold truncate transition-colors",
                                                                selectedUser?.id === user.id ? "text-primary" : "text-text-primary"
                                                            )}>{user.name}</p>
                                                            {/* Online Indicator Text */}
                                                            {user.attendanceStatus === 'CLOCKED_IN' && (
                                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">ONLINE</span>
                                                            )}
                                                            {user.attendanceStatus === 'ON_BREAK' && (
                                                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">BREAK</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] font-semibold text-text-tertiary tracking-wide uppercase italic truncate">{user.role}</p>
                                                        {/* Current Task/Assignment */}
                                                        {user.currentTask && (
                                                            <p className="text-[10px] text-text-secondary mt-1 truncate flex items-center gap-1">
                                                                <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0"></span>
                                                                {user.currentTask}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <ChevronRightIcon className={cn(
                                                        "w-4 h-4 transition-all",
                                                        selectedUser?.id === user.id ? "text-primary translate-x-1" : "text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                                                    )} />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>
                    </ContentCard>
                </div>

                {/* Personnel Deep-Dive */}
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        {selectedUser ? (
                            <motion.div
                                key={selectedUser.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                <TeamMemberDetailView user={selectedUser} initialTab={initialTab} initialDate={initialDate} />
                            </motion.div>
                        ) : (
                            <div className="h-full flex items-center justify-center border-2 border-dashed border-border/40 rounded-[2.5rem] bg-subtle-background/30">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-surface border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <UsersIcon className="w-8 h-8 text-text-tertiary opacity-20" />
                                    </div>
                                    <p className="text-text-secondary font-medium font-serif italic mb-2">Awaiting Identification</p>
                                    <p className="text-[10px] text-text-tertiary uppercase tracking-[0.2em]">Select personnel to initialize profile Deep-Dive</p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default TeamManagementPage;
