import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, where, getDocs } from 'firebase/firestore';
import { B2IClient } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

export const useB2IClients = () => {
    const [b2iClients, setB2IClients] = useState<B2IClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        const q = query(collection(db, FIRESTORE_COLLECTIONS.B2I_CLIENTS));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: B2IClient[] = [];
            snapshot.forEach((docSnap) => {
                const d = docSnap.data();
                const createdAt = d?.createdAt?.toDate?.() ?? (d?.createdAt ? new Date(d.createdAt) : new Date());
                data.push({
                    ...d,
                    id: docSnap.id,
                    createdAt,
                } as B2IClient);
            });
            data.sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
            setB2IClients(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching B2I clients:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addB2IClient = async (clientData: Omit<B2IClient, 'id' | 'createdAt'>) => {
        if (!db) throw new Error('Database not initialized');

        try {
            const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.B2I_CLIENTS), {
                ...clientData,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (err) {
            console.error("Error adding B2I client:", err);
            throw err;
        }
    };

    const updateB2IClient = async (id: string, data: Partial<B2IClient>) => {
        if (!db) throw new Error('Database not initialized');

        try {
            const docRef = doc(db, FIRESTORE_COLLECTIONS.B2I_CLIENTS, id);
            await updateDoc(docRef, data);
        } catch (err) {
            console.error("Error updating B2I client:", err);
            throw err;
        }
    };

    const deleteB2IClient = async (id: string) => {
        if (!db) throw new Error('Database not initialized');

        try {
            // Unlink all child organizations first
            const orgsQuery = query(
                collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS),
                where('b2iParentId', '==', id)
            );
            const orgsSnap = await getDocs(orgsQuery);

            if (orgsSnap.size > 0) {
                const batch = writeBatch(db);
                orgsSnap.forEach((orgDoc) => {
                    batch.update(orgDoc.ref, {
                        isB2IChild: false,
                        b2iParentId: null,
                    });
                });
                await batch.commit();
            }

            // Delete the B2I client
            await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.B2I_CLIENTS, id));
        } catch (err) {
            console.error("Error deleting B2I client:", err);
            throw err;
        }
    };

    return { b2iClients, loading, error, addB2IClient, updateB2IClient, deleteB2IClient };
};
