
import React, { useState } from 'react';
import UserSelector from './UserSelector';
import { CogIcon, BellIcon, BuildingOfficeIcon, ChevronRightIcon } from '../icons/IconComponents';
import { Bars3Icon, XMarkIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useTheme, themes } from '../../context/ThemeContext';

interface HeaderProps {
    openSettings: () => void;
    onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ openSettings, onMenuToggle }) => {
    const { currentUser } = useAuth();
    const { theme, setTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const isDark = themes[theme]?.type === 'dark';

    const toggleTheme = () => {
        const availableThemes = Object.keys(themes);
        const currentIndex = availableThemes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % availableThemes.length;
        setTheme(availableThemes[nextIndex]);
    };

    const handleMenuToggle = () => {
        setShowMobileMenu(!showMobileMenu);
        if (onMenuToggle) onMenuToggle();
    };

    return (
        <header className="bg-white dark:bg-surface border-b border-border/60 dark:border-border sticky top-0 z-20 flex-shrink-0 shadow-sm">
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
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl text-text-secondary dark:text-text-primary hover:bg-subtle-background dark:hover:bg-background hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        aria-label="Toggle theme"
                        title={`Current: ${themes[theme]?.name}`}
                    >
                        {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                    </button>

                    {/* Notifications */}
                    <div className="relative hidden sm:block">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2.5 rounded-xl text-text-secondary dark:text-text-primary hover:bg-subtle-background dark:hover:bg-background hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            aria-label="Notifications"
                        >
                            <BellIcon className="h-5 w-5" />
                            {/* Notification Badge */}
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-white dark:border-surface"></span>
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-surface rounded-xl shadow-luxury border border-border dark:border-border overflow-hidden z-30">
                                <div className="px-4 py-3 border-b border-border dark:border-border bg-subtle-background dark:bg-background">
                                    <h3 className="text-sm font-bold text-text-primary dark:text-white">Notifications</h3>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    <div className="p-4 hover:bg-subtle-background dark:hover:bg-background cursor-pointer transition-colors border-b border-border dark:border-border">
                                        <p className="text-sm font-medium text-text-primary dark:text-white mb-1">New lead assigned</p>
                                        <p className="text-xs text-text-secondary">5 minutes ago</p>
                                    </div>
                                    <div className="p-4 hover:bg-subtle-background dark:hover:bg-background cursor-pointer transition-colors border-b border-border dark:border-border">
                                        <p className="text-sm font-medium text-text-primary dark:text-white mb-1">Quotation approved</p>
                                        <p className="text-xs text-text-secondary">2 hours ago</p>
                                    </div>
                                    <div className="p-4 hover:bg-subtle-background dark:hover:bg-background cursor-pointer transition-colors">
                                        <p className="text-sm font-medium text-text-primary dark:text-white mb-1">Site visit scheduled</p>
                                        <p className="text-xs text-text-secondary">Yesterday</p>
                                    </div>
                                </div>
                                <div className="px-4 py-3 border-t border-border dark:border-border bg-subtle-background dark:bg-background text-center">
                                    <button className="text-xs font-semibold text-primary hover:text-secondary">View all notifications</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Profile Section (Hidden on small screens) */}
                    {currentUser && (
                        <div className="hidden md:flex items-center space-x-3 px-4 py-2 rounded-xl bg-subtle-background dark:bg-background border border-border/50 dark:border-border">
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
