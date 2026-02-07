import React, { useState } from 'react';
import { changeClientPassword } from '../../services/authService';
import { LockClosedIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ForcePasswordResetModalProps {
    uid: string; // Not used if we use auth.currentUser, but good for explicit prop
    onSuccess: () => void;
}

const ForcePasswordResetModal: React.FC<ForcePasswordResetModalProps> = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            // Using the updated signature: (newPassword, currentPassword?)
            // We omit currentPassword as this is a forced reset on a fresh session
            await changeClientPassword(password);

            onSuccess();
        } catch (err: any) {
            console.error(err);
            // If requires recent login, we might fail.
            setError(err.message || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    // I need to fix authService first because I made it require Current Password.
    // I'll leave this unimplemented logic-wise and fix authService in next step or use a workaround.
    // Workaround: I'll use a specific `forcePasswordChange` function in authService.

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <LockClosedIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Security Update Required</h2>
                    <p className="text-gray-500 mt-2">Please update your password to continue accessing your dashboard.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 
                      Note: If using `changeClientPassword` from Step 36, I need "Current Password".
                      I will add "Current Password" field just in case, or fix the service.
                      Decision: Fix the service to `forceChangePassword(newPassword)` which relies on active session.
                   */}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all"
                            placeholder="Min. 6 characters"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all"
                            placeholder="Re-enter password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                            <ExclamationCircleIcon className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-4">
                        This is a one-time security verification.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ForcePasswordResetModal;
