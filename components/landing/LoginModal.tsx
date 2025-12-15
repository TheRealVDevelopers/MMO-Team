
import React from 'react';
import Modal from '../shared/Modal';
import { USERS } from '../../constants';
import { User, UserRole } from '../../types';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (user: User) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
    
    const groups = [
        { name: 'Management', roles: [UserRole.SUPER_ADMIN, UserRole.SALES_GENERAL_MANAGER] },
        { name: 'Sales Team', roles: [UserRole.SALES_TEAM_MEMBER] },
        { name: 'Design & Quotation', roles: [UserRole.DRAWING_TEAM, UserRole.QUOTATION_TEAM] },
        { name: 'Operations', roles: [UserRole.SITE_ENGINEER, UserRole.PROCUREMENT_TEAM, UserRole.EXECUTION_TEAM] },
        { name: 'Finance', roles: [UserRole.ACCOUNTS_TEAM] },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Employee Portal Login" size="4xl">
            <div className="space-y-6 p-2">
                <p className="text-sm text-text-secondary">
                    Select a team member profile to access their specific dashboard and workflow.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map(group => {
                        const groupUsers = USERS.filter(u => group.roles.includes(u.role));
                        if (groupUsers.length === 0) return null;

                        return (
                            <div key={group.name} className="space-y-3">
                                <h4 className="text-sm font-bold text-primary uppercase tracking-wider border-b border-border pb-1">
                                    {group.name}
                                </h4>
                                <div className="space-y-2">
                                    {groupUsers.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => onLogin(user)}
                                            className="w-full flex items-center p-2 rounded-lg border border-border bg-surface hover:border-primary hover:shadow-md transition-all duration-200 text-left group"
                                        >
                                            <img 
                                                src={user.avatar} 
                                                alt={user.name} 
                                                className="w-10 h-10 rounded-full ring-2 ring-transparent group-hover:ring-primary/20 transition-all" 
                                            />
                                            <div className="ml-3">
                                                <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-text-secondary truncate max-w-[180px]">
                                                    {user.role}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};

export default LoginModal;
