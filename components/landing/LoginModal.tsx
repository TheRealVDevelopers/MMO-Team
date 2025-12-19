
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
    const [designation, setDesignation] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!designation) {
            setError('Please select your designation');
            setLoading(false);
            return;
        }

        try {
            const user = await signInStaff(email, password, designation);
            if (user) {
                onLogin(user);
                onClose();
                // Reset form
                setEmail('');
                setPassword('');
                setDesignation('');
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
        setDesignation('');
        setError('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="" size="3xl">
            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="text-center space-y-6 pb-8 border-b border-border">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center shadow-luxury-subtle transform hover:rotate-6 transition-transform duration-500">
                            <BuildingOfficeIcon className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-text-primary mb-2">Staff Gateway</h2>
                        <p className="text-base text-text-secondary font-light">
                            Authenticate to access your workspace
                        </p>
                    </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Designation Selection */}
                    <div>
                        <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">
                            Your Designation
                        </label>
                        <div className="relative group">
                            <select
                                value={designation}
                                onChange={(e) => setDesignation(e.target.value)}
                                className="w-full px-6 py-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none transition-all text-text-primary text-lg appearance-none cursor-pointer"
                                required
                            >
                                <option value="" disabled>Select Designation</option>
                                <option value="Admin">Admin</option>
                                <option value="Designer">Designer</option>
                                <option value="Manager">Manager</option>
                                <option value="Sales Member">Sales Member</option>
                            </select>
                            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-text-secondary/50">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Email Input */}
                    <div>
                        <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">
                            Work Email
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-text-secondary/50 group-focus-within:text-primary transition-colors">
                                <EnvelopeIcon className="w-5 h-5" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john.s@makemyoffice.com"
                                className="w-full pl-14 pr-6 py-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none transition-all text-text-primary text-lg placeholder:text-text-secondary/20"
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">
                            Passcode
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
                                autoComplete="current-password"
                            />
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-text-secondary/40 mt-3 ml-1">Default password: 123456</p>
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
                        className="w-full py-5 bg-primary text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-full hover:bg-secondary transition-all duration-500 shadow-xl hover:shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center group"
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </div>
                        ) : (
                            <>
                                Access Dashboard
                                <ArrowRightIcon className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {/* Help Text */}
                <div className="pt-6 border-t border-border">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary text-center">
                        Secure Authentication Port • Kurchi Protocol
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default LoginModal;
