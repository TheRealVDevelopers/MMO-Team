
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, Timestamp, writeBatch, limit } from 'firebase/firestore';
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
