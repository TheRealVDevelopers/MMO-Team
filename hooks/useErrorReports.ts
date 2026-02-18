/**
 * HelpBot – Internal error reporting.
 * All authenticated internal users can submit; only SUPER_ADMIN can list/update/delete.
 */

import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export type ErrorReportSeverity = 'minor' | 'medium' | 'critical';
export type ErrorReportStatus = 'open' | 'in_progress' | 'resolved';

export interface ErrorReport {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  page: string;
  description: string;
  severity: ErrorReportSeverity;
  screenshotUrl: string | null;
  voiceNoteUrl: string | null;
  status: ErrorReportStatus;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  internalNote?: string;
}

const COLLECTION = FIRESTORE_COLLECTIONS.ERROR_REPORTS;
// Storage path – no need to create this folder in Firebase Console; it is created on first upload.
const STORAGE_PREFIX = 'attachments/helpbot-reports';

function toUrl(v: unknown): string | null {
  if (v == null || typeof v !== 'string') return null;
  const s = v.trim();
  return s.length > 0 ? s : null;
}

function snapToReport(docSnap: DocumentSnapshot): ErrorReport | null {
  if (!docSnap.exists()) return null;
  const d = docSnap.data()!;
  return {
    id: docSnap.id,
    userId: d.userId ?? '',
    userName: d.userName ?? '',
    userRole: d.userRole ?? '',
    page: d.page ?? '',
    description: d.description ?? '',
    severity: d.severity ?? 'medium',
    screenshotUrl: toUrl(d.screenshotUrl ?? d.screenshot_url) ?? null,
    voiceNoteUrl: toUrl(d.voiceNoteUrl ?? d.voice_note_url) ?? null,
    status: d.status ?? 'open',
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.createdAt),
    resolvedAt: d.resolvedAt instanceof Timestamp ? d.resolvedAt.toDate() : d.resolvedAt ? new Date(d.resolvedAt) : undefined,
    resolvedBy: d.resolvedBy,
    internalNote: d.internalNote,
  };
}

/** Submit a new error report (any authenticated internal user). */
export function useSubmitErrorReport() {
  const { currentUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (payload: {
      page: string;
      description: string;
      severity: ErrorReportSeverity;
      screenshotFile?: File | null;
      voiceBlob?: Blob | null;
    }) => {
      if (!db || !currentUser) {
        setError('Not authenticated');
        return null;
      }
      setSubmitting(true);
      setError(null);
      try {
        const col = collection(db, COLLECTION);
        const docRef = await addDoc(col, {
          userId: currentUser.id,
          userName: currentUser.name ?? currentUser.email ?? 'Unknown',
          userRole: currentUser.role ?? '',
          page: payload.page,
          description: payload.description,
          severity: payload.severity,
          screenshotUrl: null,
          voiceNoteUrl: null,
          status: 'open',
          createdAt: serverTimestamp(),
        });
        const reportId = docRef.id;

        const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

        const uploadToStorage = async (
          file: Blob | File,
          filename: string,
          contentType: string
        ): Promise<string | null> => {
          if (!storage) {
            console.error('[HelpBot] Storage not initialized. Check Firebase config and that VITE_DEMO_MODE is not true.');
            return null;
          }
          const path = `${STORAGE_PREFIX}/${reportId}/${uploadId}/${filename}`;
          const storageRef = ref(storage, path);
          await uploadBytes(storageRef, file, { contentType });
          const url = await getDownloadURL(storageRef);
          console.log('[HelpBot] Upload OK:', path);
          return url;
        };

        if (payload.screenshotFile) {
          if (!storage) {
            console.error('[HelpBot] Cannot upload screenshot: Storage not initialized.');
          } else {
            try {
              const ext = payload.screenshotFile.name.split('.').pop()?.toLowerCase() || 'jpg';
              const contentType = payload.screenshotFile.type || (ext === 'png' ? 'image/png' : 'image/jpeg');
              const screenshotUrl = await uploadToStorage(
                payload.screenshotFile,
                `screenshot.${ext}`,
                contentType
              );
              if (screenshotUrl) await updateDoc(docRef, { screenshotUrl });
            } catch (err: any) {
              console.error('[HelpBot] Screenshot upload failed:', err?.code ?? err?.message ?? err);
            }
          }
        }

        if (payload.voiceBlob) {
          if (!storage) {
            console.error('[HelpBot] Cannot upload voice note: Storage not initialized.');
          } else {
            try {
              const voiceNoteUrl = await uploadToStorage(
                payload.voiceBlob,
                'voice.webm',
                'audio/webm'
              );
              if (voiceNoteUrl) await updateDoc(docRef, { voiceNoteUrl });
            } catch (err: any) {
              console.error('[HelpBot] Voice note upload failed:', err?.code ?? err?.message ?? err);
            }
          }
        }

        return reportId;
      } catch (e: any) {
        setError(e?.message ?? 'Failed to submit report');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [currentUser]
  );

  return { submit, submitting, error };
}

/** List all error reports (SUPER_ADMIN only). Real-time, newest first. */
export function useErrorReportsList() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [unresolvedCount, setUnresolvedCount] = useState(0);

  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    if (!db || !isAdmin) {
      setReports([]);
      setLoading(false);
      setUnresolvedCount(0);
      return;
    }
    const col = collection(db, COLLECTION);
    const q = query(col, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => snapToReport(d)).filter((r): r is ErrorReport => r != null);
        setReports(list);
        setUnresolvedCount(list.filter((r) => r.status !== 'resolved').length);
        setLoading(false);
      },
      (err) => {
        console.error('[useErrorReports]', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [isAdmin]);

  return { reports, loading, unresolvedCount, isAdmin };
}

/** Update status / note (SUPER_ADMIN only). */
export function useUpdateErrorReport() {
  const { currentUser } = useAuth();

  const updateStatus = useCallback(
    async (reportId: string, status: ErrorReportStatus, internalNote?: string) => {
      if (!db || currentUser?.role !== UserRole.SUPER_ADMIN) return;
      const ref = doc(db, COLLECTION, reportId);
      const updates: Record<string, unknown> = { status };
      if (internalNote !== undefined) updates.internalNote = internalNote;
      if (status === 'resolved') {
        updates.resolvedAt = serverTimestamp();
        updates.resolvedBy = currentUser.id;
      }
      await updateDoc(ref, updates);
    },
    [currentUser]
  );

  const deleteReport = useCallback(
    async (reportId: string) => {
      if (!db || currentUser?.role !== UserRole.SUPER_ADMIN) return;
      await deleteDoc(doc(db, COLLECTION, reportId));
    },
    [currentUser]
  );

  return { updateStatus, deleteReport };
}
