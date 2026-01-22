
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../shared/Modal';
import { User, Vendor } from '../../types';
import { signInStaff } from '../../services/authService';
import { EnvelopeIcon, LockClosedIcon, ArrowRightIcon, BuildingOfficeIcon, BuildingStorefrontIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (user: User | Vendor, type?: 'staff' | 'vendor') => void;
    initialType?: 'staff' | 'vendor';
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, initialType = 'staff' }) => {
    const [loginType, setLoginType] = useState<'staff' | 'vendor'>(initialType);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Update loginType when initialType changes and modal is closed/reopened
    React.useEffect(() => {
        if (isOpen) {
            setLoginType(initialType);
        }
    }, [isOpen, initialType]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (loginType === 'staff') {
                const user = await signInStaff(email, password);
                if (user) {
                    onLogin(user, 'staff');
                    onClose();
                    // Reset form
                    setEmail('');
                    setPassword('');
                }
            } else {
                const { signInVendor } = await import('../../services/authService');
                const vendor = await signInVendor(email, password);
                if (vendor) {
                    onLogin(vendor, 'vendor');
                    onClose();
                    // Reset form
                    setEmail('');
                    setPassword('');
                } else {
                    throw new Error('Invalid vendor credentials. Try vendor@makemyoffice.com / 123456');
                }
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
            <div className="space-y-8 p-6 relative overflow-hidden">
                {/* Decorative Background Element */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl"></div>

                {/* Header */}
                <div className="text-center space-y-6 pb-10 border-b border-border relative z-10">
                    <div className="flex justify-center">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-24 h-24 bg-surface backdrop-blur-md border border-white/20 rounded-[2rem] flex items-center justify-center shadow-luxury"
                        >
                            {loginType === 'staff' ? (
                                <BuildingOfficeIcon className="w-12 h-12 text-primary" />
                            ) : (
                                <BuildingStorefrontIcon className="w-12 h-12 text-secondary" />
                            )}
                        </motion.div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-serif font-bold text-text-primary mb-3">
                            {loginType === 'staff' ? 'Staff Gateway' : 'Vendor Portal'}
                        </h2>
                        <p className="text-lg text-text-secondary font-light max-w-sm mx-auto leading-relaxed">
                            Authorized access to the MMO {loginType === 'staff' ? 'Internal' : 'Partner'} ecosystem
                        </p>
                    </div>

                    {/* Login Type Toggle */}
                    <div className="flex justify-center p-1.5 bg-background rounded-full max-w-xs mx-auto border border-border shadow-inner">
                        <button
                            type="button"
                            onClick={() => setLoginType('staff')}
                            className={`flex-1 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${loginType === 'staff'
                                ? 'bg-primary text-white shadow-luxury'
                                : 'text-text-secondary hover:text-primary'
                                }`}
                        >
                            Staff
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginType('vendor')}
                            className={`flex-1 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${loginType === 'vendor'
                                ? 'bg-secondary text-white shadow-luxury'
                                : 'text-text-secondary hover:text-secondary'
                                }`}
                        >
                            Vendor
                        </button>
                    </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">

                    {/* Email Input */}
                    <div>
                        <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">
                            {loginType === 'staff' ? 'Work Email' : 'Registered Email'}
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-text-secondary/50 group-focus-within:text-primary transition-colors">
                                <EnvelopeIcon className="w-5 h-5" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={loginType === 'staff' ? "admin@makemyoffice.com / sales@makemyoffice.com" : "vendor@makemyoffice.com"}
                                className="w-full pl-14 pr-6 py-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none transition-all text-text-primary text-lg placeholder:text-text-secondary/60"
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
                                className="w-full pl-14 pr-6 py-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none transition-all text-text-primary text-lg placeholder:text-text-secondary/60"
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
                        className={`w-full py-5 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-full hover:shadow-lg transition-all duration-500 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center group ${loginType === 'staff' ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/90'
                            }`}
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
                                Access {loginType === 'staff' ? 'Dashboard' : 'Portal'}
                                <ArrowRightIcon className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {/* Help Text */}
                <div className="pt-6 border-t border-border">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary text-center">
                        Secure Authentication Port • MMO Protocol
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default LoginModal;
