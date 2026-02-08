import React, { useState } from 'react';
import { XMarkIcon, UserPlusIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../../../types';
import { createStaffAccountFromApproval, DEFAULT_STAFF_PASSWORD } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';

interface AddTeamMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: UserRole.EXECUTION_TEAM as UserRole,
        region: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Validate inputs
            if (!formData.name.trim()) throw new Error('Name is required');
            if (!formData.email.trim()) throw new Error('Email is required');
            if (!formData.email.includes('@')) throw new Error('Invalid email format');

            // Use the password from the form or default
            const password = formData.password.trim() || DEFAULT_STAFF_PASSWORD;

            await createStaffAccountFromApproval(
                formData.email.trim(),
                password,
                formData.name.trim(),
                formData.role,
                formData.phone.trim(),
                formData.region.trim() || undefined,
                currentUser?.organizationId
            );

            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose();
                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    role: UserRole.EXECUTION_TEAM,
                    region: '',
                });
                setSuccess(false);
            }, 1500);
        } catch (err: any) {
            console.error('[AddTeamMemberModal] Error creating user:', err);
            // Handle common Firebase Auth errors
            if (err.message?.includes('email-already-in-use')) {
                setError('This email is already registered. Please use a different email.');
            } else if (err.message?.includes('invalid-email')) {
                setError('The email format is invalid.');
            } else if (err.message?.includes('weak-password')) {
                setError('Password is too weak. Please use at least 6 characters.');
            } else {
                setError(err.message || 'Failed to create team member');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Get available roles (excluding Super Admin)
    const availableRoles = Object.values(UserRole).filter(
        role => role !== UserRole.SUPER_ADMIN
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-surface rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-border"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border/40 bg-subtle-background/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <UserPlusIcon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif font-black text-text-primary">Add Team Member</h2>
                                    <p className="text-xs text-text-tertiary">Create a new staff account</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-subtle-background transition-all"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Success State */}
                    {success ? (
                        <div className="p-8 flex flex-col items-center justify-center text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4"
                            >
                                <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                            </motion.div>
                            <h3 className="text-lg font-bold text-text-primary mb-1">Team Member Created!</h3>
                            <p className="text-sm text-text-secondary">
                                {formData.name} has been added to the team.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-xl"
                                >
                                    <ExclamationCircleIcon className="w-5 h-5 text-error flex-shrink-0" />
                                    <p className="text-sm text-error">{error}</p>
                                </motion.div>
                            )}

                            {/* Name */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary block mb-1.5">
                                    Full Name <span className="text-error">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                    className="w-full px-4 py-3 bg-subtle-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary block mb-1.5">
                                    Work Email <span className="text-error">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="name@company.com"
                                    className="w-full px-4 py-3 bg-subtle-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary block mb-1.5">
                                    Password <span className="text-text-tertiary text-[8px]">(Leave blank for default)</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-subtle-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                />
                                <p className="text-[10px] text-text-tertiary mt-1">
                                    Default password: <code className="bg-subtle-background px-1 rounded">{DEFAULT_STAFF_PASSWORD}</code>
                                </p>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary block mb-1.5">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 9876543210"
                                    className="w-full px-4 py-3 bg-subtle-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary block mb-1.5">
                                    Role / Designation <span className="text-error">*</span>
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-subtle-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                    required
                                >
                                    {availableRoles.map(role => (
                                        <option key={role} value={role}>
                                            {role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Region */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary block mb-1.5">
                                    Region / Location
                                </label>
                                <input
                                    type="text"
                                    name="region"
                                    value={formData.region}
                                    onChange={handleChange}
                                    placeholder="e.g., Mumbai, Delhi, etc."
                                    className="w-full px-4 py-3 bg-subtle-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-border/40">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 border border-border rounded-xl text-sm font-bold text-text-secondary hover:bg-subtle-background transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlusIcon className="w-4 h-4" />
                                            Create Member
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddTeamMemberModal;
