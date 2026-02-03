import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { InventoryItem, GREntry, GRItem } from '../types';

export const useInventory = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [grEntries, setGrEntries] = useState<GREntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Fetch Inventory Items
    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'inventoryItems'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: InventoryItem[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
            } as InventoryItem));
            setItems(data);
            setLoading(false);
        }, (err) => setError(err));
        return () => unsubscribe();
    }, []);

    // Fetch GR Entries
    useEffect(() => {
        const q = query(collection(db, 'grEntries'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: GREntry[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate() || new Date(),
            } as GREntry));
            setGrEntries(data);
        }, (err) => console.error("Error fetching GR:", err));
        return () => unsubscribe();
    }, []);

    const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
        await addDoc(collection(db, 'inventoryItems'), {
            ...item,
            lastUpdated: serverTimestamp()
        });
    };

    /**
     * Process a Goods Receipt (GR) Note.
     * If Type is IN: Increase Item Quantity.
     * If Type is OUT: Decrease Item Quantity (verify stock first).
     */
    const addGREntry = async (entry: Omit<GREntry, 'id'>) => {
        try {
            await runTransaction(db, async (transaction) => {
                // 1. Check stock for OUT entries
                if (entry.type === 'OUT') {
                    for (const item of entry.items) {
                        const itemRef = doc(db, 'inventoryItems', item.itemId);
                        const itemSnap = await transaction.get(itemRef);
                        if (!itemSnap.exists()) throw new Error(`Item ${item.itemName} not found!`);
                        const currentQty = itemSnap.data().totalQuantity || 0;
                        if (currentQty < item.quantity) {
                            throw new Error(`Insufficient stock for ${item.itemName}. Available: ${currentQty}, Required: ${item.quantity}`);
                        }
                    }
                }

                // 2. Create GR Doc
                const grRef = doc(collection(db, 'grEntries'));
                transaction.set(grRef, {
                    ...entry,
                    date: serverTimestamp() // Force server timestamp
                });

                // 3. Update Inventory Quantities
                for (const item of entry.items) {
                    const itemRef = doc(db, 'inventoryItems', item.itemId);
                    const itemSnap = await transaction.get(itemRef);
                    if (!itemSnap.exists()) continue;

                    const currentQty = itemSnap.data().totalQuantity || 0;
                    const newQty = entry.type === 'IN'
                        ? currentQty + item.quantity
                        : currentQty - item.quantity;

                    transaction.update(itemRef, {
                        totalQuantity: newQty,
                        lastUpdated: serverTimestamp()
                    });
                }
            });
        } catch (err) {
            console.error("Transaction failed: ", err);
            throw err;
        }
    };

    return { items, grEntries, loading, error, addInventoryItem, addGREntry };
};
