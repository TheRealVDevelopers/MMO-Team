import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, Timestamp, doc, updateDoc, where, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { Project, LeadHistory, ExecutionStage } from '../types';
import { createNotification } from '../services/liveDataService';

type FirestoreProject = Omit<Project, 'startDate' | 'endDate' | 'documents' | 'history' | 'siteInspectionDate' | 'drawingDeadline' | 'drawingSubmittedAt' | 'boqSubmission'> & {
    startDate: Timestamp | Date | string;
    endDate: Timestamp | Date | string;
    siteInspectionDate?: Timestamp | Date | string;
    drawingDeadline?: Timestamp | Date | string;
    drawingSubmittedAt?: Timestamp | Date | string;
    documents?: (Omit<Project['documents'][0], 'uploaded'> & { uploaded: Timestamp | Date | string })[];
    history?: (Omit<LeadHistory, 'timestamp'> & { timestamp: Timestamp | Date | string })[];
    boqSubmission?: Omit<Project['boqSubmission'], 'submittedAt'> & { submittedAt: Timestamp | Date | string };
};

// ✅ SAFE TIMESTAMP CONVERSION - Handles Timestamp, Date, string, or null/undefined
const safeToDate = (value: any): Date | undefined => {
    if (!value) return undefined;
    
    // Already a Date object
    if (value instanceof Date) return value;
    
    // Firestore Timestamp object
    if (typeof value === 'object' && typeof value.toDate === 'function') {
        return value.toDate();
    }
    
    // String timestamp
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    
    // Number timestamp (milliseconds)
    if (typeof value === 'number') {
        return new Date(value);
    }
    
    return undefined;
};

const fromFirestore = (docData: FirestoreProject, id: string): Project => {
    return {
        ...docData,
        id,
        startDate: safeToDate(docData.startDate) || new Date(),
        endDate: safeToDate(docData.endDate) || new Date(),
        siteInspectionDate: safeToDate(docData.siteInspectionDate),
        drawingDeadline: safeToDate(docData.drawingDeadline),
        drawingSubmittedAt: safeToDate(docData.drawingSubmittedAt),
        documents: docData.documents?.map(doc => ({
            ...doc,
            uploaded: safeToDate(doc.uploaded) || new Date(),
        })) || [],
        history: docData.history?.map(h => ({
            ...h,
            timestamp: safeToDate(h.timestamp) || new Date(),
        })) || [],
        boqSubmission: docData.boqSubmission
            ? {
                ...docData.boqSubmission,
                submittedAt: safeToDate(docData.boqSubmission.submittedAt) || new Date(),
            }
            : undefined,
        // ✅ Ensure ganttData dates are proper Date objects
        ganttData: (docData as any).ganttData?.map((t: any) => ({
            ...t,
            start: safeToDate(t.start) || new Date(),
            end: safeToDate(t.end) || new Date(),
            resources: t.resources?.map((r: any) => ({
                ...r,
                requiredDate: safeToDate(r.requiredDate) || new Date(),
                deliveredDate: safeToDate(r.deliveredDate),
            })) || [],
        })) || [],
    } as Project;
};

// Helper function to recursively remove undefined values from objects
const removeUndefinedValues = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefinedValues(item));
    } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        const cleaned: any = {};
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (value !== undefined) {
                cleaned[key] = removeUndefinedValues(value);
            }
        });
        return cleaned;
    }
    return obj;
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
            // ✅ Fixed: drawing is a string field, not array - use == operator
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
            // ✅ LOG STATUS TRANSITIONS FOR DEBUGGING
            if (data.status) {
                console.log(`✅ [useProjects] Status transition for project ${id}:`, {
                    newStatus: data.status,
                    timestamp: new Date().toISOString(),
                    updates: Object.keys(data)
                });
            }

            const cleanData = removeUndefinedValues(data);
            const docRef = doc(db, 'projects', id);
            await updateDoc(docRef, cleanData);

            console.log(`✅ [useProjects] Project ${id} updated successfully`);
        } catch (err) {
            console.error("Error updating project:", err);
            throw err;
        }
    };

    const addProject = async (projectData: Omit<Project, 'id'>) => {
        try {
            // Remove undefined values from the object to prevent Firebase errors
            const cleanData = removeUndefinedValues(projectData);

            const docRef = await addDoc(collection(db, 'projects'), {
                ...cleanData,
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
        const cleanData = removeUndefinedValues(updatedData);
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, cleanData);

        if (updatedData.status) {
            await createNotification({
                title: 'Project Status Updated',
                message: `Project status changed to ${updatedData.status}.`,
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
        console.log('💾 [updateProjectStage] Updating stage:', {
            projectId,
            stageId,
            completed,
            userName
        });

        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        if (!projectSnap.exists()) {
            console.error('❌ [updateProjectStage] Project not found:', projectId);
            return;
        }

        const projectData = projectSnap.data() as Project;
        const updatedStages = (projectData.stages || []).map(s =>
            s.id === stageId ? { ...s, status: completed ? 'Completed' : 'Pending', completedAt: completed ? new Date() : undefined } : s
        );

        console.log('💾 [updateProjectStage] Saving updated stages to Firestore:', {
            stageId,
            newStatus: completed ? 'Completed' : 'Pending',
            totalStages: updatedStages.length
        });

        await updateDoc(projectRef, removeUndefinedValues({
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
        }));

        console.log('✅ [updateProjectStage] Stage updated successfully in Firestore');
    } catch (error) {
        console.error("❌ [updateProjectStage] Error updating project stage:", error);
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

        await updateDoc(projectRef, removeUndefinedValues({
            issues: [...(projectData.issues || []), newIssue],
            updatedAt: serverTimestamp()
        }));

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

export const addProject = async (projectData: Omit<Project, 'id'>) => {
    try {
        // Remove undefined values from the object to prevent Firebase errors
        const cleanData = removeUndefinedValues(projectData);

        const docRef = await addDoc(collection(db, 'projects'), {
            ...cleanData,
            startDate: Timestamp.fromDate(projectData.startDate),
            endDate: Timestamp.fromDate(projectData.endDate),
        });
        return docRef.id;
    } catch (err) {
        console.error("Error adding project:", err);
        throw err;
    }
};
