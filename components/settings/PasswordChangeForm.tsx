import React, { useState } from 'react';
import Card from '../shared/Card';
import { useAuth } from '../../context/AuthContext';
import { changeStaffPassword, changeClientPassword } from '../../services/authService';
import { CogIcon, ExclamationCircleIcon } from '../icons/IconComponents';

const PasswordChangeForm: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      if (currentUser?.role) {
        // Staff user
        await changeStaffPassword(currentPassword, newPassword);
      } else {
        // Client user - we would need projectId in context for this
        // For now, we'll just show a message that this is for staff only
        setError('Password change is only available for staff accounts');
        return;
      }
      
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-bold text-text-primary flex items-center">
        <CogIcon className="w-6 h-6 mr-2" />
        Change Password
      </h2>
      
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-text-secondary mb-1">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border dark:border-border rounded-md bg-surface dark:bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter current password"
          />
        </div>
        
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-text-secondary mb-1">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border dark:border-border rounded-md bg-surface dark:bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter new password"
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border dark:border-border rounded-md bg-surface dark:bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Confirm new password"
          />
        </div>
        
        {error && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-300">Password changed successfully!</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70"
        >
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </Card>
  );
};

export default PasswordChangeForm;