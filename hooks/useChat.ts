
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
    limit,
    getDocs,
    doc,
    updateDoc
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
            // Add message
            const messageRef = await addDoc(collection(db, 'chat_messages'), {
                channelId,
                senderId,
                content,
                timestamp: serverTimestamp(),
                is_demo: false
            });

            // Update channel lastMessage
            const channelRef = doc(db, 'chat_channels', channelId);
            await updateDoc(channelRef, {
                lastMessage: {
                    content,
                    senderId,
                    timestamp: new Date() // Client side approximation, Firestore will use server time if we used serverTimestamp here but we're storing object
                },
                updatedAt: serverTimestamp()
            });

            return messageRef.id;
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
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) {
            setChannels([]);
            setLoading(false);
            return;
        }

        const channelsRef = collection(db, 'chat_channels');
        // Fetch channels where the user is a member
        const q = query(channelsRef, where('members', 'array-contains', userId));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const chans: ChatChannel[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();

                // Parse lastMessage timestamp if it exists
                let lastMessage = data.lastMessage;
                if (lastMessage && lastMessage.timestamp && typeof lastMessage.timestamp.toDate === 'function') {
                    lastMessage = {
                        ...lastMessage,
                        timestamp: lastMessage.timestamp.toDate()
                    };
                }

                chans.push({
                    ...data,
                    id: doc.id,
                    lastMessage,
                    // Ensure dates are parsed correctly if needed, though they might be timestamps
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                } as ChatChannel);
            });
            // Sort by updatedAt descending
            chans.sort((a, b) => {
                const timeA = a.updatedAt?.getTime() || 0;
                const timeB = b.updatedAt?.getTime() || 0;
                return timeB - timeA;
            });
            setChannels(chans);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching channels:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const createDirectChat = async (otherUserId: string, otherUserName: string, otherUserAvatar: string, currentUserName: string, currentUserAvatar: string) => {
        if (!userId) throw new Error("User not logged in");

        // Check if DM already exists
        // Note: Firestore array-contains doesn't support exact array match, so we have to filter client side or do a compound query if possible
        // Ideally: each DM has a unique ID like "min(uid1, uid2)_max(uid1, uid2)" to prevent duplicates
        const dmId = userId < otherUserId ? `${userId}_${otherUserId}` : `${otherUserId}_${userId}`;

        // Check if it exists (using getDoc would be better but we have the list often)
        const existing = channels.find(c => c.id === dmId);
        if (existing) return existing.id;

        // If not, try to create it with custom ID
        try {
            // We use setDoc-like behavior but since we don't have setDoc imported and to be safe with collision
            // We'll actually query first to be 100% sure if we weren't doing local check

            // Actually, let's just create a new doc if we want to rely on auto-IDs, BUT for DMs unique ID is best. 
            // Since we can't easily import setDoc here without changing imports significantly, let's iterate.
            // Let's stick to auto-ID for now to be safe and simple, relying on querying:

            // Better approach without custom IDs matches:
            // Query for channels with type 'dm' and these 2 members. 
            // Since firestore "array-contains" is single value, we can't do "array-contains [a,b]".
            // We can do "where members array-contains uid" and filter in JS, which we are essentially doing with 'channels'.

            // Let's create a new one
            const newChannelData = {
                type: 'dm',
                members: [userId, otherUserId],
                memberNames: {
                    [userId]: currentUserName,
                    [otherUserId]: otherUserName
                },
                memberAvatars: {
                    [userId]: currentUserAvatar,
                    [otherUserId]: otherUserAvatar
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isGroup: false,
                name: otherUserName, // For fallback
                avatar: otherUserAvatar // For fallback
            };

            const docRef = await addDoc(collection(db, 'chat_channels'), newChannelData);
            return docRef.id;
        } catch (err) {
            console.error("Error creating DM:", err);
            throw err;
        }
    };

    const createGroupChat = async (name: string, members: string[], memberDetails: Record<string, { name: string, avatar: string }>) => {
        if (!userId) throw new Error("User not logged in");

        const allMembers = [...members, userId]; // Ensure creator is included

        // Default group avatar if none provided (could be an icon)
        const groupAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(name) + "&background=random";

        const memberNames: Record<string, string> = {};
        const memberAvatars: Record<string, string> = {};

        allMembers.forEach(id => {
            if (memberDetails[id]) {
                memberNames[id] = memberDetails[id].name;
                memberAvatars[id] = memberDetails[id].avatar;
            }
        });

        const newChannelData = {
            type: 'group',
            name,
            avatar: groupAvatar,
            members: allMembers,
            memberNames,
            memberAvatars,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isGroup: true,
            admins: [userId]
        };

        try {
            const docRef = await addDoc(collection(db, 'chat_channels'), newChannelData);
            return docRef.id;
        } catch (err) {
            console.error("Error creating group:", err);
            throw err;
        }
    };

    return { channels, loading, error, createDirectChat, createGroupChat };
};
