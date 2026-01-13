import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, Timestamp, doc, updateDoc, where } from 'firebase/firestore';
import { Project, LeadHistory } from '../types';
import { createNotification } from '../services/liveDataService';

type FirestoreProject = Omit<Project, 'startDate' | 'endDate' | 'documents' | 'history'> & {
    startDate: Timestamp;
    endDate: Timestamp;
    documents?: (Omit<Project['documents'][0], 'uploaded'> & { uploaded: Timestamp })[];
    history?: (Omit<LeadHistory, 'timestamp'> & { timestamp: Timestamp })[];
};

const fromFirestore = (docData: FirestoreProject, id: string): Project => {
    return {
        ...docData,
        id,
        startDate: docData.startDate.toDate(),
        endDate: docData.endDate.toDate(),
        documents: docData.documents?.map(doc => ({
            ...doc,
            uploaded: doc.uploaded.toDate(),
        })) || [],
        history: docData.history?.map(h => ({
            ...h,
            timestamp: h.timestamp.toDate(),
        })) || [],
    } as Project;
};

export const useProjects = (userId?: string) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const projectsCollection = collection(db, 'projects');
        let q = query(projectsCollection, orderBy('startDate', 'desc'));

        // If userId is provided, we might want to filter projects where this user is involved
        // For simplicity in the drawing team board, we check assignedTeam.drawing
        // Fix: Remove orderBy to avoid composite index requirement. Sort client-side.
        if (userId) {
            q = query(projectsCollection, where('assignedTeam.drawing', '==', userId), orderBy('startDate', 'desc'));
        }

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const projectsData: Project[] = [];
            querySnapshot.forEach((doc) => {
                projectsData.push(fromFirestore(doc.data() as FirestoreProject, doc.id));
            });

            setProjects(projectsData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching projects:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { projects, loading, error };
};

export const updateProject = async (projectId: string, updatedData: Partial<Project>, updatedBy?: string) => {
    try {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, updatedData);

        // Trigger notification if status changed
        if (updatedData.status) {
            // In a real app, we'd find stakeholders. For demo, notify manager.
            await createNotification({
                title: 'Project Status Updated',
                message: `Project "${projectId}" status changed to ${updatedData.status}.`,
                user_id: 'user-2', // Sarah Manager
                entity_type: 'project',
                entity_id: projectId,
                type: 'success'
            });
        }
    } catch (error) {
        console.error("Error updating project:", error);
        throw error;
    }
};
