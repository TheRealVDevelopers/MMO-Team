
import React from 'react';
import { 
    BuildingOfficeIcon,
    RectangleGroupIcon,
    ViewColumnsIcon,
    ChartBarSquareIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    ShieldExclamationIcon
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
            className={`flex items-center p-2 text-base font-normal rounded-lg transition-colors duration-150 ${
                isActive 
                ? 'bg-primary/10 text-primary' 
                : 'text-text-secondary hover:bg-subtle-background hover:text-text-primary'
            }`}
        >
            {icon}
            <span className="ml-3">{label}</span>
        </a>
    </li>
);

const DrawingTeamSidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
    const navItems = [
        { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
        { id: 'projects', label: 'Projects Board', icon: <ViewColumnsIcon className="w-6 h-6" /> },
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
                        Design Hub
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
}

export default DrawingTeamSidebar;
