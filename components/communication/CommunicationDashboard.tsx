import React, { useState, useMemo, useEffect } from 'react';
import CommunicationSidebar from './CommunicationSidebar';
import ChatWindow from './ChatWindow';
import { ChatChannel, ChatMessage } from '../../types';
import { CHAT_CHANNELS, CHAT_MESSAGES } from '../../constants';
import { useAuth } from '../../context/AuthContext';

const CommunicationDashboard: React.FC = () => {
    const { currentUser } = useAuth();
    
    const [messages, setMessages] = useState<ChatMessage[]>(CHAT_MESSAGES);
    
    const [channels, setChannels] = useState<ChatChannel[]>(() => {
        const channelsWithLastMessage = CHAT_CHANNELS.map(channel => {
            const channelMessages = CHAT_MESSAGES.filter(m => m.channelId === channel.id)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            
            return {
                ...channel,
                lastMessage: channelMessages[0]
            };
        });

        channelsWithLastMessage.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime();
        });
        return channelsWithLastMessage;
    });

    const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || '');
    
    const selectedChannel = useMemo(() => 
        channels.find(c => c.id === selectedChannelId), 
        [channels, selectedChannelId]
    );

    const handleSendMessage = (content: string) => {
        if (!currentUser || !selectedChannel) return;

        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            channelId: selectedChannel.id,
            senderId: currentUser.id,
            content,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, newMessage]);

        setChannels(prevChannels => {
            const updatedChannels = prevChannels.map(c => {
                if (c.id === newMessage.channelId) {
                    return { ...c, lastMessage: newMessage };
                }
                return c;
            });
            // Sort to bring the channel with the new message to the top
            updatedChannels.sort((a, b) => {
                if (!a.lastMessage) return 1;
                if (!b.lastMessage) return -1;
                return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime();
            });
            return updatedChannels;
        });
    };
    
    // Ensure a channel is selected if the current one becomes invalid
    useEffect(() => {
        if (!selectedChannel && channels.length > 0) {
            setSelectedChannelId(channels[0].id);
        }
    }, [selectedChannel, channels]);

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
                        key={selectedChannel.id} // Add key to force re-render on channel change
                        channel={selectedChannel}
                        messages={messages.filter(m => m.channelId === selectedChannel.id)} 
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
