import React, { useState } from 'react';
import {
    PaperAirplaneIcon,
    ChatBubbleLeftRightIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

interface Message {
    id: string;
    sender: 'client' | 'team';
    senderName: string;
    message: string;
    timestamp: Date;
}

interface QuickChatProps {
    projectHeadName: string;
    className?: string;
}

const QuickChat: React.FC<QuickChatProps> = ({
    projectHeadName,
    className = ''
}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'team',
            senderName: projectHeadName,
            message: 'Hi! How can I help you today?',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSend = () => {
        if (!newMessage.trim()) return;

        const message: Message = {
            id: Date.now().toString(),
            sender: 'client',
            senderName: 'You',
            message: newMessage,
            timestamp: new Date()
        };

        setMessages([...messages, message]);
        setNewMessage('');

        // Simulate response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'team',
                senderName: projectHeadName,
                message: 'Thanks for your message! I\'ll get back to you shortly.',
                timestamp: new Date()
            }]);
        }, 1000);
    };

    return (
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-gray-800">Quick Chat</h3>
                        <p className="text-xs text-gray-500">Message your project team</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {messages.length > 1 && (
                        <span className="px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-full">
                            {messages.length}
                        </span>
                    )}
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Chat Area */}
            {isExpanded && (
                <div className="border-t border-gray-100">
                    {/* Messages */}
                    <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto bg-gray-50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`
                                    max-w-[80%] rounded-2xl px-4 py-2
                                    ${msg.sender === 'client'
                                        ? 'bg-primary text-white'
                                        : 'bg-white border border-gray-200 text-gray-800'
                                    }
                                `}>
                                    <p className="text-xs opacity-70 mb-1">{msg.senderName}</p>
                                    <p className="text-sm">{msg.message}</p>
                                    <p className="text-xs opacity-60 mt-1">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-sm"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!newMessage.trim()}
                                className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            💡 Your project head will respond within a few hours
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickChat;
