
import React, { useState, useRef, useEffect } from 'react';
import { ChatChannel, ChatMessage } from '../../types';
import { HashtagIcon, PaperAirplaneIcon, PaperClipIcon } from '../icons/IconComponents';
import { useAuth } from '../../context/AuthContext';
import { USERS } from '../../constants';

interface ChatWindowProps {
    channel: ChatChannel;
    messages: ChatMessage[];
    onSendMessage: (message: ChatMessage) => void;
}

// Inlined Message component to avoid dependency on a missing file.
const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const { currentUser } = useAuth();
    const isCurrentUser = message.senderId === currentUser?.id;
    const sender = USERS.find(u => u.id === message.senderId);

    if (!sender) {
        return null; // or some fallback UI
    }

    return (
        <div className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
            <img src={sender.avatar} alt={sender.name} className="w-8 h-8 rounded-full" />
            <div className={`p-3 rounded-lg max-w-md ${isCurrentUser ? 'bg-primary text-white' : 'bg-subtle-background'}`}>
                {!isCurrentUser && <p className="text-xs font-bold mb-1">{sender.name}</p>}
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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser) return;

        const message: ChatMessage = {
            id: `msg-${Date.now()}`,
            channelId: channel.id,
            senderId: currentUser.id,
            content: newMessage,
            timestamp: new Date(),
        };
        onSendMessage(message);
        setNewMessage('');
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-surface">
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-border flex-shrink-0">
                <HashtagIcon className="w-6 h-6 text-text-secondary"/>
                <h2 className="text-lg font-bold text-text-primary ml-2">{channel.name}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                   <Message key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
                <form onSubmit={handleSend} className="relative">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message #${channel.name}`}
                        className="w-full pl-4 pr-20 py-2 border border-border bg-subtle-background rounded-md focus:ring-primary focus:border-primary"
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
