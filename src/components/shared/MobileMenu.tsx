import React, { useEffect } from 'react';
import { XMarkIcon, PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    count?: number;
}

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    currentPage: string;
    setCurrentPage: (page: string) => void;
    navItems: NavItem[];
    secondaryNavItems?: NavItem[];
    title: string;
    showFooter?: boolean;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
    isOpen,
    onClose,
    currentPage,
    setCurrentPage,
    navItems,
    secondaryNavItems,
    title,
    showFooter = true
}) => {
    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleNavClick = (pageId: string) => {
        setCurrentPage(pageId);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Slide-in Menu */}
            <div className={`fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-surface dark:bg-surface border-l border-border dark:border-border shadow-2xl z-50 lg:hidden transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <div className="h-full flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border dark:border-border bg-gradient-to-r from-primary to-secondary">
                        <div>
                            <h2 className="text-lg font-bold text-white">{title}</h2>
                            <p className="text-xs text-white/80 mt-0.5">Navigation Menu</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                            aria-label="Close menu"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 overflow-y-auto py-6 px-4">
                        {/* Main Navigation */}
                        <div className="mb-8">
                            <p className="px-4 mb-4 text-xs font-bold text-text-secondary dark:text-text-secondary uppercase tracking-wider">
                                Main Menu
                            </p>
                            <nav className="space-y-2">
                                {navItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavClick(item.id)}
                                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${currentPage === item.id
                                            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                                            : 'text-text-primary dark:text-text-primary hover:bg-subtle-background dark:hover:bg-background'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={currentPage === item.id ? 'text-white' : 'text-primary'}>
                                                {item.icon}
                                            </div>
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                        {item.count !== undefined && (
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${currentPage === item.id
                                                ? 'bg-white/20 text-white'
                                                : 'bg-primary/10 text-primary'
                                                }`}>
                                                {item.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Secondary Navigation */}
                        {secondaryNavItems && secondaryNavItems.length > 0 && (
                            <div className="pt-6 border-t border-border dark:border-border">
                                <p className="px-4 mb-4 text-xs font-bold text-text-secondary dark:text-text-secondary uppercase tracking-wider">
                                    Quick Actions
                                </p>
                                <nav className="space-y-2">
                                    {secondaryNavItems.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleNavClick(item.id)}
                                            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${currentPage === item.id
                                                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                                                : 'text-text-primary dark:text-text-primary hover:bg-subtle-background dark:hover:bg-background'
                                                }`}
                                        >
                                            <div className={currentPage === item.id ? 'text-white' : 'text-primary'}>
                                                {item.icon}
                                            </div>
                                            <span className="font-medium">{item.label}</span>
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        )}
                    </div>

                    {/* Footer Contact Info */}
                    {showFooter && (
                        <div className="border-t border-border dark:border-border bg-subtle-background dark:bg-background p-6 space-y-4">
                            <div>
                                <p className="text-xs font-bold text-text-secondary dark:text-text-secondary uppercase tracking-wider mb-3">
                                    Contact Us
                                </p>
                                <div className="space-y-3">
                                    <a href="tel:+915551234567" className="flex items-center space-x-3 text-sm text-text-primary dark:text-text-primary hover:text-primary transition-colors">
                                        <PhoneIcon className="w-5 h-5 text-primary" />
                                        <span>+91 (555) 123-4567</span>
                                    </a>
                                    <a href="mailto:projects@makemyoffice.com" className="flex items-center space-x-3 text-sm text-text-primary dark:text-text-primary hover:text-primary transition-colors">
                                        <EnvelopeIcon className="w-5 h-5 text-primary" />
                                        <span>projects@makemyoffice.com</span>
                                    </a>
                                    <div className="flex items-start space-x-3 text-sm text-text-secondary dark:text-text-secondary">
                                        <MapPinIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">Cyber City, Sector 18<br />Gurgaon, Haryana 122002</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-border dark:border-border">
                                <p className="text-xs text-text-secondary dark:text-text-secondary text-center">
                                    © 2025 Make My Office - MMO
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MobileMenu;
