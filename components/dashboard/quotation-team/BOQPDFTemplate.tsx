import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CaseBOQ, Case } from '../../../types';
import { formatCurrencyINR } from '../../../constants';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';
import { DocumentTextIcon } from '../../icons/IconComponents';

interface BOQPDFTemplateProps {
    boq: CaseBOQ;
    caseData: Case;
    onClose: () => void;
}

const BOQPDFTemplate: React.FC<BOQPDFTemplateProps> = ({ boq, caseData, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);

    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleDownloadPDF = () => {
        if (printRef.current) {
            window.print();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-4xl w-full my-8 relative"
                style={{
                    maxHeight: '90vh',
                    overflow: 'auto',
                    zIndex: 10000
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Action Buttons - Hidden in Print */}
                <div className="flex items-center justify-between p-4 border-b border-border print:hidden">
                    <h3 className="text-lg font-bold text-text-primary">BOQ Preview</h3>
                    <div className="flex gap-3">
                        <SecondaryButton onClick={handlePrint}>
                            <DocumentTextIcon className="w-5 h-5 mr-2" />
                            Print
                        </SecondaryButton>
                        <PrimaryButton onClick={handleDownloadPDF}>
                            Download PDF
                        </PrimaryButton>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div ref={printRef} className="p-8 bg-white">
                    {/* Company Header */}
                    <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-primary">
                        <div className="flex items-center gap-4">
                            {/* Logo */}
                            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">MMO</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-primary">Make My Office</h1>
                                <p className="text-sm text-text-secondary">Interior Design & Execution Experts</p>
                                <p className="text-xs text-text-tertiary mt-1">GST: 29XXXXX1234X1ZX</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-text-tertiary">Corporate Office</p>
                            <p className="text-sm text-text-secondary">Bangalore, Karnataka</p>
                            <p className="text-sm text-text-secondary">Phone: +91 XXXXX XXXXX</p>
                            <p className="text-sm text-text-secondary">Email: info@makemyoffice.com</p>
                        </div>
                    </div>

                    {/* BOQ Header */}
                    <div className="mb-8">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary mb-2">BILL OF QUANTITIES</h2>
                                <p className="text-sm text-text-secondary">
                                    <span className="font-semibold">BOQ No:</span> BOQ-{boq.id.slice(-6).toUpperCase()}
                                </p>
                                <p className="text-sm text-text-secondary">
                                    <span className="font-semibold">Date:</span> {(() => {
                                        try {
                                            const d = boq.createdAt instanceof Date ? boq.createdAt :
                                                (boq.createdAt as any)?.toDate ? (boq.createdAt as any).toDate() :
                                                    new Date(boq.createdAt);
                                            return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
                                        } catch (e) { return 'Invalid Date'; }
                                    })()}
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-lg font-bold ${
                                boq.status === 'approved' ? 'bg-green-100 text-green-700' :
                                boq.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                boq.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {boq.status?.toUpperCase() || 'DRAFT'}
                            </div>
                        </div>

                        {/* Project Details */}
                        <div className="bg-subtle-background p-4 rounded-lg">
                            <h3 className="text-sm font-bold text-text-primary mb-2">Project Details:</h3>
                            <p className="text-base font-semibold text-text-primary">{caseData.clientName}</p>
                            <p className="text-sm text-text-secondary">{caseData.title || caseData.projectName}</p>
                            <p className="text-sm text-text-secondary">Phone: {caseData.contact?.phone || caseData.clientPhone}</p>
                            {(caseData.contact?.email || caseData.clientEmail) && (
                                <p className="text-sm text-text-secondary">Email: {caseData.contact?.email || caseData.clientEmail}</p>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-primary text-white">
                                    <th className="border border-border p-3 text-left text-sm font-bold">S.No</th>
                                    <th className="border border-border p-3 text-left text-sm font-bold">Description</th>
                                    <th className="border border-border p-3 text-center text-sm font-bold">Unit</th>
                                    <th className="border border-border p-3 text-right text-sm font-bold">Qty</th>
                                    <th className="border border-border p-3 text-right text-sm font-bold">Rate</th>
                                    <th className="border border-border p-3 text-right text-sm font-bold">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {boq.items.map((item, index) => {
                                    const itemTotal = (item.rate || 0) * (item.quantity || 0);
                                    return (
                                        <tr key={index} className="border-b border-border">
                                            <td className="border border-border p-3 text-sm">{index + 1}</td>
                                            <td className="border border-border p-3 text-sm">
                                                <div className="font-medium">{item.name || item.description || `Item #${index + 1}`}</div>
                                                {item.description && item.name && (
                                                    <div className="text-xs text-text-tertiary mt-1">{item.description}</div>
                                                )}
                                            </td>
                                            <td className="border border-border p-3 text-center text-sm">{item.unit || 'pcs'}</td>
                                            <td className="border border-border p-3 text-right text-sm">{item.quantity}</td>
                                            <td className="border border-border p-3 text-right text-sm">{formatCurrencyINR(item.rate || 0)}</td>
                                            <td className="border border-border p-3 text-right text-sm font-medium">{formatCurrencyINR(item.total || itemTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="flex justify-end mb-8">
                        <div className="w-80">
                            <div className="flex justify-between py-3 bg-primary/10 px-4 rounded-lg">
                                <span className="text-lg font-bold text-text-primary">Subtotal:</span>
                                <span className="text-lg font-bold text-primary">{formatCurrencyINR(boq.subtotal)}</span>
                            </div>
                            <p className="text-xs text-text-tertiary mt-2 text-right">
                                * Tax and additional charges will be calculated in the quotation
                            </p>
                        </div>
                    </div>

                    {/* Notes */}
                    {boq.notes && (
                        <div className="mb-8 p-4 bg-subtle-background rounded-lg">
                            <h4 className="text-sm font-bold text-text-primary mb-2">Notes:</h4>
                            <p className="text-sm text-text-secondary">{boq.notes}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="border-t-2 border-border pt-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-text-tertiary mb-4">For any queries, please contact:</p>
                                <p className="text-sm font-semibold text-text-primary">Design Team</p>
                                <p className="text-sm text-text-secondary">Phone: +91 XXXXX XXXXX</p>
                                <p className="text-sm text-text-secondary">Email: design@makemyoffice.com</p>
                            </div>
                            <div className="text-right">
                                <div className="mb-8">
                                    <div className="h-16 border-b-2 border-text-primary w-48"></div>
                                </div>
                                <p className="text-sm font-semibold text-text-primary">Prepared By</p>
                                <p className="text-xs text-text-tertiary">Make My Office</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-text-tertiary">
                            This is a computer-generated Bill of Quantities.
                        </p>
                        <p className="text-xs text-text-tertiary mt-1">
                            Subject to final approval and quotation confirmation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render modal using portal to document.body
    return createPortal(modalContent, document.body);
};

export default BOQPDFTemplate;
