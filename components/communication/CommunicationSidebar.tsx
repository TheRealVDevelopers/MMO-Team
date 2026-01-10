import React, { useState, useMemo } from 'react';
import { ChatChannel } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MagnifyingGlassIcon } from '../icons/IconComponents';

interface CommunicationSidebarProps {
    channels: ChatChannel[];
    selectedChannelId: string;
    onSelectChannel: (channelId: string) => void;
}

const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);

    const isToday = messageDate.toDateString() === now.toDateString();

    if (isToday) {
        return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }

    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const ChatListItem: React.FC<{
    channel: ChatChannel;
    isActive: boolean;
    onClick: () => void;
}> = ({ channel, isActive, onClick }) => {
    const { currentUser } = useAuth();

    let displayName = channel.name;
    let displayAvatar = channel.avatar;

    // For DMs, show the other person's name if we have it
    // In a live system, we might need a useUsers hook, but for now we rely on channel meta
    if (!channel.isGroup && channel.members.length === 2 && channel.memberNames) {
        const otherUserName = Object.entries(channel.memberNames).find(([id]) => id !== currentUser?.id)?.[1];
        if (otherUserName) displayName = otherUserName;

        const otherUserAvatar = channel.memberAvatars?.[Object.keys(channel.memberNames).find(id => id !== currentUser?.id) || ''];
        if (otherUserAvatar) displayAvatar = otherUserAvatar;
    }

    const lastMessage = channel.lastMessage;
    // Simple sender name logic for sidebar
    const lastMessagePrefix = channel.isGroup && lastMessage ? `${lastMessage.senderId === currentUser?.id ? 'You' : 'Someone'}: ` : '';

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-start p-3 rounded-xl text-left transition-all ${isActive ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-subtle-background border-l-4 border-transparent'}`}
        >
            <img src={displayAvatar} alt={displayName} className="w-12 h-12 rounded-full flex-shrink-0 shadow-sm" />
            <div className="flex-1 ml-3 min-w-0">
                <div className="flex justify-between items-center">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-text-primary'}`}>{displayName}</p>
                    <p className="text-[10px] text-text-tertiary flex-shrink-0 ml-2">
                        {formatTimestamp(lastMessage?.timestamp)}
                    </p>
                </div>
                <p className="text-xs text-text-secondary truncate mt-1">
                    {lastMessage ? <><span className="font-medium">{lastMessagePrefix}</span>{lastMessage.content}</> : 'No messages yet'}
                </p>
            </div>
        </button>
    );
}

const CommunicationSidebar: React.FC<CommunicationSidebarProps> = ({ channels, selectedChannelId, onSelectChannel }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { currentUser } = useAuth();

    const filteredChannels = useMemo(() => {
        let sorted = [...channels];
        // Sort by last message timestamp
        sorted.sort((a, b) => {
            const timeA = a.lastMessage?.timestamp?.getTime() || 0;
            const timeB = b.lastMessage?.timestamp?.getTime() || 0;
            return timeB - timeA;
        });

        if (!searchTerm.trim()) return sorted;
        const lowercasedTerm = searchTerm.toLowerCase();

        return sorted.filter(channel => {
            const nameMatch = channel.name.toLowerCase().includes(lowercasedTerm);
            const memberMatch = channel.memberNames && Object.values(channel.memberNames).some(name => (name as string).toLowerCase().includes(lowercasedTerm));
            return nameMatch || memberMatch;
        });
    }, [channels, searchTerm]);

    return (
        <aside className="w-80 lg:w-96 bg-surface border-r border-border flex-shrink-0 flex flex-col h-full" aria-label="Communication Sidebar">
            <div className="h-18 flex items-center px-6 border-b border-border flex-shrink-0">
                <h2 className="text-xl font-bold text-text-primary tracking-tight">Messages</h2>
            </div>
            <div className="p-4 border-b border-border bg-background/30">
                <div className="relative group">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border-border bg-surface rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-tertiary"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                {filteredChannels.length === 0 ? (
                    <div className="p-8 text-center text-text-tertiary">
                        <p className="text-sm">No conversations found</p>
                    </div>
                ) : (
                    filteredChannels.map(channel => (
                        <ChatListItem
                            key={channel.id}
                            channel={channel}
                            isActive={selectedChannelId === channel.id}
                            onClick={() => onSelectChannel(channel.id)}
                        />
                    ))
                )}
            </div>
        </aside>
    );
};

export default CommunicationSidebar;
