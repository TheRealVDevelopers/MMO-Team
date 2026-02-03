import React, { useState, useMemo } from 'react';
import { formatCurrencyINR } from '../../../constants';
import { User, UserRole, LeadPipelineStatus, Lead } from '../../../types';
import { useUsers } from '../../../hooks/useUsers';
import {
    MapPinIcon,
    FunnelIcon,
    ChartBarIcon,
    WalletIcon,
    BoltIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { ContentCard, cn, staggerContainer } from '../shared/DashboardUI';
import { motion } from 'framer-motion';

const TeamMemberCard: React.FC<{ member: User; leads: Lead[] }> = ({ member, leads }) => {
    const memberLeads = leads.filter(l => l.assignedTo === member.id);
    const activeLeads = memberLeads.filter(l => ![LeadPipelineStatus.WON, LeadPipelineStatus.LOST].includes(l.status)).length;
    const wonLeads = memberLeads.filter(l => l.status === LeadPipelineStatus.WON).length;
    const conversionRate = memberLeads.length > 0 ? (wonLeads / memberLeads.length) * 100 : 0;
    const revenue = memberLeads.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + l.value, 0);

    return (
        <ContentCard className="flex flex-col group hover:border-primary/30 transition-all">
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <img src={member.avatar} alt={member.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-transparent group-hover:ring-primary/20 transition-all shadow-sm" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-surface rounded-full shadow-sm" />
                    </div>
                    <div>
                        <h4 className="text-md font-bold text-text-primary group-hover:text-primary transition-colors">{member.name}</h4>
                        <div className="flex items-center text-[10px] uppercase tracking-widest text-text-secondary mt-1">
                            <MapPinIcon className="w-3 h-3 mr-1 text-primary/60" /> {member.region}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-3 bg-subtle-background rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-text-secondary mb-1">Active Pipeline</p>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-text-primary">{activeLeads}</span>
                        <BoltIcon className="w-4 h-4 text-accent/50" />
                    </div>
                </div>
                <div className="p-3 bg-subtle-background rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-text-secondary mb-1">Conversion</p>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-text-primary">{conversionRate.toFixed(1)}%</span>
                        <ChartBarIcon className="w-4 h-4 text-purple/50" />
                    </div>
                </div>
                <div className="col-span-2 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-[10px] font-black uppercase text-primary/80 mb-1">Revenue Performance</p>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">{formatCurrencyINR(revenue)}</span>
                        <WalletIcon className="w-4 h-4 text-primary/40" />
                    </div>
                </div>
            </div>

            <button className="mt-6 w-full py-3 bg-background border border-border text-text-secondary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2 group/btn">
                Analysis Details
                <ChevronRightIcon className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
            </button>
        </ContentCard>
    );
};

const TeamManagementPage: React.FC<{ leads: Lead[]; users: User[] }> = ({ leads, users }) => {
    const [regionFilter, setRegionFilter] = useState<'all' | string>('all');

    // Filter to get only sales team members from real data
    const salesTeam = useMemo(() => {
        return users.filter(u => u.role === UserRole.SALES_TEAM_MEMBER);
    }, [users]);

    const filteredTeam = useMemo(() => {
        if (regionFilter === 'all') return salesTeam;
        return salesTeam.filter(member => member.region === regionFilter);
    }, [regionFilter, salesTeam]);

    const regions = [...new Set(salesTeam.map(m => m.region).filter(Boolean))] as string[];


    if (salesTeam.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-text-secondary">No sales team members found.</p>
            </div>
        );
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <div className="flex justify-end items-center mb-8">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <FunnelIcon className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                    </div>
                    <select
                        value={regionFilter}
                        onChange={e => setRegionFilter(e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-background border border-border rounded-xl text-xs font-bold text-text-primary focus:ring-1 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer outline-none min-w-[160px]"
                    >
                        <option value="all">Global Regions</option>
                        {regions.map(region => <option key={region} value={region}>{region}</option>)}
                    </select>
                </div>
            </div>

            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {filteredTeam.map(member => (
                    <motion.div layout key={member.id}>
                        <TeamMemberCard member={member} leads={leads} />
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
};

export default TeamManagementPage;
