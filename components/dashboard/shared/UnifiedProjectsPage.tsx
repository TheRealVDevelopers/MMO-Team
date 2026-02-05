import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCases } from '../../../hooks/useCases';
import { useOrganizations } from '../../../hooks/useOrganizations';
import { useUsers } from '../../../hooks/useUsers';
import { ProjectStatus, LeadPipelineStatus, Case, Lead, Project } from '../../../types';
import { formatCurrencyINR, formatDate } from '../../../constants';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    CalendarIcon,
    ChartBarIcon,
    RectangleStackIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    ExclamationCircleIcon,
    BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { StatCard, cn } from './DashboardUI';
import LeadDetailModal from '../../shared/LeadDetailModal';
import ProjectDetailModal from '../super-admin/ProjectDetailModal';

// --- Types & Interfaces ---

interface UnifiedProjectsPageProps {
    roleView?: 'admin' | 'manager' | 'sales';
}

type FilterStage = 'projects' | 'all' | 'leads' | 'site-visit' | 'drawing' | 'execution' | 'completed';

// --- Helper Functions ---

const getStageFromStatus = (status: string): FilterStage => {
    // Lead Stages (Mapped from types.ts)
    if ([
        LeadPipelineStatus.NEW_NOT_CONTACTED,
        LeadPipelineStatus.CONTACTED_CALL_DONE,
        LeadPipelineStatus.NEGOTIATION,
        LeadPipelineStatus.QUOTATION_SENT,
        LeadPipelineStatus.WAITING_FOR_QUOTATION
    ].includes(status as any)) return 'leads';

    // Site Visit
    if ([
        LeadPipelineStatus.SITE_VISIT_SCHEDULED,
        LeadPipelineStatus.SITE_VISIT_RESCHEDULED,
        ProjectStatus.SITE_VISIT_PENDING,
        ProjectStatus.SITE_VISIT_RESCHEDULED
    ].includes(status as any)) return 'site-visit';

    // Drawing/Design
    if ([
        LeadPipelineStatus.WAITING_FOR_DRAWING,
        LeadPipelineStatus.DRAWING_IN_PROGRESS,
        LeadPipelineStatus.DRAWING_REVISIONS,
        ProjectStatus.DRAWING_PENDING,
        ProjectStatus.DESIGN_IN_PROGRESS,
        ProjectStatus.REVISIONS_IN_PROGRESS,
        ProjectStatus.AWAITING_DESIGN
    ].includes(status as any)) return 'drawing';

    // Execution
    if ([
        LeadPipelineStatus.IN_EXECUTION,
        ProjectStatus.IN_EXECUTION,
        ProjectStatus.PROCUREMENT,
        ProjectStatus.APPROVED,
        'Pending Execution Approval',
        'Execution Approved'
    ].includes(status as any)) return 'execution';

    // Completed
    if ([
        LeadPipelineStatus.WON,
        LeadPipelineStatus.LOST,
        ProjectStatus.COMPLETED,
        ProjectStatus.REJECTED
    ].includes(status as any)) return 'completed';

    return 'all';
};

