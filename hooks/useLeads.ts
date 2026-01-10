
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Lead, LeadHistory, Reminder, Notification } from '../types';
import { createNotification } from '../services/liveDataService';

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
        }

        // Trigger notification if status changed (notify owner/manager - simpler logic for now: notify assignee)
        if (updatedData.status && !updatedData.assignedTo) {
            // We can't easily know who to notify without fetching the lead, but we can try notifying the assignedTo if known or skip
            // For now, let's skip status update notifications to avoid noise unless we fetch the doc.
        }

    } catch (error) {
        console.error("Error updating lead:", error);
        throw error;
    }
};
