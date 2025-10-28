import React, { useState, useMemo } from 'react';
import CommunicationSidebar from './CommunicationSidebar';
import ChatWindow from './ChatWindow';
import QuickClarifyChannel from './QuickClarifyChannel';
import { ChatChannel, ChannelType, ChatMessage, QuickClarifyQuestion } from '../../types';
import { CHAT_CHANNELS, CHAT_MESSAGES, QUICK_CLARIFY_QUESTIONS } from '../../constants';

const CommunicationDashboard: React.FC = () => {
    const [channels] = useState<ChatChannel[]>(CHAT_CHANNELS);
    const [messages, setMessages] = useState<ChatMessage[]>(CHAT_MESSAGES);
    const [questions, setQuestions] = useState<QuickClarifyQuestion[]>(QUICK_CLARIFY_QUESTIONS);
    const [selectedChannelId, setSelectedChannelId] = useState<string>(CHAT_CHANNELS[0].id);

    const selectedChannel = useMemo(() => 
        channels.find(c => c.id === selectedChannelId), 
        [channels, selectedChannelId]
    );

    const handleSendMessage = (newMessage: ChatMessage) => {
        setMessages(prev => [...prev, newMessage]);
    };

    const handleAskQuestion = (newQuestion: QuickClarifyQuestion) => {
        setQuestions(prev => [...prev, newQuestion]);
    };

    return (
        <div className="flex h-screen max-h-screen overflow-hidden bg-background">
            <CommunicationSidebar 
                channels={channels}
                selectedChannelId={selectedChannelId}
                onSelectChannel={setSelectedChannelId}
            />
            <div className="flex-1 flex flex-col min-w-0">
                {selectedChannel?.type === ChannelType.QUICK_CLARIFY ? (
                    <QuickClarifyChannel 
                        channel={selectedChannel}
                        questions={questions}
                        onAskQuestion={handleAskQuestion}
                    />
                ) : selectedChannel ? (
                    <ChatWindow 
                        channel={selectedChannel}
                        messages={messages.filter(m => m.channelId === selectedChannel.id)} 
                        onSendMessage={handleSendMessage}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-text-secondary">Select a channel to start communicating.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunicationDashboard;