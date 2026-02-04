
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, Timestamp, writeBatch, limit, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Notification } from '../types';

type FirestoreNotification = Omit<Notification, 'created_at'> & {
    created_at: Timestamp;
};

const fromFirestore = (docData: FirestoreNotification, id: string): Notification => {
    return {
        ...docData,
        id,
        created_at: docData.created_at?.toDate() || new Date(),
    };
};

export const useNotifications = (userId?: string) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('user_id', '==', userId),
            orderBy('created_at', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const notifData: Notification[] = [];
            querySnapshot.forEach((doc) => {
                notifData.push(fromFirestore(doc.data() as FirestoreNotification, doc.id));
            });
            setNotifications(notifData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching notifications:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const markAsRead = async (id: string) => {
        try {
            const notifRef = doc(db, 'notifications', id);
            await updateDoc(notifRef, { is_read: true });
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const batch = writeBatch(db);
            notifications.filter(n => !n.is_read).forEach(n => {
                const notifRef = doc(db, 'notifications', n.id);
                batch.update(notifRef, { is_read: true });
            });
            await batch.commit();
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    };

    return { notifications, loading, error, markAsRead, markAllAsRead };
};

// Helper function to create a notification for a specific user
export const createNotification = async (notification: {
    user_id: string;
    title: string;
    message: string;
    type: 'approval' | 'task' | 'lead' | 'project' | 'system';
    link?: string;
    context_id?: string;
    context_type?: string;
}) => {
    try {
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
            ...notification,
            is_read: false,
            is_demo: false,
            created_at: serverTimestamp()
        });
        console.log('Notification created successfully');
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// Helper to notify all admins about a new approval request
export const notifyAdminsOfApproval = async (
    title: string,
    message: string,
    contextId?: string,
    contextType?: string
) => {
    try {
        // Get all admin/super admin users
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);

        const adminIds: string[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.role === 'SUPER_ADMIN' || data.role === 'super_admin') {
                adminIds.push(doc.id);
            }
        });

        // Create notification for each admin
        for (const adminId of adminIds) {
            await createNotification({
                user_id: adminId,
                title,
                message,
                type: 'approval',
                context_id: contextId,
                context_type: contextType,
                link: '/approvals'
            });
        }

        console.log(`Notified ${adminIds.length} admin(s) about approval request`);
    } catch (error) {
        console.error('Error notifying admins:', error);
    }
};
