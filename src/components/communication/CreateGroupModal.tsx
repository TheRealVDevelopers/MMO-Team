import React, { useState } from 'react';
import { User } from '../../types';
import { XMarkIcon, MagnifyingGlassIcon, CheckIcon } from '../icons/IconComponents';
import { useUsers } from '../../hooks/useUsers';
import { cn } from '../dashboard/shared/DashboardUI';

interface CreateGroupModalProps {
    onClose: () => void;
    onCreateGroup: (name: string, selectedUserIds: string[], memberDetails: Record<string, { name: string, avatar: string }>) => void;
    currentUserId?: string;
}

import Modal from '../shared/Modal';

interface CreateGroupModalProps {
    isOpen: boolean; // Added isOpen prop
    onClose: () => void;
    onCreateGroup: (name: string, selectedUserIds: string[], memberDetails: Record<string, { name: string, avatar: string }>) => void;
    currentUserId?: string;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreateGroup, currentUserId }) => {
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

        onCreateGroup(groupName, selectedUserIds, memberDetails);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Group"
            size="md"
        >
            <div className="flex flex-col max-h-[80vh]">
                <div className="space-y-4 mb-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary px-1 mb-1.5 block">Group Identifier</label>
                        <input
                            type="text"
                            placeholder="e.g. Project Alpha Strike"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full px-4 py-3 bg-subtle-background/30 border border-border focus:border-primary rounded-xl focus:ring-4 focus:ring-primary/10 text-sm font-medium transition-all outline-none"
                        />
                    </div>
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        <input
                            type="text"
                            placeholder="Add mission assets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-subtle-background/50 border-none rounded-xl text-sm outline-none"
                        />
                    </div>
                </div>

                <div className="mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary px-1">{selectedUserIds.length} Assets Selected</p>
                </div>

                <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center p-8 text-text-tertiary italic">
                            No assets found
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredUsers.map(user => {
                                const isSelected = selectedUserIds.includes(user.id);
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => toggleUser(user.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all group text-left border",
                                            isSelected ? 'bg-primary/5 border-primary/30' : 'hover:bg-subtle-background border-transparent'
                                        )}
                                    >
                                        <div className="relative">
                                            <img
                                                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full object-cover border border-border"
                                            />
                                            {isSelected && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center ring-2 ring-surface">
                                                    <CheckIcon className="w-2.5 h-2.5" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className={cn("font-bold text-sm transition-colors", isSelected ? 'text-primary' : 'text-text-primary')}>{user.name}</p>
                                            <p className="text-[10px] font-black uppercase text-text-tertiary opacity-60 tracking-tighter">{user.role}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <button
                        onClick={handleCreate}
                        disabled={!groupName.trim() || selectedUserIds.length === 0}
                        className="w-full py-4 bg-primary hover:bg-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary/20"
                    >
                        Initialize Group
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateGroupModal;
