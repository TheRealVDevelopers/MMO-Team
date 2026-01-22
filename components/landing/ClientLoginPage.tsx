
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    LockClosedIcon,
    IdentificationIcon,
    ArrowRightIcon,
    ExclamationCircleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { verifyClientCredentials } from '../../services/authService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge tailwind classes
 */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Animation Hook
const useOnScreen = (options: IntersectionObserverInit) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, options);

        if (ref.current) observer.observe(ref.current);
        return () => { if (ref.current) observer.unobserve(ref.current); };
    }, [ref, options]);

    return [ref, isVisible] as const;
};

const FadeInSection: React.FC<{ children: React.ReactNode; delay?: string; className?: string }> = ({ children, delay = '0ms', className = '' }) => {
    const [ref, isVisible] = useOnScreen({ threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    return (
        <div
            ref={ref}
            style={{ animationDelay: delay }}
            className={`${className} ${isVisible ? 'animate-luxury-reveal opacity-100' : 'opacity-0 translate-y-8'}`}
        >
            {children}
        </div>
    );
};

interface ClientLoginPageProps {
    onLoginSuccess: (email: string) => void;
}

const ClientLoginPage: React.FC<ClientLoginPageProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Validate email format
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                setError('Invalid email format. Please enter a valid email address.');
                setIsLoading(false);
                return;
            }

            // Verify credentials with Firebase
            const isValid = await verifyClientCredentials(email, password);

            if (isValid) {
                onLoginSuccess(email);
            } else {
                setError('Invalid email or password. Please check your credentials.');
            }
        } catch (error) {
            setError('Unable to verify credentials. Please try again later.');
            console.error('Client login error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6 py-20 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            </div>

            <div className="w-full lg:w-1/2 max-w-2xl relative z-10">
                <FadeInSection>
                    {/* Logo & Brand */}
                    <div className="text-center mb-16 px-4">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center justify-center mb-8 p-4 bg-surface/50 backdrop-blur-md rounded-3xl border border-white/20 shadow-luxury-subtle"
                        >
                            <img
                                src="/mmo-logo.png"
                                alt="Make My Office"
                                className="h-16 w-auto object-contain"
                            />
                        </motion.div>
                        <h1 className="text-5xl md:text-6xl font-serif font-bold text-text-primary mb-4 tracking-tight">View My Project</h1>
                        <p className="text-text-secondary font-light text-xl tracking-[0.05em] opacity-80 max-w-lg mx-auto leading-relaxed">
                            Experience your interior journey through our exclusive client portal
                        </p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-surface/80 backdrop-blur-2xl border border-white/20 rounded-[3rem] shadow-luxury p-10 md:p-16 relative overflow-hidden group">
                        {/* Decorative Gradient Blob */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-1000"></div>

                        <form onSubmit={handleLogin} className="space-y-10 relative z-10">
                            <div>
                                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-text-secondary/50 group-focus-within:text-primary transition-colors">
                                        <IdentificationIcon className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="client@makemyoffice.com"
                                        className="w-full pl-14 pr-6 py-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none transition-all text-text-primary text-lg placeholder:text-text-secondary/60"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] uppercase tracking-widest text-text-secondary/40 mt-3 ml-1">Enter your registered email address</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-text-secondary/50 group-focus-within:text-primary transition-colors">
                                        <LockClosedIcon className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="w-full pl-14 pr-6 py-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none transition-all text-text-primary text-lg placeholder:text-text-secondary/60"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] uppercase tracking-widest text-text-secondary/40 mt-3 ml-1">Provided by your sales consultant</p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 bg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-full hover:bg-secondary transition-all duration-500 shadow-xl hover:shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center group"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Authenticating...
                                    </div>
                                ) : (
                                    <>
                                        Access Project
                                        <ArrowRightIcon className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Help Section */}
                        <div className="mt-10 pt-10 border-t border-border">
                            <h4 className="text-[10px] font-black text-text-primary uppercase tracking-widest mb-6">Need Assistance?</h4>
                            <div className="space-y-4 text-sm text-text-secondary">
                                <div className="flex items-start space-x-3">
                                    <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <p className="font-light">Your login credentials were sent via email after project initiation</p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <p className="font-light">Use the email address registered with your project</p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <p className="font-light">For support: <span className="font-bold text-primary">+91 (555) 123-4567</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            <LockClosedIcon className="w-3 h-3 inline mr-1" />
                            Secure connection. Your data is encrypted and protected.
                        </p>
                    </div>
                </FadeInSection>
            </div>
        </div>
    );
};

export default ClientLoginPage;
