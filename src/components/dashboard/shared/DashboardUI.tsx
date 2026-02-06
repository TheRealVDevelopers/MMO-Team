
import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

// Make children optional in CardProps if it's used as a base for components that don't accept children
interface CardProps {
    children?: React.ReactNode;
    className?: string;
    animate?: boolean;
    onClick?: () => void;
}

export const ContentCard: React.FC<CardProps> = ({ children, className, animate = true, onClick }) => {
    // Cast strict motion types
    const Component = animate ? motion.div : 'div';
    const animationProps = animate ? {
        variants: fadeInUp,
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true }
    } : {};

    return (
        // @ts-ignore - motion component type complexity
        <Component
            {...animationProps}
            className={cn(
                "bg-surface border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow",
                className
            )}
            onClick={onClick}
        >
            {children}
        </Component>
    );
};

// Alias for easier import
export const Card = ContentCard;

interface StatCardProps extends Omit<CardProps, 'children'> {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: string;
        positive: boolean;
    };
    color?: 'primary' | 'secondary' | 'accent' | 'purple' | 'error';
    onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color = 'primary', className, onClick }) => {
    const colorClasses = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary',
        accent: 'bg-accent/10 text-accent',
        purple: 'bg-purple/10 text-purple',
        error: 'bg-error/10 text-error',
    };

    return (
        <ContentCard className={cn("relative overflow-hidden group hover:border-primary/50 transition-colors", className)} onClick={onClick}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">{title}</p>
                    <h3 className="text-3xl font-serif font-black text-text-primary">{value}</h3>
                    {trend && (
                        <div className={cn(
                            "flex items-center mt-2 text-xs font-bold",
                            trend.positive ? "text-green-500" : "text-error"
                        )}>
                            {trend.positive ? '↑' : '↓'} {trend.value}
                            <span className="text-text-secondary font-normal ml-1">vs last month</span>
                        </div>
                    )}
                </div>
                <div className={cn("p-4 rounded-2xl transition-transform duration-500 group-hover:scale-110", colorClasses[color])}>
                    {icon}
                </div>
            </div>
            {/* Decorative background glow */}
            <div className={cn(
                "absolute -bottom-6 -right-6 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity",
                trend?.positive ? "bg-green-500" : "bg-primary"
            )} />
        </ContentCard>
    );
};

export const SectionHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h2 className="text-3xl font-serif font-bold text-text-primary">{title}</h2>
            {subtitle && <p className="text-text-secondary font-light mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }> = ({ children, icon, className, ...props }) => {
    // @ts-ignore - motion component type complexity
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-primary/20 hover:bg-secondary transition-all",
                className
            )}
            {...props}
        >
            {children}
            {icon}
        </motion.button>
    );
};

export const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }> = ({ children, icon, className, ...props }) => {
    // @ts-ignore - motion component type complexity
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-border text-text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-subtle-background transition-all",
                className
            )}
            {...props}
        >
            {children}
            {icon}
        </motion.button>
    );
};
