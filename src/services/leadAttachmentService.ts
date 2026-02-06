/**
 * Lead Attachment Service - Stub for backward compatibility
 * @deprecated Use useCaseDocuments hook instead
 */

export const uploadMultipleLeadAttachments = async (
  leadId: string,
  files: File[]
): Promise<string[]> => {
  console.warn('uploadMultipleLeadAttachments: Please use useCaseDocuments hook instead');
  return [];
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
