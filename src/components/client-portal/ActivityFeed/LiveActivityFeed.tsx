import React from 'react';
import {
    ArrowUpTrayIcon,
    CheckCircleIcon,
    MapPinIcon,
    ArrowTrendingUpIcon,
    CreditCardIcon,
    ArrowPathIcon,
    ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import RoleAvatar from '../RoleAvatars/RoleAvatar';
import { ActivityItem, ActivityType, ResponsibleRole } from '../types';

interface LiveActivityFeedProps {
    activities: ActivityItem[];
    maxItems?: number;
    className?: string;
}

const getActivityIcon = (type: ActivityType) => {
    const icons: Record<ActivityType, { icon: React.ReactNode; color: string; bgColor: string }> = {
        upload: {
            icon: <ArrowUpTrayIcon className="w-4 h-4" />,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        approval: {
            icon: <CheckCircleIcon className="w-4 h-4" />,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100'
        },
        site_visit: {
            icon: <MapPinIcon className="w-4 h-4" />,
            color: 'text-amber-600',
            bgColor: 'bg-amber-100'
        },
        progress: {
            icon: <ArrowTrendingUpIcon className="w-4 h-4" />,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        payment: {
            icon: <CreditCardIcon className="w-4 h-4" />,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100'
        },
        stage_change: {
            icon: <ArrowPathIcon className="w-4 h-4" />,
            color: 'text-primary',
            bgColor: 'bg-primary/10'
        },
        message: {
            icon: <ChatBubbleLeftIcon className="w-4 h-4" />,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100'
        }
    };
    return icons[type];
};

const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const groupActivitiesByDate = (activities: ActivityItem[]) => {
    const groups: Record<string, ActivityItem[]> = {};

    activities.forEach(activity => {
        const date = new Date(activity.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let key: string;
        if (date.toDateString() === today.toDateString()) {
            key = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = 'Yesterday';
        } else {
            key = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        }

        if (!groups[key]) groups[key] = [];
        groups[key].push(activity);
    });

    return groups;
};

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
    activities,
    maxItems = 10,
    className = ''
}) => {
    const sortedActivities = [...activities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxItems);

    const groupedActivities = groupActivitiesByDate(sortedActivities);

    return (
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <h3 className="font-bold text-gray-900">Live Updates</h3>
                </div>
                <span className="text-xs text-gray-500">
                    {activities.length} activities
                </span>
            </div>

            {/* Activity List */}
            <div className="max-h-[400px] overflow-y-auto">
                {Object.entries(groupedActivities).map(([dateGroup, items]) => (
                    <div key={dateGroup}>
                        {/* Date Separator */}
                        <div className="px-6 py-2 bg-gray-50 sticky top-0">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {dateGroup}
                            </span>
                        </div>

                        {/* Items */}
                        <div className="divide-y divide-gray-50">
                            {items.map((activity) => {
                                const iconConfig = getActivityIcon(activity.type);
                                return (
                                    <div
                                        key={activity.id}
                                        className="px-6 py-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className={`
                                                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                                ${iconConfig.bgColor} ${iconConfig.color}
                                            `}>
                                                {iconConfig.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-800">
                                                    <span className="font-medium">{activity.title}</span>
                                                </p>
                                                {activity.description && (
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                        {activity.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <RoleAvatar
                                                        role={activity.actorRole}
                                                        size="sm"
                                                        showTooltip={false}
                                                    />
                                                    <span className="text-xs text-gray-500">
                                                        {activity.actor}
                                                    </span>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-400">
                                                        {formatRelativeTime(activity.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {activities.length === 0 && (
                    <div className="px-6 py-12 text-center">
                        <p className="text-gray-500 text-sm">No activities yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveActivityFeed;
