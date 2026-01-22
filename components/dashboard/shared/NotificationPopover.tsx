import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, CheckCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from './DashboardUI';
import { useNotifications } from '../../../hooks/useNotifications';
import { useNotificationRouter } from '../../../hooks/useNotificationRouter';
import { useAuth } from '../../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationPopover: React.FC = () => {
    const { currentUser } = useAuth();
    const { notifications, loading, markAsRead, markAllAsRead } = useNotifications(currentUser?.id);
    const { handleNotificationClick } = useNotificationRouter();
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = React.useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleToggle = () => setIsOpen(!isOpen);

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const getIcon = (type?: string) => {
        switch (type) {
            case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
            default: return <InformationCircleIcon className="w-5 h-5 text-accent-subtle-text" />;
        }
    };

    const formatTime = (date: Date) => {
        try {
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (e) {
            return 'Just now';
        }
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={handleToggle}
                className="p-2 text-text-secondary hover:text-primary relative transition-colors rounded-full hover:bg-primary/5 active:bg-primary/10"
            >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border shadow-2xl rounded-2xl z-50 overflow-hidden"
                    >
                        <div className="p-4 border-b border-border flex items-center justify-between bg-background/50">
                            <h3 className="font-bold text-text-primary">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-primary hover:underline font-medium"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                            {loading && (
                                <div className="p-8 text-center">
                                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                                </div>
                            )}
                            {!loading && notifications.length === 0 ? (
                                <div className="p-8 text-center text-text-secondary">
                                    <BellIcon className="w-8 h-8 mx-auto mb-2 text-text-secondary/30" />
                                    <p className="text-sm">No new notifications</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-4 border-b border-border/50 hover:bg-background/50 transition-colors flex gap-3 group relative cursor-pointer",
                                            !notification.is_read ? "bg-primary/5" : ""
                                        )}
                                        onClick={() => {
                                            markAsRead(notification.id);
                                            handleNotificationClick(notification);
                                            setIsOpen(false); // Close popover after navigation
                                        }}
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className={cn("text-sm font-semibold truncate", !notification.is_read ? "text-text-primary" : "text-text-secondary")}>
                                                    {notification.title}
                                                    {notification.is_demo && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-accent-subtle/10 text-accent-subtle-text rounded uppercase tracking-wider">Demo</span>}
                                                </p>
                                                <span className="text-[10px] text-text-tertiary whitespace-nowrap ml-2">
                                                    {formatTime(notification.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationPopover;
