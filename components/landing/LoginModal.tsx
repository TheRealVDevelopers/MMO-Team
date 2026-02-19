
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../shared/Modal';
import { User, Vendor } from '../../types';
import { signInStaff, submitStaffRegistrationRequest } from '../../services/authService';
import { EnvelopeIcon, LockClosedIcon, ArrowRightIcon, BuildingOfficeIcon, BuildingStorefrontIcon, ExclamationCircleIcon, UserIcon, PhoneIcon, BriefcaseIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { UserRole } from '../../types';

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
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.SALES_TEAM_MEMBER);
    const [region, setRegion] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    // Update loginType when initialType changes and modal is closed/reopened
    React.useEffect(() => {
        if (isOpen) {
            setLoginType(initialType);
        }
    }, [isOpen, initialType]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isRegistering && loginType === 'staff') {
                if (!name.trim() || !phone.trim() || !role) {
                    throw new Error('Please fill in all fields.');
                }
                // Submit registration request (does NOT create account immediately)
                await submitStaffRegistrationRequest(email, password, name, phone, role as UserRole, region);
                setSuccess('Registration request submitted successfully! An administrator will review your request and approve your account. You will be notified via email once approved.');
                setIsRegistering(false);
                setPassword('');
                setName('');
                setPhone('');
                setRegion('');
                setRole(UserRole.SALES_TEAM_MEMBER);
            } else if (loginType === 'staff') {
                // Staff login only: Firebase Auth → staffUsers/{uid}. No fallback to clients (B2I parent uses Client Login).
                try {
                    const user = await signInStaff(email, password);
                    if (user) {
                        onLogin(user, 'staff');
                        onClose();
                        setEmail('');
                        setPassword('');
                        return;
                    }
                } catch (staffErr: any) {
                    const code = staffErr?.code || '';
                    const isInvalidCredential = code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found';
                    if (isInvalidCredential) {
                        const { signInVendor } = await import('../../services/authService');
                        const vendor = await signInVendor(email, password);
                        if (vendor) {
                            onLogin(vendor, 'vendor');
                            onClose();
                            setEmail('');
                            setPassword('');
                            return;
                        }
                    }
                    throw staffErr;
                }
                setError('Invalid email or password.');
                return;
            } else {
                const { signInVendor } = await import('../../services/authService');
                const vendor = await signInVendor(email, password);
                if (vendor) {
                    onLogin(vendor, 'vendor');
                    onClose();
                    setEmail('');
                    setPassword('');
                } else {
                    throw new Error('Invalid email or password. Use the vendor email and temporary password (123456) you were given.');
                }
            }
        } catch (err: any) {
            const msg = err?.message || 'An error occurred. Please try again.';
            const code = err?.code || '';
            if (code) console.warn('Login error:', { code, message: msg });
            const isInvalidCredential = code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found' || /invalid-credential|invalid credential|wrong password/i.test(msg);
            if (isInvalidCredential && loginType === 'staff') {
                setError('Invalid email or password for Staff. If you are a vendor, click the "Vendor" tab above. B2I Parent accounts must use Client Login on the main site.');
            } else {
                setError(msg);
            }
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
                    {loginType === 'staff' && (
                        <p className="text-xs text-text-tertiary mt-2">
                            Vendors: use the <strong>Vendor</strong> tab and sign in with your registered email and temporary password (123456).
                        </p>
                    )}
                </div>

                {/* Auth Form */}
                <form onSubmit={handleAuth} className="space-y-6">

                    {isRegistering && loginType === 'staff' && (
                        <>
                            {/* Name Input */}
                            <div>
                                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">
                                    Full Name
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-text-secondary/50 group-focus-within:text-primary transition-colors">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full pl-14 pr-6 py-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none transition-all text-text-primary text-lg placeholder:text-text-secondary/60"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Phone Input */}
                            <div>
                                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">
                                    Phone Number
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-text-secondary/50 group-focus-within:text-primary transition-colors">
                                        <PhoneIcon className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+91 98765 43210"
                                        className="w-full pl-14 pr-6 py-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none transition-all text-text-primary text-lg placeholder:text-text-secondary/60"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Role / Designation Select */}
                            <div>
                                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">
                                    Designation
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-text-secondary/50 group-focus-within:text-primary transition-colors">
                                        <BriefcaseIcon className="w-5 h-5" />
                                    </div>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as UserRole)}
                                        className="w-full pl-14 pr-6 py-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none transition-all text-text-primary text-lg appearance-none"
                                        required
                                    >
                                        {Object.values(UserRole).filter(r => r !== UserRole.SUPER_ADMIN).map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Region Input */}
                            <div>
                                <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">
                                    Project Region
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-text-secondary/50 group-focus-within:text-primary transition-colors">
                                        <MapPinIcon className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={region}
                                        onChange={(e) => setRegion(e.target.value)}
                                        placeholder="Enter Region (e.g. North, Bangalore, etc.)"
                                        className="w-full pl-14 pr-6 py-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none transition-all text-text-primary text-lg placeholder:text-text-secondary/60"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Email Input */}
                    <div>
                        <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">
                            {loginType === 'staff' ? (isRegistering ? 'Work Email' : 'Work Email') : 'Registered Email'}
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-text-secondary/50 group-focus-within:text-primary transition-colors">
                                <EnvelopeIcon className="w-5 h-5" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={loginType === 'staff' ? "email@makemyoffice.com" : "vendor@makemyoffice.com"}
                                className="w-full pl-14 pr-6 py-5 bg-background border-2 border-border rounded-2xl focus:border-primary outline-none transition-all text-text-primary text-lg placeholder:text-text-secondary/60"
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">
                            {isRegistering ? 'Create Password' : 'Passcode'}
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
                                autoComplete={isRegistering ? "new-password" : "current-password"}
                            />
                        </div>
                        {!isRegistering && loginType === 'staff' && (
                            <p className="text-[10px] uppercase tracking-widest text-text-secondary/40 mt-3 ml-1">Default password: 123456</p>
                        )}
                    </div>

                    {/* Status Messages */}
                    {error && (
                        <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-start space-x-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                            <ExclamationCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-800 dark:text-emerald-300">{success}</p>
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
                                {isRegistering ? 'Registering...' : 'Signing in...'}
                            </div>
                        ) : (
                            <>
                                {isRegistering ? 'Create Staff Account' : `Access ${loginType === 'staff' ? 'Dashboard' : 'Portal'}`}
                                <ArrowRightIcon className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    {loginType === 'staff' && (
                        <div className="text-center pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                    setError('');
                                    setSuccess('');
                                }}
                                className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:text-secondary transition-colors"
                            >
                                {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Create new account"}
                            </button>
                        </div>
                    )}
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
