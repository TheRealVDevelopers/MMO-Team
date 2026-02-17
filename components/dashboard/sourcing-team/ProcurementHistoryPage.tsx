/**
 * Procurement History – read-only list of approved quotations.
 * Query: collectionGroup('quotations') where auditStatus === 'approved'.
 * Displays: Case Name, Client Name, Approved By, Approved Date, View PDF.
 * When no PDF URL is stored, shows a printable quotation preview (same content they approved).
 */

import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import {
    collectionGroup,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
} from 'firebase/firestore';
import { CaseQuotation, Case } from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { formatCurrencyINR } from '../../../constants';
import { DocumentArrowDownIcon, PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ApprovedQuotationWithCase extends CaseQuotation {
    projectName?: string;
    clientName?: string;
    auditedByName?: string;
}

/** Returns true if the value looks like a real PDF URL (not a placeholder). */
const isRealPdfUrl = (url: string | undefined | null): boolean => {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('placeholder-')) return false;
    return url.startsWith('http://') || url.startsWith('https://');
};

const ProcurementHistoryPage: React.FC = () => {
    const [approvedQuotations, setApprovedQuotations] = useState<ApprovedQuotationWithCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [queryError, setQueryError] = useState<string | null>(null);
    const [previewQuotation, setPreviewQuotation] = useState<ApprovedQuotationWithCase | null>(null);

    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setQueryError(null);

        const q = query(
            collectionGroup(db, FIRESTORE_COLLECTIONS.QUOTATIONS),
            where('auditStatus', '==', 'approved')
        );

        const unsubscribe = onSnapshot(
            q,
            async (snapshot) => {
                const list: ApprovedQuotationWithCase[] = [];

                for (const quotDoc of snapshot.docs) {
                    const data = quotDoc.data();
                    const quotData = {
                        id: quotDoc.id,
                        caseId: data.caseId,
                        auditStatus: data.auditStatus,
                        auditedBy: data.auditedBy,
                        auditedAt: data.auditedAt?.toDate?.() ?? (data.auditedAt ? new Date(data.auditedAt) : undefined),
                        pdfUrl: data.pdfUrl,
                        grandTotal: data.grandTotal ?? data.totalAmount,
                        ...data,
                    } as ApprovedQuotationWithCase;

                    if (quotData.caseId) {
                        try {
                            const caseSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.CASES, quotData.caseId));
                            if (caseSnap.exists()) {
                                const caseData = caseSnap.data() as Case;
                                quotData.projectName = caseData.title;
                                quotData.clientName = caseData.clientName;
                            }
                        } catch (_) {
                            // keep without case names
                        }
                    }
                    list.push(quotData);
                }

                list.sort((a, b) => {
                    const tA = a.auditedAt instanceof Date ? a.auditedAt.getTime() : 0;
                    const tB = b.auditedAt instanceof Date ? b.auditedAt.getTime() : 0;
                    return tB - tA;
                });

                setApprovedQuotations(list);
                setLoading(false);
            },
            (error) => {
                console.error('[Procurement History] Query error:', error);
                setQueryError(error?.message ?? String(error));
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-text-secondary">Loading approved quotations...</p>
            </div>
        );
    }

    if (queryError) {
        return (
            <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300">
                    Failed to load history. {queryError}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Procurement History</h1>
                <p className="text-sm text-text-secondary mt-1">Approved quotations (read-only)</p>
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-subtle-background border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-xs font-bold uppercase text-text-tertiary">Case Name</th>
                                <th className="px-4 py-3 text-xs font-bold uppercase text-text-tertiary">Client Name</th>
                                <th className="px-4 py-3 text-xs font-bold uppercase text-text-tertiary">Approved By</th>
                                <th className="px-4 py-3 text-xs font-bold uppercase text-text-tertiary">Approved Date</th>
                                <th className="px-4 py-3 text-xs font-bold uppercase text-text-tertiary">View PDF</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {approvedQuotations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-text-tertiary">
                                        No approved quotations yet.
                                    </td>
                                </tr>
                            ) : (
                                approvedQuotations.map((row) => (
                                    <tr key={`${row.caseId}-${row.id}`} className="hover:bg-subtle-background/50">
                                        <td className="px-4 py-3 text-sm font-medium text-text-primary">
                                            {row.projectName ?? row.caseId ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">
                                            {row.clientName ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">
                                            {row.auditedBy ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">
                                            {row.auditedAt
                                                ? (row.auditedAt instanceof Date
                                                    ? row.auditedAt
                                                    : new Date(row.auditedAt)
                                                  ).toLocaleDateString(undefined, {
                                                      dateStyle: 'medium',
                                                      timeStyle: 'short',
                                                  })
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isRealPdfUrl(row.pdfUrl) ? (
                                                <a
                                                    href={row.pdfUrl!}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium"
                                                >
                                                    <DocumentArrowDownIcon className="w-4 h-4" />
                                                    View PDF
                                                </a>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewQuotation(row)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium"
                                                >
                                                    <DocumentArrowDownIcon className="w-4 h-4" />
                                                    View PDF
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quotation preview modal (when no PDF URL): shows approved quotation and allows Print / Save as PDF */}
            {previewQuotation && (
                <>
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            #quotation-preview-content, #quotation-preview-content * { visibility: visible; }
                            #quotation-preview-content { position: absolute; left: 0; top: 0; width: 100%; max-height: none; background: white; }
                        }
                    `}</style>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 print:hidden" onClick={() => setPreviewQuotation(null)}>
                    <div
                        className="bg-background border border-border rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <h3 className="text-lg font-semibold text-text-primary">Approved Quotation</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 text-sm font-medium"
                                >
                                    <PrinterIcon className="w-4 h-4" />
                                    Print / Save as PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewQuotation(null)}
                                    className="p-2 rounded-lg hover:bg-background-hover text-text-secondary"
                                    aria-label="Close"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1" id="quotation-preview-content">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-text-secondary">Project</p>
                                    <p className="font-medium text-text-primary">{previewQuotation.projectName ?? previewQuotation.caseId ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">Client</p>
                                    <p className="font-medium text-text-primary">{previewQuotation.clientName ?? '—'}</p>
                                </div>
                                {previewQuotation.quotationNumber && (
                                    <div>
                                        <p className="text-sm text-text-secondary">Quotation #</p>
                                        <p className="font-medium text-text-primary">{previewQuotation.quotationNumber}</p>
                                    </div>
                                )}
                                <div className="border border-border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-background-hover">
                                                <th className="text-left px-3 py-2 font-medium text-text-primary">Item</th>
                                                <th className="text-right px-3 py-2 font-medium text-text-primary">Qty</th>
                                                <th className="text-left px-3 py-2 font-medium text-text-primary">Unit</th>
                                                <th className="text-right px-3 py-2 font-medium text-text-primary">Rate</th>
                                                <th className="text-right px-3 py-2 font-medium text-text-primary">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(previewQuotation.items ?? []).map((item, idx) => (
                                                <tr key={idx} className="border-t border-border">
                                                    <td className="px-3 py-2 text-text-primary">{item.name}</td>
                                                    <td className="px-3 py-2 text-right text-text-primary">{item.quantity}</td>
                                                    <td className="px-3 py-2 text-text-secondary">{item.unit ?? '—'}</td>
                                                    <td className="px-3 py-2 text-right text-text-primary">{formatCurrencyINR(item.rate ?? item.unitPrice ?? 0)}</td>
                                                    <td className="px-3 py-2 text-right font-medium text-text-primary">{formatCurrencyINR(item.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-sm">
                                    <div className="flex justify-end gap-6">
                                        <span className="text-text-secondary">Subtotal</span>
                                        <span className="font-medium text-text-primary w-32 text-right">{formatCurrencyINR(previewQuotation.subtotal ?? 0)}</span>
                                    </div>
                                    {(previewQuotation.discountAmount ?? 0) > 0 && (
                                        <div className="flex justify-end gap-6">
                                            <span className="text-text-secondary">Discount</span>
                                            <span className="font-medium text-error w-32 text-right">- {formatCurrencyINR(previewQuotation.discountAmount ?? 0)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-6">
                                        <span className="text-text-secondary">Tax (GST)</span>
                                        <span className="font-medium text-text-primary w-32 text-right">{formatCurrencyINR(previewQuotation.taxAmount ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-end gap-6 pt-2 border-t border-border mt-1">
                                        <span className="font-semibold text-text-primary">Grand Total</span>
                                        <span className="font-bold text-primary w-32 text-right">{formatCurrencyINR(previewQuotation.grandTotal ?? previewQuotation.finalAmount ?? 0)}</span>
                                    </div>
                                </div>
                                {previewQuotation.auditedAt && (
                                    <p className="text-xs text-text-tertiary">
                                        Approved by {previewQuotation.auditedByName ?? previewQuotation.auditedBy ?? '—'} on{' '}
                                        {previewQuotation.auditedAt instanceof Date
                                            ? previewQuotation.auditedAt.toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                                            : new Date(previewQuotation.auditedAt).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                </>
            )}
        </div>
    );
};

export default ProcurementHistoryPage;
