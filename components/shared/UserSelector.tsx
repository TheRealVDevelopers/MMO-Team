import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import { User } from '../../types';
import { useNavigate } from 'react-router-dom';

const UserSelector: React.FC = () => {
    const { currentUser, setCurrentUser } = useAuth();
    const { users, loading } = useUsers();
    const navigate = useNavigate();

    const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = e.target.value;
        const selectedUser = users.find(u => u.id === userId);
        if (selectedUser) {
            setCurrentUser(selectedUser);
            navigate('/'); // Go to dashboard of the new user
        }
    };

    if (loading) return <div className="text-[10px] text-text-tertiary">Loading users...</div>;

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="user-switcher" className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                Testing As:
            </label>
            <select
                id="user-switcher"
                value={currentUser?.id || ''}
                onChange={handleUserChange}
                className="bg-background border border-border rounded-lg px-2 py-1 text-xs font-bold text-text-primary focus:border-primary focus:ring-0 transition-colors"
            >
                {users.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                    </option>
                ))}
            </select>
        </div>
    );
};

export default UserSelector;
