import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, CheckCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from './DashboardUI';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    time: string;
    read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        title: 'New Lead Assigned',
        message: 'A new lead from "TechCorp Systems" has been assigned to you.',
        type: 'info',
        time: '5 min ago',
        read: false,
    },
    {
        id: '2',
        title: 'Project Update',
        message: 'The "Skyline Tower" project status has been updated to Execution.',
        type: 'success',
        time: '2 hours ago',
        read: false,
    },
    {
        id: '3',
        title: 'Meeting Reminder',
        message: 'Weekly sales sync starting in 15 minutes.',
        type: 'warning',
        time: '1 hour ago',
        read: true,
    }
];

const NotificationPopover: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleToggle = () => setIsOpen(!isOpen);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
            default: return <InformationCircleIcon className="w-5 h-5 text-accent-subtle-text" />;
        }
    };

    return (
        <div className="relative">
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
                    <>
                        {/* Backdrop close */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

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
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-text-secondary">
                                        <BellIcon className="w-8 h-8 mx-auto mb-2 text-text-secondary/30" />
                                        <p className="text-sm">No new notifications</p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "p-4 border-b border-border/50 hover:bg-background/50 transition-colors flex gap-3 group relative",
                                                !notification.read ? "bg-primary/5" : ""
                                            )}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className="mt-1 flex-shrink-0">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className={cn("text-sm font-semibold truncate", !notification.read ? "text-text-primary" : "text-text-secondary")}>
                                                        {notification.title}
                                                    </p>
                                                    <span className="text-[10px] text-text-tertiary whitespace-nowrap ml-2">
                                                        {notification.time}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeNotification(notification.id);
                                                }}
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-error transition-all"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationPopover;
