/**
 * Section 6: Documents — read-only (2D, 3D, BOQ, Quotation, Warranties).
 */

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { DocumentType } from '../../../types';

interface DocRow {
  id: string;
  type?: string;
  fileName?: string;
  fileUrl?: string;
  uploadedAt?: any;
}

interface Props {
  caseId: string;
}

const LABELS: Record<string, string> = {
  [DocumentType.TWO_D]: '2D Drawing',
  [DocumentType.THREE_D]: '3D Drawing',
  [DocumentType.BOQ]: 'BOQ',
  [DocumentType.QUOTATION]: 'Quotation',
  [DocumentType.PDF]: 'PDF',
  [DocumentType.IMAGE]: 'Image',
};

const ExecutionDocumentsReadOnlySection: React.FC<Props> = ({ caseId }) => {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !caseId) {
      setLoading(false);
      return;
    }
    const ref = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.DOCUMENTS);
    const q = query(ref, orderBy('uploadedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DocRow)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [caseId]);

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white text-sm font-bold">6</span>
        <h2 className="text-lg font-bold text-slate-800">Documents</h2>
      </div>
      <p className="text-sm text-slate-600 mb-4">Read-only. 2D, 3D, BOQ, Quotations, Warranties.</p>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-slate-500">No documents.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-sm">
              <span className="font-medium text-slate-800">{LABELS[d.type ?? ''] || d.type || d.fileName || d.id}</span>
              {d.fileUrl && (
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                  Open
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ExecutionDocumentsReadOnlySection;
