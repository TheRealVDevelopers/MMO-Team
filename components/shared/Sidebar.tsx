
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
            className={`group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive 
                ? 'bg-gradient-to-r from-kurchi-gold-500 to-kurchi-gold-600 text-white shadow-lg scale-[1.02]' 
                : 'text-text-secondary hover:bg-subtle-background hover:text-kurchi-espresso-900 hover:translate-x-1'
            }`}
        >
            <div className="flex items-center space-x-3">
                <div className={`${
                    isActive 
                    ? 'text-white' 
                    : 'text-text-secondary group-hover:text-kurchi-gold-600'
                } transition-colors`}>
                    {icon}
                </div>
                <span className="font-medium">{label}</span>
            </div>
             {count !== undefined && (
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full transition-colors ${
                    isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-kurchi-gold-500/10 text-kurchi-gold-600 group-hover:bg-kurchi-gold-500/20'
                }`}>
                    {count}
                </span>
            )}
        </a>
    </li>
);

const Sidebar: React.FC<SidebarProps> = ({ title, currentPage, setCurrentPage, navItems, secondaryNavItems }) => {
    return (
        <aside className="w-72 bg-white border-r border-border/50 flex-shrink-0 shadow-sm" aria-label="Sidebar">
            <div className="h-full px-4 py-6 overflow-y-auto flex flex-col">
                {/* Enhanced Sidebar Header */}
                <div className="flex items-center pl-2 mb-8 h-16 -mt-2 flex-shrink-0">
                     <div className="w-10 h-10 bg-gradient-to-br from-kurchi-gold-500 to-kurchi-espresso-900 rounded-xl flex items-center justify-center shadow-md">
                        <BuildingOfficeIcon className="h-6 w-6 text-white" />
                     </div>
                     <div className="ml-3">
                        <h1 className="text-base font-bold text-kurchi-espresso-900 tracking-tight">
                            {title}
                        </h1>
                        <p className="text-xs text-text-secondary font-light -mt-0.5">Dashboard</p>
                     </div>
                </div>
                
                {/* Main Navigation */}
                <div className="flex-grow">
                    <div className="mb-2">
                        <p className="px-4 mb-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Main Menu</p>
                    </div>
                    <ul className="space-y-1.5">
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
                
                {/* Secondary Navigation */}
                {secondaryNavItems && secondaryNavItems.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border/50 flex-shrink-0">
                        <div className="mb-2">
                            <p className="px-4 mb-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Quick Actions</p>
                        </div>
                        <ul className="space-y-1.5">
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
