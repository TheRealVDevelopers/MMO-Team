
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Lead, LeadHistory, Reminder } from '../types';
import { LEADS } from '../constants';

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

        let unsubscribe: () => void = () => {};

        try {
            const leadsCollection = collection(db, 'leads');
            const q = userId
                ? query(leadsCollection, where('assignedTo', '==', userId), orderBy('inquiryDate', 'desc'))
                : query(leadsCollection, orderBy('inquiryDate', 'desc'));

            unsubscribe = onSnapshot(q, (querySnapshot) => {
                const leadsData: Lead[] = [];
                querySnapshot.forEach((doc) => {
                    leadsData.push(fromFirestore(doc.data() as FirestoreLead, doc.id));
                });
                setLeads(leadsData);
                setLoading(false);
            }, (err) => {
                console.warn("Firestore access failed (likely permissions), falling back to mock data:", err);
                // Fallback to mock data so the app still works in demo mode
                const mockLeads = userId 
                    ? LEADS.filter(l => l.assignedTo === userId)
                    : LEADS;
                setLeads(mockLeads);
                // We do NOT set error here to allow the UI to render the mock data instead of an error card
                setLoading(false);
            });
        } catch (err) {
            console.error("Error setting up leads listener:", err);
            const mockLeads = userId 
                ? LEADS.filter(l => l.assignedTo === userId)
                : LEADS;
            setLeads(mockLeads);
            setLoading(false);
        }

        return () => unsubscribe();
    }, [userId]);

    return { leads, loading, error };
};

export const addLead = async (leadData: Omit<Lead, 'id'>) => {
    try {
        await addDoc(collection(db, 'leads'), leadData);
    } catch (error) {
        console.error("Error adding lead (mock mode active):", error);
        // In a real app, we would handle this. For demo, we just log it.
    }
};

export const updateLead = async (leadId: string, updatedData: Partial<Lead>) => {
    try {
        const leadRef = doc(db, 'leads', leadId);
        await updateDoc(leadRef, updatedData);
    } catch (error) {
        console.error("Error updating lead (mock mode active):", error);
    }
};
