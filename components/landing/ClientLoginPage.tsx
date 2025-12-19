
import React, { useState, useRef, useEffect } from 'react';
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
    onLoginSuccess: (projectId: string) => void;
}

const ClientLoginPage: React.FC<ClientLoginPageProps> = ({ onLoginSuccess }) => {
    const [projectId, setProjectId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Validate project ID format (except for default credential)
            const projectIdPattern = /^(OFF|HOM|COM|CUS)-\d{4}-\d{5}$/;
            if (projectId !== 'a@mmo.com' && !projectIdPattern.test(projectId)) {
                setError('Invalid Project ID format. Please check your credentials.');
                setIsLoading(false);
                return;
            }

            // Verify credentials with Firebase
            const isValid = await verifyClientCredentials(projectId, password);

            if (isValid) {
                onLoginSuccess(projectId);
            } else {
                setError('Invalid Project ID or Password. Please check your credentials.');
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

            <div className="w-full max-w-md relative z-10">
                <FadeInSection>
                    {/* Logo & Brand */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center mb-6">
                            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-luxury transform hover:rotate-6 transition-transform duration-500">
                                <span className="text-white font-serif font-bold text-4xl">K</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-text-primary mb-3">View My Project</h1>
                        <p className="text-text-secondary font-light text-lg">Track your interior journey securely</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-surface border border-border rounded-[2.5rem] shadow-luxury p-8 md:p-12">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">
                                    Project ID
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-text-secondary/50 group-focus-within:text-primary transition-colors">
                                        <IdentificationIcon className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                        placeholder="OFF-2025-00123"
                                        className="w-full pl-14 pr-6 py-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none transition-all text-text-primary font-mono text-lg placeholder:text-text-secondary/20"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] uppercase tracking-widest text-text-secondary/40 mt-3 ml-1">Format: XXX-YYYY-NNNNN or Default ID</p>
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
                                        className="w-full pl-14 pr-6 py-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none transition-all text-text-primary text-lg placeholder:text-text-secondary/20"
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
                                    <p className="font-light">Your Project ID was sent via email after project initiation</p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <p className="font-light">Password is shared personally by your sales consultant</p>
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
