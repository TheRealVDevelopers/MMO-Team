import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { USERS } from '../../../constants';
import { User, UserRole } from '../../../types';
import { ChevronRightIcon } from '../../icons/IconComponents';

const TeamManagementPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const filteredUsers = useMemo(() => {
        return USERS.filter(user =>
            (user.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (roleFilter === 'all' || user.role === roleFilter)
        );
    }, [searchTerm, roleFilter]);
    
    const timeSince = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Team Management</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <div className="sm:flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">All Team Members</h3>
                             <div className="flex space-x-2 mt-2 sm:mt-0">
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full sm:w-auto px-3 py-1.5 border border-border rounded-md text-sm bg-surface"
                                />
                                <select 
                                    value={roleFilter} 
                                    onChange={(e) => setRoleFilter(e.target.value as any)}
                                    className="px-3 py-1.5 border border-border rounded-md text-sm bg-surface"
                                >
                                    <option value="all">All Roles</option>
                                    {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flow-root">
                            <ul role="list" className="divide-y divide-border">
                                {filteredUsers.map((user) => (
                                    <li key={user.id} onClick={() => setSelectedUser(user)} className="py-3 sm:py-4 cursor-pointer hover:bg-subtle-background px-2 rounded-md">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                <img className="w-8 h-8 rounded-full" src={user.avatar} alt={user.name} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                                                <p className="text-sm text-text-secondary truncate">{user.role}</p>
                                            </div>
                                            <div className="flex-1 min-w-0 text-left hidden md:block">
                                                <p className="text-sm text-text-primary truncate" title={user.currentTask}>
                                                    <span className="font-medium">Status:</span> {user.currentTask}
                                                </p>
                                                <p className="text-xs text-text-secondary truncate">Updated {timeSince(user.lastUpdateTimestamp)}</p>
                                            </div>
                                            <div className="inline-flex items-center text-base font-semibold text-text-primary">
                                                <ChevronRightIcon className="w-5 h-5 text-text-secondary" />
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        {selectedUser ? (
                            <div>
                                <h3 className="text-lg font-bold">Member Details</h3>
                                <div className="mt-4 flex flex-col items-center text-center">
                                    <img className="w-20 h-20 rounded-full" src={selectedUser.avatar} alt={selectedUser.name} />
                                    <h4 className="mt-2 text-md font-bold text-text-primary">{selectedUser.name}</h4>
                                    <p className="text-sm text-text-secondary">{selectedUser.role}</p>
                                </div>
                                <div className="mt-4 border-t border-border pt-4 text-sm space-y-3">
                                    <h5 className="font-bold">Latest Update:</h5>
                                    <div className="p-2 bg-subtle-background rounded-md">
                                        <p className="italic">"{selectedUser.currentTask}"</p>
                                        <p className="text-xs text-right text-text-secondary mt-1"> - {timeSince(selectedUser.lastUpdateTimestamp)}</p>
                                    </div>
                                    <button className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-md hover:opacity-90">Assign Task</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-text-secondary">Select a team member to view details.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TeamManagementPage;
