
import React, { useState, useRef, useEffect } from 'react';
import { ChatChannel, ChatMessage } from '../../types';
import { PaperAirplaneIcon, PaperClipIcon } from '../icons/IconComponents';
import { useAuth } from '../../context/AuthContext';
import { USERS } from '../../constants';

interface ChatWindowProps {
    channel: ChatChannel;
    messages: ChatMessage[];
    onSendMessage: (content: string) => void;
}

const Message: React.FC<{ message: ChatMessage; isGroup: boolean; }> = ({ message, isGroup }) => {
    const { currentUser } = useAuth();
    const isCurrentUser = message.senderId === currentUser?.id;
    const sender = USERS.find(u => u.id === message.senderId);

    if (!sender) {
        return null; // or some fallback UI
    }

    return (
        <div className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
            {!isCurrentUser && <img src={sender.avatar} alt={sender.name} className="w-8 h-8 rounded-full" />}
            <div className={`p-3 rounded-lg max-w-md ${isCurrentUser ? 'bg-primary text-white' : 'bg-subtle-background'}`}>
                {!isCurrentUser && isGroup && <p className="text-xs font-bold mb-1 text-primary">{sender.name}</p>}
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 opacity-70 ${isCurrentUser ? 'text-right' : 'text-left'}`}>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
        </div>
    );
};


const ChatWindow: React.FC<ChatWindowProps> = ({ channel, messages, onSendMessage }) => {
    const { currentUser } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }

    useEffect(() => {
        // Use auto scroll for initial load, smooth for new messages
        scrollToBottom();
    }, [messages, channel.id]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser) return;
        onSendMessage(newMessage);
        setNewMessage('');
    };

    let channelName = channel.name;
    let channelAvatar = channel.avatar;

    if (!channel.isGroup && channel.members.length === 2) {
        const otherUserId = channel.members.find(id => id !== currentUser?.id);
        const otherUser = USERS.find(u => u.id === otherUserId);
        if (otherUser) {
            channelName = otherUser.name;
            channelAvatar = otherUser.avatar;
        }
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-surface">
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-border flex-shrink-0">
                <img src={channelAvatar} alt={channelName} className="w-10 h-10 rounded-full" />
                <h2 className="text-lg font-bold text-text-primary ml-3">{channelName}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                   <Message key={msg.id} message={msg} isGroup={channel.isGroup} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-subtle-background">
                <form onSubmit={handleSend} className="relative">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${channelName}`}
                        className="w-full pl-4 pr-20 py-2 border border-border bg-surface rounded-full focus:ring-primary focus:border-primary"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <button type="button" className="p-2 text-text-secondary hover:text-text-primary">
                            <PaperClipIcon className="w-5 h-5"/>
                        </button>
                        <button type="submit" disabled={!newMessage.trim()} className="p-2 text-primary disabled:text-text-secondary/50">
                            <PaperAirplaneIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
