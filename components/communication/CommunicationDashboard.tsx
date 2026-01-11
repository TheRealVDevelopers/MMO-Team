import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { PaperAirplaneIcon, PaperClipIcon, HashtagIcon } from '../icons/IconComponents';
import { ContentCard, cn } from '../dashboard/shared/DashboardUI';
import { motion } from 'framer-motion';

// Simple types for internal use
interface Channel {
    id: string;
    name: string;
    description: string;
}

const STATIC_CHANNELS: Channel[] = [
    { id: 'general', name: 'general', description: 'General team discussion' },
    { id: 'announcements', name: 'announcements', description: 'Important updates' },
    { id: 'random', name: 'random', description: 'Non-work banter' }
];

const CommunicationDashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const [selectedChannel, setSelectedChannel] = useState<Channel>(STATIC_CHANNELS[0]);
    // Mocking chat hook usage for the simple board - effectively using 'general' as default
    const { messages, sendMessage, loading } = useChat(selectedChannel.id);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mock scrolling
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;
        await sendMessage(newMessage, currentUser.id);
        setNewMessage('');
    };

    return (
        <ContentCard className="h-full flex flex-col md:flex-row !p-0 overflow-hidden">
            {/* Simple Channel List (Side) */}
            <div className="w-full md:w-64 bg-subtle-background/50 border-b md:border-b-0 md:border-r border-border flex-shrink-0 flex flex-col">
                <div className="p-6 border-b border-border/40">
                    <h2 className="font-serif font-black text-xl text-text-primary">Team Chat</h2>
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mt-1">Message Board</p>
                </div>
                <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {STATIC_CHANNELS.map(channel => (
                        <button
                            key={channel.id}
                            onClick={() => setSelectedChannel(channel)}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all",
                                selectedChannel.id === channel.id
                                    ? "bg-white shadow-sm ring-1 ring-border text-primary"
                                    : "text-text-secondary hover:bg-surface"
                            )}
                        >
                            <HashtagIcon className="w-4 h-4 opacity-70" />
                            <div>
                                <p className="text-xs font-bold font-mono">#{channel.name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-background">
                {/* Header */}
                <div className="h-16 border-b border-border flex items-center px-6 bg-surface">
                    <HashtagIcon className="w-5 h-5 text-text-tertiary mr-2" />
                    <div>
                        <h3 className="text-sm font-bold text-text-primary">#{selectedChannel.name}</h3>
                        <p className="text-[10px] text-text-tertiary">{selectedChannel.description}</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="flex justify-center pt-10">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-text-tertiary pt-20">
                            <p className="text-sm italic">No messages in #{selectedChannel.name} yet.</p>
                            <p className="text-xs mt-1">Be the first to say hello!</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.senderId === currentUser?.id;
                            const showAvatar = i === 0 || messages[i - 1].senderId !== msg.senderId;

                            // Mock User Avatar/Name lookup would go here, simpler for now
                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn("flex items-end gap-3", isMe ? "flex-row-reverse" : "")}
                                >
                                    {/* Avatar placeholder */}
                                    <div className={cn("w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-black uppercase text-text-tertiary flex-shrink-0", !showAvatar && "opacity-0 invisible")}>
                                        {msg.senderId.slice(0, 2)}
                                    </div>

                                    <div className={cn("max-w-[80%]", isMe ? "items-end" : "items-start")}>
                                        {showAvatar && !isMe && (
                                            <p className="text-[10px] font-bold text-text-tertiary mb-1 ml-1">User {msg.senderId.slice(0, 3)}</p>
                                        )}
                                        <div className={cn(
                                            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                                            isMe
                                                ? "bg-primary text-white rounded-br-none"
                                                : "bg-surface border border-border rounded-bl-none text-text-primary"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-surface border-t border-border">
                    <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-2 px-2">
                        <button type="button" className="p-2 text-text-secondary hover:bg-subtle-background rounded-xl transition-colors mb-1">
                            <PaperClipIcon className="w-5 h-5" />
                        </button>
                        <textarea
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder={`Message #${selectedChannel.name}...`}
                            className="flex-1 bg-subtle-background border-none rounded-2xl py-3 px-4 text-sm focus:ring-1 focus:ring-primary max-h-32 min-h-[48px] resize-none"
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="p-2 mb-1 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <PaperAirplaneIcon className="w-5 h-5 rotate-90" />
                        </button>
                    </form>
                </div>
            </div>
        </ContentCard>
    );
};

export default CommunicationDashboard;
