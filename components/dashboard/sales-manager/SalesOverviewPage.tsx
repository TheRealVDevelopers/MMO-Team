

import React from 'react';
import Card from '../../shared/Card';
import { USERS, formatCurrencyINR } from '../../../constants';
import { Lead, LeadPipelineStatus, UserRole } from '../../../types';
import { ExclamationTriangleIcon, FunnelIcon, ChartBarIcon, CheckCircleIcon, BanknotesIcon } from '../../icons/IconComponents';

const salesTeam = USERS.filter(u => u.role === UserRole.SALES_TEAM_MEMBER);
const pipelineOrder = Object.values(LeadPipelineStatus);

const KpiCard: React.FC<{ title: string; value: string; onClick?: () => void; gradient?: string; icon?: React.ReactNode }> = ({ title, value, onClick, gradient = 'from-kurchi-gold-500 to-kurchi-gold-600', icon }) => (
    <Card 
        hover={!!onClick}
        className={`${onClick ? 'cursor-pointer' : ''} overflow-hidden relative group`} 
        onClick={onClick}
    >
        <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
            <div className={`w-full h-full bg-gradient-to-br ${gradient} rounded-full transform translate-x-8 -translate-y-8`}></div>
        </div>
        <div className="relative">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">{title}</p>
                    <p className="text-4xl font-bold text-kurchi-espresso-900 tracking-tight group-hover:text-kurchi-gold-600 transition-colors">{value}</p>
                </div>
                {icon && (
                    <div className={`p-2.5 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    </Card>
);

const SalesOverviewPage: React.FC<{ setCurrentPage: (page: string) => void; leads: Lead[] }> = ({ setCurrentPage, leads }) => {
    // --- MOCK DATA CALCULATIONS ---
    const leadsThisMonth = leads.filter(l => l.inquiryDate > new Date(new Date().setDate(1)));
    const totalLeads = leadsThisMonth.length;
    const projectsWon = leadsThisMonth.filter(l => l.status === LeadPipelineStatus.WON).length;
    const totalRevenue = leadsThisMonth.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + l.value, 0);
    const conversionRate = totalLeads > 0 ? ((projectsWon / totalLeads) * 100).toFixed(1) : '0';

    const pipelineCounts = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {} as Record<LeadPipelineStatus, number>);

    const urgentAlerts = leads.filter(l => l.status === LeadPipelineStatus.NEW_NOT_CONTACTED && (new Date().getTime() - l.inquiryDate.getTime()) > 24 * 60 * 60 * 1000);

    return (
        <div className="space-y-8">
            {/* Enhanced Page Header */}
            <div>
                <h2 className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">Sales Dashboard</h2>
                <p className="text-text-secondary font-light">Track your team's performance and pipeline status</p>
            </div>
            
            {/* Enhanced KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title="New Leads (Month)" 
                    value={totalLeads.toString()} 
                    onClick={() => setCurrentPage('leads')}
                    gradient="from-blue-500 to-blue-600"
                    icon={<FunnelIcon className="w-5 h-5" />}
                />
                <KpiCard 
                    title="Conversion Rate" 
                    value={`${conversionRate}%`}
                    gradient="from-purple-500 to-purple-600"
                    icon={<ChartBarIcon className="w-5 h-5" />}
                />
                <KpiCard 
                    title="Projects Won (Month)" 
                    value={projectsWon.toString()} 
                    onClick={() => setCurrentPage('leads')}
                    gradient="from-green-500 to-green-600"
                    icon={<CheckCircleIcon className="w-5 h-5" />}
                />
                <KpiCard 
                    title="Revenue (Month)" 
                    value={formatCurrencyINR(totalRevenue)}
                    gradient="from-kurchi-gold-500 to-kurchi-gold-600"
                    icon={<BanknotesIcon className="w-5 h-5" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Enhanced Sales Pipeline */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <div className="mb-6">
                            <h3 className="text-xl font-serif font-bold text-kurchi-espresso-900 mb-2">Sales Pipeline</h3>
                            <p className="text-sm text-text-secondary font-light">Overview of all leads across different stages</p>
                        </div>
                        <div className="space-y-4">
                            {pipelineOrder.map(status => {
                                const count = pipelineCounts[status] || 0;
                                const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
                                return (
                                    <div key={status} className="group cursor-pointer hover:bg-subtle-background/50 p-3 rounded-xl transition-all" onClick={() => setCurrentPage('leads')}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-kurchi-espresso-900 group-hover:text-kurchi-gold-600 transition-colors">{status}</span>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-xs text-text-secondary">{percentage.toFixed(0)}%</span>
                                                <span className="text-sm font-bold text-kurchi-espresso-900 min-w-[3rem] text-right">{count} Lead{count !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-subtle-background rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className="bg-gradient-to-r from-kurchi-gold-500 to-kurchi-gold-600 h-2.5 rounded-full transition-all duration-500 shadow-sm" 
                                                style={{width: `${percentage}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
                
                {/* Right Column - Team Performance & Alerts */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Enhanced Team Performance */}
                    <Card>
                        <h3 className="text-lg font-serif font-bold text-kurchi-espresso-900 mb-4">Top Performers</h3>
                        <ul className="space-y-3">
                            {salesTeam.map((member) => {
                                const wonCount = leads.filter(l => l.assignedTo === member.id && l.status === LeadPipelineStatus.WON).length;
                                return (
                                    <li key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-subtle-background transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full ring-2 ring-border shadow-sm"/>
                                            <div>
                                                <span className="text-sm font-bold text-kurchi-espresso-900 block">{member.name}</span>
                                                <span className="text-xs text-text-secondary">Sales Team</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-bold">
                                                {wonCount} Won
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </Card>
                    
                    {/* Enhanced Urgent Alerts */}
                    <Card className="border-l-4 border-error">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-error flex items-center">
                                <div className="p-2 rounded-lg bg-error/10 mr-3">
                                    <ExclamationTriangleIcon className="w-5 h-5"/>
                                </div>
                                Urgent Alerts
                            </h3>
                            <span className="px-3 py-1 bg-error/10 text-error rounded-full text-sm font-bold">{urgentAlerts.length}</span>
                        </div>
                        {urgentAlerts.length > 0 ? (
                            <ul className="space-y-3">
                                {urgentAlerts.map(alert => (
                                    <li key={alert.id} className="flex items-start space-x-2 text-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 flex-shrink-0"></span>
                                        <div>
                                            <p className="font-bold text-kurchi-espresso-900">{alert.clientName}</p>
                                            <p className="text-xs text-text-secondary mt-0.5">Uncontacted for &gt; 24 hours</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-secondary italic">No urgent alerts - Great job!</p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SalesOverviewPage;