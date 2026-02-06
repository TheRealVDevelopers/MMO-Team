import { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { ProjectEnquiry, EnquiryStatus, UserRole, ActivityStatus } from '../types';
import { logActivity } from '../utils/activityLogger';

// Hook to get all enquiries (for Sales Manager)
export const useEnquiries = () => {
    const [enquiries, setEnquiries] = useState<ProjectEnquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'projectEnquiries'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const enquiriesData: ProjectEnquiry[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    enquiriesData.push({
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        updatedAt: data.updatedAt?.toDate() || undefined,
                    } as unknown as ProjectEnquiry);
                });
                setEnquiries(enquiriesData);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching enquiries:', err);
                setError(err as Error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { enquiries, loading, error };
};

// Hook to get new/unassigned enquiries (for notifications)
export const useNewEnquiries = (userId?: string) => {
    const [newEnquiries, setNewEnquiries] = useState<ProjectEnquiry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'projectEnquiries'),
            where('status', '==', EnquiryStatus.NEW),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const enquiriesData: ProjectEnquiry[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const viewedBy = data.viewedBy || [];

                // Show if not viewed by this user
                if (!userId || !viewedBy.includes(userId)) {
                    enquiriesData.push({
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        updatedAt: data.updatedAt?.toDate() || undefined,
                    } as unknown as ProjectEnquiry);
                }
            });
            setNewEnquiries(enquiriesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { newEnquiries, loading };
};

// Hook to get enquiries assigned to specific user
export const useMyEnquiries = (userId: string) => {
    const [myEnquiries, setMyEnquiries] = useState<ProjectEnquiry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'projectEnquiries'),
            where('assignedTo', '==', userId),
            where('status', '==', EnquiryStatus.ASSIGNED),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const enquiriesData: ProjectEnquiry[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                enquiriesData.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || undefined,
                } as unknown as ProjectEnquiry);
            });
            setMyEnquiries(enquiriesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { myEnquiries, loading };
};

// Function to create a new enquiry
export const createEnquiry = async (enquiryData: Omit<ProjectEnquiry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const docRef = await addDoc(collection(db, 'projectEnquiries'), {
            ...enquiryData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating enquiry:', error);
        throw error;
    }
};

// Function to assign enquiry to sales member
export const assignEnquiry = async (
    enquiryId: string,
    userId: string,
    userName: string,
    clientPassword: string
) => {
    try {
        const enquiryRef = doc(db, 'projectEnquiries', enquiryId);
        await updateDoc(enquiryRef, {
            status: EnquiryStatus.ASSIGNED,
            assignedTo: userId,
            assignedToName: userName,
            clientPassword: clientPassword,
            updatedAt: serverTimestamp(),
        });

        // Log assignment activity
        await logActivity({
            description: `ENQUIRY ASSIGNED: Assigned to ${userName} by Manager. Client portal password established.`,
            team: UserRole.SALES_TEAM_MEMBER,
            userId: userId,
            status: ActivityStatus.DONE,
            projectId: enquiryId
        });
    } catch (error) {
        console.error('Error assigning enquiry:', error);
        throw error;
    }
};

// Function to mark enquiry as viewed
export const markEnquiryAsViewed = async (enquiryId: string, userId: string) => {
    try {
        const enquiryRef = doc(db, 'projectEnquiries', enquiryId);
        const enquiryDoc = await import('firebase/firestore').then(m => m.getDoc(enquiryRef));

        if (enquiryDoc.exists()) {
            const currentViewedBy = enquiryDoc.data().viewedBy || [];
            if (!currentViewedBy.includes(userId)) {
                await updateDoc(enquiryRef, {
                    viewedBy: [...currentViewedBy, userId],
                });
            }
        }
    } catch (error) {
        console.error('Error marking enquiry as viewed:', error);
    }
};

// Function to convert enquiry to lead
export const convertEnquiryToLead = async (
    enquiryId: string,
    enquiry: ProjectEnquiry,
    leadData: any
) => {
    try {
        // Create the lead
        const leadRef = await addDoc(collection(db, 'leads'), {
            ...leadData,
            createdAt: serverTimestamp(),
        });

        // Update enquiry status
        const enquiryRef = doc(db, 'projectEnquiries', enquiryId);
        await updateDoc(enquiryRef, {
            status: EnquiryStatus.CONVERTED_TO_LEAD,
            convertedLeadId: leadRef.id,
            updatedAt: serverTimestamp(),
        });

        // Also create client project for tracking
        await addDoc(collection(db, 'clientProjects'), {
            projectId: enquiry.enquiryId.replace('ENQ', 'PRJ'), // Convert ENQ-2025-00123 to PRJ-2025-00123
            clientName: enquiry.clientName,
            email: enquiry.email,
            mobile: enquiry.mobile,
            city: enquiry.city,
            projectType: enquiry.projectType,
            spaceType: enquiry.spaceType,
            area: enquiry.area,
            numberOfZones: enquiry.numberOfZones,
            isRenovation: enquiry.isRenovation,
            designStyle: enquiry.designStyle,
            budgetRange: enquiry.budgetRange,
            startTime: enquiry.startTime,
            completionTimeline: enquiry.completionTimeline,
            additionalNotes: enquiry.additionalNotes,
            password: enquiry.clientPassword || '123456',
            hasPassword: true,
            currentStage: 1,
            expectedCompletion: '',
            consultant: enquiry.assignedToName || '',
            consultantId: enquiry.assignedTo || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Log overall project creation activity
        await logActivity({
            description: `NEW PROJECT CREATED: Converted from enquiry ${enquiry.enquiryId} for ${enquiry.clientName}. Project ID: ${enquiry.enquiryId.replace('ENQ', 'PRJ')}`,
            team: UserRole.SALES_GENERAL_MANAGER,
            userId: enquiry.assignedTo || '',
            status: ActivityStatus.DONE,
            projectId: leadRef.id
        });

        return leadRef.id;
    } catch (error) {
        console.error('Error converting enquiry to lead:', error);
        throw error;
    }
};

// Function to generate enquiry ID
export const generateEnquiryId = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 90000) + 10000; // 5-digit random number
    return `ENQ-${year}-${random}`;
};
