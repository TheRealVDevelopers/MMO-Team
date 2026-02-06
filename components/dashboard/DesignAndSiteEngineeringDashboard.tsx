import React, { useState, useEffect, useMemo } from 'react';
import { DrawingTask, SiteVisit, Project, Lead, LeadPipelineStatus, DesignSiteProjectStatus, UserRole, ProjectStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useLeads, updateLead } from '../../hooks/useLeads';
import { useAutomatedTaskCreation } from '../../hooks/useAutomatedTaskCreation';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import ProjectsWorkflowPage from './design-site-team/ProjectsWorkflowPage';
import MyPerformancePage from './drawing-team/MyPerformancePage';

// Status values relevant for Design & Site Engineering workflow
const DESIGN_SITE_WORKFLOW_STATUSES = [
    ProjectStatus.SITE_VISIT_PENDING,
    ProjectStatus.SITE_VISIT_RESCHEDULED,
    ProjectStatus.DRAWING_PENDING,
    ProjectStatus.DESIGN_IN_PROGRESS,
    ProjectStatus.REVISIONS_IN_PROGRESS,
    ProjectStatus.AWAITING_DESIGN,
    ProjectStatus.AWAITING_QUOTATION,
    ProjectStatus.BOQ_PENDING,
    'Site Visit Pending',
    'Site Visit Rescheduled',
    'Drawing Pending',
    'Design In Progress',
    'Revisions In Progress',
    'Awaiting Design',
    'Awaiting Quotation',
    'BOQ Pending'
];

const DesignAndSiteEngineeringDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
    const { currentUser } = useAuth();
    const { projects, loading: projectsLoading, updateProject } = useProjects();
    const { leads, loading: leadsLoading } = useLeads();

    const loading = projectsLoading || leadsLoading;

    // Convert leads with site visit status to Project-like objects
    const leadsAsProjects: Project[] = useMemo(() => {
        // Early return if no leads available
        if (!leads || leads.length === 0) {
            console.log('[DesignAndSiteEngineeringDashboard] No leads available for conversion');
            return [];
        }

        const siteVisitLeadStatuses = [
            LeadPipelineStatus.SITE_VISIT_SCHEDULED,
            LeadPipelineStatus.SITE_VISIT_RESCHEDULED,
            'Site Visit Scheduled',
            'Site Visit Rescheduled'
        ];

        const drawingLeadStatuses = [
            LeadPipelineStatus.WAITING_FOR_DRAWING,
            LeadPipelineStatus.DRAWING_IN_PROGRESS,
            LeadPipelineStatus.DRAWING_REVISIONS,
            'Waiting for Drawing',
            'Drawing In Progress',
            'Drawing Revisions'
        ];

        const converted = leads
            .filter(lead => {
                // Only include leads in relevant statuses for this workflow
                const isInSiteVisitStatus = siteVisitLeadStatuses.includes(lead.status as any);
                const isInDrawingStatus = drawingLeadStatuses.includes(lead.status as any);
                return isInSiteVisitStatus || isInDrawingStatus;
            })
            .map(lead => {
                // Convert Lead to Project-compatible format
                // Map lead status to project status
                const leadStatus = lead.status as string;
                let projectStatus: ProjectStatus;
                if (leadStatus === LeadPipelineStatus.SITE_VISIT_SCHEDULED) {
                    projectStatus = ProjectStatus.SITE_VISIT_PENDING;
                } else if (leadStatus === LeadPipelineStatus.SITE_VISIT_RESCHEDULED) {
                    projectStatus = ProjectStatus.SITE_VISIT_RESCHEDULED;
                } else if (leadStatus === LeadPipelineStatus.WAITING_FOR_DRAWING) {
                    projectStatus = ProjectStatus.DRAWING_PENDING;
                } else if (leadStatus === LeadPipelineStatus.DRAWING_IN_PROGRESS) {
                    projectStatus = ProjectStatus.DESIGN_IN_PROGRESS;
                } else if (leadStatus === LeadPipelineStatus.DRAWING_REVISIONS) {
                    projectStatus = ProjectStatus.REVISIONS_IN_PROGRESS;
                } else {
                    projectStatus = ProjectStatus.SITE_VISIT_PENDING; // Default fallback
                }

                const convertedProject: Project = {
                    id: `lead-${lead.id}`, // Prefix to distinguish from regular projects
                    clientName: lead.clientName,
                    projectName: lead.projectName,
                    status: projectStatus,
                    priority: lead.priority,
                    budget: lead.value || 0,
                    advancePaid: 0,
                    clientAddress: '',
                    clientContact: {
                        name: lead.clientName,
                        phone: lead.clientMobile || ''
                    },
                    progress: 0,
                    assignedTeam: {
                        site_engineer: lead.assignedTo,
                    },
                    milestones: [],
                    startDate: lead.inquiryDate || new Date(),
                    endDate: lead.deadline || new Date(),
                    createdAt: lead.inquiryDate,
                    is_demo: lead.is_demo,
                    // Mark this as originating from a lead
                    convertedFromLeadId: lead.id,
                };

                console.log(`[DesignAndSiteEngineeringDashboard] Converted Lead to Project: ${lead.projectName}, LeadStatus: ${lead.status} -> ProjectStatus: ${projectStatus}`);
                return convertedProject;
            });

        console.log(`[DesignAndSiteEngineeringDashboard] Converted ${converted.length} leads to projects`);
        return converted;
    }, [leads]);

    // Filter projects assigned to this team member or all if manager
    // STRICT FILTERING: Only show projects assigned to the current user
    const myProjects = useMemo(() => {
        // Defensive check: ensure arrays exist
        const safeProjects = projects || [];
        const safeLeadsAsProjects = leadsAsProjects || [];

        // Combine real projects with converted leads
        const allProjects = [...safeProjects, ...safeLeadsAsProjects];

        console.log('[DesignAndSiteEngineeringDashboard] Total projects from Firebase:', safeProjects.length);
        console.log('[DesignAndSiteEngineeringDashboard] Total leads converted to projects:', safeLeadsAsProjects.length);
        console.log('[DesignAndSiteEngineeringDashboard] Combined total:', allProjects.length);
        console.log('[DesignAndSiteEngineeringDashboard] Current user:', currentUser?.id, currentUser?.role);

        // Early return if no projects available
        if (allProjects.length === 0) {
            console.log('[DesignAndSiteEngineeringDashboard] No projects available to filter');
            return [];
        }

        const filtered = allProjects.filter(p => {
            // Check if user is a manager/admin - they see everything
            const isManager = ['Super Admin', 'Admin', 'admin', 'Manager', 'manager', UserRole.SUPER_ADMIN, UserRole.SALES_GENERAL_MANAGER].includes(currentUser?.role || '');
            if (isManager) {
                return true;
            }

            // STRICT FILTERING for non-managers:
            // Check if user is assigned to this project in any role
            const isAssignedEngineer = p.assignedEngineerId === currentUser?.id;
            const isDrawingTeamMember = p.drawingTeamMemberId === currentUser?.id;
            const isInExecutionTeam = p.assignedTeam?.execution?.includes(currentUser?.id || '');
            const isSiteEngineer = p.assignedTeam?.site_engineer === currentUser?.id;
            const isDrawingAssigned = p.assignedTeam?.drawing === currentUser?.id;

            // Also check the generic assignedTo field (for leads)
            const isGenericAssigned = (p as any).assignedTo === currentUser?.id;

            // STRICT: Only include if user is explicitly assigned
            const shouldInclude =
                isAssignedEngineer ||
                isDrawingTeamMember ||
                isInExecutionTeam ||
                isSiteEngineer ||
                isDrawingAssigned ||
                isGenericAssigned;

            if (shouldInclude) {
                console.log(`[DesignAndSiteEngineeringDashboard] INCLUDED: ${p.projectName}, Status: ${p.status}, IsFromLead: ${p.id.startsWith('lead-')}`);
            }

            return shouldInclude;
        });

        console.log('[DesignAndSiteEngineeringDashboard] Filtered projects for user:', filtered.length);
        return filtered;
    }, [projects, leadsAsProjects, currentUser?.id, currentUser?.role]);

    // Unified update handler that handles both projects and leads
    const handleUpdateProjectOrLead = async (id: string, updates: Partial<Project>) => {
        // Check if this is a lead-sourced project (prefixed with 'lead-')
        if (id.startsWith('lead-')) {
            const actualLeadId = id.replace('lead-', '');
            console.log(`[DesignAndSiteEngineeringDashboard] Updating LEAD: ${actualLeadId}`, updates);

            // Map project status back to lead status
            let leadUpdates: Partial<Lead> = {};

            if (updates.status) {
                switch (updates.status) {
                    case ProjectStatus.DRAWING_PENDING:
                        leadUpdates.status = LeadPipelineStatus.WAITING_FOR_DRAWING;
                        console.log('[DesignAndSiteEngineeringDashboard] Mapped status to WAITING_FOR_DRAWING');
                        break;
                    case ProjectStatus.DESIGN_IN_PROGRESS:
                        leadUpdates.status = LeadPipelineStatus.DRAWING_IN_PROGRESS;
                        break;
                    case ProjectStatus.REVISIONS_IN_PROGRESS:
                        leadUpdates.status = LeadPipelineStatus.DRAWING_REVISIONS;
                        break;
                    case ProjectStatus.AWAITING_QUOTATION:
                        leadUpdates.status = LeadPipelineStatus.WAITING_FOR_QUOTATION;
                        break;
                    default:
                        // Keep original status for unmapped statuses
                        console.log('[DesignAndSiteEngineeringDashboard] No status mapping for:', updates.status);
                        break;
                }
            }

            console.log('[DesignAndSiteEngineeringDashboard] Updating lead with:', leadUpdates);
            await updateLead(actualLeadId, leadUpdates);
        } else {
            console.log(`[DesignAndSiteEngineeringDashboard] Updating PROJECT: ${id}`, updates);
            await updateProject(id, updates);
        }
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'my-day':
                return <MyDayPage />;
            case 'projects-board':
                return (
                    <ProjectsWorkflowPage
                        projects={myProjects}
                        loading={loading}
                        onUpdateProject={handleUpdateProjectOrLead}
                        setCurrentPage={setCurrentPage}
                    />
                );
            case 'performance':
                return <MyPerformancePage setCurrentPage={setCurrentPage} />;
            case 'communication':
                return <CommunicationDashboard />;
            case 'escalate-issue':
                return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
            case 'create-quotation':
                return (
                    <ProjectsWorkflowPage
                        projects={myProjects}
                        loading={loading}
                        onUpdateProject={handleUpdateProjectOrLead}
                        setCurrentPage={setCurrentPage}
                    />
                );
            default:
                return <MyDayPage />;
        }
    };

    return renderPage();
};

export default DesignAndSiteEngineeringDashboard;
