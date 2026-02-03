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

type FirestoreChatMessage = Omit<ChatMessage, 'timestamp'> & {
    timestamp: Timestamp;
};

const fromFirestoreMessage = (docData: FirestoreChatMessage, id: string): ChatMessage => {
    // Safely convert timestamp
    let timestamp: Date;
    if (docData.timestamp && typeof docData.timestamp === 'object' && 'toDate' in docData.timestamp) {
        timestamp = (docData.timestamp as any).toDate();
    } else if (docData.timestamp instanceof Date) {
        timestamp = docData.timestamp;
    } else if (docData.timestamp) {
        timestamp = new Date(docData.timestamp as any);
    } else {
        timestamp = new Date();
    }

    return {
        ...docData,
        id,
        timestamp,
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
            // Clean message data before sending
            const messageData = removeUndefinedValues({
                channelId,
                senderId,
                content,
                timestamp: serverTimestamp(),
                is_demo: false
            });

            // Add message
            const messageRef = await addDoc(collection(db, 'chat_messages'), messageData);

            // Update channel lastMessage
            const channelRef = doc(db, 'chat_channels', channelId);
            const lastMessageData = removeUndefinedValues({
                lastMessage: {
                    content,
                    senderId,
                    timestamp: new Date() // Client side approximation
                },
                updatedAt: serverTimestamp()
            });
            
            await updateDoc(channelRef, lastMessageData);

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

                // Safely parse lastMessage timestamp
                let lastMessage = data.lastMessage;
                if (lastMessage && lastMessage.timestamp) {
                    let msgTimestamp: Date;
                    if (typeof lastMessage.timestamp === 'object' && 'toDate' in lastMessage.timestamp) {
                        msgTimestamp = (lastMessage.timestamp as any).toDate();
                    } else if (lastMessage.timestamp instanceof Date) {
                        msgTimestamp = lastMessage.timestamp;
                    } else {
                        msgTimestamp = new Date(lastMessage.timestamp);
                    }
                    lastMessage = {
                        ...lastMessage,
                        timestamp: msgTimestamp
                    };
                }

                // Safely parse createdAt
                let createdAt: Date;
                if (data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt) {
                    createdAt = (data.createdAt as any).toDate();
                } else if (data.createdAt instanceof Date) {
                    createdAt = data.createdAt;
                } else if (data.createdAt) {
                    createdAt = new Date(data.createdAt);
                } else {
                    createdAt = new Date();
                }

                // Safely parse updatedAt
                let updatedAt: Date;
                if (data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt) {
                    updatedAt = (data.updatedAt as any).toDate();
                } else if (data.updatedAt instanceof Date) {
                    updatedAt = data.updatedAt;
                } else if (data.updatedAt) {
                    updatedAt = new Date(data.updatedAt);
                } else {
                    updatedAt = new Date();
                }

                chans.push({
                    ...data,
                    id: doc.id,
                    lastMessage,
                    createdAt,
                    updatedAt,
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

        try {
            // Check if DM already exists
            const dmId = userId < otherUserId ? `${userId}_${otherUserId}` : `${otherUserId}_${userId}`;
            const existing = channels.find(c => c.id === dmId);
            if (existing) {
                console.log('DM already exists, returning existing channel:', existing.id);
                return existing.id;
            }

            // Helper to get avatar URL (use generated URL instead of base64 to avoid size limit)
            const getAvatarUrl = (avatar: string, name: string) => {
                // If it's already a URL, use it
                if (avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'))) {
                    return avatar;
                }
                // If it's base64 (starts with data:), skip it and use generated avatar
                // Base64 images can be huge and exceed Firestore's 1MB doc limit
                return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
            };

            // Create new DM channel - DON'T store base64 avatars!
            const newChannelData = {
                type: 'dm',
                members: [userId, otherUserId],
                memberNames: {
                    [userId]: currentUserName,
                    [otherUserId]: otherUserName
                },
                // Store avatar URLs only, not base64 data
                memberAvatars: {
                    [userId]: getAvatarUrl(currentUserAvatar, currentUserName),
                    [otherUserId]: getAvatarUrl(otherUserAvatar, otherUserName)
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isGroup: false,
                name: otherUserName,
                avatar: getAvatarUrl(otherUserAvatar, otherUserName)
            };

            // Clean undefined values before sending to Firestore
            const cleanedData = removeUndefinedValues(newChannelData);
            
            console.log('Creating new DM (avatar URLs only)');
            const docRef = await addDoc(collection(db, 'chat_channels'), cleanedData);
            console.log('DM created successfully with ID:', docRef.id);
            
            return docRef.id;
        } catch (err) {
            console.error("Error creating DM:", err);
            throw err;
        }
    };

    const createGroupChat = async (name: string, members: string[], memberDetails: Record<string, { name: string, avatar: string }>) => {
        if (!userId) throw new Error("User not logged in");

        const allMembers = [...members, userId]; // Ensure creator is included

        // Default group avatar if none provided
        const groupAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(name) + "&background=random";

        // Helper to get avatar URL (avoid storing base64)
        const getAvatarUrl = (avatar: string, name: string) => {
            if (avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'))) {
                return avatar;
            }
            // If it's base64, use generated avatar instead
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
        };

        const memberNames: Record<string, string> = {};
        const memberAvatars: Record<string, string> = {};

        allMembers.forEach(id => {
            if (memberDetails[id]) {
                memberNames[id] = memberDetails[id].name;
                // Store avatar URLs only, not base64 data
                memberAvatars[id] = getAvatarUrl(memberDetails[id].avatar, memberDetails[id].name);
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

        // Clean undefined values before sending to Firestore
        const cleanedData = removeUndefinedValues(newChannelData);

        try {
            console.log('Creating new group (avatar URLs only)');
            const docRef = await addDoc(collection(db, 'chat_channels'), cleanedData);
            console.log('Group created successfully with ID:', docRef.id);
            return docRef.id;
        } catch (err) {
            console.error("Error creating group:", err);
            throw err;
        }
    };

    return { channels, loading, error, createDirectChat, createGroupChat };
};
