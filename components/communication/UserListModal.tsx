import React, { useState } from 'react';
import { User } from '../../types';
import { XMarkIcon, MagnifyingGlassIcon } from '../icons/IconComponents';
import { useUsers } from '../../hooks/useUsers';

interface UserListModalProps {
    onClose: () => void;
    onSelectUser: (user: User) => void;
    currentUserId?: string;
}

const UserListModal: React.FC<UserListModalProps> = ({ onClose, onSelectUser, currentUserId }) => {
    const { users, loading } = useUsers();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        user.id !== currentUserId &&
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-lg font-bold text-text-primary">New Message</h3>
                    <button onClick={onClose} className="p-2 hover:bg-subtle-background rounded-full transition-colors">
                        <XMarkIcon className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                <div className="p-4 border-b border-border">
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

                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-text-tertiary">
                            <p>No users found</p>
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
                                        className="w-10 h-10 rounded-full object-cover"
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
        </div>
    );
};

export default UserListModal;
