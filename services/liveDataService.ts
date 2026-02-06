/**
 * STUB: liveDataService - Replaced by notificationService
 * This file exists only to prevent import errors in non-Phase 6A files.
 */

export const createNotification = async (data: any) => {
  console.warn('createNotification moved to notificationService.ts');
};

export const logActivity = async (data: any) => {
  console.warn('logActivity moved to activity logging in hooks');
};

export const generateRandomPassword = (length: number = 12): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const subscribeToNotifications = () => {
  console.warn('subscribeToNotifications deprecated');
  return () => {};
};

export const markNotificationAsRead = async () => {
  console.warn('markNotificationAsRead deprecated');
};
