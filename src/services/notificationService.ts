/**
 * Notification Service - Provides notification functions
 * Replaces liveDataService.createNotification
 */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';

interface NotificationData {
  title: string;
  message: string;
  user_id: string;
  entity_type?: string;
  entity_id?: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const createNotification = async (data: NotificationData): Promise<void> => {
  if (!db) {
    console.warn('Database not initialized');
    return;
  }

  try {
    const notificationsRef = collection(
      db,
      FIRESTORE_COLLECTIONS.STAFF_USERS,
      data.user_id,
      FIRESTORE_COLLECTIONS.NOTIFICATIONS
    );

    await addDoc(notificationsRef, {
      title: data.title,
      message: data.message,
      type: data.type,
      entity_type: data.entity_type || '',
      entity_id: data.entity_id || '',
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const generateRandomPassword = (length: number = 8): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

export const logActivity = async (
  organizationId: string,
  caseId: string,
  action: string,
  userId: string
): Promise<void> => {
  if (!db) return;

  try {
    const activitiesRef = collection(
      db,
      FIRESTORE_COLLECTIONS.ORGANIZATIONS,
      organizationId,
      FIRESTORE_COLLECTIONS.CASES,
      caseId,
      FIRESTORE_COLLECTIONS.ACTIVITIES
    );

    await addDoc(activitiesRef, {
      action,
      userId,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
