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
    const { cases, loading } = useCases();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showLeads, setShowLeads] = useState(true);

    if (!currentUser) return null;

    // Debug: Log what we're getting
    console.log('ProjectsListPage - Total cases:', cases.length);
    console.log('ProjectsListPage - Cases with isProject=true:', cases.filter(c => c.isProject === true).length);
    console.log('ProjectsListPage - Cases with isProject=false:', cases.filter(c => c.isProject === false).length);
    console.log('ProjectsListPage - Cases with isProject undefined:', cases.filter(c => c.isProject === undefined).length);

    // Filter: Show projects and optionally leads
    // Note: If isProject is undefined, treat as project for backward compatibility
    const allItems = cases.filter(c => {
        // Explicitly marked as project, OR isProject is undefined (legacy projects)
        if (c.isProject === true || c.isProject === undefined) return true;
        // Explicitly marked as lead - show only if toggle is on
        if (showLeads && c.isProject === false) return true;
        return false;
    });

    // Filter by search
    const filteredItems = allItems.filter(item => 
        item.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary mb-2">Projects & Leads</h1>
                        <p className="text-text-secondary">View all project details, drawings, BOQs, and quotations</p>
                        <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-text-tertiary">Projects: <span className="font-bold text-primary">{projectCount}</span></span>
                            <span className="text-text-tertiary">Leads: <span className="font-bold text-purple-500">{leadCount}</span></span>
                        </div>
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

                {/* Projects & Leads Grid */}
                {filteredItems.length === 0 ? (
                    <Card>
                        <div className="p-12 text-center">
                            <p className="text-text-secondary">No {showLeads ? 'projects or leads' : 'projects'} found</p>
                        </div>
                    </Card>
                ) : (
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
                                            {item.projectName}
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
                                                {formatCurrencyINR(item.budget)}
                                            </p>
                                        )}

                                        {/* Progress Bar (only for projects) */}
                                        {!isLead && item.progress !== undefined && (
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs text-text-tertiary mb-1">
                                                    <span>Progress</span>
                                                    <span>{item.progress}%</span>
                                                </div>
                                                <div className="w-full bg-border rounded-full h-2">
                                                    <div 
                                                        className="bg-primary h-2 rounded-full transition-all"
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </div>
                                            </div>
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
                )}
            </div>
        </div>
    );
};

export default ProjectsListPage;
