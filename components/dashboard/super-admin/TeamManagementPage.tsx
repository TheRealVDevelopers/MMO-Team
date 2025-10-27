
import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { USERS } from '../../../constants';
import { User, UserRole } from '../../../types';
import { ChevronRightIcon, UsersIcon, ArrowLeftIcon } from '../../icons/IconComponents';
import TeamMemberDetailView from './TeamMemberDetailView';
import PlaceholderDashboard from '../PlaceholderDashboard';

const TeamManagementPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(USERS[1]); // Default to first non-admin

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
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentPage('overview')}
                    className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <h2 className="text-2xl font-bold text-text-primary">Team Management</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                <div className="lg:col-span-1">
                    <Card className="h-full flex flex-col">
                        <div className="sm:flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">All Members</h3>
                        </div>
                         <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-surface"
                            />
                            <select 
                                value={roleFilter} 
                                onChange={(e) => setRoleFilter(e.target.value as any)}
                                className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-surface"
                            >
                                <option value="all">All Roles</option>
                                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>

                        <div className="flex-grow overflow-y-auto -mr-4 pr-4">
                            <ul role="list" className="divide-y divide-border">
                                {filteredUsers.map((user) => (
                                    <li key={user.id} onClick={() => setSelectedUser(user)} className={`py-3 sm:py-4 cursor-pointer hover:bg-subtle-background px-2 rounded-md ${selectedUser?.id === user.id ? 'bg-primary-subtle-background' : ''}`}>
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                <img className="w-8 h-8 rounded-full" src={user.avatar} alt={user.name} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                                                <p className="text-sm text-text-secondary truncate">{user.role}</p>
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
                <div className="lg:col-span-2">
                    {selectedUser ? (
                        <TeamMemberDetailView user={selectedUser} />
                    ) : (
                        <PlaceholderDashboard 
                            role="Team Member Details"
                            message="Select a team member to view their detailed profile, work history, and attendance."
                            subMessage=""
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamManagementPage;
