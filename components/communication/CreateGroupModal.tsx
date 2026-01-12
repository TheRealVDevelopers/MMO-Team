import React, { useState } from 'react';
import { User } from '../../types';
import { XMarkIcon, MagnifyingGlassIcon, CheckIcon } from '../icons/IconComponents';
import { useUsers } from '../../hooks/useUsers';

interface CreateGroupModalProps {
    onClose: () => void;
    onCreateGroup: (name: string, selectedUserIds: string[], memberDetails: Record<string, { name: string, avatar: string }>) => void;
    currentUserId?: string;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreateGroup, currentUserId }) => {
    const { users, loading } = useUsers();
    const [searchTerm, setSearchTerm] = useState('');
    const [groupName, setGroupName] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const filteredUsers = users.filter(user =>
        user.id !== currentUserId &&
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreate = () => {
        if (!groupName.trim() || selectedUserIds.length === 0) return;

        const memberDetails: Record<string, { name: string, avatar: string }> = {};
        users.forEach(u => {
            if (selectedUserIds.includes(u.id)) {
                memberDetails[u.id] = { name: u.name, avatar: u.avatar };
            }
        });

        // Add current user details too if needed by caller, but usually handled by caller or hook
        // We'll pass user details of SELECTED members
        onCreateGroup(groupName, selectedUserIds, memberDetails);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-lg font-bold text-text-primary">Create Group</h3>
                    <button onClick={onClose} className="p-2 hover:bg-subtle-background rounded-full transition-colors">
                        <XMarkIcon className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Group Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Project Alpha"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full px-4 py-2 bg-subtle-background border border-transparent focus:bg-surface focus:border-primary rounded-xl focus:ring-2 focus:ring-primary/20 text-sm transition-all outline-none"
                        />
                    </div>
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder="Add members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-subtle-background border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                    </div>
                </div>

                <div className="px-4 pb-2">
                    <p className="text-xs font-bold text-text-tertiary">{selectedUserIds.length} members selected</p>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin">
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
                            {filteredUsers.map(user => {
                                const isSelected = selectedUserIds.includes(user.id);
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => toggleUser(user.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group text-left border ${isSelected ? 'bg-primary/5 border-primary/30' : 'hover:bg-subtle-background border-transparent'}`}
                                    >
                                        <div className="relative">
                                            <img
                                                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            {isSelected && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center ring-2 ring-surface">
                                                    <CheckIcon className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm transition-colors ${isSelected ? 'text-primary' : 'text-text-primary'}`}>{user.name}</p>
                                            <p className="text-xs text-text-tertiary capitalize">{user.role}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border bg-subtle-background/30 rounded-b-2xl">
                    <button
                        onClick={handleCreate}
                        disabled={!groupName.trim() || selectedUserIds.length === 0}
                        className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                    >
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
