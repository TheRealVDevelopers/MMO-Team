
import React, { useState } from 'react';
import UserSelector from './UserSelector';
import { CogIcon, BellIcon, BuildingOfficeIcon, ChevronRightIcon } from '../icons/IconComponents';
import { Bars3Icon, XMarkIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationPopover from '../dashboard/shared/NotificationPopover';

interface HeaderProps {
    openSettings: () => void;
    onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ openSettings, onMenuToggle }) => {
    const { currentUser } = useAuth();
    const { isDark, toggleTheme, currentTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const handleMenuToggle = () => {
        setShowMobileMenu(!showMobileMenu);
        if (onMenuToggle) onMenuToggle();
    };

    return (
        <header className="bg-surface dark:bg-surface border-b border-border/60 dark:border-border sticky top-0 z-20 flex-shrink-0 shadow-sm">
            <div className="flex items-center justify-between h-16 md:h-18 px-4 md:px-6 lg:px-8">
                {/* Left Section - Branding & Hamburger */}
                <div className="flex items-center space-x-3">
                    {/* Hamburger Menu (Mobile Only) */}
                    <button
                        onClick={handleMenuToggle}
                        className="lg:hidden p-2 rounded-xl text-text-secondary dark:text-text-primary hover:bg-subtle-background dark:hover:bg-background transition-all"
                        aria-label="Toggle menu"
                    >
                        {showMobileMenu ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                    </button>

                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-md">
                            <BuildingOfficeIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold text-text-primary dark:text-white tracking-tight">
                                MMO
                            </h1>
                            <p className="text-xs text-text-secondary dark:text-text-secondary font-light -mt-0.5">Internal Portal</p>
                        </div>
                    </div>
                </div>

                {/* Right Section - User Controls */}
                <div className="flex items-center space-x-2 md:space-x-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={() => {
                            console.log('Theme button clicked!');
                            console.log('toggleTheme function:', toggleTheme);
                            console.log('isDark:', isDark);
                            if (toggleTheme) {
                                toggleTheme();
                            } else {
                                console.error('toggleTheme is undefined!');
                            }
                        }}
                        className="p-2.5 rounded-xl text-text-secondary dark:text-text-primary hover:bg-subtle-background dark:hover:bg-background hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        aria-label="Toggle theme"
                        title={`Current: ${currentTheme?.name || 'Unknown'}`}
                    >
                        {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                    </button>

                    {/* Notifications */}
                    <div className="relative hidden sm:block">
                        <NotificationPopover />
                    </div>

                    {/* User Profile Section (Hidden on small screens) */}
                    {currentUser && (
                        <div 
                            onClick={openSettings}
                            className="hidden md:flex items-center space-x-3 px-4 py-2 rounded-xl bg-subtle-background dark:bg-background border border-border/50 dark:border-border cursor-pointer hover:border-primary transition-all"
                        >
                            <img
                                src={currentUser.avatar}
                                alt={currentUser.name}
                                className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-surface shadow-sm"
                            />
                            <div className="text-left">
                                <p className="text-sm font-bold text-text-primary dark:text-white leading-tight">{currentUser.name}</p>
                                <p className="text-xs text-text-secondary font-light">{currentUser.role}</p>
                            </div>
                        </div>
                    )}

                    {/* User Selector (for switching users) - Hidden on mobile */}
                    <div className="hidden sm:block">
                        <UserSelector />
                    </div>

                    {/* Settings */}
                    <button
                        onClick={openSettings}
                        className="p-2.5 rounded-xl text-text-secondary dark:text-text-primary hover:bg-subtle-background dark:hover:bg-background hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        aria-label="Open settings"
                    >
                        <CogIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
