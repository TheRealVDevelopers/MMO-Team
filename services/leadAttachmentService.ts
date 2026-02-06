import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { LeadHistoryAttachment } from '../types';

/**
 * Determines the file type category based on MIME type
 */
const getFileTypeCategory = (mimeType: string): 'image' | 'document' | 'other' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (
        mimeType === 'application/pdf' ||
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/vnd.ms-excel' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'text/plain'
    ) {
        return 'document';
    }
    return 'other';
};

/**
 * Uploads a file to Firebase Storage for lead activity attachments
 * @param file - The file to upload
 * @param leadId - The ID of the lead
 * @returns LeadHistoryAttachment object with file metadata and download URL
 */
export const uploadLeadActivityAttachment = async (
    file: File,
    leadId: string
): Promise<LeadHistoryAttachment> => {
    // If storage is not initialized (e.g. demo mode), fall back to checking if we can mock or error
    if (!storage) {
        console.warn("Storage not initialized, using base64 fallback (not recommended for large files)");
        const fileToBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
        };
        const downloadUrl = await fileToBase64(file);
        const timestamp = Date.now();
        return {
            id: `att-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            fileName: file.name,
            fileUrl: downloadUrl,
            fileType: getFileTypeCategory(file.type),
            fileSize: file.size,
            uploadedAt: new Date(),
        };
    }

    try {
        const timestamp = Date.now();
        const storagePath = `leads/${leadId}/attachments/${timestamp}_${file.name}`;
        const storageRef = ref(storage, storagePath);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        const attachment: LeadHistoryAttachment = {
            id: `att-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            fileName: file.name,
            fileUrl: downloadUrl,
            fileType: getFileTypeCategory(file.type),
            fileSize: file.size,
            uploadedAt: new Date(),
        };

        return attachment;
    } catch (error) {
        console.error("Error uploading file to storage:", error);
        throw error;
    }
};

/**
 * Uploads multiple files for a lead activity
 * @param files - Array of files to upload
 * @param leadId - The ID of the lead
 * @returns Array of LeadHistoryAttachment objects
 */
export const uploadMultipleLeadAttachments = async (
    files: File[],
    leadId: string
): Promise<LeadHistoryAttachment[]> => {
    const uploadPromises = files.map((file) => uploadLeadActivityAttachment(file, leadId));
    return Promise.all(uploadPromises);
};

/**
 * Formats file size to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
