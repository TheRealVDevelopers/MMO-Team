import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, Timestamp, doc, updateDoc, where, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { Project, LeadHistory, ExecutionStage } from '../types';
import { createNotification } from '../services/liveDataService';

type FirestoreProject = Omit<Project, 'startDate' | 'endDate' | 'documents' | 'history' | 'siteInspectionDate' | 'drawingDeadline' | 'drawingSubmittedAt'> & {
    startDate: Timestamp;
    endDate: Timestamp;
    siteInspectionDate?: Timestamp;
    drawingDeadline?: Timestamp;
    drawingSubmittedAt?: Timestamp;
    documents?: (Omit<Project['documents'][0], 'uploaded'> & { uploaded: Timestamp })[];
    history?: (Omit<LeadHistory, 'timestamp'> & { timestamp: Timestamp })[];
};

const fromFirestore = (docData: FirestoreProject, id: string): Project => {
    return {
        ...docData,
        id,
        startDate: docData.startDate?.toDate() || new Date(),
        endDate: docData.endDate?.toDate() || new Date(),
        siteInspectionDate: docData.siteInspectionDate?.toDate(),
        drawingDeadline: docData.drawingDeadline?.toDate(),
        drawingSubmittedAt: docData.drawingSubmittedAt?.toDate(),
        documents: docData.documents?.map(doc => ({
            ...doc,
            uploaded: doc.uploaded?.toDate() || new Date(),
        })) || [],
        history: docData.history?.map(h => ({
            ...h,
            timestamp: h.timestamp?.toDate() || new Date(),
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
        let q = query(projectsCollection);

        if (userId) {
            q = query(projectsCollection, where('assignedTeam.drawing', '==', userId));
        }

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const projectsData: Project[] = [];
            querySnapshot.forEach((doc) => {
                projectsData.push(fromFirestore(doc.data() as FirestoreProject, doc.id));
            });

            setProjects(projectsData.sort((a, b) => b.startDate.getTime() - a.startDate.getTime()));
            setLoading(false);
        }, (err) => {
            console.error("Error fetching projects:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const updateProject = async (id: string, data: Partial<Project>) => {
        try {
            const docRef = doc(db, 'projects', id);
            await updateDoc(docRef, data);
        } catch (err) {
            console.error("Error updating project:", err);
            throw err;
        }
    };

    const addProject = async (projectData: Omit<Project, 'id'>) => {
        try {
            const docRef = await addDoc(collection(db, 'projects'), {
                ...projectData,
                startDate: Timestamp.fromDate(projectData.startDate),
                endDate: Timestamp.fromDate(projectData.endDate),
            });
            return docRef.id;
        } catch (err) {
            console.error("Error adding project:", err);
            throw err;
        }
    };

    return { projects, loading, error, updateProject, addProject };
};

export const useAssignedProjects = (userId: string) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const projectsCollection = collection(db, 'projects');
        const q = query(projectsCollection, where('assignedTeam.execution', 'array-contains', userId));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const projectsData: Project[] = [];
            querySnapshot.forEach((doc) => {
                projectsData.push(fromFirestore(doc.data() as FirestoreProject, doc.id));
            });

            setProjects(projectsData.sort((a, b) => b.startDate.getTime() - a.startDate.getTime()));
            setLoading(false);
        }, (err) => {
            console.error("Error fetching assigned projects:", err);
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

        if (updatedData.status) {
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

export const updateProjectStage = async (projectId: string, stageId: string, completed: boolean, userName: string) => {
    try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        if (!projectSnap.exists()) return;

        const projectData = projectSnap.data() as Project;
        const updatedStages = (projectData.stages || []).map(s =>
            s.id === stageId ? { ...s, status: completed ? 'Completed' : 'Pending', completedAt: completed ? new Date() : undefined } : s
        );

        await updateDoc(projectRef, {
            stages: updatedStages,
            updatedAt: serverTimestamp(),
            history: [
                ...(projectData.history || []),
                {
                    action: completed ? 'Stage Completed' : 'Stage Reset',
                    user: userName,
                    timestamp: new Date(),
                    notes: `Stage: ${updatedStages.find(s => s.id === stageId)?.name}`
                }
            ]
        });
    } catch (error) {
        console.error("Error updating project stage:", error);
        throw error;
    }
};

export const raiseProjectIssue = async (projectId: string, issue: any, userName: string) => {
    try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        if (!projectSnap.exists()) return;

        const projectData = projectSnap.data() as Project;
        const newIssue = {
            id: Date.now().toString(),
            ...issue,
            raisedBy: userName,
            createdAt: new Date(),
            status: 'Open'
        };

        await updateDoc(projectRef, {
            issues: [...(projectData.issues || []), newIssue],
            updatedAt: serverTimestamp()
        });

        await createNotification({
            title: 'Critical Project Issue',
            message: `Field Alert: ${userName} has raised an issue for project ${projectData.projectName}. Category: ${issue.category}`,
            user_id: 'user-2', // Admin/Manager
            entity_type: 'project',
            entity_id: projectId,
            type: 'error'
        });

        return newIssue;
    } catch (error) {
        console.error("Error raising project issue:", error);
        throw error;
    }
};
