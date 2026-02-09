/**
 * BOQ History Page - Drawing Team
 * Lists all BOQs created by the logged-in drawing team member.
 * Case-linked data from cases/{caseId}/boq.
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import {
  collectionGroup,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { DocumentTextIcon, PencilSquareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { safeDateTime } from '../../../constants';
import { ContentCard, SectionHeader } from '../shared/DashboardUI';
import { Case, UserRole, CaseBOQ, BOQItemData } from '../../../types';
import BOQPDFTemplate from '../quotation-team/BOQPDFTemplate';
import EditBOQModal from './EditBOQModal';

interface BOQWithCase {
  id: string;
  caseId: string;
  caseName: string;
  items: any[];
  createdBy: string;
  createdAt: Date;
  pdfUrl?: string;
  locked?: boolean;
}

const BOQsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [boqs, setBoqs] = useState<BOQWithCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [viewingBOQ, setViewingBOQ] = useState<BOQWithCase | null>(null);
  const [caseDataForView, setCaseDataForView] = useState<Case | null>(null);
  const [editingBOQ, setEditingBOQ] = useState<BOQWithCase | null>(null);

  const handleViewBOQ = async (boq: BOQWithCase) => {
    if (!db) return;
    try {
      const caseSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.CASES, boq.caseId));
      if (caseSnap.exists()) {
        setCaseDataForView({ ...(caseSnap.data() as Case), id: boq.caseId });
        setViewingBOQ(boq);
      } else {
        alert('Case not found');
      }
    } catch (e) {
      console.error('[BOQsPage] Failed to load case for view:', e);
      alert('Failed to load case data');
    }
  };

  const toCaseBOQ = (boq: BOQWithCase): CaseBOQ => {
    const items: BOQItemData[] = (boq.items || []).map((it: any) => ({
      catalogItemId: it.catalogItemId || '',
      name: it.name || it.description || 'Item',
      unit: it.unit || 'pcs',
      quantity: typeof it.quantity === 'number' ? it.quantity : parseFloat(it.quantity) || 0,
      rate: typeof it.rate === 'number' ? it.rate : parseFloat(it.rate) || 0,
      total: typeof it.total === 'number' ? it.total : (it.quantity || 0) * (it.rate || 0),
    }));
    const subtotal = items.reduce((s, i) => s + (i.total || i.quantity * i.rate), 0);
    return {
      id: boq.id,
      caseId: boq.caseId,
      items,
      subtotal,
      createdBy: boq.createdBy,
      createdAt: boq.createdAt,
      pdfUrl: boq.pdfUrl,
    };
  };

  useEffect(() => {
    if (!db || !currentUser) {
      setLoading(false);
      return;
    }

    setQueryError(null);
    const boqQuery = query(
      collectionGroup(db, FIRESTORE_COLLECTIONS.BOQ),
      where('createdBy', '==', currentUser.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      boqQuery,
      async (snapshot) => {
        const results: BOQWithCase[] = [];
        for (const boqDoc of snapshot.docs) {
          const data = boqDoc.data();
          const caseId = data.caseId;
          let caseName = 'Unknown Case';
          if (caseId) {
            try {
              const caseSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.CASES, caseId));
              if (caseSnap.exists()) {
                caseName = (caseSnap.data() as Case).title || caseName;
              }
            } catch {
              // ignore
            }
          }
          results.push({
            id: boqDoc.id,
            caseId,
            caseName,
            items: data.items || [],
            createdBy: data.createdBy || '',
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            pdfUrl: data.pdfUrl,
            locked: !!data.locked || !!data.referencedByQuotation,
          });
        }
        setBoqs(results);
        setLoading(false);
        setQueryError(null);
      },
      (err) => {
        console.error('[BOQsPage] Query error:', err);
        setQueryError(err?.message || 'Failed to load BOQs');
        setBoqs([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.id, retryKey]);

  const canEdit = (boq: BOQWithCase) =>
    !boq.locked &&
    (boq.createdBy === currentUser?.id ||
      currentUser?.role === UserRole.ADMIN ||
      currentUser?.role === UserRole.SALES_GENERAL_MANAGER);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My BOQs"
        subtitle="Bill of Quantities created by you. Open or edit to update."
      />

      {queryError ? (
        <ContentCard>
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <p className="text-text-secondary font-medium">Unable to load BOQs</p>
            <p className="text-sm text-text-tertiary mt-2 max-w-md mx-auto">
              {queryError.includes('index') || queryError.includes('INTERNAL')
                ? 'Firestore index may be missing or still building. Run: firebase deploy --only firestore:indexes and wait a few minutes.'
                : queryError}
            </p>
            <button
              onClick={() => { setQueryError(null); setRetryKey((k) => k + 1); }}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </ContentCard>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : boqs.length === 0 ? (
        <ContentCard>
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary">No BOQs created yet.</p>
            <p className="text-sm text-text-tertiary mt-1">Create BOQs from the Projects board or Work Queue.</p>
          </div>
        </ContentCard>
      ) : (
        <div className="grid gap-4">
          {boqs.map((boq) => (
            <ContentCard key={`${boq.caseId}-${boq.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">{boq.caseName}</h3>
                    <p className="text-sm text-text-tertiary">
                      {boq.items.length} items • {safeDateTime(boq.createdAt)}
                      {boq.locked && (
                        <span className="ml-2 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800">
                          Locked (referenced by quotation)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewBOQ(boq)}
                    className="p-2 rounded-lg border border-border hover:bg-subtle-background transition-colors"
                    title="View BOQ as PDF"
                  >
                    <EyeIcon className="w-5 h-5 text-text-secondary" />
                  </button>
                  {canEdit(boq) && (
                    <button
                      onClick={() => setEditingBOQ(boq)}
                      className="p-2 rounded-lg border border-border hover:bg-subtle-background transition-colors"
                      title="Edit BOQ"
                    >
                      <PencilSquareIcon className="w-5 h-5 text-text-secondary" />
                    </button>
                  )}
                </div>
              </div>
            </ContentCard>
          ))}
        </div>
      )}

      {/* View BOQ as PDF */}
      {viewingBOQ && caseDataForView && (
        <BOQPDFTemplate
          boq={toCaseBOQ(viewingBOQ)}
          caseData={caseDataForView}
          onClose={() => { setViewingBOQ(null); setCaseDataForView(null); }}
        />
      )}

      {/* Edit BOQ modal */}
      {editingBOQ && currentUser && (
        <EditBOQModal
          isOpen={!!editingBOQ}
          onClose={() => setEditingBOQ(null)}
          caseId={editingBOQ.caseId}
          boqId={editingBOQ.id}
          existingBOQ={toCaseBOQ(editingBOQ)}
          currentUser={currentUser}
          onBOQSaved={() => {
            setEditingBOQ(null);
            setRetryKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
};

export default BOQsPage;
