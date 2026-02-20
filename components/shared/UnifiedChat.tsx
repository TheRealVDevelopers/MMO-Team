/**
 * UnifiedChat – Premium real-time messaging component.
 * Used from BOTH the staff-side ProjectReferencePage and the client-side ClientProjectCommandCenter.
 *
 * Features:
 * - Real-time Firestore sync (chat[] array in case doc)
 * - Image / file attachment upload via Firebase Storage
 * - Inline image previews with lightbox
 * - Role badges (client, admin, sales, etc.)
 * - Proper multiline input with Shift+Enter
 * - Auto scroll to bottom
 * - Message grouping by date
 * - Responsive design
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { uploadChatAttachment } from '../../services/storageService';
import {
    PaperAirplaneIcon,
    PhotoIcon,
    PaperClipIcon,
    XMarkIcon,
    ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import {
    ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/solid';

/* ─── types ─── */
export interface ChatMsg {
    id: string;
    senderId: string;
    senderName: string;
    role: string;
    message: string;
    content?: string;        // Legacy compat
    timestamp: any;          // Date | Timestamp | string
    type: 'text' | 'image' | 'file';
    attachments?: string[];  // URLs
    fileName?: string;
}

export interface UnifiedChatUser {
    uid: string;
    displayName: string;
    role: string;
}

interface UnifiedChatProps {
    caseId: string;
    messages: ChatMsg[];
    currentUser: UnifiedChatUser;
    isReadOnly?: boolean;
    isDark?: boolean;
    /** Max height in px. Default 500 for staff side, full-height for client side */
    maxHeight?: number;
    /** Variant: 'card' wraps in a bordered card, 'embedded' for no outer border */
    variant?: 'card' | 'embedded';
}

