
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Lead, LeadHistory, Reminder, Notification, UserRole, ActivityStatus, TaskStatus } from '../types';
import { createNotification, logActivity } from '../services/liveDataService';
import { addTask } from './useMyDayTasks';

// Type from Firestore, where dates are Timestamps

// Type from Firestore, where dates are Timestamps
type FirestoreLead = Omit<Lead, 'inquiryDate' | 'history' | 'reminders'> & {
    inquiryDate: Timestamp;
    history: (Omit<LeadHistory, 'timestamp'> & { timestamp: Timestamp })[];
    reminders?: (Omit<Reminder, 'date'> & { date: Timestamp })[];
};

// Function to convert Firestore document to frontend Lead type
const fromFirestore = (docData: FirestoreLead, id: string): Lead => {
    return {
        ...docData,
        id,
        inquiryDate: docData.inquiryDate.toDate(),
        history: docData.history.map(h => ({ ...h, timestamp: h.timestamp.toDate() })),
        reminders: docData.reminders?.map(r => ({ ...r, date: r.date.toDate() })),
    };
};

export const useLeads = (userId?: string) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        let unsubscribe: () => void = () => { };

        try {
            // Fix: Firestore requires an index for compound queries (where + orderBy).
            // We switch to client-side sorting to avoid this requirement for now.
            const leadsCollection = collection(db, 'leads');
            let q;

            if (userId) {
                q = query(leadsCollection, where('assignedTo', '==', userId), orderBy('inquiryDate', 'desc'));
            } else {
                q = query(leadsCollection, orderBy('inquiryDate', 'desc'));
            }

            unsubscribe = onSnapshot(q, (querySnapshot) => {
                const leadsData: Lead[] = [];
                querySnapshot.forEach((doc) => {
                    leadsData.push(fromFirestore(doc.data() as FirestoreLead, doc.id));
                });
                setLeads(leadsData);
                setLoading(false);
            }, (err) => {
                console.error("Firestore access failed:", err);
                setError(err);
                setLoading(false);
            });
        } catch (err) {
            console.error("Error setting up leads listener:", err);
            setError(err as Error);
            setLoading(false);
        }

        return () => unsubscribe();
    }, [userId]);

    return { leads, loading, error };
};

export const addLead = async (leadData: Omit<Lead, 'id'>, createdBy?: string) => {
    try {
        const docRef = await addDoc(collection(db, 'leads'), {
            ...leadData,
            is_demo: false, // New leads are always real
        });

        // Trigger notification
        await createNotification({
            title: 'New Lead Added',
            message: `New lead "${leadData.clientName}" - ${leadData.projectName} has been added.`,
            user_id: leadData.assignedTo, // Notify the assigned user
            entity_type: 'lead',
            entity_id: docRef.id,
            type: 'info'
        });

        // 1. GENERATE TASK FOR ASSIGNED USER
        if (leadData.assignedTo) {
            await addTask({
                title: `New Lead Assigned: ${leadData.clientName}`,
                userId: leadData.assignedTo,
                status: TaskStatus.ASSIGNED,
                priority: 'High',
                deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days default
                date: new Date().toISOString().split('T')[0],
                description: `Initial contact required for new lead: ${leadData.clientName} (${leadData.projectName}).`,
                isPaused: false,
                timeSpent: 0,
                createdAt: new Date(),
                createdBy: createdBy || 'system',
                createdByName: 'System', // Or fetch name if needed, but 'System' is fine for auto-tasks
                contextId: docRef.id,
                contextType: 'lead',
                taskType: 'Client Meeting' // Default instruction type
            }, createdBy || 'system');
        }

        // Log lead creation activity
        await logActivity({
            description: `LEAD PROTOCOL INITIATED: New lead "${leadData.clientName}" registered in system.`,
            team: UserRole.SALES_TEAM_MEMBER,
            userId: leadData.assignedTo,
            status: ActivityStatus.DONE,
            projectId: docRef.id
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding lead:", error);
        throw error;
    }
};

export const updateLead = async (leadId: string, updatedData: Partial<Lead>) => {
    try {
        const leadRef = doc(db, 'leads', leadId);
        await updateDoc(leadRef, updatedData);

        // Trigger notification if assignedTo changed
        if (updatedData.assignedTo) {
            await createNotification({
                title: 'Lead Assigned',
                message: `You have been assigned to lead: ${updatedData.clientName || 'Lead'}`,
                user_id: updatedData.assignedTo,
                entity_type: 'lead',
                entity_id: leadId,
                type: 'info'
            });

            // 2. GENERATE TASK FOR NEW ASSIGNEE
            await addTask({
                title: `Lead Re-assigned: ${updatedData.clientName || 'Lead'}`,
                userId: updatedData.assignedTo,
                status: TaskStatus.ASSIGNED,
                priority: 'High',
                deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                date: new Date().toISOString().split('T')[0],
                description: `You have been assigned this lead. Please review history and contact the client.`,
                isPaused: false,
                timeSpent: 0,
                createdAt: new Date(),
                createdBy: 'system',
                createdByName: 'System',
                contextId: leadId,
                contextType: 'lead',
                taskType: 'Client Meeting'
            }, 'system');

            // Log re-assignment activity
            await logActivity({
                description: `LEAD RE-ASSIGNMENT: Lead "${updatedData.clientName || 'Lead'}" assigned to specialist.`,
                team: UserRole.SALES_TEAM_MEMBER,
                userId: updatedData.assignedTo,
                status: ActivityStatus.DONE,
                projectId: leadId
            });
        }

        // Log status change activity
        if (updatedData.status) {
            await logActivity({
                description: `PIPELINE TRANSITION: Project status synchronized to "${updatedData.status}".`,
                team: UserRole.SALES_GENERAL_MANAGER,
                userId: '', // Generic update
                status: ActivityStatus.DONE,
                projectId: leadId
            });
        }
    } catch (error) {
        console.error("Error updating lead:", error);
        throw error;
    }
};
