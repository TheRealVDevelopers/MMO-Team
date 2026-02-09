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
    <section className="bg-surface border border-border rounded-xl p-6">
      <h2 className="text-lg font-bold text-text-primary mb-4">6. Documents</h2>
      <p className="text-sm text-text-secondary mb-4">Read-only. 2D, 3D, BOQ, Quotations, Warranties.</p>
      {loading ? (
        <p className="text-sm text-text-tertiary">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-text-tertiary">No documents.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between text-sm">
              <span className="text-text-primary">{LABELS[d.type ?? ''] || d.type || d.fileName || d.id}</span>
              {d.fileUrl && (
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
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
