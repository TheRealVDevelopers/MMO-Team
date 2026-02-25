import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
        setError(null);
        // Query without orderBy to avoid requiring composite index and to tolerate docs missing createdAt
        const q = query(collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orgsData: Organization[] = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const createdAt = data?.createdAt?.toDate?.() ?? (data?.createdAt ? new Date(data.createdAt) : new Date());
                orgsData.push({
                    ...data,
                    id: docSnap.id,
                    createdAt,
                } as Organization);
            });
            // Sort by createdAt desc in-memory
            orgsData.sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
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

    const deleteOrganization = async (id: string) => {
        if (!db) throw new Error('Database not initialized');
        try {
            const { deleteDoc, doc } = await import('firebase/firestore');
            const docRef = doc(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS, id);
            await deleteDoc(docRef);
        } catch (err) {
            console.error("Error deleting organization:", err);
            throw err;
        }
    };

    return { organizations, loading, error, addOrganization, updateOrganization, deleteOrganization };
};
