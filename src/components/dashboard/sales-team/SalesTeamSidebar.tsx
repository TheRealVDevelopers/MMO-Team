
import React from 'react';
import {
    BuildingOfficeIcon,
    FunnelIcon,
    MapPinIcon,
    PaintBrushIcon,
    CalculatorIcon,
    TruckIcon,
    WrenchScrewdriverIcon,
    CreditCardIcon,
    ChartBarSquareIcon,
    RectangleGroupIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    ShieldExclamationIcon
} from '../../icons/IconComponents';

interface SidebarProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
    leadsCount: number;
    taskCounts: Record<string, number>;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    count?: number;
}> = ({ icon, label, isActive, onClick, count }) => (
    <li>
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`flex items-center justify-between p-2 text-base font-normal rounded-lg transition-colors duration-150 group ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-subtle-background hover:text-text-primary'
                }`}
        >
            <div className="flex items-center">
                {icon}
                <span className="ml-3">{label}</span>
            </div>
            {count !== undefined && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isActive ? 'bg-primary text-white' : 'bg-subtle-background group-hover:bg-border'}`}>
                    {count}
                </span>
            )}
        </a>
    </li>
);

const SalesTeamSidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, leadsCount, taskCounts }) => {
    const navItems = [
        { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
        { id: 'leads', label: 'My Registry', icon: <FunnelIcon className="w-6 h-6" />, count: leadsCount },
        { id: 'my-requests', label: 'My Requests', icon: <RectangleGroupIcon className="w-6 h-6" /> },
        { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
        { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
    ];

    const secondaryNavItems = [
        { id: 'escalate-issue', label: 'Escalate Issue', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
    ];

    return (
        <aside className="w-64 bg-surface border-r border-border flex-shrink-0 flex flex-col" aria-label="Sidebar">
            <div className="flex items-center pl-2.5 mb-5 h-16 flex-shrink-0 border-b border-border">
                <BuildingOfficeIcon className="h-8 w-8 text-primary" />
                <h1 className="ml-3 text-xl font-bold text-text-primary tracking-tight">
                    My Workspace
                </h1>
            </div>
            <div className="overflow-y-auto h-full px-3 py-4 flex flex-col justify-between">
                <ul className="space-y-2">
                    {navItems.map(item => (
                        <NavItem
                            key={item.id}
                            label={item.label}
                            icon={item.icon}
                            isActive={currentPage === item.id}
                            onClick={() => setCurrentPage(item.id)}
                            count={item.count}
                        />
                    ))}
                </ul>
                <div>
                    <div className="mt-4 pt-4 border-t border-border">
                        <ul className="space-y-2">
                            {secondaryNavItems.map(item => (
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
                </div>
            </div>
        </aside>
    );
}

export default SalesTeamSidebar;
