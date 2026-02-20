/**
 * Firebase Storage Service
 * Handles all file uploads/downloads to Firebase Storage
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
  UploadTask,
  StorageReference,
  listAll,
  getMetadata
} from 'firebase/storage';
import { storage } from '../firebase';

// Storage bucket paths
export const STORAGE_PATHS = {
  // Lead/Case attachments
  LEAD_ATTACHMENTS: 'leads/{leadId}/attachments',
  CASE_DOCUMENTS: 'cases/{caseId}/documents',

  // Drawing/Design files
  DRAWINGS: 'drawings/{caseId}',
  CAD_FILES: 'cad/{caseId}',

  // User profiles
  USER_AVATARS: 'users/{userId}/avatar',

  // Project files
  PROJECT_FILES: 'projects/{projectId}/files',
  SITE_PHOTOS: 'projects/{projectId}/site-photos',

  // Quotation/BOQ
  QUOTATION_PDFS: 'quotations/{caseId}',
  BOQ_PDFS: 'boq/{caseId}',

  // Chat attachments
  CHAT_ATTACHMENTS: 'chat/{channelId}/attachments',

  // Receipts and invoices
  RECEIPTS: 'finance/receipts/{receiptId}',
  INVOICES: 'finance/invoices/{invoiceId}',

  // Catalog images
  CATALOG_IMAGES: 'catalog/{itemId}/images',

  // General attachments
  GENERAL: 'attachments',
};

// Helper to replace path placeholders
const buildPath = (template: string, params: Record<string, string>): string => {
  let path = template;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`{${key}}`, value);
  }
  return path;
};

// Generate unique filename with timestamp
const generateUniqueFilename = (originalName: string): string => {
  const ext = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${baseName}_${timestamp}_${randomStr}.${ext}`;
};

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
}

/**
 * Upload a single file to Firebase Storage
 */
export const uploadFile = async (
  file: File,
  storagePath: string,
  customFileName?: string
): Promise<UploadResult> => {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }

  const fileName = customFileName || generateUniqueFilename(file.name);
  const fullPath = `${storagePath}/${fileName}`;
  const storageRef = ref(storage, fullPath);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e4336b3f-e354-4a9b-9c27-6ecee71671c2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'storageService.ts:uploadFile', message: 'uploadFile before upload', data: { fullPath, storagePath }, timestamp: Date.now(), hypothesisId: 'H6' }) }).catch(() => { });
  // #endregion
  console.log('[StorageService] Uploading file to:', fullPath); // Debug log

  try {
    // Use resumable upload (avoids 412 Precondition Failed on some bucket configs)
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Wait for upload to complete
    const snapshot = await new Promise<any>((resolve, reject) => {
      uploadTask.on('state_changed',
        null,
        (error) => reject(error),
        () => resolve(uploadTask.snapshot)
      );
    });

    // Get download URL
    const url = await getDownloadURL(snapshot.ref);

    return {
      url,
      path: fullPath,
      fileName,
      fileSize: file.size,
      contentType: file.type,
    };
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e4336b3f-e354-4a9b-9c27-6ecee71671c2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'storageService.ts:uploadFile:catch', message: 'upload failed', data: { fullPath, errorCode: error?.code, errorMessage: error?.message }, timestamp: Date.now(), hypothesisId: 'H4' }) }).catch(() => { });
    // #endregion
    console.error('[StorageService] Upload failed:', error);
    // Log the full server response for debugging 412 errors
    if (error?.serverResponse) {
      console.error('[StorageService] Server response:', error.serverResponse);
    }
    if (error?.customData) {
      console.error('[StorageService] Custom data:', JSON.stringify(error.customData));
    }
    console.error('[StorageService] Error code:', error?.code, '| Status:', error?.status);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload a file with progress tracking
 */
