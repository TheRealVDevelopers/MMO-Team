import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from './DashboardUI';
import { useTheme } from '../../../context/ThemeContext';

// Define Command Items
interface CommandItem {
    id: string;
    label: string;
    category: string;
    icon?: React.ReactNode;
    action?: () => void;
    pageId?: string; // If it navigates to a page
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    setCurrentPage: (page: string) => void;
    navItems: any[]; // simplify type for now
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, setCurrentPage, navItems }) => {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const { theme, setTheme } = useTheme();

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Generate searchable items
    const getItems = (): CommandItem[] => {
        const items: CommandItem[] = [];

        // Navigation Items
        navItems.forEach(item => {
            items.push({
                id: `nav-${item.id}`,
                label: `Go to ${item.label}`,
                category: 'Navigation',
                icon: item.icon,
                pageId: item.id
            });
        });

        // System Actions
        items.push({
            id: 'theme-toggle',
            label: `Switch to ${theme === 'serenity-white' ? 'Dark' : 'Light'} Mode`,
            category: 'System',
            action: () => setTheme(theme === 'serenity-white' ? 'midnight-executive' : 'serenity-white')
        });

        // Filter based on query
        if (!query) return items;
        return items.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        );
    };

    const filteredItems = getItems();

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setActiveIndex(prev => (prev + 1) % filteredItems.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setActiveIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
                    break;
                case 'Enter':
                    e.preventDefault();
                    executeCommand(filteredItems[activeIndex]);
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredItems, activeIndex]);

    const executeCommand = (item: CommandItem) => {
        if (!item) return;

        if (item.action) {
            item.action();
        } else if (item.pageId) {
            setCurrentPage(item.pageId);
        }

        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 pointer-events-auto"
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 pointer-events-auto px-4"
                    >
                        <div className="bg-surface border border-primary/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]">
                            {/* Input Header */}
                            <div className="flex items-center gap-3 px-4 py-4 border-b border-border/50 bg-surface/50">
                                <MagnifyingGlassIcon className="w-6 h-6 text-primary" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setActiveIndex(0);
                                    }}
                                    placeholder="Type a command or search..."
                                    className="flex-1 bg-transparent border-none outline-none text-lg text-text-primary placeholder:text-text-secondary/50 font-medium"
                                />
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-background/50 rounded text-xs text-text-secondary border border-border">ESC</span>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-primary/20">
                                {filteredItems.length === 0 ? (
                                    <div className="py-8 text-center text-text-secondary">
                                        No results found.
                                    </div>
                                ) : (
                                    filteredItems.map((item, index) => (
                                        <button
                                            key={item.id}
                                            onClick={() => executeCommand(item)}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-left",
                                                activeIndex === index
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.01]"
                                                    : "text-text-primary hover:bg-primary/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    activeIndex === index ? "bg-white/20" : "bg-primary/10 text-primary"
                                                )}>
                                                    {item.icon || <ChevronRightIcon className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className={cn("font-semibold text-sm", activeIndex === index ? "text-white" : "text-text-primary")}>
                                                        {item.label}
                                                    </p>
                                                    <p className={cn("text-xs mt-0.5", activeIndex === index ? "text-white/70" : "text-text-secondary")}>
                                                        {item.category}
                                                    </p>
                                                </div>
                                            </div>

                                            {activeIndex === index && (
                                                <motion.div
                                                    layoutId="enter-icon"
                                                    className="text-white/70 text-xs font-medium uppercase tracking-wider"
                                                >
                                                    Enter
                                                </motion.div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-2 border-t border-border/50 bg-background/50 flex items-center justify-between text-xs text-text-secondary">
                                <div className="flex gap-4">
                                    <span><strong className="text-text-primary">↑↓</strong> to navigate</span>
                                    <span><strong className="text-text-primary">↵</strong> to select</span>
                                </div>
                                <div>
                                    Internal Command System v1.0
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
