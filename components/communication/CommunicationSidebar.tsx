import React from 'react';
import { ChatChannel, ChannelType } from '../../types';
import { HashtagIcon, AtSymbolIcon, QuestionMarkCircleIcon } from '../icons/IconComponents';
import { useAuth } from '../../context/AuthContext';
import { USERS } from '../../constants';

interface CommunicationSidebarProps {
    channels: ChatChannel[];
    selectedChannelId: string;
    onSelectChannel: (channelId: string) => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center p-2 text-sm font-medium rounded-md transition-colors duration-150 text-left ${
            isActive 
            ? 'bg-primary/10 text-primary' 
            : 'text-text-secondary hover:bg-subtle-background hover:text-text-primary'
        }`}
    >
        {icon}
        <span className="ml-2 truncate">{label}</span>
    </button>
);

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="px-2 mt-4 mb-1 text-xs font-bold text-text-secondary uppercase tracking-wider">{children}</h3>
);


const CommunicationSidebar: React.FC<CommunicationSidebarProps> = ({ channels, selectedChannelId, onSelectChannel }) => {
    const { currentUser } = useAuth();
    
    const workStreams = channels.filter(c => c.type === ChannelType.WORK_STREAM && !c.isProject);
    const projectStreams = channels.filter(c => c.type === ChannelType.WORK_STREAM && c.isProject);
    const directMessages = USERS.filter(u => u.id !== currentUser?.id);
    const quickClarifyChannel = channels.find(c => c.type === ChannelType.QUICK_CLARIFY);

    return (
        <aside className="w-64 bg-surface border-r border-border flex-shrink-0 flex flex-col" aria-label="Communication Sidebar">
            <div className="h-16 flex items-center px-4 border-b border-border flex-shrink-0">
                <h2 className="text-lg font-bold text-text-primary">Communication</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                
                {quickClarifyChannel && (
                     <NavItem 
                        icon={<QuestionMarkCircleIcon className="w-5 h-5 flex-shrink-0"/>}
                        label={quickClarifyChannel.name}
                        isActive={selectedChannelId === quickClarifyChannel.id}
                        onClick={() => onSelectChannel(quickClarifyChannel.id)}
                    />
                )}

                <SectionHeader>Work Streams</SectionHeader>
                {workStreams.map(channel => (
                    <NavItem 
                        key={channel.id}
                        icon={<HashtagIcon className="w-5 h-5 flex-shrink-0"/>}
                        label={channel.name}
                        isActive={selectedChannelId === channel.id}
                        onClick={() => onSelectChannel(channel.id)}
                    />
                ))}

                <SectionHeader>Projects</SectionHeader>
                {projectStreams.map(channel => (
                    <NavItem 
                        key={channel.id}
                        icon={<HashtagIcon className="w-5 h-5 flex-shrink-0"/>}
                        label={channel.name}
                        isActive={selectedChannelId === channel.id}
                        onClick={() => onSelectChannel(channel.id)}
                    />
                ))}

                <SectionHeader>Direct Messages</SectionHeader>
                {directMessages.map(user => (
                    <NavItem 
                        key={`dm-${user.id}`}
                        icon={<img src={user.avatar} className="w-5 h-5 rounded-full flex-shrink-0" />}
                        label={user.name}
                        isActive={selectedChannelId === `dm-${user.id}`} // This is a mock ID
                        onClick={() => onSelectChannel(`dm-user-3-user-4`)} // Mock selection
                    />
                ))}

            </div>
        </aside>
    );
};

export default CommunicationSidebar;
