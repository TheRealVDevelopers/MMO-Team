import React, { useState, useMemo } from 'react';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    ChevronDownIcon,
    UserCircleIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    CheckCircleIcon,
    XCircleIcon,
    PlusIcon,
    EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { useUsers } from '../../../hooks/useUsers';
import { User, UserRole, Project } from '../../../types';
import { useProjects } from '../../../hooks/useProjects';

type ExecutionRole = 'all' | 'project_head' | 'site_engineer' | 'drawing_team' | 'execution_team';

const ExecutionTeamManagementPage: React.FC = () => {
    const { users, loading: usersLoading, addUser, updateUserStatus } = useUsers();
    const { projects } = useProjects();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<ExecutionRole>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New Member Form State
    const [newMember, setNewMember] = useState<Partial<User>>({
        name: '',
        email: '',
        phone: '',
        role: UserRole.SITE_ENGINEER,
        region: ''
    });

    // Filter execution team members
    const executionTeamMembers = useMemo(() => {
        return users.filter(user =>
            user.id && ( // Ensure user has ID
                user.role === UserRole.PROJECT_HEAD ||
                user.role === UserRole.SITE_ENGINEER ||
                user.role === UserRole.DRAWING_TEAM ||
                user.role === UserRole.EXECUTION_TEAM
            )
        );
    }, [users]);

    // Apply filters
    const filteredMembers = useMemo(() => {
        return executionTeamMembers.filter(member => {
            // Search filter
            const matchesSearch = searchQuery === '' ||
                member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.email.toLowerCase().includes(searchQuery.toLowerCase());

            // Role filter
            let matchesRole = roleFilter === 'all';
            if (roleFilter === 'project_head') matchesRole = member.role === UserRole.PROJECT_HEAD;
            if (roleFilter === 'execution_team') matchesRole = member.role === UserRole.EXECUTION_TEAM;
            if (roleFilter === 'site_engineer') matchesRole = member.role === UserRole.SITE_ENGINEER;
            if (roleFilter === 'drawing_team') matchesRole = member.role === UserRole.DRAWING_TEAM;

            return matchesSearch && matchesRole;
        });
    }, [executionTeamMembers, searchQuery, roleFilter]);

    // Get assigned projects count for a member
    const getAssignedProjectsCount = (userId: string) => {
        return projects.filter(p =>
            p.projectHeadId === userId ||
            p.assignedTeam?.execution?.includes(userId) ||
            p.assignedTeam?.site_engineer === userId ||
            p.assignedTeam?.drawing === userId
        ).length;
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!newMember.name || !newMember.email || !newMember.role) {
                alert('Please fill in required fields');
                return;
            }

            await addUser({
                name: newMember.name,
                email: newMember.email,
                role: newMember.role as UserRole,
                phone: newMember.phone || '',
                region: newMember.region || '',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newMember.name)}&background=random`,
                activeTaskCount: 0,
                attendanceStatus: 'CLOCKED_OUT',
                currentTask: '',
                lastUpdateTimestamp: new Date()
            } as any);

            setIsAddModalOpen(false);
            setNewMember({ name: '', email: '', phone: '', role: UserRole.SITE_ENGINEER, region: '' });
        } catch (error) {
            console.error('Failed to add member:', error);
            alert('Failed to add member');
        }
    };

    const handleAction = async (userId: string, action: 'activate' | 'deactivate' | 'remove') => {
        // Implementation for status update
        if (action === 'activate' || action === 'deactivate') {
            await updateUserStatus(userId, action === 'activate');
        } else {
            console.log('Remove user', userId);
            alert('Remove user feature pending backend implementation');
        }
    };

    // Export to CSV
    const handleExport = () => {
        const headers = ['Name', 'Role', 'Email', 'Phone', 'Region', 'Assigned Projects'];
        const rows = filteredMembers.map(m => [
            m.name,
            m.role,
            m.email,
            m.phone,
            m.region || '',
            getAssignedProjectsCount(m.id).toString()
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'execution_team.csv';
        a.click();
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case UserRole.PROJECT_HEAD: return 'bg-primary-subtle text-primary';
            case UserRole.EXECUTION_TEAM: return 'bg-purple-100 text-purple-700';
            case UserRole.SITE_ENGINEER: return 'bg-success-subtle text-success';
            case UserRole.DRAWING_TEAM: return 'bg-warning-subtle text-warning';
            default: return 'bg-subtle-background text-text-secondary';
        }
    };

    const getPerformanceColor = (flag?: string) => {
        switch (flag) {
            case 'green': return 'bg-success';
            case 'yellow': return 'bg-warning';
            case 'red': return 'bg-error';
            default: return 'bg-text-tertiary';
        }
    };

    if (usersLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-subtle-background min-h-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Execution Team</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Manage team members, assignments, and performance
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-text-primary hover:bg-subtle-background transition-colors"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Member
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="text-2xl font-bold text-text-primary">{executionTeamMembers.length}</div>
                    <div className="text-sm text-text-secondary">Total Members</div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="text-2xl font-bold text-primary">
                        {executionTeamMembers.filter(m => m.role === UserRole.PROJECT_HEAD || m.role === UserRole.EXECUTION_TEAM).length}
                    </div>
                    <div className="text-sm text-text-secondary">Execution Leads</div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="text-2xl font-bold text-success">
                        {executionTeamMembers.filter(m => m.role === UserRole.SITE_ENGINEER).length}
                    </div>
                    <div className="text-sm text-text-secondary">Site Engineers</div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="text-2xl font-bold text-warning">
                        {executionTeamMembers.filter(m => m.role === UserRole.DRAWING_TEAM).length}
                    </div>
                    <div className="text-sm text-text-secondary">Drawing Team</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-surface p-4 rounded-xl border border-border">
                {/* Search */}
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-subtle-background border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                {/* Role Filter */}
                <div className="relative">
                    <FunnelIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as ExecutionRole)}
                        className="pl-9 pr-8 py-2 bg-subtle-background border border-border rounded-lg text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="all">All Roles</option>
                        <option value="execution_team">Execution Team</option>
                        <option value="project_head">Execution Lead (Legacy)</option>
                        <option value="site_engineer">Site Engineer</option>
                        <option value="drawing_team">Drawing Team</option>
                    </select>
                    <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                </div>
            </div>

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map(member => (
                    <div key={member.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-all relative group">
                        {/* Action Menu (Simplified for now) */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MenuDropdown userId={member.id} onAction={handleAction} />
                        </div>

                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="relative">
                                {member.avatar ? (
                                    <img src={member.avatar} alt={member.name} className="w-14 h-14 rounded-full object-cover" />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-primary-subtle flex items-center justify-center text-primary text-xl font-bold">
                                        {member.name.charAt(0)}
                                    </div>
                                )}
                                {/* Performance indicator */}
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface ${getPerformanceColor(member.performanceFlag)}`} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-text-primary truncate">{member.name}</h3>
                                    {member.attendanceStatus === 'CLOCKED_IN' ? (
                                        <CheckCircleIcon className="w-4 h-4 text-success flex-shrink-0" />
                                    ) : (
                                        <XCircleIcon className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                                    )}
                                </div>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                                    {member.role === UserRole.PROJECT_HEAD ? 'EXECUTION LEAD' : member.role}
                                </span>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="mt-4 space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-text-secondary">
                                <EnvelopeIcon className="w-4 h-4 text-text-tertiary" />
                                <span className="truncate">{member.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-secondary">
                                <PhoneIcon className="w-4 h-4 text-text-tertiary" />
                                <span>{member.phone}</span>
                            </div>
                            {member.region && (
                                <div className="flex items-center gap-2 text-text-secondary">
                                    <MapPinIcon className="w-4 h-4 text-text-tertiary" />
                                    <span>{member.region}</span>
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-lg font-bold text-text-primary">{getAssignedProjectsCount(member.id)}</div>
                                <div className="text-xs text-text-tertiary">Assigned Projects</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-text-primary">{member.activeTaskCount || 0}</div>
                                <div className="text-xs text-text-tertiary">Active Tasks</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredMembers.length === 0 && (
                <div className="text-center py-12 bg-surface rounded-xl border border-border">
                    <UserCircleIcon className="w-12 h-12 mx-auto text-text-tertiary mb-3" />
                    <p className="text-text-secondary">No team members found</p>
                    <p className="text-sm text-text-tertiary mt-1">Try adjusting your filters</p>
                </div>
            )}

            {/* Add Member Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface rounded-2xl border border-border p-6 w-full max-w-lg shadow-xl">
                        <h2 className="text-xl font-bold text-text-primary mb-4">Add Team Member</h2>
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg bg-surface text-text-primary"
                                    value={newMember.name}
                                    onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full p-2.5 border border-border rounded-lg bg-surface text-text-primary"
                                        value={newMember.email}
                                        onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        className="w-full p-2.5 border border-border rounded-lg bg-surface text-text-primary"
                                        value={newMember.phone}
                                        onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                                    <select
                                        className="w-full p-2.5 border border-border rounded-lg bg-surface text-text-primary"
                                        value={newMember.role}
                                        onChange={e => setNewMember({ ...newMember, role: e.target.value as UserRole })}
                                    >
                                        <option value={UserRole.SITE_ENGINEER}>Site Engineer</option>
                                        <option value={UserRole.DRAWING_TEAM}>Drawing Team</option>
                                        <option value={UserRole.EXECUTION_TEAM}>Execution Team</option>
                                        <option value={UserRole.PROJECT_HEAD}>Execution Lead (Legacy)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Region</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 border border-border rounded-lg bg-surface text-text-primary"
                                        value={newMember.region}
                                        onChange={e => setNewMember({ ...newMember, region: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-text-secondary hover:bg-subtle-background rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                >
                                    Add Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const MenuDropdown: React.FC<{ userId: string; onAction: (id: string, action: 'activate' | 'deactivate' | 'remove') => void }> = ({ userId, onAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-full hover:bg-subtle-background text-text-tertiary hover:text-text-primary"
            >
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-surface border border-border rounded-lg shadow-lg z-10 py-1">
                    <button
                        onClick={() => { onAction(userId, 'activate'); setIsOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-subtle-background"
                    >
                        Activate
                    </button>
                    <button
                        onClick={() => { onAction(userId, 'deactivate'); setIsOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-subtle-background"
                    >
                        Deactivate
                    </button>
                    <button
                        onClick={() => { onAction(userId, 'remove'); setIsOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-error-subtle/20"
                    >
                        Remove
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExecutionTeamManagementPage;
