import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCases } from '../../../hooks/useCases';
import { Case, UserRole } from '../../../types';
import { formatCurrencyINR } from '../../../constants';
import Card from '../../shared/Card';
import { PrimaryButton, cn } from './DashboardUI';

/**
 * Simple Projects List Page
 * Shows all projects AND leads with "View Details" button
 */

const ProjectsListPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { cases, loading } = useCases({
        organizationId: currentUser?.organizationId
    });
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showLeads, setShowLeads] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    if (!currentUser) return null;

    // Debug: Log what we're getting
    console.log('ProjectsListPage - Total cases:', cases?.length || 0);
    console.log('ProjectsListPage - Cases with isProject=true:', cases?.filter(c => c.isProject === true).length || 0);
    console.log('ProjectsListPage - Cases with isProject=false:', cases?.filter(c => c.isProject === false).length || 0);
    console.log('ProjectsListPage - Cases with isProject undefined:', cases?.filter(c => c.isProject === undefined).length || 0);

    // Filter: Show projects and optionally leads
    // Note: If isProject is undefined, treat as project for backward compatibility
    // Filter: Show projects and optionally leads
    // Note: If isProject is undefined, treat as project for backward compatibility
    const allItems = cases.filter(c => {
        // 1. Basic type filter (Project vs Lead)
        let matchesType = false;
        if (c.isProject === true || c.isProject === undefined) matchesType = true;
        else if (showLeads && c.isProject === false) matchesType = true;

        if (!matchesType) return false;

        // 2. Role-based Restriction Filter
        // If user is Manager/Admin, show everything.
        const isManager = [UserRole.SUPER_ADMIN, UserRole.SALES_GENERAL_MANAGER, 'Manager', 'Admin'].includes(currentUser.role);
        if (isManager) return true;

        // For restricted roles (Drawing/Site), only show assigned items
        const isRestrictedRole = [UserRole.DRAWING_TEAM, UserRole.SITE_ENGINEER, UserRole.DESIGNER].includes(currentUser.role);

        if (isRestrictedRole) {
            const project = c as any;
            const isAssignedEngineer = project.assignedEngineerId === currentUser.id;
            const isDrawingTeamMember = project.drawingTeamMemberId === currentUser.id;
            const isInExecutionTeam = project.assignedTeam?.execution?.includes(currentUser.id);
            const isSiteEngineer = project.assignedTeam?.site_engineer === currentUser.id;
            const isDrawingAssigned = project.assignedTeam?.drawing === currentUser.id;
            const isGenericAssigned = project.assignedTo === currentUser.id;

            return isAssignedEngineer || isDrawingTeamMember || isInExecutionTeam || isSiteEngineer || isDrawingAssigned || isGenericAssigned;
        }

        // Default allow for other roles (Sales, etc. usually see their own leads, but this page is 'Reference' so maybe restricted too? 
        // For now, only enforcing restriction for the requested teams as per instruction)
        return true;
    });

    // Filter by search
    const filteredItems = allItems.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Count projects and leads
    // Note: undefined isProject is treated as project for backward compatibility
    const projectCount = filteredItems.filter(i => i.isProject === true || i.isProject === undefined).length;
    const leadCount = filteredItems.filter(i => i.isProject === false).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-text-secondary">Loading projects...</p>
            </div>
        );
    }



    // ... (existing code)

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary mb-2">References</h1>
                        <p className="text-text-secondary">View all project details, drawings, BOQs, and quotations</p>
                        <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-text-tertiary">Projects: <span className="font-bold text-primary">{projectCount}</span></span>
                            <span className="text-text-tertiary">Leads: <span className="font-bold text-purple-500">{leadCount}</span></span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {/* View Toggle */}
                        <div className="flex bg-surface border border-border rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "p-2 rounded-md transition-all",
                                    viewMode === 'grid' ? "bg-primary/10 text-primary" : "text-text-tertiary hover:text-text-primary"
                                )}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={cn(
                                    "p-2 rounded-md transition-all",
                                    viewMode === 'table' ? "bg-primary/10 text-primary" : "text-text-tertiary hover:text-text-primary"
                                )}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowLeads(!showLeads)}
                            className={cn(
                                "px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2",
                                showLeads
                                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-600"
                                    : "bg-surface border border-border text-text-secondary hover:bg-subtle-background"
                            )}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {showLeads ? 'Showing Leads' : 'Leads Hidden'}
                        </button>
                    </div>
                </div>

                {/* Search */}
                <Card className="mb-6">
                    <div className="p-4">
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </Card>

                {/* Projects & Leads Grid/Table */}
                {filteredItems.length === 0 ? (
                    <Card>
                        <div className="p-12 text-center">
                            <p className="text-text-secondary">No {showLeads ? 'projects or leads' : 'projects'} found</p>
                        </div>
                    </Card>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map(item => {
                            const isLead = item.isProject === false;
                            return (
                                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                                    <div className="p-6">
                                        {/* Status Badge + Type Badge */}
                                        <div className="mb-4 flex gap-2 flex-wrap">
                                            <span className={cn(
                                                "inline-block px-3 py-1 rounded-full text-xs font-medium",
                                                isLead ? "bg-purple-500/10 text-purple-500" : "bg-primary/10 text-primary"
                                            )}>
                                                {item.status}
                                            </span>
                                            {isLead && (
                                                <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-purple-500 text-white">
                                                    Lead
                                                </span>
                                            )}
                                        </div>

                                        {/* Project/Lead Info */}
                                        <h3 className="text-xl font-bold text-text-primary mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-text-secondary mb-4">
                                            {item.clientName}
                                        </p>

                                        {/* Budget */}
                                        {item.budget && (
                                            <p className={cn(
                                                "text-lg font-bold mb-4",
                                                isLead ? "text-purple-500" : "text-primary"
                                            )}>
                                                {formatCurrencyINR(item.budget?.totalBudget || 0)}
                                            </p>
                                        )}

                                        {/* View Details Button */}
                                        <PrimaryButton
                                            onClick={() => navigate(`/projects/${item.id}`)}
                                            className="w-full"
                                        >
                                            View Details
                                        </PrimaryButton>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    // TABLE VIEW
                    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-subtle-background">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Project / Client</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Documents</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {filteredItems.map(item => {
                                    const isLead = item.isProject === false;
                                    // Note: Documents are now in subcollection, not inline
                                    // This would require a separate query - for now show empty
                                    const docs: any[] = [];
                                    const latestDocs = docs.sort((a, b) => {
                                        const dateA = new Date(a.uploadedAt || a.uploaded || 0).getTime();
                                        const dateB = new Date(b.uploadedAt || b.uploaded || 0).getTime();
                                        return dateB - dateA;
                                    }).slice(0, 3); // Show top 3

                                    return (
                                        <tr key={item.id} className="hover:bg-subtle-background/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-text-primary">{item.title}</span>
                                                    <span className="text-xs text-text-secondary">{item.clientName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
                                                    isLead ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                                )}>
                                                    {isLead ? 'Lead' : 'Project'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-text-secondary">{item.status}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {docs.length === 0 ? (
                                                        <span className="text-xs text-text-tertiary italic">No docs</span>
                                                    ) : (
                                                        <>
                                                            {latestDocs.map((doc: any, i) => (
                                                                <a
                                                                    key={i}
                                                                    href={doc.fileUrl || doc.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="group relative p-1.5 bg-subtle-background hover:bg-primary/10 rounded-lg transition-colors border border-border"
                                                                    title={doc.fileName || doc.name}
                                                                >
                                                                    <svg className="w-4 h-4 text-text-secondary group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                                </a>
                                                            ))}
                                                            {docs.length > 3 && (
                                                                <span className="text-xs text-text-tertiary self-center">+{docs.length - 3} more</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <PrimaryButton
                                                    onClick={() => navigate(`/projects/${item.id}`)}
                                                    className="px-3 py-1 text-xs"
                                                >
                                                    View
                                                </PrimaryButton>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsListPage;
