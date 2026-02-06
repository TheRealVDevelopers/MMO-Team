import React, { useMemo } from 'react';
import { Project } from '../../../types';
import { cn } from '../shared/DashboardUI';
import { motion } from 'framer-motion';

interface GanttChartProps {
    projects: Project[];
    onProjectSelect?: (project: Project) => void;
}

const GanttChart: React.FC<GanttChartProps> = ({ projects, onProjectSelect }) => {
    const { chartStartDate, totalDays, months } = useMemo(() => {
        if (projects.length === 0) {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const daysInMonth = end.getDate();
            return {
                chartStartDate: start,
                chartEndDate: end,
                totalDays: daysInMonth,
                months: [{
                    name: now.toLocaleString('default', { month: 'short' }) + ` '${now.getFullYear().toString().slice(2)}`,
                    days: daysInMonth
                }]
            };
        }

        const allDates = projects.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

        const chartStartDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        const chartEndDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

        const totalDays = (chartEndDate.getTime() - chartStartDate.getTime()) / (1000 * 3600 * 24) + 1;

        const generatedMonths = [];
        let currentDate = new Date(chartStartDate);
        while (currentDate <= chartEndDate) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            generatedMonths.push({
                name: `${currentDate.toLocaleString('default', { month: 'short' })} '${year.toString().slice(2)}`,
                days: new Date(year, month + 1, 0).getDate(),
            });
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return { chartStartDate, chartEndDate, totalDays, months: generatedMonths };
    }, [projects]);

    const getPosition = (date: Date) => {
        const diff = (new Date(date).getTime() - chartStartDate.getTime()) / (1000 * 3600 * 24);
        return (diff / totalDays) * 100;
    };

    const getWidth = (startDate: Date, endDate: Date) => {
        const diff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24) + 1;
        return (diff / totalDays) * 100;
    };

    const monthGridColumns = useMemo(() => {
        return months.map(m => `${(m.days / totalDays) * 100}%`).join(' ')
    }, [months, totalDays]);

    return (
        <div className="bg-surface rounded-3xl overflow-hidden border border-border/40 shadow-xl">
            {/* Header */}
            <div className="flex sticky top-0 bg-surface/80 backdrop-blur-md z-20 border-b border-border/40">
                <div className="w-56 flex-shrink-0 border-r border-border/40 px-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Strategic Roadmap</span>
                </div>
                <div className="flex-1 grid" style={{ gridTemplateColumns: monthGridColumns }}>
                    {months.map((month, index) => (
                        <div key={index} className="text-center py-4 border-r border-border/40 last:border-r-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary italic">
                                {month.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="relative min-w-full">
                {/* Vertical grid lines */}
                <div className="absolute top-0 left-56 h-full flex pointer-events-none" style={{ width: 'calc(100% - 14rem)' }}>
                    {months.slice(0, -1).reduce((acc, month) => {
                        const days = (acc.length > 0 ? acc[acc.length - 1].days : 0) + month.days;
                        acc.push({ days });
                        return acc;
                    }, [] as { days: number }[])
                        .map((cumulative, index) => {
                            const left = (cumulative.days / totalDays) * 100;
                            return (
                                <div key={index} className="absolute top-0 h-full w-px bg-border/20" style={{ left: `${left}%` }}></div>
                            )
                        })}
                </div>

                {/* Project Rows */}
                <div className="grid">
                    {projects.map((project, idx) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center group hover:bg-subtle-background/50 transition-colors border-b border-border/20 last:border-b-0"
                        >
                            <div className="w-56 flex-shrink-0 px-6 py-4 border-r border-border/40 h-full flex flex-col justify-center">
                                <p className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                                    {project.projectName}
                                </p>
                                <p className="text-[10px] font-medium text-text-tertiary truncate uppercase tracking-tighter mt-0.5">
                                    {project.clientName}
                                </p>
                            </div>
                            <div className="flex-1 h-16 relative px-4">
                                <motion.div
                                    whileHover={{ scale: [1, 1.02, 1] }}
                                    className="absolute top-4 h-8 rounded-xl group/bar cursor-pointer overflow-hidden shadow-sm"
                                    onClick={() => onProjectSelect && onProjectSelect(project)}
                                    style={{
                                        left: `${getPosition(project.startDate)}%`,
                                        width: `${getWidth(project.startDate, project.endDate)}%`,
                                    }}
                                >
                                    <div className="h-full bg-primary/10 rounded-xl border border-primary/20 relative overflow-hidden group-hover/bar:border-primary/40 transition-all">
                                        {/* Progress fill */}
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${project.progress}%` }}
                                            className="h-full bg-primary relative shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all duration-1000"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                                        </motion.div>

                                        <div className="absolute inset-0 flex items-center px-3 justify-between pointer-events-none">
                                            <span className="text-[10px] font-black text-white/90 uppercase tracking-tighter truncate drop-shadow-md">
                                                {project.projectName}
                                            </span>
                                            <span className="text-[10px] font-black text-white/80 drop-shadow-md">
                                                {project.progress}%
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Footer / Legend */}
            <div className="bg-subtle-background/30 px-6 py-3 border-t border-border/40 flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded shadow-sm bg-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Completed Velocity</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded shadow-sm bg-primary/20 border border-primary/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Projected Timeline</span>
                </div>
            </div>
        </div>
    );
};

export default GanttChart;