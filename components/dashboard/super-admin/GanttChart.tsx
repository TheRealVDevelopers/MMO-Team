import React, { useMemo } from 'react';
import { Project } from '../../../types';

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
        const diff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24) + 1; // +1 to include end date
        return (diff / totalDays) * 100;
    };

    const monthGridColumns = useMemo(() => {
        return months.map(m => `${(m.days / totalDays) * 100}%`).join(' ')
    }, [months, totalDays]);

    return (
        <div className="text-sm bg-surface">
            {/* Header */}
            <div className="flex sticky top-0 bg-surface z-10">
                <div className="w-48 flex-shrink-0 border-r border-t border-l border-border p-2 text-xs font-bold text-text-secondary bg-subtle-background">Project Name</div>
                <div className="flex-1 grid" style={{ gridTemplateColumns: monthGridColumns }}>
                    {months.map((month, index) => (
                        <div key={index} className="text-center text-xs font-bold text-text-secondary p-2 border-t border-r border-border bg-subtle-background">
                            {month.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Rows */}
            <div className="relative border-b border-l border-r border-border">
                {/* Vertical grid lines for months */}
                 <div className="absolute top-0 left-48 h-full flex" style={{ width: 'calc(100% - 12rem)' }}>
                    {months.slice(0, -1).reduce((acc, month) => {
                        const days = (acc.length > 0 ? acc[acc.length-1].days : 0) + month.days;
                        acc.push({ days });
                        return acc;
                    }, [] as {days: number}[])
                    .map((cumulative, index) => {
                        const left = (cumulative.days / totalDays) * 100;
                        return (
                             <div key={index} className="absolute top-0 h-full w-px bg-border/70" style={{ left: `${left}%` }}></div>
                        )
                    })}
                </div>

                {projects.map((project, index) => (
                    <div key={project.id} className={`flex items-center h-12 ${index < projects.length - 1 ? 'border-b border-border' : ''}`}>
                        <div className="w-48 flex-shrink-0 text-xs font-medium truncate px-2 border-r border-border h-full flex items-center bg-subtle-background">
                            {project.projectName}
                        </div>
                        <div className="flex-1 h-full relative px-1">
                            <div
                                title={`${project.projectName}\nProgress: ${project.progress}%`}
                                className="absolute top-3 h-6 rounded group cursor-pointer"
                                onClick={() => onProjectSelect && onProjectSelect(project)}
                                style={{
                                    left: `${getPosition(project.startDate)}%`,
                                    width: `${getWidth(project.startDate, project.endDate)}%`,
                                }}
                            >
                                <div className="h-full bg-primary/20 rounded border border-primary/50 relative overflow-hidden transition-all duration-300 group-hover:shadow-lg">
                                     <div 
                                        className="h-full bg-primary rounded-l transition-all duration-500"
                                        style={{ width: `${project.progress}%` }}
                                    />
                                    <span className="absolute inset-0 left-2 flex items-center text-xs text-white font-semibold truncate pr-2" style={{textShadow: '0 1px 2px rgba(0,0,0,0.4)'}}>
                                        {project.projectName}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GanttChart;