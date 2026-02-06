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
} from 'firebase/firestore';
import { db } from '../firebase';
import { CaseDocument, DocumentType } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

interface UseCaseDocumentsOptions {
  organizationId: string;
  caseId: string;
  type?: DocumentType | DocumentType[];
}

export const useCaseDocuments = (options: UseCaseDocumentsOptions) => {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for documents
  useEffect(() => {
    if (!db || !options.organizationId || !options.caseId) {
      setLoading(false);
      return;
    }

    try {
      const documentsRef = collection(
        db,
        FIRESTORE_COLLECTIONS.ORGANIZATIONS,
        options.organizationId,
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
  }, [options.organizationId, options.caseId, JSON.stringify(options.type)]);

  // Upload document
  const uploadDocument = useCallback(
    async (documentData: Omit<CaseDocument, 'id' | 'uploadedAt'>) => {
      if (!db || !options.organizationId || !options.caseId) {
        throw new Error('Database, organization, or case not initialized');
      }

      try {
        const documentsRef = collection(
          db,
          FIRESTORE_COLLECTIONS.ORGANIZATIONS,
          options.organizationId,
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
          options.organizationId,
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
    [options.organizationId, options.caseId]
  );

  // Delete document
  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (!db || !options.organizationId || !options.caseId) {
        throw new Error('Database, organization, or case not initialized');
      }

      try {
        const documentRef = doc(
          db,
          FIRESTORE_COLLECTIONS.ORGANIZATIONS,
          options.organizationId,
          FIRESTORE_COLLECTIONS.CASES,
          options.caseId,
          FIRESTORE_COLLECTIONS.DOCUMENTS,
          documentId
        );

        await deleteDoc(documentRef);

        await logActivity(options.organizationId, options.caseId, 'Document deleted', 'system');
      } catch (err: any) {
        console.error('Error deleting document:', err);
        throw err;
      }
    },
    [options.organizationId, options.caseId]
  );

  // Helper: Log activity
  const logActivity = async (orgId: string, caseId: string, action: string, userId: string) => {
    if (!db) return;

    try {
      const activitiesRef = collection(
        db,
        FIRESTORE_COLLECTIONS.ORGANIZATIONS,
        orgId,
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
    deleteDocument,
  };
};
