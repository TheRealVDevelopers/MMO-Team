/**
 * Client-side Case Chat – wraps UnifiedChat for the Client Project Command Center.
 * Receives messages via props from ClientProjectCommandCenter.
 */

import React from 'react';
import UnifiedChat, { ChatMsg, UnifiedChatUser } from '../shared/UnifiedChat';

export interface CaseChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  role: string;
  message: string;
  timestamp: Date;
  attachments?: string[];
  type?: 'text' | 'image' | 'file';
  fileName?: string;
}

interface CaseChatProps {
  caseId: string;
  messages: CaseChatMessage[];
  clientUserId: string;
  clientName?: string;
  isReadOnly?: boolean;
  isDark?: boolean;
}

const CaseChat: React.FC<CaseChatProps> = ({
  caseId,
  messages,
  clientUserId,
  clientName = 'Client',
  isReadOnly,
  isDark,
}) => {
  // Map to shared ChatMsg[]
  const chatMessages: ChatMsg[] = messages.map((msg, idx) => ({
    id: msg.id || idx.toString(),
    senderId: msg.senderId || '',
    senderName: msg.senderName || 'Unknown',
    role: msg.role || 'team',
    message: msg.message || '',
    timestamp: msg.timestamp,
    type: msg.type || 'text',
    attachments: msg.attachments,
    fileName: msg.fileName,
  }));

  const clientUser: UnifiedChatUser = {
    uid: clientUserId,
    displayName: clientName,
    role: 'client',
  };

  return (
    <UnifiedChat
      caseId={caseId}
      messages={chatMessages}
      currentUser={clientUser}
      isReadOnly={isReadOnly}
      isDark={isDark}
      maxHeight={500}
      variant="card"
    />
  );
};

export default CaseChat;
