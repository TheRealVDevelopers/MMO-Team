
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    onSnapshot,
    query,
    where,
    orderBy,
    addDoc,
    serverTimestamp,
    Timestamp,
    limit
} from 'firebase/firestore';
import { ChatChannel, ChatMessage } from '../types';

type FirestoreChatMessage = Omit<ChatMessage, 'timestamp'> & {
    timestamp: Timestamp;
};

const fromFirestoreMessage = (docData: FirestoreChatMessage, id: string): ChatMessage => {
    return {
        ...docData,
        id,
        timestamp: docData.timestamp?.toDate() || new Date(),
    };
};

export const useChat = (channelId?: string) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!channelId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const messagesRef = collection(db, 'chat_messages');
        const q = query(
            messagesRef,
            where('channelId', '==', channelId),
            orderBy('timestamp', 'asc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs: ChatMessage[] = [];
            querySnapshot.forEach((doc) => {
                msgs.push(fromFirestoreMessage(doc.data() as FirestoreChatMessage, doc.id));
            });
            setMessages(msgs);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching messages:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [channelId]);

    const sendMessage = async (content: string, senderId: string) => {
        if (!channelId) return;
        try {
            await addDoc(collection(db, 'chat_messages'), {
                channelId,
                senderId,
                content,
                timestamp: serverTimestamp(),
                is_demo: false
            });
        } catch (err) {
            console.error("Error sending message:", err);
            throw err;
        }
    };

    return { messages, loading, error, sendMessage };
};

export const useChannels = (userId?: string) => {
    const [channels, setChannels] = useState<ChatChannel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setChannels([]);
            setLoading(false);
            return;
        }

        const channelsRef = collection(db, 'chat_channels');
        // In a real app, we'd query channel members. For now, simple fetch.
        const q = query(channelsRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const chans: ChatChannel[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as any;
                // If it's a DM, adjust name based on recipient
                chans.push({ ...data, id: doc.id });
            });
            setChannels(chans);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching channels:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { channels, loading };
};
