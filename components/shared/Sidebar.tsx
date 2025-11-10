
import React from 'react';
import { BuildingOfficeIcon } from '../icons/IconComponents';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    count?: number;
}

interface SidebarProps {
    title: string;
    currentPage: string;
    setCurrentPage: (page: string) => void;
    navItems: NavItem[];
    secondaryNavItems?: NavItem[];
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

const Sidebar: React.FC<SidebarProps> = ({ title, currentPage, setCurrentPage, navItems, secondaryNavItems }) => {
    return (
        <aside className="w-64 bg-surface border-r border-border flex-shrink-0" aria-label="Sidebar">
            <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
                <div className="flex items-center pl-2.5 mb-5 h-16 -mt-4 flex-shrink-0">
                     <BuildingOfficeIcon className="h-8 w-8 text-primary" />
                     <h1 className="ml-3 text-xl font-bold text-text-primary tracking-tight">
                        {title}
                    </h1>
                </div>
                <div className="flex-grow">
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
                </div>
                {secondaryNavItems && secondaryNavItems.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border flex-shrink-0">
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
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
