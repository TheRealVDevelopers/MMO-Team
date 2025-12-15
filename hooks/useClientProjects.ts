import { useState, useEffect } from 'react';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    onSnapshot, 
    query, 
    orderBy,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ClientProject {
    id: string;
    projectId: string;
    clientName: string;
    email: string;
    mobile: string;
    city: string;
    projectType: string;
    spaceType: string;
    area: string;
    numberOfZones?: string;
    isRenovation: string;
    designStyle: string;
    budgetRange: string;
    startTime: string;
    completionTimeline: string;
    additionalNotes?: string;
    currentStage: number;
    expectedCompletion: string;
    consultant: string;
    consultantId?: string;
    password?: string;
    hasPassword: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

export interface ChatMessage {
    id: string;
    projectId: string;
    sender: 'client' | 'consultant' | 'system';
    senderName: string;
    content: string;
    timestamp: Date;
    read: boolean;
}

export interface ProjectIssue {
    id: string;
    projectId: string;
    category: string;
    description: string;
    urgency: 'low' | 'medium' | 'high';
    status: 'open' | 'in-progress' | 'resolved';
    createdAt: Date;
    response?: string;
    respondedAt?: Date;
    respondedBy?: string;
}

export interface ProjectUpdate {
    id: string;
    projectId: string;
    stage: number;
    stageName: string;
    notes?: string;
    updatedBy: string;
    timestamp: Date;
}

// Hook to get all client projects
export const useClientProjects = () => {
    const [projects, setProjects] = useState<ClientProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'clientProjects'), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const projectsData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        updatedAt: data.updatedAt?.toDate() || undefined,
                    } as ClientProject;
                });
                setProjects(projectsData);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching client projects:', err);
                setError(err as Error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { projects, loading, error };
};

// Hook to get a single project by projectId
export const useClientProject = (projectId: string) => {
    const [project, setProject] = useState<ClientProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'clientProjects'));
        
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const projectDoc = snapshot.docs.find(doc => doc.data().projectId === projectId);
                if (projectDoc) {
                    const data = projectDoc.data();
                    setProject({
                        id: projectDoc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        updatedAt: data.updatedAt?.toDate() || undefined,
                    } as ClientProject);
                } else {
                    setProject(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching project:', err);
                setError(err as Error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [projectId]);

    return { project, loading, error };
};

// Hook to get chat messages for a project
export const useProjectChat = (projectId: string) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'projectChats'),
            orderBy('timestamp', 'asc')
        );
        
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const messagesData = snapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            timestamp: data.timestamp?.toDate() || new Date(),
                        } as ChatMessage;
                    })
                    .filter(msg => msg.projectId === projectId);
                setMessages(messagesData);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching chat messages:', err);
                setError(err as Error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [projectId]);

    return { messages, loading, error };
};

// Hook to get issues for a project
export const useProjectIssues = (projectId: string) => {
    const [issues, setIssues] = useState<ProjectIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'projectIssues'),
            orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const issuesData = snapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            createdAt: data.createdAt?.toDate() || new Date(),
                            respondedAt: data.respondedAt?.toDate() || undefined,
                        } as ProjectIssue;
                    })
                    .filter(issue => issue.projectId === projectId);
                setIssues(issuesData);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching issues:', err);
                setError(err as Error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [projectId]);

    return { issues, loading, error };
};

// Function to add a new client project
export const addClientProject = async (projectData: Omit<ClientProject, 'id' | 'createdAt'>) => {
    try {
        const docRef = await addDoc(collection(db, 'clientProjects'), {
            ...projectData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding project:', error);
        throw error;
    }
};

// Function to update a client project
export const updateClientProject = async (projectId: string, updates: Partial<ClientProject>) => {
    try {
        const projectRef = doc(db, 'clientProjects', projectId);
        await updateDoc(projectRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
};

// Function to add a chat message
export const addChatMessage = async (messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    try {
        const docRef = await addDoc(collection(db, 'projectChats'), {
            ...messageData,
            timestamp: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding message:', error);
        throw error;
    }
};

// Function to add an issue
export const addProjectIssue = async (issueData: Omit<ProjectIssue, 'id' | 'createdAt'>) => {
    try {
        const docRef = await addDoc(collection(db, 'projectIssues'), {
            ...issueData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding issue:', error);
        throw error;
    }
};

// Function to update an issue
export const updateProjectIssue = async (issueId: string, updates: Partial<ProjectIssue>) => {
    try {
        const issueRef = doc(db, 'projectIssues', issueId);
        await updateDoc(issueRef, {
            ...updates,
            respondedAt: updates.response ? serverTimestamp() : undefined,
        });
    } catch (error) {
        console.error('Error updating issue:', error);
        throw error;
    }
};

// Function to add project update (stage change notification)
export const addProjectUpdate = async (updateData: Omit<ProjectUpdate, 'id' | 'timestamp'>) => {
    try {
        const docRef = await addDoc(collection(db, 'projectUpdates'), {
            ...updateData,
            timestamp: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding project update:', error);
        throw error;
    }
};

// Function to generate a secure password
export const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Function to set project password
export const setProjectPassword = async (projectId: string, password: string) => {
    try {
        const projectRef = doc(db, 'clientProjects', projectId);
        await updateDoc(projectRef, {
            password: password,
            hasPassword: true,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error setting password:', error);
        throw error;
    }
};

// Function to verify project credentials
export const verifyProjectCredentials = async (projectId: string, password: string): Promise<boolean> => {
    try {
        const q = query(collection(db, 'clientProjects'));
        const snapshot = await new Promise<any>((resolve, reject) => {
            const unsubscribe = onSnapshot(q, resolve, reject);
            setTimeout(() => {
                unsubscribe();
                reject(new Error('Timeout'));
            }, 5000);
        });

        const projectDoc = snapshot.docs.find((doc: any) => doc.data().projectId === projectId);
        if (!projectDoc) return false;

        const projectData = projectDoc.data();
        return projectData.password === password;
    } catch (error) {
        console.error('Error verifying credentials:', error);
        return false;
    }
};
