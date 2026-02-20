/**
 * Chat utilities for Case-Centric Architecture.
 * Writes to cases/{caseId} 'chat' array.
 */

import {
  doc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is available or use simpler generator

// Fallback ID generator if uuid not available
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export interface CaseMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string; // 'client' | 'admin' | 'sales' etc
  content: string; // mapped from 'message' in schema
  message: string; // actual schema field
  type: 'text' | 'image' | 'file';
  timestamp: Date;
  attachments?: string[];
}

/**
 * Sends a message by updating the case document's chat array.
 */
export async function sendCaseMessage(
  caseId: string,
  payload: {
    senderId: string;
    senderName: string;
    senderRole: string;
    content: string;
    type?: 'text' | 'image' | 'file';
    attachments?: string[];
  }
): Promise<string> {
  const caseRef = doc(db, 'cases', caseId);
  const messageId = generateId();

  const newMessage = {
    id: messageId,
    senderId: payload.senderId,
    senderName: payload.senderName,
    role: payload.senderRole,
    message: payload.content, // Schema uses 'message'
    type: payload.type || 'text',
    timestamp: Timestamp.now(), // Firestore timestamp
    attachments: payload.attachments || []
  };

  await updateDoc(caseRef, {
    chat: arrayUnion(newMessage)
  });

  return messageId;
}
