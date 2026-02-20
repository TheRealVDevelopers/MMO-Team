/**
 * Staff-side Project Chat – wraps UnifiedChat for the Project Reference Page.
 * Reads from caseData.chat (real-time via parent's onSnapshot).
 */

import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { Case } from '../../../../types';
import UnifiedChat, { ChatMsg, UnifiedChatUser } from '../../../shared/UnifiedChat';

interface ProjectChatProps {
    caseData: Case;
    currentUser: { uid: string; displayName: string; role: string };
}

const ProjectChat: React.FC<ProjectChatProps> = ({ caseData, currentUser }) => {
    // Map raw chat data to ChatMsg[]
    const messages: ChatMsg[] = (caseData.chat || []).map((msg: any, idx: number) => ({
        id: msg.id || idx.toString(),
        senderId: msg.senderId || '',
        senderName: msg.senderName || 'Unknown',
        role: msg.role || 'team',
        message: msg.message || msg.content || '',
        content: msg.content || msg.message || '',
        timestamp: msg.timestamp,
        type: msg.type || 'text',
        attachments: msg.attachments,
        fileName: msg.fileName,
    }));

    const chatUser: UnifiedChatUser = {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        role: currentUser.role,
    };

    return (
        <UnifiedChat
            caseId={caseData.id}
            messages={messages}
            currentUser={chatUser}
            isDark={false}
            maxHeight={550}
            variant="card"
        />
    );
};

export default ProjectChat;
