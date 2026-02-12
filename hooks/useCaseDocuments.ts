import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { CaseDocument, DocumentType } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { uploadCaseDocuments, deleteFile, UploadResult } from '../services/storageService';

interface UseCaseDocumentsOptions {
  caseId: string;
  type?: DocumentType | DocumentType[];
}

export const useCaseDocuments = (options: UseCaseDocumentsOptions) => {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for documents
  useEffect(() => {
    if (!db || !options.caseId) {
      setLoading(false);
      return;
    }

    try {
      const documentsRef = collection(
        db,
        FIRESTORE_COLLECTIONS.CASES,
        options.caseId,
        FIRESTORE_COLLECTIONS.DOCUMENTS
      );

      let q = query(documentsRef, orderBy('uploadedAt', 'desc'));

      // Apply type filter if specified
      if (options.type && !Array.isArray(options.type)) {
        q = query(q, where('type', '==', options.type));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let docsData = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              uploadedAt: data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate() : new Date(data.uploadedAt),
            } as CaseDocument;
          });

          // Client-side filtering for multiple types
          if (Array.isArray(options.type)) {
            docsData = docsData.filter((d) => options.type!.includes(d.type));
          }

          setDocuments(docsData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching documents:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Error setting up documents listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [options.caseId, JSON.stringify(options.type)]);

  // Upload document
  const uploadDocument = useCallback(
    async (documentData: Omit<CaseDocument, 'id' | 'uploadedAt'>) => {
      if (!db || !options.caseId) {
        throw new Error('Database or case not initialized');
      }

      try {
        const documentsRef = collection(
          db,
          FIRESTORE_COLLECTIONS.CASES,
          options.caseId,
          FIRESTORE_COLLECTIONS.DOCUMENTS
        );

        const newDocument: Omit<CaseDocument, 'id'> = {
          ...documentData,
          caseId: options.caseId,
          uploadedAt: new Date(),
        };

        const docRef = await addDoc(documentsRef, {
          ...newDocument,
          uploadedAt: serverTimestamp(),
        });

        // Log activity
        await logActivity(
          options.caseId,
          `Document uploaded: ${documentData.fileName}`,
          documentData.uploadedBy
        );

        return docRef.id;
      } catch (err: any) {
        console.error('Error uploading document:', err);
        throw err;
      }
    },
    [options.caseId]
  );

  // Upload file to Storage and then save metadata to Firestore
  const uploadFileWithStorage = useCallback(
    async (
      file: File,
      type: DocumentType,
      uploadedBy: string,
      additionalData?: Partial<CaseDocument>
    ): Promise<string> => {
      if (!db || !options.caseId) {
        throw new Error('Database or case not initialized');
      }

      try {
        // 1. Upload file to Firebase Storage
        const [uploadResult] = await uploadCaseDocuments(options.caseId, [file]);

        // 2. Save metadata to Firestore
        const documentsRef = collection(
          db,
          FIRESTORE_COLLECTIONS.CASES,
          options.caseId,
          FIRESTORE_COLLECTIONS.DOCUMENTS
        );

        const documentData: Omit<CaseDocument, 'id'> = {
          caseId: options.caseId,
          type,
          fileName: file.name,
          fileUrl: uploadResult.url,
          storagePath: uploadResult.path,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.contentType,
          uploadedBy,
          uploadedAt: new Date(),
          ...additionalData,
        };

        const docRef = await addDoc(documentsRef, {
          ...documentData,
          uploadedAt: serverTimestamp(),
        });

        // Log activity
        await logActivity(
          options.caseId,
          `Document uploaded: ${file.name}`,
          uploadedBy
        );

        return docRef.id;
      } catch (err: any) {
        console.error('Error uploading file to storage:', err);
        throw err;
      }
    },
    [options.caseId]
  );

  // Delete document from Firestore and Storage
  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (!db || !options.caseId) {
        throw new Error('Database or case not initialized');
      }

      try {
        const documentRef = doc(
          db,
          FIRESTORE_COLLECTIONS.CASES,
          options.caseId,
          FIRESTORE_COLLECTIONS.DOCUMENTS,
          documentId
        );

        // Get the document to find storage path
        const docSnap = await getDoc(documentRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Delete from Storage if storagePath exists
          if (data.storagePath) {
            try {
              await deleteFile(data.storagePath);
            } catch (storageErr) {
              console.warn('Failed to delete file from storage:', storageErr);
              // Continue with Firestore deletion even if storage deletion fails
            }
          }
        }

        await deleteDoc(documentRef);

        await logActivity(options.caseId, 'Document deleted', 'system');
      } catch (err: any) {
        console.error('Error deleting document:', err);
        throw err;
      }
    },
    [options.caseId]
  );

  // Helper: Log activity
  const logActivity = async (caseId: string, action: string, userId: string) => {
    if (!db) return;

    try {
      const activitiesRef = collection(
        db,
        FIRESTORE_COLLECTIONS.CASES,
        caseId,
        FIRESTORE_COLLECTIONS.ACTIVITIES
      );

      await addDoc(activitiesRef, {
        action,
        by: userId,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  return {
    documents,
    loading,
    error,
    uploadDocument,
    uploadFileWithStorage,
    deleteDocument,
  };
};
