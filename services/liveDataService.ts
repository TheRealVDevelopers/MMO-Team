
import { db } from '../firebase';
import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    query,
    where,
    Timestamp
} from 'firebase/firestore';
import {
    LEADS,
    PROJECTS,
    USERS,
    CHAT_MESSAGES,
    CHAT_CHANNELS,
    ACTIVITIES
} from '../constants';
import { Notification, Activity } from '../types';

export const seedDemoData = async () => {
    if (!db) {
        console.log("Skipping demo data seeding because Firebase is not initialized (demo mode).");
        return;
    }
    console.log("Starting demo data seeding...");

    // Seed Leads
    const leadsRef = collection(db, 'leads');
    const leadSnapshot = await getDocs(query(leadsRef, where('is_demo', '==', true)));
    if (leadSnapshot.empty) {
        console.log("Seeding leads...");
        for (const lead of LEADS) {
            const { id, ...leadData } = lead;
            await addDoc(leadsRef, {
                ...leadData,
                is_demo: true,
                inquiryDate: Timestamp.fromDate(lead.inquiryDate),
                history: lead.history.map(h => ({ ...h, timestamp: Timestamp.fromDate(h.timestamp) })),
                reminders: lead.reminders?.map(r => ({ ...r, date: Timestamp.fromDate(r.date) })) || []
            });
        }
    }

    // Seed Projects
    const projectsRef = collection(db, 'projects');
    const projectSnapshot = await getDocs(query(projectsRef, where('is_demo', '==', true)));
    if (projectSnapshot.empty) {
        console.log("Seeding projects...");
        for (const project of PROJECTS) {
            const { id, ...projectData } = project;
            await addDoc(projectsRef, {
                ...projectData,
                is_demo: true,
                startDate: Timestamp.fromDate(project.startDate),
                endDate: Timestamp.fromDate(project.endDate),
                documents: project.documents?.map(d => ({ ...d, uploaded: Timestamp.fromDate(d.uploaded) })) || []
            });
        }
    }

    // Seed Users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    if (usersSnapshot.size <= 1) { // Only seed if empty or just one user
        console.log("Seeding users...");
        const { setDoc, doc } = await import('firebase/firestore');
        for (const user of USERS) {
            await setDoc(doc(db, 'users', user.id), {
                ...user,
                lastUpdateTimestamp: serverTimestamp(),
                performanceFlag: ['green', 'yellow', 'red'][Math.floor(Math.random() * 3)], // Mock performance
                activeTaskCount: Math.floor(Math.random() * 5),
                is_demo: true
            });
        }
    }

    // Seed Notifications (Initial set from components/dashboard/shared/NotificationPopover.tsx INITIAL_NOTIFICATIONS)
    const notificationsRef = collection(db, 'notifications');
    const notifSnapshot = await getDocs(query(notificationsRef, where('is_demo', '==', true)));
    if (notifSnapshot.empty) {
        console.log("Seeding notifications...");
        const INITIAL_NOTIFICATIONS = [
            {
                title: 'New Lead Assigned',
                message: 'A new lead from "TechCorp Systems" has been assigned to you.',
                type: 'info',
                user_id: 'user-3', // Assigning to John Sales for demo
                entity_type: 'lead',
                is_read: false,
                is_demo: true,
                created_at: serverTimestamp(),
            },
            {
                title: 'Project Update',
                message: 'The "Skyline Tower" project status has been updated to Execution.',
                type: 'success',
                user_id: 'user-3',
                entity_type: 'project',
                is_read: false,
                is_demo: true,
                created_at: serverTimestamp(),
            },
            {
                title: 'Meeting Reminder',
                message: 'Weekly sales sync starting in 15 minutes.',
                type: 'warning',
                user_id: 'user-3',
                entity_type: 'system',
                is_read: true,
                is_demo: true,
                created_at: serverTimestamp(),
            }
        ];

        for (const notif of INITIAL_NOTIFICATIONS) {
            await addDoc(notificationsRef, notif);
        }
    }

    console.log("Demo data seeding completed.");
};

export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'is_demo'>) => {
    try {
        if (!db) return;
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
            ...notification,
            is_read: false,
            is_demo: false,
            created_at: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

export const logActivity = async (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    try {
        if (!db) return;
        const activitiesRef = collection(db, 'activities');
        await addDoc(activitiesRef, {
            ...activity,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};

export const generateRandomPassword = (length: number = 8): string => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};


