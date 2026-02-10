
import React from 'react';
import { Invoice } from '../../../types';
import { COMPANY_DETAILS, formatCurrencyINR, formatDate } from '../../../constants';
import { ArrowDownTrayIcon } from '../../icons/IconComponents';

interface InvoicePreviewProps {
    invoice: Invoice;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
    // Defensive defaults for optional/potentially undefined fields
    const safeInvoice = {
        ...invoice,
        items: invoice.items || [],
        subTotal: invoice.subTotal || 0,
        taxAmount: invoice.taxAmount || 0,
        total: invoice.total || 0,
        paidAmount: invoice.paidAmount || 0,
        discountValue: invoice.discountValue || 0,
        bankDetails: invoice.bankDetails || { bank: '', accountNo: '', ifsc: '' },
    };

    const handlePrint = () => {
        window.print();
    }

    return (
        <>
            <style>
            {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #invoice-preview, #invoice-preview * {
                        visibility: visible;
                    }
                    #invoice-preview {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none;
                    }
                }
            `}
            </style>
            <div className="no-print absolute top-4 right-4 flex space-x-2">
                 <button onClick={handlePrint} className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary">
                    <ArrowDownTrayIcon className="w-4 h-4"/>
                    <span>Print / Download</span>
                </button>
            </div>
            <div id="invoice-preview" className="p-8 font-sans text-sm text-gray-800 bg-white">
                <header className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
                    <div>
                        <img src={COMPANY_DETAILS.logo} alt="Company Logo" className="h-16 w-auto" />
                        <h1 className="text-2xl font-bold text-gray-800 mt-2">{COMPANY_DETAILS.name}</h1>
                        <p className="text-xs text-gray-500">{COMPANY_DETAILS.address}</p>
                        <p className="text-xs text-gray-500">GSTIN: {COMPANY_DETAILS.gstin}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold uppercase text-gray-400">Invoice</h2>
                        <p className="text-gray-500"><span className="font-semibold">#</span> {invoice.invoiceNumber}</p>
                        <p className="text-gray-500"><span className="font-semibold">Date:</span> {formatDate(invoice.issueDate)}</p>
                    </div>
                </header>

                <section className="mt-6 grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-xs uppercase font-semibold text-gray-500">Bill To</h3>
                        <p className="font-bold text-gray-800">{invoice.clientName}</p>
                        <p className="text-gray-500">{invoice.clientAddress}</p>
                        <p className="text-gray-500">GSTIN: {invoice.clientGstin}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs uppercase font-semibold text-gray-500">Payment Due</h3>
                        <p className="text-2xl font-bold text-gray-800">{formatCurrencyINR(safeInvoice.total - safeInvoice.paidAmount)}</p>
                        <p className="text-gray-500">Due on {formatDate(invoice.dueDate)}</p>
                    </div>
                </section>

                <section className="mt-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 text-xs uppercase">
                                <th className="p-2">Description</th>
                                <th className="p-2 text-center">HSN/SAC</th>
                                <th className="p-2 text-center">Qty</th>
                                <th className="p-2 text-right">Rate</th>
                                <th className="p-2 text-center">Tax</th>
                                <th className="p-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {safeInvoice.items.map(item => (
                                <tr key={item.id}>
                                    <td className="p-2">{item.description}</td>
                                    <td className="p-2 text-center">{item.hsn}</td>
                                    <td className="p-2 text-center">{item.quantity}</td>
                                    <td className="p-2 text-right">{formatCurrencyINR(item.rate)}</td>
                                    <td className="p-2 text-center">{item.taxRate}%</td>
                                    <td className="p-2 text-right font-medium">{formatCurrencyINR(item.quantity * item.rate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="mt-6 flex justify-end">
                    <div className="w-full max-w-xs space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium text-gray-800">{formatCurrencyINR(safeInvoice.subTotal)}</span>
                        </div>
                         {safeInvoice.discountValue > 0 && (
                             <div className="flex justify-between">
                                <span className="text-gray-500">Discount</span>
                                <span className="font-medium text-gray-800">-{formatCurrencyINR(safeInvoice.discountValue)}</span>
                            </div>
                         )}
                        <div className="flex justify-between">
                            <span className="text-gray-500">Taxes</span>
                            <span className="font-medium text-gray-800">{formatCurrencyINR(safeInvoice.taxAmount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                            <span className="text-gray-800">Total</span>
                            <span className="text-primary">{formatCurrencyINR(safeInvoice.total)}</span>
                        </div>
                         {safeInvoice.paidAmount > 0 && (
                            <div className="flex justify-between text-secondary">
                                <span className="">Amount Paid</span>
                                <span className="font-medium">-{formatCurrencyINR(safeInvoice.paidAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-primary">
                            <span className="text-gray-800">Balance Due</span>
                            <span className="text-primary">{formatCurrencyINR(safeInvoice.total - safeInvoice.paidAmount)}</span>
                        </div>
                    </div>
                </section>
                
                 <div className="text-right text-xs text-gray-500 mt-1">
                    Amount in words: <span className="font-semibold">{invoice.amountInWords}</span>
                </div>

                <footer className="mt-8 pt-4 border-t-2 border-gray-200 text-xs text-gray-500">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-gray-600 mb-1">Notes</h4>
                            <p>{invoice.notes}</p>
                            <h4 className="font-semibold text-gray-600 mt-2 mb-1">Bank Details</h4>
                            <p><strong>Bank:</strong> {safeInvoice.bankDetails.bank}</p>
                            <p><strong>A/C No:</strong> {safeInvoice.bankDetails.accountNo}</p>
                            <p><strong>IFSC:</strong> {safeInvoice.bankDetails.ifsc}</p>
                        </div>
                        <div>
                             <h4 className="font-semibold text-gray-600 mb-1">Terms & Conditions</h4>
                            <p>{invoice.terms}</p>
                        </div>
                    </div>
                    <div className="text-center mt-6">
                        <p>Thank you for doing business with us.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}

export default InvoicePreview;
