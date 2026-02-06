import React from 'react';
import {
    BuildingOfficeIcon,
    ViewColumnsIcon,
    ChartBarSquareIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    ShieldExclamationIcon,
    UsersIcon,
    ClipboardDocumentCheckIcon,
    QueueListIcon
} from '../../icons/IconComponents';
import { CheckCircleIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { UserRole } from '../../../types';

interface SidebarProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    badge?: number;
}> = ({ icon, label, isActive, onClick, badge }) => (
    <li>
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`flex items-center p-2 text-base font-normal rounded-lg transition-colors duration-150 ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-subtle-background hover:text-text-primary'
                }`}
        >
            {icon}
            <span className="ml-3 flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-error text-white rounded-full">
                    {badge}
                </span>
            )}
        </a>
    </li>
);

const ExecutionTeamSidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
    const { currentUser } = useAuth();
    const isProjectHead = currentUser?.role === UserRole.PROJECT_HEAD || currentUser?.role === UserRole.EXECUTION_TEAM;

    interface NavigationItem {
        id: string;
        label: string;
        icon: React.ReactNode;
        badge?: number;
    }

    // Base items for all execution team members
    const baseItems: NavigationItem[] = [
        { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
        { id: 'work-queue', label: 'Work Queue', icon: <QueueListIcon className="w-6 h-6" /> },
        { id: 'board', label: 'Projects', icon: <ViewColumnsIcon className="w-6 h-6" /> },
        { id: 'gantt', label: 'Gantt', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
    ];

    // Project Head / Execution Lead exclusive items
    const leaderItems: NavigationItem[] = isProjectHead ? [
        { id: 'approvals', label: 'Approvals', icon: <CheckCircleIcon className="w-6 h-6" />, badge: 3 },
        { id: 'blueprint', label: 'Blueprints', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
        { id: 'team', label: 'Team', icon: <UsersIcon className="w-6 h-6" /> },
        { id: 'tasks', label: 'Assign Tasks', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
        { id: 'budget', label: 'Budgets', icon: <CurrencyDollarIcon className="w-6 h-6" /> },
    ] : [];

    // Common items for everyone
    const commonItems: NavigationItem[] = [
        { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
        { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
        { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ];

    const navItems = [...baseItems, ...leaderItems, ...commonItems];

    return (
        <aside className="w-64 bg-surface border-r border-border flex-shrink-0" aria-label="Sidebar">
            <div className="h-full px-3 py-4 overflow-y-auto">
                <div className="flex items-center pl-2.5 mb-5 h-16 -mt-4">
                    <BuildingOfficeIcon className="h-8 w-8 text-primary" />
                    <h1 className="ml-3 text-xl font-bold text-text-primary tracking-tight">
                        Execution Hub
                    </h1>
                </div>
                <ul className="space-y-2">
                    {navItems.map(item => (
                        <NavItem
                            key={item.id}
                            label={item.label}
                            icon={item.icon}
                            isActive={currentPage === item.id}
                            onClick={() => setCurrentPage(item.id)}
                            badge={item.badge}
                        />
                    ))}
                </ul>
            </div>
        </aside>
    );
}

export default ExecutionTeamSidebar;
