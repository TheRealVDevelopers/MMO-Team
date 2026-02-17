import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, writeBatch, serverTimestamp, query, where, Timestamp } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { useAuth } from '../../../context/AuthContext';
import { UserRole } from '../../../types';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DocumentVisibilityBackfill: React.FC = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState('');

    const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

    if (!isSuperAdmin) return null;

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const runBackfill = async () => {
        if (!window.confirm('Are you sure you want to run the Document Visibility Backfill? This will update existing documents.')) return;

        setLoading(true);
        setLogs([]);
        addLog('Starting backfill process...');

        try {
            const casesRef = collection(db, FIRESTORE_COLLECTIONS.CASES);
            const casesSnap = await getDocs(casesRef);
            addLog(`Found ${casesSnap.size} cases to scan.`);

            let totalUpdated = 0;
            let totalScanned = 0;

            for (const caseDoc of casesSnap.docs) {
                const caseId = caseDoc.id;
                setProgress(`Scanning case: ${caseId}`);

                // 1. Fetch Approved Quotations
                const quotesRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.QUOTATIONS);
                const approvedQuotesSnap = await getDocs(query(quotesRef, where('auditStatus', '==', 'approved')));

                const approvedQuoteUrls = new Map<string, any>(); // url -> quotation data
                approvedQuotesSnap.forEach(q => {
                    const data = q.data();
                    if (data.pdfUrl) approvedQuoteUrls.set(data.pdfUrl, data);
                    if (data.url) approvedQuoteUrls.set(data.url, data);
                });

                // 2. Fetch All Documents
                const docsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.DOCUMENTS);
                const docsSnap = await getDocs(docsRef);

                const batch = writeBatch(db);
                let batchCount = 0;

                for (const docSnap of docsSnap.docs) {
                    const docData = docSnap.data();
                    let needsUpdate = false;
                    let updates: any = {};

                    // Logic 1: Existing visible docs should be approved
                    if (docData.visibleToClient === true && docData.approvalStatus !== 'approved') {
                        needsUpdate = true;
                        updates.approvalStatus = 'approved';
                        // Fallback fields if missing
                        if (!docData.approvedBy) updates.approvedBy = docData.uploadedBy || currentUser?.id;
                        if (!docData.approvedAt) updates.approvedAt = docData.uploadedAt || serverTimestamp();
                    }

                    // Logic 2: Docs matching approved quotations should be visible & approved
                    if (approvedQuoteUrls.has(docData.fileUrl) || approvedQuoteUrls.has(docData.url)) {
                        const quoteData = approvedQuoteUrls.get(docData.fileUrl) || approvedQuoteUrls.get(docData.url);

                        if (!docData.visibleToClient || docData.approvalStatus !== 'approved') {
                            needsUpdate = true;
                            updates.visibleToClient = true;
                            updates.approvalStatus = 'approved';
                            updates.approvedBy = quoteData.auditedBy || currentUser?.id;
                            updates.approvedAt = quoteData.auditedAt || serverTimestamp();
                            updates.quotationId = quoteData.id; // Link if missing
                            updates.amount = quoteData.grandTotal || quoteData.totalAmount;
                        }
                    }

                    if (needsUpdate) {
                        const docRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.DOCUMENTS, docSnap.id);
                        batch.update(docRef, updates);
                        batchCount++;
                        addLog(`Updated doc ${docSnap.id} in case ${caseId}`);
                    }
                    totalScanned++;
                }

                if (batchCount > 0) {
                    await batch.commit();
                    totalUpdated += batchCount;
                }
            }

            addLog(`SUCCESS: Scanned ${totalScanned} documents. Updated ${totalUpdated} documents.`);
            alert(`Backfill Complete! Updated ${totalUpdated} documents.`);

        } catch (error: any) {
            console.error(error);
            addLog(`ERROR: ${error.message}`);
            alert('Backfill failed. Check logs.');
        } finally {
            setLoading(false);
            setProgress('');
        }
    };

    return (
        <div className="bg-surface border border-border rounded-xl p-6 mt-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <ExclamationTriangleIcon className="w-8 h-8 text-warning" />
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">Admin: Data Migration</h3>
                        <p className="text-sm text-text-secondary">Backfill document visibility and approval status.</p>
                    </div>
                </div>
                <button
                    onClick={runBackfill}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-warning/10 text-warning hover:bg-warning/20 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                    {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" /> : <CheckCircleIcon className="w-5 h-5 mr-2" />}
                    {loading ? 'Running...' : 'Run Backfill'}
                </button>
            </div>

            {progress && <p className="text-sm text-primary font-medium mb-2">{progress}</p>}

            {logs.length > 0 && (
                <div className="bg-subtle-background p-4 rounded-lg h-60 overflow-y-auto text-xs font-mono border border-border">
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 text-text-secondary border-b border-border/10 pb-1 last:border-0">{log}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentVisibilityBackfill;