/* ─── role styling ─── */
const ROLE_LABELS: Record<string, string> = {
    client: 'Client',
    sales: 'Sales',
    admin: 'Admin',
    sgm: 'SGM',
    'super admin': 'Super Admin',
    'project head': 'Project Head',
    team: 'Team',
    staff: 'Staff',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    client: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300' },
    sales: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300' },
    admin: { bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-700 dark:text-violet-300' },
    sgm: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
    'super admin': { bg: 'bg-slate-100 dark:bg-slate-500/20', text: 'text-slate-700 dark:text-slate-300' },
    'project head': { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300' },
    staff: { bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-300' },
    team: { bg: 'bg-slate-100 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400' },
};

/* ─── helpers ─── */
const toDate = (v: any): Date => {
    if (!v) return new Date();
    if (v instanceof Timestamp) return v.toDate();
    if (v instanceof Date) return v;
    if (typeof v === 'string' || typeof v === 'number') return new Date(v);
    if (v.seconds) return new Date(v.seconds * 1000); // Firestore-like
    return new Date();
};

const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const formatDateLabel = (d: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isImageUrl = (url: string) =>
    /\.(jpg|jpeg|png|gif|webp|svg|bmp)/i.test(url);

/* ─── component ─── */
const UnifiedChat: React.FC<UnifiedChatProps> = ({
    caseId,
    messages,
    currentUser,
    isReadOnly = false,
    isDark = false,
    maxHeight = 500,
    variant = 'card',
}) => {
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    // Auto-resize textarea
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = Math.min(textAreaRef.current.scrollHeight, 120) + 'px';
        }
    }, [input]);

    // Clean up preview URLs
    useEffect(() => {
        return () => previewUrls.forEach(url => URL.revokeObjectURL(url));
    }, [previewUrls]);

    const handleFileSelect = (files: FileList | null, type: 'image' | 'file') => {
        if (!files) return;
        const newFiles = Array.from(files);
        setAttachments(prev => [...prev, ...newFiles]);

        // Create preview URLs for images
        const newPreviews = newFiles
            .filter(f => f.type.startsWith('image/'))
            .map(f => URL.createObjectURL(f));
        setPreviewUrls(prev => [...prev, ...newPreviews]);
    };

    const removeAttachment = (idx: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== idx));
        // Also remove preview URL if applicable
        if (attachments[idx]?.type.startsWith('image/')) {
            setPreviewUrls(prev => {
                const newPreviews = [...prev];
                // This is a simplistic approach; for precise tracking we'd use a map
                if (newPreviews.length > 0) {
                    URL.revokeObjectURL(newPreviews[newPreviews.length - 1]);
                    newPreviews.pop();
                }
                return newPreviews;
            });
        }
    };

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if ((!text && attachments.length === 0) || sending || isReadOnly || !db) return;

        setSending(true);
        try {
            let attachmentUrls: string[] = [];

            // Upload attachments
            if (attachments.length > 0) {
                for (const file of attachments) {
                    const result = await uploadChatAttachment(caseId, file);
                    attachmentUrls.push(result.url);
                }
            }

            const isImage = attachments.length > 0 && attachments.every(f => f.type.startsWith('image/'));

            const msg: ChatMsg = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                senderId: currentUser.uid,
                senderName: currentUser.displayName || 'User',
                role: currentUser.role || 'team',
                message: text,
                content: text,
                timestamp: new Date(),
                type: attachmentUrls.length > 0 ? (isImage ? 'image' : 'file') : 'text',
                attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
                fileName: attachments.length === 1 ? attachments[0].name : undefined,
            };

            const caseRef = doc(db, 'cases', caseId);
            await updateDoc(caseRef, {
                chat: arrayUnion(msg),
            });

            setInput('');
            setAttachments([]);
            previewUrls.forEach(url => URL.revokeObjectURL(url));
            setPreviewUrls([]);
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message.");
        } finally {
            setSending(false);
        }
    }, [input, attachments, sending, isReadOnly, caseId, currentUser, previewUrls]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    /* ─── Group messages by date ─── */
    const groupedMessages: { label: string; msgs: ChatMsg[] }[] = [];
    messages.forEach(msg => {
        const d = toDate(msg.timestamp);
        const label = formatDateLabel(d);
        const lastGroup = groupedMessages[groupedMessages.length - 1];
        if (lastGroup && lastGroup.label === label) {
            lastGroup.msgs.push(msg);
        } else {
            groupedMessages.push({ label, msgs: [msg] });
        }
    });

    /* ─── Render ─── */
    const bgBase = isDark ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200';
    const bgInput = isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-slate-50 border-slate-200';
    const textP = isDark ? 'text-white' : 'text-slate-900';
    const textS = isDark ? 'text-slate-400' : 'text-slate-500';

    const wrapperClasses = variant === 'card'
        ? `flex flex-col rounded-xl border overflow-hidden shadow-sm ${bgBase}`
        : `flex flex-col overflow-hidden ${bgBase}`;

    return (
        <>
            <div className={wrapperClasses} style={{ height: maxHeight }}>
                {/* Header */}
                <div className={`flex items-center justify-between gap-2 px-4 py-3 border-b ${isDark ? 'border-white/10 bg-[#0d0d0d]' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center gap-2.5">
                        <ChatBubbleLeftRightIcon className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-emerald-600'}`} />
                        <span className={`text-sm font-bold ${textP}`}>Project Chat</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                            {messages.length} messages
                        </span>
                    </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1" style={{ minHeight: 0 }}>
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center pt-8">
                            <ChatBubbleLeftRightIcon className={`w-12 h-12 mb-3 ${isDark ? 'text-white/10' : 'text-slate-200'}`} />
                            <p className={`text-sm font-medium ${textS}`}>No messages yet</p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Start the conversation by sending a message below</p>
                        </div>
                    )}

                    {groupedMessages.map((group) => (
                        <div key={group.label}>
                            {/* Date divider */}
                            <div className="flex items-center gap-3 my-4">
                                <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{group.label}</span>
                                <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                            </div>

                            {group.msgs.map((msg) => {
                                const role = msg.role?.toLowerCase() || 'team';
                                const isMe = msg.senderId === currentUser.uid;
                                const isClient = role === 'client';
                                const roleLabel = ROLE_LABELS[role] ?? msg.role ?? 'Team';
                                const roleColor = ROLE_COLORS[role] ?? ROLE_COLORS.team;
                                const ts = toDate(msg.timestamp);

                                return (
                                    <div key={msg.id} className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        {/* Avatar */}
                                        {!isMe && (
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 mt-1 ${roleColor.bg} ${roleColor.text}`}>
                                                {msg.senderName?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}

                                        <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            {/* Sender info */}
                                            {!isMe && (
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className={`text-xs font-semibold ${textP}`}>{msg.senderName}</span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${roleColor.bg} ${roleColor.text}`}>
                                                        {roleLabel}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Bubble */}
                                            <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                                                ? 'bg-emerald-600 text-white rounded-br-md'
                                                : isDark
                                                    ? 'bg-[#1e1e1e] text-slate-100 border border-white/10 rounded-bl-md'
                                                    : 'bg-slate-100 text-slate-800 border border-slate-200/50 rounded-bl-md'
                                                }`}>

                                                {/* Text */}
                                                {(msg.message || msg.content) && (
                                                    <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                                                        {msg.message || msg.content}
                                                    </p>
                                                )}

                                                {/* Attachments */}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="mt-2 space-y-2">
                                                        {msg.attachments.map((url, i) => (
                                                            isImageUrl(url) ? (
                                                                <div key={i} className="relative cursor-pointer group/img" onClick={() => setLightboxUrl(url)}>
                                                                    <img
                                                                        src={url}
                                                                        alt={`Attachment ${i + 1}`}
                                                                        className="max-w-full max-h-48 rounded-lg object-cover border border-white/20"
                                                                        loading="lazy"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 rounded-lg transition-all flex items-center justify-center">
                                                                        <ArrowsPointingOutIcon className="w-6 h-6 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity ${isMe ? 'bg-white/10 text-white' : isDark ? 'bg-white/5 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'}`}>
                                                                    <PaperClipIcon className="w-4 h-4 flex-shrink-0" />
                                                                    <span className="truncate">{msg.fileName || `File ${i + 1}`}</span>
                                                                </a>
                                                            )
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Timestamp */}
                                                <p className={`text-[10px] mt-1.5 ${isMe ? 'text-white/60' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    {formatTime(ts)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Attachment previews */}
                {attachments.length > 0 && (
                    <div className={`px-4 py-2 border-t flex gap-2 overflow-x-auto ${isDark ? 'border-white/10 bg-[#0d0d0d]' : 'border-slate-200 bg-slate-50'}`}>
                        {attachments.map((file, idx) => (
                            <div key={idx} className={`relative flex-shrink-0 rounded-lg overflow-hidden border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                                {file.type.startsWith('image/') ? (
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="w-16 h-16 object-cover"
                                    />
                                ) : (
                                    <div className={`w-28 h-16 flex items-center justify-center gap-1.5 px-2 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                        <PaperClipIcon className={`w-4 h-4 ${textS}`} />
                                        <span className={`text-[10px] truncate ${textS}`}>{file.name}</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => removeAttachment(idx)}
                                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Input area */}
                {!isReadOnly && (
                    <div className={`px-4 py-3 border-t ${isDark ? 'border-white/10 bg-[#0d0d0d]' : 'border-slate-200 bg-white'}`}>
                        <div className={`flex items-end gap-2 rounded-xl border ${isDark ? 'bg-[#151515] border-white/10' : 'bg-slate-50 border-slate-200'} px-3 py-2`}>
                            {/* Image button */}
                            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden"
                                onChange={(e) => handleFileSelect(e.target.files, 'image')} />
                            <button
                                onClick={() => imageInputRef.current?.click()}
                                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                                title="Send image"
                            >
                                <PhotoIcon className="w-5 h-5" />
                            </button>

                            {/* File button */}
                            <input ref={fileInputRef} type="file" multiple className="hidden"
                                onChange={(e) => handleFileSelect(e.target.files, 'file')} />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                                title="Attach file"
                            >
                                <PaperClipIcon className="w-5 h-5" />
                            </button>

                            {/* Textarea */}
                            <textarea
                                ref={textAreaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                rows={1}
                                className={`flex-1 resize-none bg-transparent border-none outline-none text-sm py-1.5 max-h-28 ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                            />

                            {/* Send */}
                            <button
                                onClick={handleSend}
                                disabled={(!input.trim() && attachments.length === 0) || sending}
                                className={`p-2 rounded-xl transition-all flex-shrink-0 ${sending
                                    ? 'opacity-50 cursor-not-allowed'
                                    : input.trim() || attachments.length > 0
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 scale-100'
                                        : isDark
                                            ? 'text-slate-600 hover:text-slate-400'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {sending ? (
                                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                ) : (
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <p className={`text-[10px] mt-1.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            Press Enter to send, Shift+Enter for new line
                        </p>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                    <img
                        src={lightboxUrl}
                        alt="Preview"
                        className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};

export default UnifiedChat;