// Use standard Tailwind classes for badges since Badge component is missing
const getStatusColor = (stage: FilterStage) => {
    switch (stage) {
        case 'leads': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'site-visit': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'drawing': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'execution': return 'bg-green-100 text-green-700 border-green-200';
        case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
        default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
};

// --- Component ---

const UnifiedProjectsPage: React.FC<UnifiedProjectsPageProps> = ({ roleView = 'admin' }) => {
    const { currentUser } = useAuth();
    const { cases, loading } = useCases();
    const { organizations } = useOrganizations();
    const { users } = useUsers();

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStage, setActiveStage] = useState<FilterStage>('projects');
    const [selectedOrgId, setSelectedOrgId] = useState<string>('all');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

    // Modal State
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

    const handleActionClick = (item: Case) => {
        setSelectedCase(item);
        // Always use LeadDetailModal for both leads and projects
        // This provides a unified activity view for all cases
        setIsLeadModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsLeadModalOpen(false);
        setIsProjectModalOpen(false);
        setTimeout(() => setSelectedCase(null), 300); // Clear after animation
    };

    // --- Derived Data ---

    const stats = useMemo(() => {
        const counts = {
            total: cases.length,
            leads: 0,
            execution: 0,
            completed: 0,
            value: 0
        };

        cases.forEach(c => {
            const stage = getStageFromStatus(c.status);
            if (stage === 'leads' || stage === 'site-visit' || stage === 'drawing') counts.leads++;
            if (stage === 'execution') counts.execution++;
            if (stage === 'completed') counts.completed++;
            counts.value += (c.budget || c.value || 0);
        });

        return counts;
    }, [cases]);

    const filteredCases = useMemo(() => {
        return cases.filter(item => {
            // Text Search
            const matchesSearch =
                (item.projectName || item.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.clientContact?.phone || '').includes(searchTerm);

            // Stage Filter
            const itemStage = getStageFromStatus(item.status);
            let matchesStage = activeStage === 'all' || itemStage === activeStage;
            if (activeStage === 'projects') {
                matchesStage = item.isProject === true;
            }

            // Organization Filter
            const matchesOrg = selectedOrgId === 'all' || item.organizationId === selectedOrgId;

            // Date Filter (Created At)
            let matchesDate = true;
            if (dateRange.start && item.createdAt) {
                matchesDate = new Date(item.createdAt) >= new Date(dateRange.start);
            }
            if (dateRange.end && item.createdAt && matchesDate) {
                matchesDate = new Date(item.createdAt) <= new Date(dateRange.end);
            }

            return matchesSearch && matchesStage && matchesDate && matchesOrg;
        });
    }, [cases, searchTerm, activeStage, selectedOrgId, dateRange]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-text-secondary animate-pulse">Synchronizing project pipeline...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Pipeline"
                    value={stats.total.toString()}
                    icon={<RectangleStackIcon className="w-6 h-6" />}
                    color="primary"
                    trend={{ value: `${formatCurrencyINR(stats.value)} Val`, positive: true }}
                />
                <StatCard
                    title="Active Leads"
                    value={stats.leads.toString()}
                    icon={<FunnelIcon className="w-6 h-6" />}
                    color="accent"
                    onClick={() => setActiveStage('leads')}
                    className={activeStage === 'leads' ? 'ring-2 ring-accent' : ''}
                />
                <StatCard
                    title="In Execution"
                    value={stats.execution.toString()}
                    icon={<ChartBarIcon className="w-6 h-6" />}
                    color="secondary"
                    onClick={() => setActiveStage('execution')}
                    className={activeStage === 'execution' ? 'ring-2 ring-secondary' : ''}
                />
                <StatCard
                    title="Completed"
                    value={stats.completed.toString()}
                    icon={<CheckCircleIcon className="w-6 h-6" />}
                    color="purple"
                    onClick={() => setActiveStage('completed')}
                    className={activeStage === 'completed' ? 'ring-2 ring-purple-500' : ''}
                />
            </div>

            {/* Controls Bar */}
            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                    <div className="relative flex-1 md:max-w-xs">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder="Search projects, clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-subtle-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>

                    {/* Organization Filter */}
                    <div className="relative md:w-48 hidden md:block">
                        <BuildingOfficeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <select
                            value={selectedOrgId}
                            onChange={(e) => setSelectedOrgId(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-subtle-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                        >
                            <option value="all">All Organizations</option>
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-subtle-background border border-border rounded-lg p-1 hidden lg:flex">
                        <button
                            onClick={() => setActiveStage('projects')}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", activeStage === 'projects' ? "bg-white shadow text-text-primary" : "text-text-secondary hover:text-text-primary")}
                        >
                            Projects
                        </button>
                        <button
                            onClick={() => setActiveStage('all')}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", activeStage === 'all' ? "bg-white shadow text-text-primary" : "text-text-secondary hover:text-text-primary")}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveStage('leads')}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", activeStage === 'leads' ? "bg-white shadow text-text-primary" : "text-text-secondary hover:text-text-primary")}
                        >
                            Leads
                        </button>
                        <button
                            onClick={() => setActiveStage('execution')}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", activeStage === 'execution' ? "bg-white shadow text-text-primary" : "text-text-secondary hover:text-text-primary")}
                        >
                            Execution
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-subtle-background border border-border rounded-lg px-3 py-2">
                        <CalendarIcon className="w-4 h-4 text-text-tertiary" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent border-none text-xs text-text-secondary p-0 focus:ring-0 w-24"
                        />
                        <span className="text-text-tertiary">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent border-none text-xs text-text-secondary p-0 focus:ring-0 w-24"
                        />
                    </div>
                </div>
            </div>

            {/* Main Table/Grid */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm min-h-[500px]">
                <table className="w-full">
                    <thead className="bg-subtle-background border-b border-border">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Project / Client</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Current Stage</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Value / Budget</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Assigned Team</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-tertiary">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filteredCases.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center text-text-secondary">
                                    <div className="flex flex-col items-center">
                                        <ExclamationCircleIcon className="w-12 h-12 text-border mb-4" />
                                        <p className="font-bold">No projects found</p>
                                        <p className="text-sm">Try adjusting your filters or search terms.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredCases.map((item) => {
                                const stage = getStageFromStatus(item.status);
                                const isLead = item.isProject === false;
                                return (
                                    <tr key={item.id} className="group hover:bg-subtle-background/30 transition-colors cursor-pointer" onClick={() => handleActionClick(item)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-2 h-10 rounded-full",
                                                    isLead ? 'bg-secondary' : 'bg-primary'
                                                )} />
                                                <div>
                                                    <p className="font-bold text-text-primary group-hover:text-primary transition-colors cursor-pointer">
                                                        {item.projectName || 'Untitled Project'}
                                                    </p>
                                                    <p className="text-xs text-text-secondary mt-0.5">
                                                        {item.clientName} • {formatDate(new Date(item.createdAt || Date.now()))}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                                getStatusColor(stage)
                                            )}>
                                                {item.status?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-mono text-sm font-bold text-text-primary">
                                                {formatCurrencyINR(item.budget || item.value || 0)}
                                            </p>
                                            <p className="text-[10px] text-text-tertiary mt-0.5">
                                                {isLead ? 'Est. Value' : 'Approved Budget'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                <div className="w-8 h-8 rounded-full bg-surface border-2 border-white flex items-center justify-center text-[10px] font-bold text-text-secondary shadow-sm" title={`Sales: ${item.assignedTo}`}>
                                                    S
                                                </div>
                                                {item.assignedTeam?.execution && (
                                                    <div className="w-8 h-8 rounded-full bg-primary text-white border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-sm" title="Execution">
                                                        E
                                                    </div>
                                                )}
                                                {item.assignedTeam?.drawing && (
                                                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-sm" title="Design">
                                                        D
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                className="p-2 text-text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                title="View Details"
                                            >
                                                <ArrowRightIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="text-center text-xs text-text-tertiary">
                Showing {filteredCases.length} of {cases.length} total records
            </div>

            {/* Modal is used for both leads and projects */}
            {selectedCase && (
                <LeadDetailModal
                    isOpen={isLeadModalOpen}
                    onClose={handleCloseModals}
                    caseItem={selectedCase}
                    onUpdate={() => {
                        // Updates propagate via real-time useCases hook
                    }}
                />
            )}
        </div>
    );
};

export default UnifiedProjectsPage;
