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
    RectangleGroupIcon
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
            className={`flex items-center justify-between p-2 text-base font-normal rounded-lg transition-colors duration-150 group ${
                isActive 
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
        { id: 'overview', label: 'Overview', icon: <RectangleGroupIcon className="w-6 h-6" /> },
        { id: 'leads', label: 'My Leads', icon: <FunnelIcon className="w-6 h-6" />, count: leadsCount },
        { id: 'site-visits', label: 'Site Visits', icon: <MapPinIcon className="w-6 h-6" />, count: taskCounts['site-visits'] },
        { id: 'drawing-tasks', label: 'Drawing Tasks', icon: <PaintBrushIcon className="w-6 h-6" />, count: taskCounts['drawing-tasks'] },
        { id: 'quotation-tasks', label: 'Quotations', icon: <CalculatorIcon className="w-6 h-6" />, count: taskCounts['quotation-tasks'] },
        { id: 'procurement-tasks', label: 'Procurement', icon: <TruckIcon className="w-6 h-6" />, count: taskCounts['procurement-tasks'] },
        { id: 'execution-tasks', label: 'Execution', icon: <WrenchScrewdriverIcon className="w-6 h-6" />, count: taskCounts['execution-tasks'] },
        { id: 'accounts-tasks', label: 'Accounts', icon: <CreditCardIcon className="w-6 h-6" />, count: taskCounts['accounts-tasks'] },
        { id: 'performance', label: 'Performance', icon: <ChartBarSquareIcon className="w-6 h-6" /> },
    ];

    return (
        <aside className="w-64 bg-surface border-r border-border flex-shrink-0 flex flex-col" aria-label="Sidebar">
            <div className="flex items-center pl-2.5 mb-5 h-16 flex-shrink-0 border-b border-border">
                 <BuildingOfficeIcon className="h-8 w-8 text-primary" />
                 <h1 className="ml-3 text-xl font-bold text-text-primary tracking-tight">
                    My Workspace
                </h1>
            </div>
            <div className="overflow-y-auto h-full">
                <ul className="space-y-2 px-3 py-4">
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
            </div>
        </aside>
    );
}

export default SalesTeamSidebar;
