import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Lead, LeadHistory, Reminder } from '../types';

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

        const leadsCollection = collection(db, 'leads');
        const q = userId
            ? query(leadsCollection, where('assignedTo', '==', userId), orderBy('inquiryDate', 'desc'))
            : query(leadsCollection, orderBy('inquiryDate', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const leadsData: Lead[] = [];
            querySnapshot.forEach((doc) => {
                leadsData.push(fromFirestore(doc.data() as FirestoreLead, doc.id));
            });
            setLeads(leadsData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching leads:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { leads, loading, error };
};

export const addLead = async (leadData: Omit<Lead, 'id'>) => {
    await addDoc(collection(db, 'leads'), leadData);
};

export const updateLead = async (leadId: string, updatedData: Partial<Lead>) => {
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, updatedData);
};
