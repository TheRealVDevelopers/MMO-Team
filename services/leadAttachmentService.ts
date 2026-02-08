/**
 * Lead Attachment Service
 * Handles file uploads for leads/cases using Firebase Storage
 */

import {
  uploadLeadAttachments as uploadToStorage,
  formatFileSize as formatSize,
  UploadResult,
} from './storageService';

/**
 * Upload multiple attachments for a lead
 * @param leadId - The lead/case ID
 * @param files - Array of files to upload
 * @returns Array of download URLs
 */
export const uploadMultipleLeadAttachments = async (
  leadId: string,
  files: File[]
): Promise<string[]> => {
  if (!leadId || !files || files.length === 0) {
    console.warn('[LeadAttachmentService] No files to upload');
    return [];
  }

  try {
    const results: UploadResult[] = await uploadToStorage(leadId, files);
    return results.map((r) => r.url);
  } catch (error: any) {
    console.error('[LeadAttachmentService] Upload failed:', error);
    throw new Error(error.message || 'Failed to upload attachments');
  }
};

/**
 * Format file size for display
 */
export const formatFileSize = formatSize;

export default {
  uploadMultipleLeadAttachments,
  formatFileSize,
};
