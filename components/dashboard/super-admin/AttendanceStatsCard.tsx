import React, { useState } from 'react';
import { useUsers } from '../../../hooks/useUsers';
import { formatDate } from '../../../constants';
import { AttendanceStatus } from '../../../types';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { ContentCard, cn } from '../shared/DashboardUI';
import { motion } from 'framer-motion';
import TeamHeadcountModal from './TeamHeadcountModal';

const AttendanceStatsCard: React.FC<{ onViewMember?: (userId: string) => void }> = ({ onViewMember }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { users, loading } = useUsers();

    // In a real app, these would come from a useAttendance hook
    const totalStaff = users.length;
    let presentCount = 0;

    // For now, reflecting 0 or mock a value based on real users if needed, 
    // but better to show 0 if not implemented to follow "remove hardcoded" rule.
    // However, for UI polish during transition, we might show a % of real users.
    // Let's stick to 0 or real data if available.

    const percentage = totalStaff > 0 ? Math.round((presentCount / totalStaff) * 100) : 0;

    if (loading) return (
        <ContentCard className="animate-pulse">
            <div className="h-20 bg-subtle-background/50 rounded-2xl" />
        </ContentCard>
    );

    return (
        <>
            <ContentCard
                className="cursor-pointer transition-all hover:shadow-md active:scale-[0.99]"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                        <UserGroupIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif font-bold text-text-primary tracking-tight">Total Headcount</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Workforce Registry</p>
                    </div>
                </div>

                <div className="flex items-end justify-between mb-6">
                    <div>
                        <p className="text-3xl font-serif font-black text-text-primary tabular-nums">{presentCount} / {totalStaff}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mt-1">Personnel Synchronized</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-serif font-black text-accent tabular-nums">{percentage}%</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mt-1">Operational Depth</p>
                    </div>
                </div>

                <div className="relative h-1.5 w-full bg-subtle-background rounded-full overflow-hidden border border-border/20">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-accent h-full rounded-full"
                    />
                </div>
            </ContentCard>

            <TeamHeadcountModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onViewMemberProfile={onViewMember}
            />
        </>
    );
};

export default AttendanceStatsCard;