export const uploadFileWithProgress = (
  file: File,
  storagePath: string,
  onProgress?: (progress: UploadProgress) => void,
  customFileName?: string
): { task: UploadTask; resultPromise: Promise<UploadResult> } => {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }

  const fileName = customFileName || generateUniqueFilename(file.name);
  const fullPath = `${storagePath}/${fileName}`;
  const storageRef = ref(storage, fullPath);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });

  const resultPromise = new Promise<UploadResult>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          progress,
        });
      },
      (error) => {
        console.error('[StorageService] Upload error:', error);
        reject(new Error(`Upload failed: ${error.message}`));
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url,
            path: fullPath,
            fileName,
            fileSize: file.size,
            contentType: file.type,
          });
        } catch (error: any) {
          reject(new Error(`Failed to get download URL: ${error.message}`));
        }
      }
    );
  });

  return { task: uploadTask, resultPromise };
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (
  files: File[],
  storagePath: string
): Promise<UploadResult[]> => {
  const results = await Promise.all(
    files.map((file) => uploadFile(file, storagePath))
  );
  return results;
};

/**
 * Delete a file from Firebase Storage
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }

  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    console.log('[StorageService] File deleted:', filePath);
  } catch (error: any) {
    // Ignore if file doesn't exist
    if (error.code === 'storage/object-not-found') {
      console.warn('[StorageService] File not found:', filePath);
      return;
    }
    console.error('[StorageService] Delete failed:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Get download URL for a file path
 */
export const getFileUrl = async (filePath: string): Promise<string> => {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }

  try {
    const storageRef = ref(storage, filePath);
    return await getDownloadURL(storageRef);
  } catch (error: any) {
    console.error('[StorageService] Failed to get URL:', error);
    throw new Error(`Failed to get file URL: ${error.message}`);
  }
};

/**
 * List all files in a directory
 */
export const listFiles = async (directoryPath: string): Promise<{
  files: { name: string; path: string }[];
}> => {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }

  try {
    const directoryRef = ref(storage, directoryPath);
    const result = await listAll(directoryRef);

    const files = result.items.map((item) => ({
      name: item.name,
      path: item.fullPath,
    }));

    return { files };
  } catch (error: any) {
    console.error('[StorageService] Failed to list files:', error);
    throw new Error(`Failed to list files: ${error.message}`);
  }
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (filePath: string): Promise<{
  name: string;
  size: number;
  contentType: string;
  timeCreated: string;
  updated: string;
  customMetadata?: Record<string, string>;
}> => {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }

  try {
    const storageRef = ref(storage, filePath);
    const metadata = await getMetadata(storageRef);

    return {
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.contentType || 'application/octet-stream',
      timeCreated: metadata.timeCreated,
      updated: metadata.updated,
      customMetadata: metadata.customMetadata,
    };
  } catch (error: any) {
    console.error('[StorageService] Failed to get metadata:', error);
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }
};

// ============================================
// SPECIALIZED UPLOAD FUNCTIONS
// ============================================

/**
 * Upload lead/case attachments
 */
export const uploadLeadAttachments = async (
  leadId: string,
  files: File[]
): Promise<UploadResult[]> => {
  const path = buildPath(STORAGE_PATHS.LEAD_ATTACHMENTS, { leadId });
  return uploadMultipleFiles(files, path);
};

/**
 * Upload case documents
 */
export const uploadCaseDocuments = async (
  caseId: string,
  files: File[]
): Promise<UploadResult[]> => {
  const path = buildPath(STORAGE_PATHS.CASE_DOCUMENTS, { caseId });
  return uploadMultipleFiles(files, path);
};

/**
 * Upload drawing files
 */
export const uploadDrawing = async (
  caseId: string,
  file: File,
  type: 'pdf' | 'cad'
): Promise<UploadResult> => {
  const pathTemplate = type === 'cad' ? STORAGE_PATHS.CAD_FILES : STORAGE_PATHS.DRAWINGS;
  const path = buildPath(pathTemplate, { caseId });
  return uploadFile(file, path);
};

/**
 * Upload user avatar
 */
