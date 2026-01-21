import React, { useState } from 'react';
import {
    PlusIcon,
    XMarkIcon,
    ChatBubbleLeftRightIcon,
    ExclamationCircleIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ClockIcon,
    PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import RoleAvatar from '../RoleAvatars/RoleAvatar';
import { ClientRequest, RequestType, RequestStatus, RequestMessage, ResponsibleRole } from '../types';

interface ClientRequestSystemProps {
    requests: ClientRequest[];
    onNewRequest?: (request: Partial<ClientRequest>) => void;
    onSendMessage?: (requestId: string, message: string) => void;
    className?: string;
}

const requestTypeConfig: Record<RequestType, { icon: React.ReactNode; label: string; color: string }> = {
    question: {
        icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />,
        label: 'Question',
        color: 'bg-blue-500'
    },
    concern: {
        icon: <ExclamationCircleIcon className="w-4 h-4" />,
        label: 'Concern',
        color: 'bg-amber-500'
    },
    change_request: {
        icon: <ArrowPathIcon className="w-4 h-4" />,
        label: 'Change Request',
        color: 'bg-purple-500'
    },
    approval: {
        icon: <CheckCircleIcon className="w-4 h-4" />,
        label: 'Approval',
        color: 'bg-emerald-500'
    }
};

const statusConfig: Record<RequestStatus, { label: string; color: string; bgColor: string }> = {
    open: {
        label: 'Open',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100'
    },
    acknowledged: {
        label: 'Acknowledged',
        color: 'text-amber-700',
        bgColor: 'bg-amber-100'
    },
    'in-progress': {
        label: 'In Progress',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100'
    },
    resolved: {
        label: 'Resolved',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-100'
    }
};

const ClientRequestSystem: React.FC<ClientRequestSystemProps> = ({
    requests,
    onNewRequest,
    onSendMessage,
    className = ''
}) => {
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [newRequestForm, setNewRequestForm] = useState({
        type: 'question' as RequestType,
        title: '',
        description: '',
        priority: 'medium' as 'low' | 'medium' | 'high'
    });

    const handleSubmitRequest = () => {
        if (!newRequestForm.title || !newRequestForm.description) return;

        onNewRequest?.({
            type: newRequestForm.type,
            title: newRequestForm.title,
            description: newRequestForm.description,
            priority: newRequestForm.priority,
            status: 'open',
            createdAt: new Date(),
            updatedAt: new Date(),
            conversation: []
        });

        setNewRequestForm({ type: 'question', title: '', description: '', priority: 'medium' });
        setIsNewRequestOpen(false);
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedRequest) return;
        onSendMessage?.(selectedRequest.id, newMessage);
        setNewMessage('');
    };

    const openRequests = requests.filter(r => r.status !== 'resolved');
    const resolvedRequests = requests.filter(r => r.status === 'resolved');

    return (
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900">My Requests</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {openRequests.length} open, {resolvedRequests.length} resolved
                    </p>
                </div>
                <button
                    onClick={() => setIsNewRequestOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    New Request
                </button>
            </div>

            {/* Request List */}
            <div className="max-h-[400px] overflow-y-auto">
                {requests.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No requests yet</p>
                        <p className="text-gray-400 text-xs mt-1">Create a request to get started</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {requests.map((request) => {
                            const typeConf = requestTypeConfig[request.type];
                            const statConf = statusConfig[request.status];

                            return (
                                <button
                                    key={request.id}
                                    onClick={() => setSelectedRequest(request)}
                                    className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Type Icon */}
                                        <div className={`w-8 h-8 ${typeConf.color} text-white rounded-lg flex items-center justify-center flex-shrink-0`}>
                                            {typeConf.icon}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-sm text-gray-800 truncate">
                                                    {request.title}
                                                </p>
                                                <span className={`px-2 py-0.5 ${statConf.bgColor} ${statConf.color} text-xs font-medium rounded-full flex-shrink-0`}>
                                                    {statConf.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-1">
                                                {request.description}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2">
                                                {request.owner && request.ownerRole && (
                                                    <div className="flex items-center gap-1.5">
                                                        <RoleAvatar role={request.ownerRole} size="sm" showTooltip={false} />
                                                        <span className="text-xs text-gray-500">{request.owner}</span>
                                                    </div>
                                                )}
                                                {request.eta && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                                        <ClockIcon className="w-3 h-3" />
                                                        ETA: {new Date(request.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Message count */}
                                        {request.conversation.length > 0 && (
                                            <div className="flex items-center gap-1 text-gray-400">
                                                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                                <span className="text-xs">{request.conversation.length}</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* New Request Modal */}
            {isNewRequestOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">New Request</h3>
                            <button onClick={() => setIsNewRequestOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Request Type */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.keys(requestTypeConfig) as RequestType[]).map((type) => {
                                        const conf = requestTypeConfig[type];
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => setNewRequestForm({ ...newRequestForm, type })}
                                                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${newRequestForm.type === type
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 ${conf.color} text-white rounded flex items-center justify-center`}>
                                                    {conf.icon}
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{conf.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={newRequestForm.title}
                                    onChange={(e) => setNewRequestForm({ ...newRequestForm, title: e.target.value })}
                                    placeholder="Brief summary of your request"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Details
                                </label>
                                <textarea
                                    rows={4}
                                    value={newRequestForm.description}
                                    onChange={(e) => setNewRequestForm({ ...newRequestForm, description: e.target.value })}
                                    placeholder="Describe your request in detail..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none resize-none"
                                />
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Priority
                                </label>
                                <div className="flex gap-2">
                                    {(['low', 'medium', 'high'] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setNewRequestForm({ ...newRequestForm, priority: p })}
                                            className={`flex-1 py-2 px-4 rounded-xl border-2 text-sm font-medium capitalize transition-all ${newRequestForm.priority === p
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleSubmitRequest}
                                disabled={!newRequestForm.title || !newRequestForm.description}
                                className="w-full py-4 bg-primary text-white font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Detail Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 ${requestTypeConfig[selectedRequest.type].color} text-white rounded-xl flex items-center justify-center`}>
                                    {requestTypeConfig[selectedRequest.type].icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{selectedRequest.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 ${statusConfig[selectedRequest.status].bgColor} ${statusConfig[selectedRequest.status].color} text-xs font-medium rounded-full`}>
                                            {statusConfig[selectedRequest.status].label}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(selectedRequest.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="p-2 rounded-xl hover:bg-gray-100">
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Description */}
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <p className="text-sm text-gray-700">{selectedRequest.description}</p>
                            {selectedRequest.owner && (
                                <div className="flex items-center gap-2 mt-3">
                                    <RoleAvatar role={selectedRequest.ownerRole!} size="sm" showTooltip={false} />
                                    <span className="text-xs text-gray-500">Assigned to {selectedRequest.owner}</span>
                                </div>
                            )}
                        </div>

                        {/* Conversation */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {selectedRequest.conversation.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] ${msg.sender === 'client'
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-800'
                                        } rounded-2xl px-4 py-3`}>
                                        <p className="text-xs font-medium opacity-70 mb-1">{msg.senderName}</p>
                                        <p className="text-sm">{msg.message}</p>
                                        <p className="text-xs opacity-60 mt-2">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Message Input */}
                        {selectedRequest.status !== 'resolved' && (
                            <div className="p-4 border-t border-gray-100">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary outline-none text-sm"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                                    >
                                        <PaperAirplaneIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientRequestSystem;
