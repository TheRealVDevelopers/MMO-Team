
import React, { useState } from 'react';
import Card from '../shared/Card';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon, CameraIcon, CheckIcon, XMarkIcon, PhoneIcon, MapPinIcon, PencilSquareIcon } from '../icons/IconComponents';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserRole } from '../../types';

const ProfileCard: React.FC = () => {
  const { currentUser, setCurrentUser, updateCurrentUserAvatar } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    region: currentUser?.region || '',
    currentTask: currentUser?.currentTask || ''
  });

  if (!currentUser) {
    return null;
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        try {
          // First update Firestore (this will throw if it fails)
          await updateUserInFirestore({ avatar: base64String });
          
          // Update local state immediately after successful Firestore update
          const updatedUser = {
            ...currentUser,
            avatar: base64String,
            lastUpdateTimestamp: new Date()
          };
          setCurrentUser(updatedUser);
          
          // Also update via context if available
          if (updateCurrentUserAvatar) {
            updateCurrentUserAvatar(base64String);
          }
          
          console.log('Avatar updated successfully in Firestore and local state');
          alert('Profile picture updated successfully!');
        } catch (error) {
          console.error('Failed to update avatar:', error);
          alert('Failed to update profile picture. Please try again.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleEdit = () => {
    setEditedData({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      region: currentUser.region || '',
      currentTask: currentUser.currentTask
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      region: currentUser.region || '',
      currentTask: currentUser.currentTask
    });
  };

  const updateUserInFirestore = async (updates: any) => {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    // Remove undefined values before updating
    const cleanUpdates: any = {};
    Object.keys(updates).forEach(key => {
      const value = updates[key];
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });

    // Add timestamp
    cleanUpdates.lastUpdateTimestamp = new Date();

    // Check if user ID exists
    if (!currentUser.id) {
      throw new Error('No user ID found');
    }

    try {
      const userRef = doc(db, 'staffUsers', currentUser.id);
      await updateDoc(userRef, cleanUpdates);
      console.log('User updated in Firestore successfully');
    } catch (error: any) {
      console.error('Error updating user in Firestore:', error);
      
      // Check if it's a "document not found" error (demo/mock user)
      if (error.code === 'not-found') {
        throw new Error('Profile updates are not available for demo accounts. Please create a real account.');
      }
      
      // Re-throw any other errors
      throw error;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving profile with data:', editedData);
      
      // Update in Firestore
      await updateUserInFirestore(editedData);

      // Update local state only after successful Firestore update
      const updatedUser = {
        ...currentUser,
        ...editedData,
        lastUpdateTimestamp: new Date()
      };
      setCurrentUser(updatedUser);

      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(`Failed to update profile: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-text-primary flex items-center">
          <UserCircleIcon className="w-6 h-6 mr-2" />
          My Profile
        </h2>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <PencilSquareIcon className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-border">
          <div className="relative">
            <img
              key={currentUser.avatar}
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-32 h-32 rounded-full ring-4 ring-primary/20 object-cover shadow-lg"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
              aria-hidden="true"
            />
            <button
              onClick={handleCameraClick}
              className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2.5 shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-surface transition-all transform hover:scale-110"
              aria-label="Change profile picture"
            >
              <CameraIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-4 text-xs bg-subtle-background text-text-secondary px-3 py-1.5 rounded-full font-medium">
            User ID: {currentUser.id}
          </p>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="flex items-center text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              <UserCircleIcon className="w-4 h-4 mr-1.5" />
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.name}
                onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-surface dark:bg-slate-700 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Enter your full name"
              />
            ) : (
              <p className="text-lg font-bold text-text-primary px-4 py-2.5 bg-subtle-background rounded-lg">
                {currentUser.name}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="flex items-center text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              Role / Position
            </label>
            <div className="px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-bold text-primary">{currentUser.role}</p>
              <p className="text-xs text-text-secondary mt-0.5">Cannot be changed</p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={editedData.email}
                onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-surface dark:bg-slate-700 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="your.email@example.com"
              />
            ) : (
              <p className="text-base text-text-primary px-4 py-2.5 bg-subtle-background rounded-lg">
                {currentUser.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              <PhoneIcon className="w-4 h-4 mr-1.5" />
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={editedData.phone}
                onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-surface dark:bg-slate-700 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="+91 XXXXX XXXXX"
              />
            ) : (
              <p className="text-base text-text-primary px-4 py-2.5 bg-subtle-background rounded-lg">
                {currentUser.phone || 'Not provided'}
              </p>
            )}
          </div>

          {/* Region */}
          {currentUser.region !== undefined && (
            <div>
              <label className="flex items-center text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                <MapPinIcon className="w-4 h-4 mr-1.5" />
                Region
              </label>
              {isEditing ? (
                <select
                  value={editedData.region}
                  onChange={(e) => setEditedData({ ...editedData, region: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-surface dark:bg-slate-700 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">Select Region</option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="Central">Central</option>
                </select>
              ) : (
                <p className="text-base text-text-primary px-4 py-2.5 bg-subtle-background rounded-lg">
                  {currentUser.region || 'Not assigned'}
                </p>
              )}
            </div>
          )}

          {/* Current Task */}
          <div>
            <label className="flex items-center text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Current Task / Status
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.currentTask}
                onChange={(e) => setEditedData({ ...editedData, currentTask: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-surface dark:bg-slate-700 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="What are you working on?"
              />
            ) : (
              <p className="text-base text-text-primary px-4 py-2.5 bg-subtle-background rounded-lg">
                {currentUser.currentTask || 'No current task'}
              </p>
            )}
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Additional Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-secondary text-xs mb-1">Active Tasks</p>
              <p className="font-bold text-text-primary">{currentUser.activeTaskCount || 0}</p>
            </div>
            <div>
              <p className="text-text-secondary text-xs mb-1">Overdue Tasks</p>
              <p className="font-bold text-red-600">{currentUser.overdueTaskCount || 0}</p>
            </div>
            <div>
              <p className="text-text-secondary text-xs mb-1">Attendance Status</p>
              <p className={`font-bold ${
                currentUser.attendanceStatus === 'CLOCKED_IN' ? 'text-green-600' :
                currentUser.attendanceStatus === 'ON_BREAK' ? 'text-yellow-600' :
                'text-gray-600'
              }`}>
                {currentUser.attendanceStatus?.replace(/_/g, ' ') || 'Not Available'}
              </p>
            </div>
            <div>
              <p className="text-text-secondary text-xs mb-1">Performance</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  currentUser.performanceFlag === 'green' ? 'bg-green-500' :
                  currentUser.performanceFlag === 'yellow' ? 'bg-yellow-500' :
                  currentUser.performanceFlag === 'red' ? 'bg-red-500' :
                  'bg-gray-300'
                }`} />
                <p className="font-bold text-text-primary capitalize">
                  {currentUser.performanceFlag || 'Not Rated'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Settings - User Selector Toggle */}
        {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN) && (
          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Admin Settings</h3>
            <div className="flex items-center justify-between p-4 bg-subtle-background rounded-lg">
              <div>
                <p className="font-bold text-text-primary">Toggle User Selector</p>
                <p className="text-xs text-text-secondary mt-1">
                  Show or hide the user switcher dropdown in the header
                </p>
              </div>
              <button
                onClick={async () => {
                  const newValue = !currentUser.showUserSelector;
                  try {
                    await updateUserInFirestore({ showUserSelector: newValue });
                    setCurrentUser({
                      ...currentUser,
                      showUserSelector: newValue,
                      lastUpdateTimestamp: new Date()
                    });
                  } catch (error: any) {
                    console.error('Error toggling user selector:', error);
                    alert(`Failed to update setting: ${error.message || 'Please try again.'}`);
                  }
                }}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  currentUser.showUserSelector ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-600'
                }`}
                role="switch"
                aria-checked={currentUser.showUserSelector || false}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    currentUser.showUserSelector ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-text-secondary text-center">
            Last updated: {new Date(currentUser.lastUpdateTimestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ProfileCard;