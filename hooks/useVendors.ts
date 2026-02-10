import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';

/**
 * Vendor type – vendors are a separate branch (not tied to any organization/case).
 * Stored at root: vendors (top-level collection)
 */
export interface Vendor {
    id: string;
    name: string;
    category: string; // e.g., "Electrical", "Plumbing", "Woodwork", "General"
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    gstNumber?: string;
    panNumber?: string;
    bankDetails?: {
        accountName?: string;
        accountNumber?: string;
        ifscCode?: string;
        bankName?: string;
    };
    rating?: number; // 1-5 stars
    notes?: string;
    isActive: boolean;
    createdAt: Date;
    createdBy: string;
    updatedAt?: Date;
}

interface UseVendorsReturn {
    vendors: Vendor[];
    loading: boolean;
    error: string | null;
    addVendor: (vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateVendor: (vendorId: string, updates: Partial<Vendor>) => Promise<void>;
    deleteVendor: (vendorId: string) => Promise<void>;
}

/**
 * Manages vendors from the root-level vendors collection.
 * No organization or case – vendors are a separate branch.
 */
export function useVendors(): UseVendorsReturn {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!db) {
            setVendors([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const vendorsRef = collection(db, FIRESTORE_COLLECTIONS.VENDORS);
        const q = query(vendorsRef, where('isActive', '==', true));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const vendorList: Vendor[] = snapshot.docs.map((d) => {
                    const data = d.data();
                    return {
                        id: d.id,
                        name: data.name || '',
                        category: data.category || 'General',
                        contactPerson: data.contactPerson,
                        phone: data.phone,
                        email: data.email,
                        address: data.address,
                        gstNumber: data.gstNumber,
                        panNumber: data.panNumber,
                        bankDetails: data.bankDetails,
                        rating: data.rating,
                        notes: data.notes,
                        isActive: data.isActive ?? true,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        createdBy: data.createdBy || '',
                        updatedAt: data.updatedAt?.toDate(),
                    };
                });
                setVendors(vendorList);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching vendors:', err);
                setError('Failed to load vendors');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    /** Remove undefined values – Firestore does not accept undefined. */
    const stripUndefined = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> =>
        Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

    const addVendor = async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        if (!db) throw new Error('Firebase not initialized');

        const vendorsRef = collection(db, FIRESTORE_COLLECTIONS.VENDORS);
        const payload = stripUndefined({
            ...vendorData,
            createdAt: serverTimestamp(),
        }) as Record<string, unknown>;
        payload.createdAt = serverTimestamp();
        const docRef = await addDoc(vendorsRef, payload);
        return docRef.id;
    };

    const updateVendor = async (vendorId: string, updates: Partial<Vendor>): Promise<void> => {
        if (!db) throw new Error('Firebase not initialized');

        const vendorRef = doc(db, FIRESTORE_COLLECTIONS.VENDORS, vendorId);
        const payload = stripUndefined({ ...updates, updatedAt: serverTimestamp() }) as Record<string, unknown>;
        payload.updatedAt = serverTimestamp();
        await updateDoc(vendorRef, payload);
    };

    const deleteVendor = async (vendorId: string): Promise<void> => {
        if (!db) throw new Error('Firebase not initialized');

        const vendorRef = doc(db, FIRESTORE_COLLECTIONS.VENDORS, vendorId);
        await updateDoc(vendorRef, {
            isActive: false,
            updatedAt: serverTimestamp(),
        });
    };

    return {
        vendors,
        loading,
        error,
        addVendor,
        updateVendor,
        deleteVendor,
    };
}
