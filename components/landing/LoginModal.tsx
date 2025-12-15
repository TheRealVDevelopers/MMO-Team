
import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { USERS } from '../../constants';
import { User, UserRole } from '../../types';
import { BuildingOfficeIcon, UserCircleIcon, ChevronRightIcon } from '../icons/IconComponents';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (user: User) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    
    const groups = [
        { 
            name: 'Management', 
            roles: [UserRole.SUPER_ADMIN, UserRole.SALES_GENERAL_MANAGER],
            icon: '👑',
            color: 'from-kurchi-gold-500 to-kurchi-gold-600'
        },
        { 
            name: 'Sales Team', 
            roles: [UserRole.SALES_TEAM_MEMBER],
            icon: '💼',
            color: 'from-blue-500 to-blue-600'
        },
        { 
            name: 'Design & Quotation', 
            roles: [UserRole.DRAWING_TEAM, UserRole.QUOTATION_TEAM],
            icon: '🎨',
            color: 'from-purple-500 to-purple-600'
        },
        { 
            name: 'Operations', 
            roles: [UserRole.SITE_ENGINEER, UserRole.PROCUREMENT_TEAM, UserRole.EXECUTION_TEAM],
            icon: '⚙️',
            color: 'from-orange-500 to-orange-600'
        },
        { 
            name: 'Finance', 
            roles: [UserRole.ACCOUNTS_TEAM],
            icon: '💰',
            color: 'from-green-500 to-green-600'
        },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="5xl">
            <div className="space-y-8 p-4">
                {/* Enhanced Header */}
                <div className="text-center space-y-4 pb-6 border-b border-border">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-kurchi-gold-500 to-kurchi-espresso-900 rounded-2xl flex items-center justify-center shadow-luxury">
                            <BuildingOfficeIcon className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-kurchi-espresso-900 mb-2">Employee Portal</h2>
                        <p className="text-base text-text-secondary font-light">
                            Select your department below to access your workspace
                        </p>
                    </div>
                </div>

                {!selectedGroup ? (
                    /* Department Selection View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups.map(group => {
                            const groupUsers = USERS.filter(u => group.roles.includes(u.role));
                            if (groupUsers.length === 0) return null;

                            return (
                                <button
                                    key={group.name}
                                    onClick={() => setSelectedGroup(group.name)}
                                    className="group relative overflow-hidden bg-white rounded-2xl border-2 border-border hover:border-kurchi-gold-500 transition-all duration-300 hover:shadow-luxury p-6 text-left"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${group.color} flex items-center justify-center text-2xl shadow-md`}>
                                            {group.icon}
                                        </div>
                                        <ChevronRightIcon className="w-5 h-5 text-text-secondary group-hover:text-kurchi-gold-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-kurchi-espresso-900 mb-2 group-hover:text-kurchi-gold-600 transition-colors">
                                            {group.name}
                                        </h3>
                                        <p className="text-sm text-text-secondary font-light">
                                            {groupUsers.length} {groupUsers.length === 1 ? 'member' : 'members'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    /* User Selection View */
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setSelectedGroup(null)}
                                className="flex items-center space-x-2 text-sm text-text-secondary hover:text-kurchi-gold-600 transition-colors"
                            >
                                <ChevronRightIcon className="w-4 h-4 rotate-180" />
                                <span>Back to departments</span>
                            </button>
                        </div>

                        <div>
                            <h3 className="text-xl font-serif font-bold text-kurchi-espresso-900 mb-6 flex items-center">
                                <span className="mr-3">{groups.find(g => g.name === selectedGroup)?.icon}</span>
                                {selectedGroup}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groups
                                    .find(g => g.name === selectedGroup)
                                    ?.roles.flatMap(role => USERS.filter(u => u.role === role))
                                    .map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => onLogin(user)}
                                            className="group flex items-center p-4 rounded-xl border-2 border-border bg-white hover:border-kurchi-gold-500 hover:shadow-lg transition-all duration-300 text-left"
                                        >
                                            <div className="relative">
                                                <img 
                                                    src={user.avatar} 
                                                    alt={user.name} 
                                                    className="w-14 h-14 rounded-full ring-2 ring-border group-hover:ring-kurchi-gold-500 transition-all" 
                                                />
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <p className="text-base font-bold text-kurchi-espresso-900 group-hover:text-kurchi-gold-600 transition-colors mb-1">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-text-secondary font-light">
                                                    {user.role}
                                                </p>
                                            </div>
                                            <ChevronRightIcon className="w-5 h-5 text-text-secondary group-hover:text-kurchi-gold-500 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default LoginModal;
