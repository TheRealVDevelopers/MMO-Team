
import React, { useState, useMemo } from 'react';
import { ChatChannel, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import { MagnifyingGlassIcon, PlusIcon, UserGroupIcon, ChatBubbleLeftRightIcon, UsersIcon } from '../icons/IconComponents';

interface CommunicationSidebarProps {
    channels: ChatChannel[];
    selectedChannelId: string;
    onSelectChannel: (channelId: string) => void;
    onNewChat: () => void;
    onCreateGroup: () => void;
    onSelectUser?: (user: User) => void;  // New prop for quick DM
}

const formatTimestamp = (date?: any) => {
    if (!date) return '';
    try {
        const now = new Date();
        const messageDate = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));

        if (isNaN(messageDate.getTime())) return '';

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
    } catch (e) {
        return '';
    }
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
    if (!channel.isGroup && channel.members?.length === 2 && channel.memberNames) {
        const otherUserId = Object.keys(channel.memberNames).find(id => id !== currentUser?.id);
        if (otherUserId) {
            displayName = channel.memberNames[otherUserId];
            displayAvatar = channel.memberAvatars?.[otherUserId] || displayAvatar;
        }
    }

    const lastMessage = channel.lastMessage;
    const lastMessagePrefix = channel.isGroup && lastMessage ? `${lastMessage.senderId === currentUser?.id ? 'You' : 'Someone'}: ` : '';

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-start p-3 rounded-xl text-left transition-all group ${isActive ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-subtle-background border-l-4 border-transparent'}`}
        >
            <div className="relative">
                <img src={displayAvatar} alt={displayName} className="w-12 h-12 rounded-full flex-shrink-0 shadow-sm object-cover bg-surface" />
                {isActive && <div className="absolute inset-0 ring-2 ring-primary rounded-full ring-offset-2 ring-offset-surface"></div>}
            </div>

            <div className="flex-1 ml-3 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-text-primary'}`}>{displayName}</p>
                    <p className="text-[10px] text-text-tertiary flex-shrink-0 ml-2 font-medium">
                        {formatTimestamp(lastMessage?.timestamp)}
                    </p>
                </div>
                <p className={`text-xs truncate leading-relaxed ${isActive ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                    {lastMessage ? <><span className="font-semibold opacity-80">{lastMessagePrefix}</span>{lastMessage.content}</> : <span className="italic opacity-60">No messages yet</span>}
                </p>
            </div>
        </button>
    );
}

const CommunicationSidebar: React.FC<CommunicationSidebarProps> = ({ 
    channels, 
    selectedChannelId, 
    onSelectChannel, 
    onNewChat, 
    onCreateGroup,
    onSelectUser 
}) => {
    const { currentUser } = useAuth();
    const { users } = useUsers();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'dm' | 'group'>('all'); // Filter tabs
    const [showTeamMembers, setShowTeamMembers] = useState(true); // Toggle team members

    // Filter out current user from team members
    const teamMembers = useMemo(() => {
        return users.filter(u => u.id !== currentUser?.id);
    }, [users, currentUser]);

    // Search in team members
    const filteredTeamMembers = useMemo(() => {
        if (!searchTerm.trim()) return teamMembers;
        const lowercased = searchTerm.toLowerCase();
        return teamMembers.filter(u => 
            u.name.toLowerCase().includes(lowercased) ||
            u.role.toLowerCase().includes(lowercased)
        );
    }, [teamMembers, searchTerm]);

    const filteredChannels = useMemo(() => {
        let sorted = [...channels];
        // Sort by last message timestamp (or createdAt if no messages)
        sorted.sort((a, b) => {
            const timeA = a.lastMessage?.timestamp?.getTime() || a.updatedAt?.getTime() || 0;
            const timeB = b.lastMessage?.timestamp?.getTime() || a.updatedAt?.getTime() || 0;
            return timeB - timeA;
        });

        // Filter by Tab
        if (activeTab === 'dm') sorted = sorted.filter(c => !c.isGroup);
        if (activeTab === 'group') sorted = sorted.filter(c => c.isGroup);

        // Filter by Search
        if (!searchTerm.trim()) return sorted;
        const lowercasedTerm = searchTerm.toLowerCase();

        return sorted.filter(channel => {
            const nameMatch = channel.name.toLowerCase().includes(lowercasedTerm);
            const memberMatch = channel.memberNames && Object.values(channel.memberNames).some(name => (name as string).toLowerCase().includes(lowercasedTerm));
            return nameMatch || memberMatch;
        });
    }, [channels, searchTerm, activeTab]);

    return (
        <aside className="w-full md:w-80 lg:w-96 bg-surface border-r border-border flex-shrink-0 flex flex-col h-full" aria-label="Communication Sidebar">
            {/* Header */}
            <div className="h-18 px-5 border-b border-border flex items-center justify-between flex-shrink-0 bg-surface z-10">
                <h2 className="text-xl font-bold text-text-primary tracking-tight">Messages</h2>
                <div className="flex gap-2">
                    <button
                        onClick={onCreateGroup}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-subtle-background rounded-full transition-all"
                        title="Create Group"
                    >
                        <UserGroupIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onNewChat}
                        className="p-2 text-white bg-primary hover:bg-primary-hover rounded-full transition-all shadow-md hover:shadow-lg shadow-primary/20"
                        title="New Chat"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="p-4 pb-2 space-y-3 bg-surface">
                <div className="relative group">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border-none bg-subtle-background rounded-xl focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-tertiary"
                    />
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-subtle-background rounded-xl">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'all' ? 'bg-white text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setActiveTab('dm')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'dm' ? 'bg-white text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                    >
                        Direct
                    </button>
                    <button
                        onClick={() => setActiveTab('group')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'group' ? 'bg-white text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                    >
                        Groups
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
                {/* Team Members Section */}
                {showTeamMembers && filteredTeamMembers.length > 0 && (
                    <div className="mb-4">
                        <button
                            onClick={() => setShowTeamMembers(!showTeamMembers)}
                            className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider hover:text-primary transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <UsersIcon className="w-4 h-4" />
                                <span>Team Members ({filteredTeamMembers.length})</span>
                            </div>
                            <svg 
                                className={`w-4 h-4 transition-transform ${showTeamMembers ? 'rotate-180' : ''}`}
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showTeamMembers && (
                            <div className="space-y-1 mt-2">
                                {filteredTeamMembers.slice(0, 10).map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => onSelectUser?.(user)}
                                        className="w-full flex items-center p-2 rounded-lg hover:bg-subtle-background transition-all group"
                                    >
                                        <img
                                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                            alt={user.name}
                                            className="w-10 h-10 rounded-full flex-shrink-0 shadow-sm object-cover bg-surface"
                                        />
                                        <div className="flex-1 ml-3 text-left min-w-0">
                                            <p className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-text-tertiary truncate capitalize">
                                                {user.role}
                                            </p>
                                        </div>
                                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                                {filteredTeamMembers.length > 10 && (
                                    <button
                                        onClick={onNewChat}
                                        className="w-full text-xs text-center py-2 text-primary hover:text-primary-hover font-medium"
                                    >
                                        View all {filteredTeamMembers.length} members
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Conversations Divider */}
                {showTeamMembers && filteredTeamMembers.length > 0 && filteredChannels.length > 0 && (
                    <div className="px-3 py-2">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-border"></div>
                            <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Recent</span>
                            <div className="flex-1 h-px bg-border"></div>
                        </div>
                    </div>
                )}

                {/* Conversations List */}
                {filteredChannels.length === 0 && (!showTeamMembers || filteredTeamMembers.length === 0) ? (
                    <div className="p-10 text-center text-text-tertiary flex flex-col items-center">
                        <ChatBubbleLeftRightIcon className="w-12 h-12 mb-3 opacity-10" />
                        <p className="text-sm font-medium">No conversations found</p>
                        <p className="text-xs mt-1 opacity-70">Start a new chat to connect with your team</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredChannels.map(channel => (
                            <ChatListItem
                                key={channel.id}
                                channel={channel}
                                isActive={selectedChannelId === channel.id}
                                onClick={() => onSelectChannel(channel.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
};

export default CommunicationSidebar;
