import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Organization } from '../types';

export const useOrganizations = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'organizations'), orderBy('createdAt', 'desc'));

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

    const addOrganization = async (orgData: Omit<Organization, 'id'>) => {
        try {
            const docRef = await addDoc(collection(db, 'organizations'), {
                ...orgData,
                createdAt: Timestamp.fromDate(orgData.createdAt),
            });
            return docRef.id;
        } catch (err) {
            console.error("Error adding organization:", err);
            throw err;
        }
    };

    const updateOrganization = async (id: string, data: Partial<Organization>) => {
        try {
            const docRef = doc(db, 'organizations', id);
            await updateDoc(docRef, data);
        } catch (err) {
            console.error("Error updating organization:", err);
            throw err;
        }
    };

    return { organizations, loading, error, addOrganization, updateOrganization };
};
