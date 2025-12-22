
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { UserRole } from '../../../types';
import { cn } from './DashboardUI';
import {
    Squares2X2Icon,
    UserGroupIcon,
    DocumentChartBarIcon,
    ChatBubbleLeftEllipsisIcon,
    ExclamationTriangleIcon,
    ArrowLeftOnRectangleIcon,
    SunIcon,
    MoonIcon,
    BellIcon,
    ClockIcon,
    UserCircleIcon,
    ChevronLeftIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import UserSelector from '../../shared/UserSelector';
import CommandPalette from './CommandPalette';
import NotificationPopover from './NotificationPopover';

interface NavItemProp {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface InternalLayoutProps {
    children: React.ReactNode;
    currentPage: string;
    setCurrentPage: (page: string) => void;
    title?: string;
    navItems?: NavItemProp[];
    secondaryNavItems?: NavItemProp[];
}

const InternalLayout: React.FC<InternalLayoutProps> = ({
    children,
    currentPage,
    setCurrentPage,
    title = "MMO",
    navItems = [],
    secondaryNavItems = []
}) => {
    const { currentUser, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    // Keyboard Shortcut for Command Palette
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const renderIcon = (icon: React.ReactNode, isActive: boolean) => {
        if (React.isValidElement(icon)) {
            return React.cloneElement(icon as React.ReactElement, {
                className: cn(
                    (icon as React.ReactElement).props.className,
                    "w-6 h-6 flex-shrink-0 transition-transform duration-300",
                    isActive ? "text-white" : "text-text-secondary group-hover:scale-110 group-hover:text-primary"
                )
            });
        }
        return icon;
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans">
            {/* Sidebar - Desktop */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarCollapsed ? '80px' : '280px' }}
                className="hidden lg:flex flex-col bg-surface border-r border-border relative z-30 transition-all duration-500 ease-in-out"
            >
                <div className="p-6 flex items-center justify-between">
                    {!isSidebarCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-serif font-bold">M</div>
                            <span className="text-xl font-serif font-bold text-text-primary tracking-wide">{title}</span>
                        </motion.div>
                    )}
                    {isSidebarCollapsed && (
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-serif font-bold mx-auto">M</div>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-8 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentPage(item.id)}
                            className={cn(
                                "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group text-left",
                                currentPage === item.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-text-secondary hover:bg-primary/5 hover:text-primary"
                            )}
                        >
                            {renderIcon(item.icon, currentPage === item.id)}
                            {!isSidebarCollapsed && (
                                <span className="font-bold text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
                            )}
                        </button>
                    ))}

                    {secondaryNavItems.length > 0 && (
                        <div className="pt-6 mt-6 border-t border-border/40">
                            {!isSidebarCollapsed && (
                                <p className="px-4 mb-4 text-[9px] font-black text-text-tertiary uppercase tracking-[0.3em]">Quick Actions</p>
                            )}
                            {secondaryNavItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentPage(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group text-left",
                                        currentPage === item.id
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "text-text-secondary hover:bg-primary/5 hover:text-primary"
                                    )}
                                >
                                    {renderIcon(item.icon, currentPage === item.id)}
                                    {!isSidebarCollapsed && (
                                        <span className="font-bold text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="w-full flex items-center gap-4 px-4 py-3 text-text-secondary hover:text-primary transition-colors"
                    >
                        <ChevronLeftIcon className={cn("w-6 h-6 transition-transform duration-500", isSidebarCollapsed && "rotate-180")} />
                        {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Collapse</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header */}
                <header className="h-20 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-8 z-20">
                    <div className="flex items-center gap-4 lg:hidden">
                        <button onClick={() => setIsMobileMenuOpen(true)}>
                            <Bars3Icon className="w-6 h-6 text-text-primary" />
                        </button>
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-serif font-bold">M</div>
                    </div>

                    <div className="flex-1 max-w-xl hidden md:block">
                        <button
                            onClick={() => setIsCommandPaletteOpen(true)}
                            className="w-full h-10 bg-background border border-border rounded-full px-4 flex items-center justify-between text-text-secondary/50 hover:border-primary hover:text-primary transition-all group cursor-text"
                        >
                            <span className="text-xs group-hover:text-text-primary">Search projects, enquiries or tasks...</span>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold bg-surface border border-border rounded px-1.5 py-0.5 group-hover:bg-primary/10 group-hover:border-primary/20">Ctrl</span>
                                <span className="text-[10px] font-bold bg-surface border border-border rounded px-1.5 py-0.5 group-hover:bg-primary/10 group-hover:border-primary/20">K</span>
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(theme === 'serenity-white' ? 'midnight-executive' : 'serenity-white')}
                            className="p-2 text-text-secondary hover:text-primary transition-colors"
                        >
                            {theme === 'serenity-white' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                        </button>

                        <NotificationPopover />

                        <div className="h-8 w-px bg-border hidden sm:block" />

                        <div className="flex items-center gap-4">
                            <div className="hidden md:block">
                                <UserSelector />
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-text-primary">{currentUser?.name}</p>
                                <p className="text-[10px] uppercase tracking-widest text-text-secondary font-black">{currentUser?.role}</p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border group cursor-pointer hover:border-primary transition-colors">
                                {currentUser?.avatar ? (
                                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircleIcon className="w-8 h-8 text-primary" />
                                )}
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-text-secondary hover:text-error transition-colors"
                                title="Sign Out"
                            >
                                <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </header>

                <CommandPalette
                    isOpen={isCommandPaletteOpen}
                    onClose={() => setIsCommandPaletteOpen(false)}
                    setCurrentPage={setCurrentPage}
                    navItems={[...navItems, ...secondaryNavItems]}
                />

                {/* Dynamic Content */}
                <div className="flex-1 overflow-y-auto bg-background p-8 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Decorative background effects */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
            </main>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-80 bg-surface z-50 flex flex-col p-6 lg:hidden"
                        >
                            <div className="flex items-center justify-between mb-12">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-serif font-bold">M</div>
                                    <span className="text-xl font-serif font-bold text-text-primary">{title}</span>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)}>
                                    <XMarkIcon className="w-6 h-6 text-text-primary" />
                                </button>
                            </div>
                            <nav className="space-y-3 overflow-y-auto">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => { setCurrentPage(item.id); setIsMobileMenuOpen(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-left",
                                            currentPage === item.id
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "text-text-secondary hover:bg-primary/5"
                                        )}
                                    >
                                        {renderIcon(item.icon, currentPage === item.id)}
                                        <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                                    </button>
                                ))}

                                {secondaryNavItems.length > 0 && (
                                    <div className="pt-6 mt-6 border-t border-border/40">
                                        <p className="px-4 mb-4 text-[9px] font-black text-text-tertiary uppercase tracking-[0.3em]">Quick Actions</p>
                                        {secondaryNavItems.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => { setCurrentPage(item.id); setIsMobileMenuOpen(false); }}
                                                className={cn(
                                                    "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-left",
                                                    currentPage === item.id
                                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                        : "text-text-secondary hover:bg-primary/5"
                                                )}
                                            >
                                                {renderIcon(item.icon, currentPage === item.id)}
                                                <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </nav>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InternalLayout;
