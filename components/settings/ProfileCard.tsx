
import React from 'react';
import Card from '../shared/Card';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon, CameraIcon } from '../icons/IconComponents';

const ProfileCard: React.FC = () => {
  const { currentUser, updateCurrentUserAvatar } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!currentUser) {
    return null;
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (updateCurrentUserAvatar) {
            updateCurrentUserAvatar(base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };


  return (
    <Card>
      <h2 className="text-lg font-bold text-text-primary flex items-center">
        <UserCircleIcon className="w-6 h-6 mr-2" />
        My Profile
      </h2>
      <div className="mt-4 flex flex-col items-center text-center">
        <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-24 h-24 rounded-full ring-4 ring-primary/20 object-cover"
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
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 shadow-md hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-surface"
                aria-label="Change profile picture"
            >
                <CameraIcon className="w-4 h-4" />
            </button>
        </div>
        <h3 className="mt-4 text-xl font-bold text-text-primary">{currentUser.name}</h3>
        <p className="text-sm text-text-secondary">{currentUser.role}</p>
        <p className="mt-2 text-xs bg-subtle-background text-text-secondary px-2 py-1 rounded-md">
          User ID: {currentUser.id}
        </p>
      </div>
    </Card>
  );
};

export default ProfileCard;