import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, Timestamp, orderBy, getDocs } from 'firebase/firestore';
import { TeamMemberSession, Lead, ImportedLead, LeadAssignment, UserRole, LeadPipelineStatus, LeadHistory } from '../types';
import { addLead } from './useLeads';
import { createNotification } from '../services/liveDataService';
import { USERS } from '../constants';

// Convert Firestore Timestamp to Date
type FirestoreSession = Omit<TeamMemberSession, 'loginTime'> & {
    loginTime: Timestamp;
};

const fromFirestore = (docData: FirestoreSession, id: string): TeamMemberSession => {
    return {
        ...docData,
        loginTime: docData.loginTime.toDate(),
    };
};

/**
 * Hook to manage smart assignment of leads based on team member login order
 */
export const useSmartAssignment = () => {
    const [sessions, setSessions] = useState<TeamMemberSession[]>([]);
    const [assignmentQueue, setAssignmentQueue] = useState<LeadAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    // Listen to active sessions (sales team members who have logged in)
    useEffect(() => {
        const sessionsRef = collection(db, 'teamSessions');
        const q = query(
            sessionsRef,
            where('role', '==', UserRole.SALES_TEAM_MEMBER),
            where('isActive', '==', true),
            orderBy('loginTime', 'asc') // Order by login time (first login first)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessionsData: TeamMemberSession[] = [];
            snapshot.forEach((doc) => {
                sessionsData.push(fromFirestore(doc.data() as FirestoreSession, doc.id));
            });
            setSessions(sessionsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    /**
     * Distribute leads among active team members based on login order
     * Algorithm: First login gets more leads, distributed proportionally
     * Example: 10 leads, 3 members -> 4, 3, 3
     */
    const distributeLeads = async (
        leads: ImportedLead[],
        assignedBy: string,
        method: 'auto' | 'import' = 'auto'
    ): Promise<string[]> => {
        if (sessions.length === 0) {
            throw new Error('No active sales team members available for assignment');
        }

        if (leads.length === 0) {
            return [];
        }

        const totalLeads = leads.length;
        const totalMembers = sessions.length;
        const baseLeadsPerMember = Math.floor(totalLeads / totalMembers);
        const extraLeads = totalLeads % totalMembers;

        const distribution: { [userId: string]: number } = {};

        // Calculate distribution
        sessions.forEach((session, index) => {
            // First few members get one extra lead if there's a remainder
            distribution[session.userId] = baseLeadsPerMember + (index < extraLeads ? 1 : 0);
        });

        const assignedLeadIds: string[] = [];
        let leadIndex = 0;

        // Assign leads to team members
        for (const session of sessions) {
            const leadsToAssign = distribution[session.userId];

            for (let i = 0; i < leadsToAssign && leadIndex < totalLeads; i++) {
                const importedLead = leads[leadIndex];

                // Create full lead object
                const newLead: Omit<Lead, 'id'> = {
                    clientName: importedLead.clientName,
                    projectName: importedLead.projectName,
                    clientEmail: importedLead.clientEmail,
                    clientMobile: importedLead.clientMobile,
                    value: importedLead.value,
                    source: importedLead.source,
                    priority: importedLead.priority,
                    status: LeadPipelineStatus.NEW_NOT_CONTACTED,
                    lastContacted: 'Not contacted',
                    assignedTo: session.userId,
                    inquiryDate: new Date(),
                    history: [
                        {
                            action: `Lead auto-assigned via ${method}`,
                            user: 'System',
                            timestamp: new Date(),
                            notes: `Assigned to ${session.userName} (login position ${sessions.indexOf(session) + 1})`,
                        },
                    ],
                    tasks: {},
                    reminders: [],
                };

                try {
                    // Add lead to database
                    const leadId = await addLead(newLead, assignedBy);
                    assignedLeadIds.push(leadId);

                    // Create assignment log
                    await addDoc(collection(db, 'leadAssignments'), {
                        leadId,
                        assignedTo: session.userId,
                        assignedBy,
                        assignedAt: new Date(),
                        distributionMethod: method,
                        queuePosition: leadIndex + 1,
                    });

                    // Notify team member
                    await createNotification({
                        title: 'New Lead Assigned',
                        message: `You have been assigned a new lead: ${importedLead.clientName} - ${importedLead.projectName}`,
                        user_id: session.userId,
                        entity_type: 'lead',
                        entity_id: leadId,
                        type: 'info',
                    });

                    leadIndex++;
                } catch (error) {
                    console.error('Error assigning lead:', error);
                    throw error;
                }
            }
        }

        return assignedLeadIds;
    };

    /**
     * Get the next available team member for assignment (round-robin)
     */
    const getNextAvailableTeamMember = (): TeamMemberSession | null => {
        if (sessions.length === 0) return null;
        // Return first in login order
        return sessions[0];
    };

    /**
     * Get distribution summary for UI display
     */
    const getDistributionSummary = (leadCount: number) => {
        if (sessions.length === 0) {
            return { assignments: [], totalMembers: 0 };
        }

        const totalMembers = sessions.length;
        const baseLeadsPerMember = Math.floor(leadCount / totalMembers);
        const extraLeads = leadCount % totalMembers;

        const assignments = sessions.map((session, index) => ({
            userId: session.userId,
            userName: session.userName,
            assignedCount: baseLeadsPerMember + (index < extraLeads ? 1 : 0),
            loginPosition: index + 1,
        }));

        return { assignments, totalMembers };
    };

    return {
        sessions,
        assignmentQueue,
        loading,
        distributeLeads,
        getNextAvailableTeamMember,
        getDistributionSummary,
    };
};
