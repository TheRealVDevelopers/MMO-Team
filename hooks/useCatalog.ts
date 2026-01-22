import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Item } from '../types';

export const useCatalog = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const catalogRef = collection(db, 'catalog');
        const q = query(catalogRef, orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const itemsData: Item[] = [];
            snapshot.forEach((doc) => {
                itemsData.push({ id: doc.id, ...doc.data() } as Item);
            });
            setItems(itemsData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching catalog:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addItem = async (itemData: Omit<Item, 'id'>) => {
        try {
            const docRef = await addDoc(collection(db, 'catalog'), itemData);
            return docRef.id;
        } catch (err) {
            console.error("Error adding item to catalog:", err);
            throw err;
        }
    };

    const updateItem = async (itemId: string, updates: Partial<Item>) => {
        try {
            const itemRef = doc(db, 'catalog', itemId);
            await updateDoc(itemRef, updates);
        } catch (err) {
            console.error("Error updating catalog item:", err);
            throw err;
        }
    };

    const removeItem = async (itemId: string) => {
        try {
            const itemRef = doc(db, 'catalog', itemId);
            await deleteDoc(itemRef);
        } catch (err) {
            console.error("Error removing catalog item:", err);
            throw err;
        }
    };

    return { items, loading, error, addItem, updateItem, removeItem };
};
