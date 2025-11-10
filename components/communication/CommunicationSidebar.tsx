import React, { useState, useMemo } from 'react';
import { ChatChannel } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { USERS } from '../../constants';
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

    if (!channel.isGroup && channel.members.length === 2) {
        const otherUserId = channel.members.find(id => id !== currentUser?.id);
        const otherUser = USERS.find(u => u.id === otherUserId);
        if (otherUser) {
            displayName = otherUser.name;
            displayAvatar = otherUser.avatar;
        }
    }

    const lastMessage = channel.lastMessage;
    const sender = lastMessage ? USERS.find(u => u.id === lastMessage.senderId) : null;
    const senderName = sender?.id === currentUser?.id ? 'You' : sender?.name.split(' ')[0];
    const lastMessagePrefix = channel.isGroup && senderName && lastMessage ? `${senderName}: ` : '';

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-start p-2 rounded-lg text-left transition-colors ${isActive ? 'bg-primary-subtle-background' : 'hover:bg-subtle-background'}`}
        >
            <img src={displayAvatar} alt={displayName} className="w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 ml-3 min-w-0">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-text-primary truncate">{displayName}</p>
                    <p className="text-xs text-text-secondary flex-shrink-0 ml-2">
                        {formatTimestamp(lastMessage?.timestamp)}
                    </p>
                </div>
                <p className="text-sm text-text-secondary truncate mt-1">
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
        if (!searchTerm.trim()) return channels;
        const lowercasedTerm = searchTerm.toLowerCase();

        return channels.filter(channel => {
            if (!channel.isGroup && channel.members.length === 2) {
                const otherUserId = channel.members.find(id => id !== currentUser?.id);
                const otherUser = USERS.find(u => u.id === otherUserId);
                return otherUser?.name.toLowerCase().includes(lowercasedTerm);
            }
            return channel.name.toLowerCase().includes(lowercasedTerm);
        });
    }, [channels, searchTerm, currentUser]);

    return (
        <aside className="w-96 bg-surface border-r border-border flex-shrink-0 flex flex-col" aria-label="Communication Sidebar">
            <div className="h-16 flex items-center px-4 border-b border-border flex-shrink-0">
                <h2 className="text-lg font-bold text-text-primary">Chats</h2>
            </div>
            <div className="p-2 border-b border-border">
                <div className="relative">
                     <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"/>
                     <input
                        type="text"
                        placeholder="Search or start new chat"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border-border bg-subtle-background rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredChannels.map(channel => (
                    <ChatListItem 
                        key={channel.id}
                        channel={channel}
                        isActive={selectedChannelId === channel.id}
                        onClick={() => onSelectChannel(channel.id)}
                    />
                ))}
            </div>
        </aside>
    );
};

export default CommunicationSidebar;
