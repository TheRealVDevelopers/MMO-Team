/**
 * GlobalNotificationToast
 *
 * Persistent real-time toast panel (fixed top-right).
 * Shows new unread notifications as they arrive.
 * Plays repeating buzzer until user clicks notification.
 * Does NOT auto-dismiss — stays until user reads it.
 *
 * Usage: mount once in root layout alongside NotificationPopover.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BellAlertIcon,
    XMarkIcon,
    CheckCircleIcon,
    ChatBubbleLeftRightIcon,
    CurrencyRupeeIcon,
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useNotifications } from '../../../hooks/useNotifications';
import { useAuth } from '../../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

// ─── Buzzer Sound (base64 encoded short beep – no file needed) ────────────────
// 440 Hz sine wave beep generated as a tiny WAV, base64 encoded
const BEEP_DATA_URI = (() => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        return null; // Will use AudioContext approach
    } catch {
        return null;
    }
})();

class SoundManager {
    private static oscillator: OscillatorNode | null = null;
    private static gainNode: GainNode | null = null;
    private static ctx: AudioContext | null = null;
    private static intervalId: ReturnType<typeof setInterval> | null = null;

    static play() {
        try {
            if (this.intervalId) return; // already playing

            const pulse = () => {
                try {
                    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                    if (!AudioCtx) return;
                    const ctx = new AudioCtx();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(880, ctx.currentTime);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.3);
                    setTimeout(() => ctx.close(), 500);
                } catch { /* ignore audio errors */ }
            };

            pulse(); // immediate first pulse
            this.intervalId = setInterval(pulse, 2500); // repeat every 2.5s
        } catch { /* ignore */ }
    }

    static stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

// ─── Notification Type Config ─────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { bg: string; border: string; icon: React.FC<any>; iconColor: string; label: string }> = {
    task: { bg: 'bg-blue-50', border: 'border-blue-400', icon: ClipboardDocumentListIcon, iconColor: 'text-blue-600', label: 'Task' },
    chat: { bg: 'bg-green-50', border: 'border-green-400', icon: ChatBubbleLeftRightIcon, iconColor: 'text-green-600', label: 'Chat' },
    payment: { bg: 'bg-purple-50', border: 'border-purple-400', icon: CurrencyRupeeIcon, iconColor: 'text-purple-600', label: 'Payment' },
    lead: { bg: 'bg-sky-50', border: 'border-sky-400', icon: BellAlertIcon, iconColor: 'text-sky-600', label: 'Lead' },
    approval: { bg: 'bg-amber-50', border: 'border-amber-400', icon: CheckCircleIcon, iconColor: 'text-amber-600', label: 'Approval' },
    system: { bg: 'bg-red-50', border: 'border-red-400', icon: ExclamationTriangleIcon, iconColor: 'text-red-600', label: 'Alert' },
    project: { bg: 'bg-teal-50', border: 'border-teal-400', icon: ClipboardDocumentListIcon, iconColor: 'text-teal-600', label: 'Project' },
};

const DEFAULT_TYPE_CFG = TYPE_CONFIG.system;

// ─── Single Toast Card ────────────────────────────────────────────────────────
interface ToastNotification {
    id: string;
    title: string;
    message: string;
    type?: string;
    created_at: Date;
    is_read: boolean;
}

const ToastCard: React.FC<{
    notification: ToastNotification;
    onRead: (id: string) => void;
}> = ({ notification, onRead }) => {
    const cfg = TYPE_CONFIG[notification.type ?? ''] ?? DEFAULT_TYPE_CFG;
    const Icon = cfg.icon;

    const handleClick = useCallback(() => {
        SoundManager.stop();
        onRead(notification.id);
    }, [notification.id, onRead]);

    const timeAgo = (() => {
        try { return formatDistanceToNow(notification.created_at, { addSuffix: true }); }
        catch { return 'Just now'; }
    })();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`w-full max-w-sm rounded-2xl border-l-4 ${cfg.border} ${cfg.bg} shadow-xl overflow-hidden cursor-pointer group`}
            onClick={handleClick}
        >
            <div className="p-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm`}>
                    <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black text-slate-800 leading-tight truncate">
                            {notification.title}
                        </p>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleClick(); }}
                            className="flex-shrink-0 p-0.5 rounded-lg text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-snug">
                        {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.iconColor}`}>
                            {cfg.label}
                        </span>
                        <span className="text-[10px] text-slate-400">{timeAgo}</span>
                    </div>
                </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60" />
        </motion.div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const GlobalNotificationToast: React.FC = () => {
    const { currentUser } = useAuth();
    const { notifications, markAsRead } = useNotifications(currentUser?.id);
    const previousUnreadIdsRef = useRef<Set<string>>(new Set());
    const [visibleToasts, setVisibleToasts] = useState<ToastNotification[]>([]);

    // Detect new unread notifications
    useEffect(() => {
        const unread = notifications.filter(n => !n.is_read);
        const currentUnreadIds = new Set(unread.map(n => n.id));

        const newNotifs = unread.filter(n => !previousUnreadIdsRef.current.has(n.id));

        if (newNotifs.length > 0) {
            // Add new notifications to the visible toast stack
            setVisibleToasts(prev => {
                const existingIds = new Set(prev.map(t => t.id));
                const toAdd = newNotifs.filter(n => !existingIds.has(n.id)).map(n => ({
                    id: n.id,
                    title: n.title,
                    message: n.message,
                    type: (n as any).type,
                    created_at: n.created_at,
                    is_read: n.is_read,
                }));
                return [...toAdd, ...prev].slice(0, 5); // max 5 at once
            });

            // Play sound for new notifications
            SoundManager.play();
        }

        // If no unread left, stop sound
        if (unread.length === 0) {
            SoundManager.stop();
        }

        previousUnreadIdsRef.current = currentUnreadIds;
    }, [notifications]);

    const handleRead = useCallback((id: string) => {
        markAsRead(id);
        setVisibleToasts(prev => prev.filter(t => t.id !== id));

        // Stop sound if no more visible toasts
        setVisibleToasts(prev => {
            if (prev.filter(t => t.id !== id).length === 0) {
                SoundManager.stop();
            }
            return prev.filter(t => t.id !== id);
        });
    }, [markAsRead]);

    const handleDismissAll = useCallback(() => {
        SoundManager.stop();
        visibleToasts.forEach(t => markAsRead(t.id));
        setVisibleToasts([]);
    }, [visibleToasts, markAsRead]);

    if (visibleToasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
            <AnimatePresence mode="popLayout">
                {visibleToasts.length > 1 && (
                    <motion.button
                        key="dismiss-all"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        type="button"
                        onClick={handleDismissAll}
                        className="pointer-events-auto text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl bg-slate-800 text-white shadow-lg hover:bg-slate-700 transition-colors"
                    >
                        Dismiss All ({visibleToasts.length})
                    </motion.button>
                )}
                {visibleToasts.map(notif => (
                    <div key={notif.id} className="pointer-events-auto">
                        <ToastCard notification={notif} onRead={handleRead} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default GlobalNotificationToast;
