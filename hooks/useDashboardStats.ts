
import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import {
    collection,
    onSnapshot,
    query,
    where,
    getCountFromServer
} from 'firebase/firestore';
import { useLeads } from './useLeads';
import { useProjects } from './useProjects';
import { LeadPipelineStatus, ProjectStatus } from '../types';
import { useTimeEntries } from './useTimeTracking';

interface DashboardStats {
    // Lead Statistics
    totalLeads: number;
    leadsThisMonth: number;
    leadsLastMonth: number;
    leadsTrend: string;
    leadsTrendPositive: boolean;
    
    // Conversion Statistics
    conversionRate: number;
    conversionRateLastMonth: number;
    conversionTrend: string;
    conversionTrendPositive: boolean;
    
    // Project Statistics
    activeProjects: number;
    projectsWon: number;
    projectsWonLastMonth: number;
    projectsTrend: string;
    projectsTrendPositive: boolean;
    
    // Revenue Statistics
    totalRevenue: number;
    revenueLastMonth: number;
    revenueTrend: string;
    revenueTrendPositive: boolean;
    
    // Time Statistics (hours logged)
    hoursLoggedThisMonth: number;
    hoursLoggedLastMonth: number;
    timeTrend: string;
    timeTrendPositive: boolean;
    
    // General counts
    pendingApprovals: number;
    unreadNotifications: number;
}

export const useDashboardStats = (userId?: string) => {
    const { leads, loading: leadsLoading } = useLeads();
    const { projects, loading: projectsLoading } = useProjects();
    
    // Calculate date range for time entries (last 2 months for trend analysis)
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startDate = startOfLastMonth.toLocaleDateString('en-CA');
    const endDate = now.toLocaleDateString('en-CA');
    
    const { entries: allTimeEntries, loading: timeLoading } = useTimeEntries(userId || '', startDate, endDate);
    
    const [loading, setLoading] = useState(true);

    // Filter data by user if userId is provided
    const userLeads = useMemo(() => {
        if (userId) {
            return leads.filter(l => l.assignedTo === userId);
        }
        return leads;
    }, [leads, userId]);

    const userProjects = useMemo(() => {
        if (userId) {
            return projects.filter(p => p.salespersonId === userId);
        }
        return projects;
    }, [projects, userId]);

    const userTimeEntries = useMemo(() => {
        if (userId) {
            return allTimeEntries.filter(e => e.userId === userId);
        }
        return allTimeEntries;
    }, [allTimeEntries, userId]);

    const stats = useMemo<DashboardStats>(() => {
        // Get date ranges
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Calculate leads statistics
        const leadsThisMonth = userLeads.filter(l => l.inquiryDate >= startOfThisMonth);
        const leadsLastMonth = userLeads.filter(l => 
            l.inquiryDate >= startOfLastMonth && l.inquiryDate <= endOfLastMonth
        );
        
        const leadsTrendValue = leadsLastMonth.length > 0 
            ? ((leadsThisMonth.length - leadsLastMonth.length) / leadsLastMonth.length) * 100 
            : 0;
        
        // Calculate conversion statistics
        const wonThisMonth = leadsThisMonth.filter(l => l.status === LeadPipelineStatus.WON);
        const wonLastMonth = leadsLastMonth.filter(l => l.status === LeadPipelineStatus.WON);
        
        const conversionRate = leadsThisMonth.length > 0 
            ? (wonThisMonth.length / leadsThisMonth.length) * 100 
            : 0;
        const conversionRateLastMonth = leadsLastMonth.length > 0 
            ? (wonLastMonth.length / leadsLastMonth.length) * 100 
            : 0;
        
        const conversionTrendValue = conversionRateLastMonth > 0
            ? ((conversionRate - conversionRateLastMonth) / conversionRateLastMonth) * 100
            : 0;

        // Calculate project statistics
        const projectsWonThisMonth = wonThisMonth.length;
        const projectsWonLastMonth = wonLastMonth.length;
        
        const projectsTrendValue = projectsWonLastMonth > 0
            ? ((projectsWonThisMonth - projectsWonLastMonth) / projectsWonLastMonth) * 100
            : projectsWonThisMonth > 0 ? 100 : 0;

        // Calculate revenue statistics
        const revenueThisMonth = wonThisMonth.reduce((sum, l) => sum + (l.value || 0), 0);
        const revenueLastMonth = wonLastMonth.reduce((sum, l) => sum + (l.value || 0), 0);
        
        const revenueTrendValue = revenueLastMonth > 0
            ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
            : revenueThisMonth > 0 ? 100 : 0;

        // Calculate time tracking statistics
        const timeThisMonth = userTimeEntries.filter(e => {
            const entryDate = new Date(e.date);
            return entryDate >= startOfThisMonth;
        });
        const timeLastMonth = userTimeEntries.filter(e => {
            const entryDate = new Date(e.date);
            return entryDate >= startOfLastMonth && entryDate <= endOfLastMonth;
        });

        const hoursThisMonth = timeThisMonth.reduce((sum, e) => sum + (e.totalWorkHours || 0), 0);
        const hoursLastMonth = timeLastMonth.reduce((sum, e) => sum + (e.totalWorkHours || 0), 0);
        
        const timeTrendValue = hoursLastMonth > 0
            ? ((hoursThisMonth - hoursLastMonth) / hoursLastMonth) * 100
            : hoursThisMonth > 0 ? 100 : 0;

        // Active projects count
        const activeProjects = userProjects.filter(p => 
            [ProjectStatus.IN_EXECUTION, ProjectStatus.PROCUREMENT, ProjectStatus.DESIGN_IN_PROGRESS].includes(p.status)
        ).length;

        return {
            totalLeads: userLeads.length,
            leadsThisMonth: leadsThisMonth.length,
            leadsLastMonth: leadsLastMonth.length,
            leadsTrend: `${Math.abs(leadsTrendValue).toFixed(1)}%`,
            leadsTrendPositive: leadsTrendValue >= 0,
            
            conversionRate: conversionRate,
            conversionRateLastMonth: conversionRateLastMonth,
            conversionTrend: `${Math.abs(conversionTrendValue).toFixed(1)}%`,
            conversionTrendPositive: conversionTrendValue >= 0,
            
            activeProjects: activeProjects,
            projectsWon: projectsWonThisMonth,
            projectsWonLastMonth: projectsWonLastMonth,
            projectsTrend: `${Math.abs(projectsTrendValue).toFixed(0)}`,
            projectsTrendPositive: projectsTrendValue >= 0,
            
            totalRevenue: revenueThisMonth,
            revenueLastMonth: revenueLastMonth,
            revenueTrend: `${Math.abs(revenueTrendValue).toFixed(1)}%`,
            revenueTrendPositive: revenueTrendValue >= 0,
            
            hoursLoggedThisMonth: hoursThisMonth,
            hoursLoggedLastMonth: hoursLastMonth,
            timeTrend: `${Math.abs(timeTrendValue).toFixed(1)}%`,
            timeTrendPositive: timeTrendValue >= 0,
            
            pendingApprovals: 0, // TODO: Implement with approval system
            unreadNotifications: 0 // TODO: Implement with notification system
        };
    }, [userLeads, userProjects, userTimeEntries]);

    useEffect(() => {
        if (!leadsLoading && !projectsLoading && !timeLoading) {
            setLoading(false);
        }
    }, [leadsLoading, projectsLoading, timeLoading]);

    return { stats, loading };
};
