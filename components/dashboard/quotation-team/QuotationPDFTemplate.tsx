import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CaseQuotation, Case } from '../../../types';
import { formatCurrencyINR } from '../../../constants';
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI';
import { DocumentTextIcon } from '../../icons/IconComponents';
import { useAuth } from '../../../context/AuthContext';
import { UserRole } from '../../../types';
import { useCatalog } from '../../../hooks/useCatalog';

interface QuotationPDFTemplateProps {
    quotation: CaseQuotation;
    caseData: Case;
    onClose: () => void;
    onEdit?: () => void;
}

const QuotationPDFTemplate: React.FC<QuotationPDFTemplateProps> = ({ quotation, caseData, onClose, onEdit }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const { currentUser } = useAuth();
    const { items: catalogItems } = useCatalog();

    console.log('QuotationPDFTemplate rendered', { quotation, caseData, catalogItems });

    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Check if user can see PR (Internal Price Rate) field
    // Only visible to: Sales Manager (Sales General Manager), Quotation Team, Admin (Super Admin)
    const canViewPR = currentUser?.role && [
        UserRole.SALES_GENERAL_MANAGER, // Sales Manager
        UserRole.SUPER_ADMIN,           // Admin
        UserRole.ADMIN,                 // Admin
        UserRole.QUOTATION_TEAM         // Quotation Team
    ].includes(currentUser.role);

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
                // Close on backdrop click
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
                    <h3 className="text-lg font-bold text-text-primary">Quotation Preview</h3>
                    <div className="flex gap-3">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm flex items-center gap-2"
                            >
                                ✏️ Edit Quotation
                            </button>
                        )}
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

                    {/* Quotation Header */}
                    <div className="mb-8">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary mb-2">QUOTATION</h2>
                                <p className="text-sm text-text-secondary">
                                    <span className="font-semibold">Quotation No:</span> {quotation.quotationNumber}
                                </p>
                                <p className="text-sm text-text-secondary">
                                    <span className="font-semibold">Date:</span> {(() => {
                                        try {
                                            const d = quotation.submittedAt instanceof Date ? quotation.submittedAt :
                                                (quotation.submittedAt as any)?.toDate ? (quotation.submittedAt as any).toDate() :
                                                    new Date(quotation.submittedAt);
                                            return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
                                        } catch (e) { return 'Invalid Date'; }
                                    })()}
                                </p>
                                <p className="text-sm text-text-secondary">
                                    <span className="font-semibold">Valid Until:</span> {(() => {
                                        try {
                                            const d = quotation.submittedAt instanceof Date ? quotation.submittedAt :
                                                (quotation.submittedAt as any)?.toDate ? (quotation.submittedAt as any).toDate() :
                                                    new Date(quotation.submittedAt);
                                            const validUntil = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000);
                                            return validUntil.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
                                        } catch (e) { return 'Invalid Date'; }
                                    })()}
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-lg font-bold ${quotation.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                    quotation.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-700' :
                                        quotation.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                }`}>
                                {quotation.status}
                            </div>
                        </div>

                        {/* Client Details */}
                        <div className="bg-subtle-background p-4 rounded-lg">
                            <h3 className="text-sm font-bold text-text-primary mb-2">Bill To:</h3>
                            <p className="text-base font-semibold text-text-primary">{caseData.clientName}</p>
                            <p className="text-sm text-text-secondary">{caseData.projectName}</p>
                            <p className="text-sm text-text-secondary">Phone: {caseData.contact.phone}</p>
                            {caseData.contact.email && <p className="text-sm text-text-secondary">Email: {caseData.contact.email}</p>}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-primary text-white">
                                    <th className="border border-border p-3 text-left text-sm font-bold">S.No</th>
                                    <th className="border border-border p-3 text-left text-sm font-bold">Description</th>
                                    <th className="border border-border p-3 text-right text-sm font-bold">Qty</th>
                                    <th className="border border-border p-3 text-right text-sm font-bold">Unit Price</th>
                                    <th className="border border-border p-3 text-right text-sm font-bold">Discount</th>
                                    <th className="border border-border p-3 text-right text-sm font-bold">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotation.items.map((item, index) => {
                                    const lineTotal = item.unitPrice * item.quantity;
                                    const discountAmount = (lineTotal * item.discount) / 100;
                                    const finalAmount = lineTotal - discountAmount;

                                    // Find item name from catalog
                                    const catalogItem = catalogItems.find(ci => ci.id === item.itemId);
                                    const itemName = catalogItem?.name || `Item #${item.itemId.slice(-6)}`;
                                    const itemDescription = catalogItem?.description || '';

                                    return (
                                        <tr key={index} className="border-b border-border">
                                            <td className="border border-border p-3 text-sm">{index + 1}</td>
                                            <td className="border border-border p-3 text-sm">
                                                <div className="font-medium">{itemName}</div>
                                                {itemDescription && (
                                                    <div className="text-xs text-text-tertiary mt-1">{itemDescription}</div>
                                                )}
                                            </td>
                                            <td className="border border-border p-3 text-right text-sm">{item.quantity}</td>
                                            <td className="border border-border p-3 text-right text-sm">{formatCurrencyINR(item.unitPrice)}</td>
                                            <td className="border border-border p-3 text-right text-sm">{item.discount}%</td>
                                            <td className="border border-border p-3 text-right text-sm font-medium">{formatCurrencyINR(finalAmount)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="flex justify-end mb-8">
                        <div className="w-80">
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-sm text-text-secondary">Subtotal:</span>
                                <span className="text-sm font-medium text-text-primary">{formatCurrencyINR(quotation.totalAmount - quotation.discountAmount)}</span>
                            </div>
                            {quotation.discountAmount > 0 && (
                                <div className="flex justify-between py-2 border-b border-border">
                                    <span className="text-sm text-text-secondary">Discount:</span>
                                    <span className="text-sm font-medium text-error">- {formatCurrencyINR(quotation.discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-sm text-text-secondary">Tax (GST 18%):</span>
                                <span className="text-sm font-medium text-text-primary">{formatCurrencyINR(quotation.taxAmount)}</span>
                            </div>
                            <div className="flex justify-between py-3 bg-primary/10 px-4 rounded-lg mt-2">
                                <span className="text-lg font-bold text-text-primary">Total Amount:</span>
                                <span className="text-lg font-bold text-primary">{formatCurrencyINR(quotation.finalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* PR (Internal Price Rate) Field - Visible only to authorized roles */}
                    {canViewPR && quotation.internalPRCode && (
                        <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded print:hidden">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-yellow-800 mb-1">🔒 Internal PR Code (Confidential)</h4>
                                    <p className="text-sm text-yellow-700">
                                        <span className="font-semibold">PR Code:</span> {quotation.internalPRCode}
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                        ⚠️ This field is confidential and visible only to Sales Manager, Admin, and Quotation Team.
                                        <br />
                                        <strong>NOT included in printed/downloaded PDF.</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Terms & Conditions */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-text-primary mb-3 border-b border-border pb-2">Terms & Conditions:</h3>
                        <ul className="space-y-2 text-xs text-text-secondary">
                            <li>• Payment Terms: 30% advance, 40% on material delivery, 30% on completion</li>
                            <li>• Validity: This quotation is valid for 30 days from the date of issue</li>
                            <li>• Delivery: Subject to site readiness and material availability</li>
                            <li>• Warranty: 1 year warranty on workmanship and materials</li>
                            <li>• Changes: Any changes to the scope will be charged additionally</li>
                            <li>• GST: All prices are inclusive of 18% GST</li>
                        </ul>
                    </div>

                    {/* Notes */}
                    {quotation.notes && (
                        <div className="mb-8 p-4 bg-subtle-background rounded-lg">
                            <h4 className="text-sm font-bold text-text-primary mb-2">Additional Notes:</h4>
                            <p className="text-sm text-text-secondary">{quotation.notes}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="border-t-2 border-border pt-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-text-tertiary mb-4">For any queries, please contact:</p>
                                <p className="text-sm font-semibold text-text-primary">Sales Team</p>
                                <p className="text-sm text-text-secondary">Phone: +91 XXXXX XXXXX</p>
                                <p className="text-sm text-text-secondary">Email: sales@makemyoffice.com</p>
                            </div>
                            <div className="text-right">
                                <div className="mb-8">
                                    <div className="h-16 border-b-2 border-text-primary w-48"></div>
                                </div>
                                <p className="text-sm font-semibold text-text-primary">Authorized Signatory</p>
                                <p className="text-xs text-text-tertiary">Make My Office</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-text-tertiary">
                            This is a computer-generated quotation and does not require a physical signature.
                        </p>
                        <p className="text-xs text-text-tertiary mt-1">
                            Thank you for choosing Make My Office!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render modal using portal to document.body
    return createPortal(modalContent, document.body);
};

export default QuotationPDFTemplate;
