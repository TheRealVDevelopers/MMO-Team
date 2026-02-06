import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ProjectStatus, ActivityStatus, UserRole } from '../../../types';
import { useProjects } from '../../../hooks/useProjects';
import { useLeads } from '../../../hooks/useLeads';
import { useUsers } from '../../../hooks/useUsers';
import { useTeamTasks } from '../../../hooks/useTeamTasks';
import {
    ArrowDownTrayIcon,
    ArrowLeftIcon,
    SparklesIcon,
    ChartPieIcon,
    PresentationChartBarIcon,
    DocumentArrowDownIcon,
    CpuChipIcon,
    CircleStackIcon
} from '@heroicons/react/24/outline';
import { ContentCard, SectionHeader, cn, staggerContainer } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';

// --- START: Chart Components ---

const projectStatusConfig: Record<ProjectStatus, { color: string, name: string }> = {
    [ProjectStatus.AWAITING_DESIGN]: { color: '#3b82f6', name: 'Awaiting Design' },
    [ProjectStatus.DESIGN_IN_PROGRESS]: { color: '#6366f1', name: 'Design In Progress' },
    [ProjectStatus.PENDING_REVIEW]: { color: '#a855f7', name: 'Pending Review' },
    [ProjectStatus.REVISIONS_REQUESTED]: { color: '#f97316', name: 'Revisions' },
    [ProjectStatus.AWAITING_QUOTATION]: { color: '#0ea5e9', name: 'Needs Quote' },
    [ProjectStatus.QUOTATION_SENT]: { color: '#06b6d4', name: 'Quote Sent' },
    [ProjectStatus.NEGOTIATING]: { color: '#eab308', name: 'Negotiating' },
    [ProjectStatus.APPROVED]: { color: '#22c55e', name: 'Approved' },
    [ProjectStatus.REJECTED]: { color: '#ef4444', name: 'Rejected' },
    [ProjectStatus.PROCUREMENT]: { color: '#14b8a6', name: 'Procurement' },
    [ProjectStatus.IN_EXECUTION]: { color: '#f59e0b', name: 'In Execution' },
    [ProjectStatus.COMPLETED]: { color: '#10b981', name: 'Completed' },
    [ProjectStatus.ON_HOLD]: { color: '#64748b', name: 'On Hold' },
    [ProjectStatus.SITE_VISIT_PENDING]: { color: '#fbbf24', name: 'Site Visit Pending' },
    [ProjectStatus.DRAWING_PENDING]: { color: '#818cf8', name: 'Drawing Pending' },
    [ProjectStatus.BOQ_PENDING]: { color: '#34d399', name: 'BOQ Pending' },
    [ProjectStatus.REVISIONS_IN_PROGRESS]: { color: '#f87171', name: 'Rev. In Progress' },
    [ProjectStatus.SITE_VISIT_RESCHEDULED]: { color: '#fbbf24', name: 'Site Visit Rescheduled' },
    [ProjectStatus.APPROVAL_REQUESTED]: { color: '#818cf8', name: 'Approval Requested' },
};

