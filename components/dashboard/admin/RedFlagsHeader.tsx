import React, { useState, useMemo } from 'react';
import { ExclamationTriangleIcon, FireIcon, HandThumbDownIcon, ShieldExclamationIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Card } from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeamTasks } from '../../../hooks/useTeamTasks';
import { Task, TaskStatus } from '../../../types';
import { USERS } from '../../../constants';

export interface RedFlag {
    id: string;
    type: 'overdue' | 'complaint' | 'validation';
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    entityId?: string;
    timestamp: Date;
    assigneeName?: string;
}

const RedFlagsHeader: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { tasks, loading } = useTeamTasks();

    const flags = useMemo(() => {
        const generatedFlags: RedFlag[] = [];
        const now = new Date();

        // 1. Check for Overdue Tasks (Red Flag)
        tasks.forEach(task => {
            if (task.status !== TaskStatus.COMPLETED && task.deadline) {
                const deadline = new Date(task.deadline);
                const diffHours = (now.getTime() - deadline.getTime()) / (1000 * 60 * 60);

                if (diffHours > 24) {
                    // Overdue by more than 24 hours -> High Severity Red Flag
                    const assignee = USERS.find(u => u.id === task.userId)?.name || 'Unknown User';
                    generatedFlags.push({
                        id: `overdue-${task.id}`,
                        type: 'overdue',
                        severity: 'high',
                        title: `Overdue Task: ${task.title}`,
                        description: `${assignee} is late by ${Math.floor(diffHours)} hours on this task.`,
                        entityId: task.id,
                        timestamp: deadline,
                        assigneeName: assignee
                    });
                } else if (diffHours > 0) {
                    // Overdue but less than 24 hours -> Medium Severity
                    const assignee = USERS.find(u => u.id === task.userId)?.name || 'Unknown User';
                    generatedFlags.push({
                        id: `late-${task.id}`,
                        type: 'overdue',
                        severity: 'medium',
                        title: `Late Task: ${task.title}`,
                        description: `${assignee} is late by ${Math.floor(diffHours)} hours.`,
                        entityId: task.id,
                        timestamp: deadline,
                        assigneeName: assignee
                    });
                }
            }
        });

        // Sort by severity (high first) then timestamp
        return generatedFlags.sort((a, b) => {
            if (a.severity === b.severity) {
                return b.timestamp.getTime() - a.timestamp.getTime();
            }
            return a.severity === 'high' ? -1 : 1;
        });
    }, [tasks]);

    if (loading) return (
        <Card className="bg-surface mb-8 border-l-4 border-l-border p-4 animate-pulse">
            <div className="h-6 w-1/3 bg-subtle-background rounded mb-2"></div>
            <div className="h-4 w-1/4 bg-subtle-background rounded"></div>
        </Card>
    );

    if (flags.length === 0) return null;

    const highSeverityCount = flags.filter(f => f.severity === 'high').length;

    return (
        <Card className="bg-red-50/50 border-l-4 border-l-error mb-8 overflow-hidden">
            <div
                className="flex items-center justify-between cursor-pointer p-4"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-error text-white rounded-xl shadow-lg shadow-error/20 animate-pulse">
                        <FireIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                            CRITICAL ATTENTION REQUIRED
                            {highSeverityCount > 0 && (
                                <span className="px-2 py-0.5 bg-error text-white text-[10px] rounded-full">
                                    {highSeverityCount} HIGH PRIORITY
                                </span>
                            )}
                        </h3>
                        <p className="text-sm text-text-secondary font-medium">
                            {flags.length} critical issues require your immediate action.
                        </p>
                    </div>
                </div>

                <button className="text-text-tertiary hover:text-text-primary transition-colors text-sm font-bold uppercase tracking-wider">
                    {isExpanded ? 'Collapse View' : 'View Details'}
                </button>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white/50 border-t border-error/10"
                    >
                        <div className="p-4 grid gap-3 max-h-[400px] overflow-y-auto">
                            {flags.map(flag => (
                                <div key={flag.id} className="flex items-start gap-4 p-3 bg-white rounded-lg border border-border shadow-sm hover:shadow-md transition-all">
                                    <div className={`mt-1 p-1.5 rounded-lg ${flag.severity === 'high' ? 'bg-red-100 text-red-600' :
                                            'bg-orange-100 text-orange-600'
                                        }`}>
                                        {flag.type === 'overdue' && <ClockIcon className="w-4 h-4" />}
                                        {flag.type === 'complaint' && <HandThumbDownIcon className="w-4 h-4" />}
                                        {flag.type === 'validation' && <ShieldExclamationIcon className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <h4 className="font-bold text-text-primary">{flag.title}</h4>
                                            <span className="text-xs text-text-tertiary">Due: {flag.timestamp.toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-text-secondary mt-1">{flag.description}</p>
                                        {flag.assigneeName && (
                                            <p className="text-xs text-text-tertiary mt-1 font-medium">
                                                Assignee: {flag.assigneeName}
                                            </p>
                                        )}
                                    </div>
                                    <button className="px-3 py-1.5 text-xs font-bold bg-subtle-background hover:bg-primary hover:text-white rounded-lg transition-colors">
                                        ACT
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};

export default RedFlagsHeader;
