import React, { useState } from 'react';
import { User } from '../../types';
import { XMarkIcon, MagnifyingGlassIcon } from '../icons/IconComponents';
import { useUsers } from '../../hooks/useUsers';

interface UserListModalProps {
    onClose: () => void;
    onSelectUser: (user: User) => void;
    currentUserId?: string;
}

import Modal from '../shared/Modal';

interface UserListModalProps {
    isOpen: boolean; // Added isOpen prop
    onClose: () => void;
    onSelectUser: (user: User) => void;
    currentUserId?: string;
}

const UserListModal: React.FC<UserListModalProps> = ({ isOpen, onClose, onSelectUser, currentUserId }) => {
    const { users, loading } = useUsers();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        user.id !== currentUserId &&
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="New Message"
            size="md"
        >
            <div className="flex flex-col max-h-[70vh]">
                <div className="mb-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            className="w-full pl-9 pr-4 py-2 bg-subtle-background border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center p-8 text-text-tertiary italic">
                            No users found matching "{searchTerm}"
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => onSelectUser(user)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-subtle-background rounded-xl transition-all group text-left"
                                >
                                    <img
                                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full object-cover border border-border"
                                    />
                                    <div>
                                        <p className="font-bold text-text-primary text-sm group-hover:text-primary transition-colors">{user.name}</p>
                                        <p className="text-xs text-text-tertiary capitalize">{user.role}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default UserListModal;
