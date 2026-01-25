import { useState } from 'react';
import { Lead, Project, ProjectStatus, LeadPipelineStatus } from '../types';
import { USERS, PROJECTS } from '../constants'; // In real app, this would be an API call

export const useLeadToProjectConversion = () => {
    const [isConverting, setIsConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const convertLeadToProject = async (lead: Lead, organizationId: string, paymentDetails: any): Promise<Project | null> => {
        setIsConverting(true);
        setError(null);

        try {
            // Simulator API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 1. Create new Project Object
            const newProject: Project = {
                id: `proj-${Date.now()}`, // Generate ID
                organizationId: organizationId,
                clientName: lead.clientName,
                projectName: lead.projectName,
                status: ProjectStatus.AWAITING_DESIGN, // Initial status
                priority: lead.priority,
                budget: lead.value,
                advancePaid: paymentDetails.amount, // From confirmation
                clientAddress: 'Address Pending', // To be filled in wizard
                clientContact: {
                    name: lead.clientName,
                    phone: lead.clientMobile
                },
                progress: 0,
                assignedTeam: {
                    // Pre-fill if known, otherwise empty
                },
                milestones: [],
                startDate: new Date(),
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // Default 3 months
                totalExpenses: 0,
                salespersonId: lead.assignedTo,
                history: [
                    ...(lead.history || []),
                    {
                        action: 'Converted to Project',
                        user: 'System',
                        timestamp: new Date(),
                        notes: `Converted from Lead ${lead.id} after advance payment of ${paymentDetails.amount}`
                    }
                ],
                documents: lead.files?.map(f => ({
                    id: f.id,
                    name: f.fileName,
                    type: 'pdf', // simplification
                    url: f.fileUrl,
                    uploaded: f.uploadedAt,
                    size: 'Unknown'
                })) || [],
                convertedFromLeadId: lead.id,
                conversionDate: new Date(),
                paymentTerms: [] // To be set in wizard
            };

            // 2. Logic to update Lead status would go here (mocked)
            // lead.status = LeadPipelineStatus.WON;

            return newProject;

        } catch (err: any) {
            setError(err.message || 'Conversion failed');
            return null;
        } finally {
            setIsConverting(false);
        }
    };

    return { convertLeadToProject, isConverting, error };
};
