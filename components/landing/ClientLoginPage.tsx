
import React, { useState, useRef, useEffect } from 'react';
import { 
    LockClosedIcon, 
    IdentificationIcon,
    ArrowRightIcon,
    ExclamationCircleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { verifyClientCredentials } from '../../services/authService';

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
            // Validate project ID format
            const projectIdPattern = /^(OFF|HOM|COM|CUS)-\d{4}-\d{5}$/;
            if (!projectIdPattern.test(projectId)) {
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
        <div className="min-h-screen bg-gradient-to-br from-kurchi-espresso-950 via-kurchi-espresso-900 to-kurchi-espresso-950 flex items-center justify-center px-6 py-20">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <FadeInSection>
                    {/* Logo & Brand */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center mb-6">
                            <div className="w-16 h-16 bg-kurchi-gold-500 rounded-2xl flex items-center justify-center shadow-2xl">
                                <span className="text-white font-serif font-bold text-3xl">K</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-serif font-bold text-white mb-3">View My Project</h1>
                        <p className="text-gray-400 font-light">Track your interior journey securely</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Project ID Input */}
                            <div>
                                <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
                                    Project ID
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <IdentificationIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value.toUpperCase())}
                                        placeholder="OFF-2025-00123"
                                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors text-lg font-mono"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Format: XXX-YYYY-NNNNN</p>
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors text-lg"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Provided by your sales consultant</p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-kurchi-espresso-900 text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-kurchi-gold-500 transition-all duration-300 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Access My Project
                                        <ArrowRightIcon className="w-5 h-5 ml-2" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Help Section */}
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <h4 className="text-sm font-bold text-kurchi-espresso-900 mb-4">Need Help?</h4>
                            <div className="space-y-3 text-sm text-text-secondary">
                                <div className="flex items-start space-x-2">
                                    <CheckCircleIcon className="w-4 h-4 text-kurchi-gold-500 flex-shrink-0 mt-0.5" />
                                    <p>Your Project ID was sent via email after project initiation</p>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircleIcon className="w-4 h-4 text-kurchi-gold-500 flex-shrink-0 mt-0.5" />
                                    <p>Password is shared personally by your sales consultant</p>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircleIcon className="w-4 h-4 text-kurchi-gold-500 flex-shrink-0 mt-0.5" />
                                    <p>For support, contact: <span className="font-medium text-kurchi-gold-500">+91 (555) 123-4567</span></p>
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
