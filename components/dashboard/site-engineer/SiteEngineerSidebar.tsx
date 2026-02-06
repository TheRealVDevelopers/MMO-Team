
import React from 'react';
import {
    BuildingOfficeIcon,
    CalendarDaysIcon,
    ReceiptPercentIcon,
    ChartBarSquareIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    ShieldExclamationIcon,
    QueueListIcon
} from '../../icons/IconComponents';

interface SidebarProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
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
            <span className="ml-3">{label}</span>
        </a>
    </li>
);

const SiteEngineerSidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
    const navItems = [
        { id: 'overview', label: 'Overview', icon: <BuildingOfficeIcon className="w-6 h-6" /> },
        { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
        { id: 'work-queue', label: 'Work Queue', icon: <QueueListIcon className="w-6 h-6" /> },
        { id: 'schedule', label: "Site Inspections", icon: <CalendarDaysIcon className="w-6 h-6" /> },
        { id: 'drawings', label: 'Drawing Tasks', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
        { id: 'expenses', label: 'Expense Claims', icon: <ReceiptPercentIcon className="w-6 h-6" /> },
        { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
        { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
        { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ];

    return (
        <aside className="w-64 bg-surface border-r border-border flex-shrink-0" aria-label="Sidebar">
            <div className="h-full px-3 py-4 overflow-y-auto">
                <div className="flex items-center pl-2.5 mb-5 h-16 -mt-4">
                    <BuildingOfficeIcon className="h-8 w-8 text-primary" />
                    <h1 className="ml-3 text-xl font-bold text-text-primary tracking-tight">
                        Site Engineer
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
                        />
                    ))}
                </ul>
            </div>
        </aside>
    );
};

export default SiteEngineerSidebar;