const ProjectStatusDonutChart: React.FC = () => {
    const { projects } = useProjects();
    const data = useMemo(() => {
        const counts = projects.reduce((acc, project) => {
            acc[project.status] = (acc[project.status] || 0) + 1;
            return acc;
        }, {} as Record<ProjectStatus, number>);

        return Object.entries(counts)
            .map(([status, count]) => ({
                status: status as ProjectStatus,
                count,
                color: projectStatusConfig[status as ProjectStatus]?.color || '#ccc',
                name: projectStatusConfig[status as ProjectStatus]?.name || status,
            }))
            .sort((a, b) => b.count - a.count);
    }, [projects]);

    const totalProjects = projects.length;
    const radius = 80;
    const strokeWidth = 24;
    const innerRadius = radius - strokeWidth / 2;
    const circumference = 2 * Math.PI * innerRadius;

    let accumulatedAngle = 0;

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 h-full">
            <div className="relative">
                <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-2xl">
                    <g transform="rotate(-90 100 100)">
                        {data.map((segment, idx) => {
                            const percentage = (segment.count / totalProjects) * 100;
                            const arcLength = (circumference * percentage) / 100;
                            const rotation = (accumulatedAngle / totalProjects) * 360;
                            accumulatedAngle += segment.count;

                            return (
                                <motion.circle
                                    key={segment.status}
                                    initial={{ strokeDasharray: `0 ${circumference}` }}
                                    animate={{ strokeDasharray: `${arcLength} ${circumference}` }}
                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                    cx="100" cy="100" r={innerRadius}
                                    fill="transparent"
                                    stroke={segment.color}
                                    strokeWidth={strokeWidth}
                                    transform={`rotate(${rotation} 100 100)`}
                                    className="transition-all hover:stroke-[30px] cursor-pointer"
                                >
                                    <title>{segment.name}: {segment.count} ({percentage.toFixed(1)}%)</title>
                                </motion.circle>
                            );
                        })}
                    </g>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-serif font-black text-text-primary tracking-tighter">{totalProjects}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Fleet Total</span>
                </div>
            </div>
            <div className="flex-1 w-full space-y-3">
                {data.slice(0, 5).map((item, idx) => (
                    <motion.div
                        key={item.status}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary transition-colors">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-text-primary">{item.count}</span>
                            <span className="text-[9px] font-black text-text-tertiary uppercase tracking-tighter opacity-40">Units</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};


const TeamProductivityChart: React.FC = () => {
    const { tasks } = useTeamTasks();
    const { users } = useUsers();

    // Helper to get user role
    const getUserRole = (userId: string) => users.find(u => u.id === userId)?.role || 'Unknown';

    const data = useMemo(() => {
        // Map tasks to team/role counts
        const counts = tasks.filter(t => t.status === 'Completed').reduce((acc, task) => {
            const role = getUserRole(task.userId);
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
            // Clean up role names for display if needed, but keeping simple for now
            .map(([team, count]) => ({ team: team as UserRole, count }))
            .sort((a, b) => b.count - a.count);
    }, [tasks, users]);

    const maxCount = Math.max(...data.map(d => d.count), 0);

    return (
        <div className="space-y-6">
            {data.map((d, idx) => {
                const barWidth = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                return (
                    <motion.div
                        key={d.team}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="space-y-1.5"
                    >
                        <div className="flex justify-between items-center px-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                                {d.team.replace(' Team', '').replace(' Member', '').replace(' General Manager', ' GM')}
                            </p>
                            <p className="text-xs font-bold text-text-primary">{d.count} Operations</p>
                        </div>
                        <div className="h-4 bg-subtle-background/50 rounded-full border border-border/20 overflow-hidden shadow-inner group relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${barWidth}%` }}
                                transition={{ duration: 1.2, delay: idx * 0.1, ease: "easeOut" }}
                                className="bg-primary h-full relative group-hover:bg-secondary transition-colors"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                            </motion.div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    );
};


// --- END: Chart Components ---


const ReportsPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { projects } = useProjects();
    const { leads } = useLeads();
    const { users } = useUsers();
    const { tasks } = useTeamTasks(); // For exporting activities

    const generateReportSummary = async () => {
        setIsLoading(true);
        setError('');
        setSummary('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const prompt = `
                Analyze the following JSON data for an interior design company's internal management system in India and generate a concise weekly report summary in markdown format.
                The summary should be suitable for an Indian business context.

                The summary should include three sections using H3 markdown (###):
                1.  **Project Highlights:** Mention the number of newly completed projects and any projects that are currently in the execution phase.
                2.  **Sales & Leads Overview:** Summarize the number of new leads acquired this week and the total number of deals won.
                3.  **Team Productivity:** Briefly comment on the overall team activity based on their latest status updates. Mention a few examples of what team members are working on.

                Use bullet points (* or -) for lists.

                Here is the data:
                Projects: ${JSON.stringify(projects.map(p => ({ status: p.status, name: p.projectName })))}
                Leads: ${JSON.stringify(leads.map(l => ({ status: l.status, inquiryDate: l.inquiryDate })))}
                Users: ${JSON.stringify(users.map(u => ({ name: u.name, role: u.role, currentTask: u.currentTask })))}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash', // updated to latest
                contents: prompt,
            });

            setSummary(response.text);

        } catch (err) {
            console.error(err);
            setError('Strategic Synthesis Offline. Please verify API protocols.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderMarkdown = (text: string) => {
        if (!text) return null;
        const sections = text.split(/(?=###\s)/g);
        return sections.map((section, index) => {
            const lines = section.split('\n').filter(line => line.trim() !== '');
            const heading = lines.shift()?.replace('###', '').trim();
            return (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="mb-6 last:mb-0"
                >
                    {heading && (
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{heading}</h3>
                        </div>
                    )}
                    <ul className="space-y-3">
                        {lines.map((line, lineIndex) => (
                            <li key={lineIndex} className="flex items-start gap-4 group">
                                <span className="text-[10px] text-text-tertiary mt-1 font-bold">0{lineIndex + 1}</span>
                                <p className="text-sm text-text-secondary font-medium leading-relaxed group-hover:text-text-primary transition-colors">
                                    {line.replace(/[-*]\s/, '').trim()}
                                </p>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            );
        });
    };

    const handleDownload = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);

        const convertToCSV = (objArray: any[]) => {
            const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
            const header = headers.join(',') + '\r\n';
            const body = array.map((row: any) => {
                return headers.map(fieldName => {
                    let value = row[fieldName];
                    if (value === null || value === undefined) {
                        value = '';
                    } else if (typeof value === 'object' && !(value instanceof Date)) {
                        value = JSON.stringify(value).replace(/"/g, '""');
                    } else {
                        value = String(value).replace(/"/g, '""');
                    }
                    return `"${value}"`;
                }).join(',');
            }).join('\r\n');
            return header + body;
        }

        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-10"
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentPage('overview')}
                    className="group p-3 rounded-2xl border border-border bg-surface hover:bg-subtle-background hover:scale-105 transition-all text-text-tertiary shadow-sm"
                >
                    <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="h-6 w-px bg-border/40 mx-2" />
                <div>
                    <h2 className="text-3xl font-serif font-black text-text-primary tracking-tight">Intelligence & Analytics</h2>
                    <p className="text-text-tertiary text-sm font-medium mt-1">High-fidelity strategic synthesis and data exporting.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* AI Briefing Module */}
                <div className="lg:col-span-12">
                    <ContentCard className="!p-0 overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                            <CpuChipIcon className="w-64 h-64" />
                        </div>
                        <div className="p-8 border-b border-border/40 bg-surface flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <SparklesIcon className="w-6 h-6 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-serif font-black text-text-primary tracking-tight italic">Intelligence Briefing</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary mt-0.5">Automated Strategic Synthesis</p>
                                </div>
                            </div>
                            <button
                                onClick={generateReportSummary}
                                disabled={isLoading}
                                className="group flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-secondary transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <SparklesIcon className={cn("w-4 h-4", isLoading ? "animate-spin" : "group-hover:rotate-12")} />
                                {isLoading ? 'Synthesizing...' : 'Initialize Analysis'}
                            </button>
                        </div>

                        <div className="p-10 min-h-[400px] relative z-10 bg-subtle-background/30 backdrop-blur-sm">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="w-16 h-1 bg-border/20 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ x: -100 }}
                                            animate={{ x: 100 }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            className="w-full h-full bg-primary"
                                        />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest text-text-tertiary animate-pulse">Aggregating Strategic Vectors...</p>
                                </div>
                            ) : summary ? (
                                <div className="max-w-4xl mx-auto">
                                    {renderMarkdown(summary)}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <div className="w-20 h-20 bg-surface rounded-[2rem] border border-border shadow-sm flex items-center justify-center mb-6">
                                        <SparklesIcon className="w-10 h-10 text-text-tertiary opacity-10" />
                                    </div>
                                    <p className="text-text-secondary font-serif italic text-lg max-w-sm mx-auto">
                                        "Click initialize to trigger deep-learning synthesis of the current operational state."
                                    </p>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-4 bg-error/10 border-t border-error/20 flex items-center justify-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-error" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-error">{error}</p>
                            </div>
                        )}
                    </ContentCard>
                </div>

                {/* Data Charts Module */}
                <div className="lg:col-span-7">
                    <ContentCard className="h-full shadow-xl">
                        <div className="flex items-center gap-4 mb-10 pb-4 border-b border-border/40">
                            <ChartPieIcon className="w-6 h-6 text-primary" />
                            <h3 className="text-xl font-serif font-black text-text-primary tracking-tight">Fleet Status Breakdown</h3>
                        </div>
                        <div className="h-64 mb-8">
                            <ProjectStatusDonutChart />
                        </div>
                    </ContentCard>
                </div>

                <div className="lg:col-span-5">
                    <ContentCard className="h-full shadow-xl">
                        <div className="flex items-center gap-4 mb-10 pb-4 border-b border-border/40">
                            <PresentationChartBarIcon className="w-6 h-6 text-secondary" />
                            <h3 className="text-xl font-serif font-black text-text-primary tracking-tight">Deployment Depth</h3>
                        </div>
                        <TeamProductivityChart />
                    </ContentCard>
                </div>

                {/* Export Module */}
                <div className="lg:col-span-12">
                    <ContentCard className="bg-surface/50 border-border/40 backdrop-blur-sm shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <CircleStackIcon className="w-6 h-6 text-accent" />
                            <h3 className="text-xl font-serif font-black text-text-primary tracking-tight">Data Extraction Protocol</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Team Activity Feed', file: 'team_activity.csv', data: tasks },
                                { label: 'Deployment Progress', file: 'project_progress.csv', data: projects },
                                { label: 'Stakeholder Registry', file: 'client_leads.csv', data: leads },
                            ].map((repo, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleDownload(repo.data, repo.file)}
                                    className="group flex items-center justify-between p-6 bg-surface border border-border/60 rounded-3xl hover:border-primary/40 hover:scale-[1.02] transition-all shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-subtle-background flex items-center justify-center text-text-tertiary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            <DocumentArrowDownIcon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black uppercase tracking-widest text-text-primary leading-none mb-1">{repo.label}</p>
                                            <p className="text-[10px] font-bold text-text-tertiary uppercase opacity-40 leading-none">Export .CSV Protocol</p>
                                        </div>
                                    </div>
                                    <ArrowDownTrayIcon className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-colors" />
                                </button>
                            ))}
                        </div>
                    </ContentCard>
                </div>
            </div>
        </motion.div>
    );
};

export default ReportsPage;