import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Vendor type - represents a vendor in an organization's vendor list
 * Vendors are stored at: organizations/{orgId}/vendors
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
 * Hook to manage vendors for an organization
 * Vendors live at: organizations/{orgId}/vendors
 */
export function useVendors(organizationId?: string): UseVendorsReturn {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!organizationId) {
            setVendors([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const vendorsRef = collection(db, 'organizations', organizationId, 'vendors');
        const q = query(vendorsRef, where('isActive', '==', true));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const vendorList: Vendor[] = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
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
    }, [organizationId]);

    const addVendor = async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        if (!organizationId) throw new Error('Organization ID is required');

        const vendorsRef = collection(db, 'organizations', organizationId, 'vendors');
        const docRef = await addDoc(vendorsRef, {
            ...vendorData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    };

    const updateVendor = async (vendorId: string, updates: Partial<Vendor>): Promise<void> => {
        if (!organizationId) throw new Error('Organization ID is required');

        const vendorRef = doc(db, 'organizations', organizationId, 'vendors', vendorId);
        await updateDoc(vendorRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    };

    const deleteVendor = async (vendorId: string): Promise<void> => {
        if (!organizationId) throw new Error('Organization ID is required');

        // Soft delete by setting isActive to false
        const vendorRef = doc(db, 'organizations', organizationId, 'vendors', vendorId);
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
