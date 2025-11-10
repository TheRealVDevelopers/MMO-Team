import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { Project } from '../types';

type FirestoreProject = Omit<Project, 'startDate' | 'endDate' | 'documents'> & {
    startDate: Timestamp;
    endDate: Timestamp;
    documents?: (Omit<Project['documents'][0], 'uploaded'> & { uploaded: Timestamp })[];
};

const fromFirestore = (docData: FirestoreProject, id: string): Project => {
    const data = { ...docData } as any;
    
    if (data.documents) {
        data.documents = data.documents.map((doc: any) => ({
            ...doc,
            uploaded: doc.uploaded?.toDate ? doc.uploaded.toDate() : new Date(),
        }));
    }

    return {
        ...data,
        id,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
    } as Project;
};

export const useProjects = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const projectsCollection = collection(db, 'projects');
        const q = query(projectsCollection, orderBy('startDate', 'desc'));

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
    }, []);

    return { projects, loading, error };
};
