import React, { useState, useRef, useEffect } from 'react';
import { ChatChannel, ChatMessage } from '../../types';
import { PaperAirplaneIcon, PaperClipIcon } from '../icons/IconComponents';
import { useAuth } from '../../context/AuthContext';

interface ChatWindowProps {
    channel: ChatChannel;
    messages: ChatMessage[];
    onSendMessage: (content: string) => void;
}

const Message: React.FC<{ message: ChatMessage; isGroup: boolean; channel: ChatChannel }> = ({ message, isGroup, channel }) => {
    const { currentUser } = useAuth();
    const isCurrentUser = message.senderId === currentUser?.id;

    const senderName = isCurrentUser ? 'You' : (channel.memberNames?.[message.senderId] || 'Someone');
    const senderAvatar = channel.memberAvatars?.[message.senderId] || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random`;

    return (
        <div className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
            {!isCurrentUser && <img src={senderAvatar} alt={senderName} className="w-9 h-9 rounded-full shadow-sm" />}
            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                {!isCurrentUser && isGroup && <p className="text-[11px] font-bold mb-1 text-primary ml-1">{senderName}</p>}
                <div className={`p-3 rounded-2xl max-w-sm lg:max-w-md ${isCurrentUser ? 'bg-primary text-white rounded-tr-none shadow-md' : 'bg-surface border border-border rounded-tl-none shadow-sm'}`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-[10px] mt-1.5 opacity-60 font-medium ${isCurrentUser ? 'text-white text-right' : 'text-text-tertiary text-left'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
        </div>
    );
};


const ChatWindow: React.FC<ChatWindowProps> = ({ channel, messages, onSendMessage }) => {
    const { currentUser } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser) return;
        onSendMessage(newMessage);
        setNewMessage('');
    };

    let channelName = channel.name;
    let channelAvatar = channel.avatar;

    if (!channel.isGroup && channel.members.length === 2 && channel.memberNames) {
        const otherUserName = Object.entries(channel.memberNames).find(([id]) => id !== currentUser?.id)?.[1];
        if (otherUserName) channelName = otherUserName;

        const otherUserAvatar = channel.memberAvatars?.[Object.keys(channel.memberNames).find(id => id !== currentUser?.id) || ''];
        if (otherUserAvatar) channelAvatar = otherUserAvatar;
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background/50">
            {/* Header */}
            <div className="h-18 flex items-center px-6 border-b border-border bg-surface flex-shrink-0 shadow-sm z-10">
                <div className="relative">
                    <img src={channelAvatar} alt={channelName} className="w-10 h-10 rounded-full ring-2 ring-primary/10" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full"></span>
                </div>
                <div className="ml-4">
                    <h2 className="text-base font-bold text-text-primary leading-none">{channelName}</h2>
                    <p className="text-[10px] text-green-600 font-medium mt-1 uppercase tracking-wider">Online</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                        <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mb-4">
                            <PaperAirplaneIcon className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-sm font-medium">No messages yet. Say hello!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <Message key={msg.id} message={msg} isGroup={channel.isGroup} channel={channel} />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-surface border-t border-border">
                <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-center gap-2">
                    <button type="button" className="p-2.5 text-text-secondary hover:text-primary transition-colors rounded-xl hover:bg-subtle-background">
                        <PaperClipIcon className="w-6 h-6" />
                    </button>
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full pl-4 pr-12 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary disabled:text-text-tertiary/50 hover:bg-primary/10 rounded-xl transition-all"
                        >
                            <PaperAirplaneIcon className="w-6 h-6 rotate-90" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