export const uploadUserAvatar = async (
  userId: string,
  file: File
): Promise<UploadResult> => {
  const path = buildPath(STORAGE_PATHS.USER_AVATARS, { userId });
  // Use fixed filename for avatar to replace on re-upload
  return uploadFile(file, path, 'avatar');
};

/**
 * Upload site photos
 */
export const uploadSitePhotos = async (
  projectId: string,
  files: File[]
): Promise<UploadResult[]> => {
  const path = buildPath(STORAGE_PATHS.SITE_PHOTOS, { projectId });
  return uploadMultipleFiles(files, path);
};

/**
 * Upload project files (e.g. admin attachments)
 */
export const uploadProjectFiles = async (
  projectId: string,
  files: File[]
): Promise<UploadResult[]> => {
  const path = buildPath(STORAGE_PATHS.PROJECT_FILES, { projectId });
  return uploadMultipleFiles(files, path);
};

/**
 * Upload chat attachment
 */
export const uploadChatAttachment = async (
  channelId: string,
  file: File
): Promise<UploadResult> => {
  const path = buildPath(STORAGE_PATHS.CHAT_ATTACHMENTS, { channelId });
  return uploadFile(file, path);
};

/**
 * Upload receipt image
 */
export const uploadReceipt = async (
  receiptId: string,
  file: File
): Promise<UploadResult> => {
  const path = buildPath(STORAGE_PATHS.RECEIPTS, { receiptId });
  return uploadFile(file, path);
};

/**
 * Upload catalog item image
 */
export const uploadCatalogImage = async (
  itemId: string,
  file: File
): Promise<UploadResult> => {
  const path = buildPath(STORAGE_PATHS.CATALOG_IMAGES, { itemId });
  return uploadFile(file, path);
};

/**
 * Upload quotation PDF
 */
export const uploadQuotationPdf = async (
  caseId: string,
  file: File
): Promise<UploadResult> => {
  const path = buildPath(STORAGE_PATHS.QUOTATION_PDFS, { caseId });
  return uploadFile(file, path);
};

/**
 * Upload BOQ PDF
 */
export const uploadBoqPdf = async (
  caseId: string,
  file: File
): Promise<UploadResult> => {
  const path = buildPath(STORAGE_PATHS.BOQ_PDFS, { caseId });
  return uploadFile(file, path);
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file type category
 */
export const getFileTypeCategory = (contentType: string): 'image' | 'document' | 'cad' | 'other' => {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType === 'application/pdf' || contentType.includes('document') || contentType.includes('word')) return 'document';
  if (contentType.includes('dwg') || contentType.includes('dxf') || contentType.includes('cad')) return 'cad';
  return 'other';
};

/**
 * Check if file type is allowed
 */
export const isAllowedFileType = (file: File, allowedTypes?: string[]): boolean => {
  if (!allowedTypes || allowedTypes.length === 0) return true;

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type.toLowerCase();

  return allowedTypes.some((type) => {
    const typeNormalized = type.toLowerCase().replace('.', '');
    return ext === typeNormalized || mimeType.includes(typeNormalized);
  });
};

/**
 * Validate file size
 */
export const isFileSizeValid = (file: File, maxSizeMB: number = 10): boolean => {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
};

export default {
  uploadFile,
  uploadFileWithProgress,
  uploadMultipleFiles,
  deleteFile,
  getFileUrl,
  listFiles,
  getFileMetadata,
  uploadLeadAttachments,
  uploadCaseDocuments,
  uploadDrawing,
  uploadUserAvatar,
  uploadSitePhotos,
  uploadProjectFiles,
  uploadChatAttachment,
  uploadReceipt,
  uploadCatalogImage,
  uploadQuotationPdf,
  uploadBoqPdf,
  formatFileSize,
  getFileTypeCategory,
  isAllowedFileType,
  isFileSizeValid,
  STORAGE_PATHS,
  buildPath,
};
