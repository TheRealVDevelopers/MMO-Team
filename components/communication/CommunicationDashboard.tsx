
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat, useChannels } from '../../hooks/useChat';
import { ContentCard } from '../dashboard/shared/DashboardUI';
import CommunicationSidebar from './CommunicationSidebar';
import ChatWindow from './ChatWindow';
import UserListModal from './UserListModal';
import CreateGroupModal from './CreateGroupModal';
import { ChatChannel } from '../../types';

const CommunicationDashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const { channels, loading: channelsLoading } = useChannels(currentUser?.id);
    // Move chat logic inside specific channel view, here we manage selection
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const selectedChannel = channels.find(c => c.id === selectedChannelId);

    // Chat hook for the Selected Channel
    const { messages, sendMessage, loading: messagesLoading } = useChat(selectedChannelId || undefined);

    // Helpers to create chats
    const { createDirectChat, createGroupChat } = useChannels(currentUser?.id);

    // Modals
    const [showUserList, setShowUserList] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    // Auto-select first channel if none selected and not loading
    useEffect(() => {
        if (!channelsLoading && channels.length > 0 && !selectedChannelId) {
            setSelectedChannelId(channels[0].id);
        }
    }, [channels, channelsLoading]);

    const handleSendMessage = async (content: string) => {
        if (!currentUser || !selectedChannelId) return;
        await sendMessage(content, currentUser.id);
    };

    const handleCreateDM = async (otherUser: any) => {
        if (!currentUser) return;
        try {
            const channelId = await createDirectChat(
                otherUser.id,
                otherUser.name,
                otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`,
                currentUser.name,
                currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`
            );
            setShowUserList(false);
            if (channelId) setSelectedChannelId(channelId);
        } catch (e) {
            console.error("Failed to create DM", e);
            alert("Failed to create chat");
        }
    };

    const handleCreateGroup = async (name: string, members: string[], memberDetails: any) => {
        try {
            const channelId = await createGroupChat(name, members, memberDetails);
            setShowCreateGroup(false);
            if (channelId) setSelectedChannelId(channelId);
        } catch (e) {
            console.error("Failed to create group", e);
            alert("Failed to create group");
        }
    };

    if (!currentUser) return null;

    return (
        <ContentCard className="h-[calc(100vh-12rem)] min-h-[500px] flex flex-col md:flex-row !p-0 overflow-hidden relative">
            <CommunicationSidebar
                channels={channels}
                selectedChannelId={selectedChannelId || ''}
                onSelectChannel={setSelectedChannelId}
                onNewChat={() => setShowUserList(true)}
                onCreateGroup={() => setShowCreateGroup(true)}
                onSelectUser={handleCreateDM}
            />

            {selectedChannel ? (
                <ChatWindow
                    channel={selectedChannel}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                />
            ) : (
                <div className="flex-1 flex items-center justify-center bg-subtle-background text-text-tertiary">
                    <div className="text-center">
                        <h3 className="text-lg font-bold mb-2">Welcome to Team Chat</h3>
                        <p className="text-sm">Select a conversation or start a new one.</p>
                    </div>
                </div>
            )}

            {/* Modals */}
            <UserListModal
                isOpen={showUserList}
                onClose={() => setShowUserList(false)}
                onSelectUser={handleCreateDM}
                currentUserId={currentUser.id}
            />

            <CreateGroupModal
                isOpen={showCreateGroup}
                onClose={() => setShowCreateGroup(false)}
                onCreateGroup={handleCreateGroup}
                currentUserId={currentUser.id}
            />
        </ContentCard>
    );
};

export default CommunicationDashboard;
