import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Organization } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

export const useOrganizations = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        const q = query(collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orgsData: Organization[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                orgsData.push({
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt?.toDate() || new Date(),
                } as Organization);
            });
            setOrganizations(orgsData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching organizations:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addOrganization = async (orgData: Omit<Organization, 'id' | 'createdAt'>) => {
        if (!db) throw new Error('Database not initialized');
        
        try {
            const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS), {
                ...orgData,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (err) {
            console.error("Error adding organization:", err);
            throw err;
        }
    };

    const updateOrganization = async (id: string, data: Partial<Organization>) => {
        if (!db) throw new Error('Database not initialized');
        
        try {
            const docRef = doc(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, id);
            await updateDoc(docRef, data);
        } catch (err) {
            console.error("Error updating organization:", err);
            throw err;
        }
    };

    return { organizations, loading, error, addOrganization, updateOrganization };
};
