
import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { User } from '../../types';
import { signInStaff } from '../../services/authService';
import { EnvelopeIcon, LockClosedIcon, ArrowRightIcon, BuildingOfficeIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (user: User) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await signInStaff(email, password);
            if (user) {
                onLogin(user);
                onClose();
                // Reset form
                setEmail('');
                setPassword('');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="" size="3xl">
            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="text-center space-y-4 pb-6 border-b border-border dark:border-border">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-kurchi-gold-500 to-kurchi-espresso-900 rounded-2xl flex items-center justify-center shadow-luxury">
                            <BuildingOfficeIcon className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-kurchi-espresso-900 dark:text-white mb-2">Staff Login</h2>
                        <p className="text-base text-text-secondary dark:text-text-secondary font-light">
                            Sign in to access your dashboard
                        </p>
                    </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-bold text-text-secondary dark:text-text-secondary uppercase tracking-wider mb-3">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john.s@makemyoffice.com"
                                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-border rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors text-lg bg-white dark:bg-background text-text-primary dark:text-text-primary"
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-sm font-bold text-text-secondary dark:text-text-secondary uppercase tracking-wider mb-3">
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
                                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-border rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors text-lg bg-white dark:bg-background text-text-primary dark:text-text-primary"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-text-secondary mt-2">Default password: 123456</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-kurchi-espresso-900 text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-kurchi-gold-500 transition-all duration-300 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign In
                                <ArrowRightIcon className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </button>
                </form>

                {/* Help Text */}
                <div className="pt-6 border-t border-border dark:border-border">
                    <p className="text-xs text-text-secondary dark:text-text-secondary text-center">
                        Having trouble logging in? Contact your system administrator.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default LoginModal;
