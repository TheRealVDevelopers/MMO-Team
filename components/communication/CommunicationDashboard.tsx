import React, { useState, useMemo, useEffect } from 'react';
import CommunicationSidebar from './CommunicationSidebar';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../context/AuthContext';
import { useChat, useChannels } from '../../hooks/useChat';

const CommunicationDashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const { channels, loading: channelsLoading } = useChannels(currentUser?.id);
    const [selectedChannelId, setSelectedChannelId] = useState<string>('');
    const { messages, sendMessage, loading: messagesLoading } = useChat(selectedChannelId);

    // Update selectedChannelId when channels load if none selected
    useEffect(() => {
        if (!selectedChannelId && channels.length > 0) {
            setSelectedChannelId(channels[0].id);
        }
    }, [channels, selectedChannelId]);

    const selectedChannel = useMemo(() =>
        channels.find(c => c.id === selectedChannelId),
        [channels, selectedChannelId]
    );

    const handleSendMessage = async (content: string) => {
        if (!currentUser || !selectedChannel) return;
        await sendMessage(content, currentUser.id);
    };

    if (channelsLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen max-h-screen overflow-hidden bg-background">
            <CommunicationSidebar
                channels={channels}
                selectedChannelId={selectedChannelId}
                onSelectChannel={setSelectedChannelId}
            />
            <div className="flex-1 flex flex-col min-w-0">
                {selectedChannel ? (
                    <ChatWindow
                        key={selectedChannel.id}
                        channel={selectedChannel}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-text-secondary">Select a chat to start messaging.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunicationDashboard;
