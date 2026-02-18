import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, updatePassword, signOut } from 'firebase/auth'; // Import signOut
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { FIRESTORE_COLLECTIONS } from '../../constants';
import { UserRole } from '../../types';

const SetPasswordPage: React.FC = () => {
    const { currentUser, logout } = useAuth(); // Use logout from context
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (user) {
                // 1. Update Password in Firebase Auth
                await updatePassword(user, password);

                // 2. Clear 'mustChangePassword' flag in Firestore
                if (currentUser?.id) {
                    const userRef = doc(db, FIRESTORE_COLLECTIONS.STAFF_USERS, currentUser.id);
                    await updateDoc(userRef, {
                        mustChangePassword: false
                    });
                }

                alert('Password updated successfully! Please login with your new password.');

                // 3. Logout using context function ensuring clean state
                await logout(); // This handles signOut and state cleanup

                // 4. Redirect to login
                navigate('/login');
            } else {
                setError('No authenticated user found.');
            }
        } catch (err: any) {
            console.error("Error updating password:", err);
            setError(err.message || 'Failed to update password. You may need to re-login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-border">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Set New Password</h1>
                    <p className="text-text-secondary">
                        For security reasons, you must change your password before continuing.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="Enter new password"
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="Confirm new password"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-primary hover:bg-secondary text-white font-bold rounded-lg transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Updating Password...' : 'Update Password'}
                    </button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => logout()}
                            className="text-sm text-text-tertiary hover:text-text-primary underline"
                        >
                            Cancel & Logout
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SetPasswordPage;
