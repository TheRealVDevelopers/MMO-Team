import React, { useState, useEffect } from 'react';
import Card from '../../shared/Card';
import { useInvoices } from '../../../hooks/useInvoices';
import { useVendorBills } from '../../../hooks/useVendorBills';
import { DocumentTextIcon, BanknotesIcon } from '@heroicons/react/24/outline';

const TaxAndGSTPage: React.FC = () => {
    const { invoices, loading: invLoading } = useInvoices();
    const { vendorBills, loading: billLoading } = useVendorBills();

    const [view, setView] = useState<'summary' | 'gstr1' | 'gstr3b'>('summary');
    const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

    if (invLoading || billLoading) return <div className="p-8">Loading GST Data...</div>;

    // Filter by selected period
    // Use issueDate for date filtering
    const periodInvoices = invoices.filter(i => new Date(i.issueDate).toISOString().includes(period));
    const periodBills = vendorBills.filter(b => new Date(b.issueDate).toISOString().includes(period));

    // Calculate Summary
    // Invoice uses 'total', VendorBill uses 'amount'
    const totalSales = periodInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const totalOutputTax = totalSales * 0.18; // Assuming flat 18% for demo

    const totalPurchases = periodBills.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalInputCredit = totalPurchases * 0.18; // Assuming flat 18% for demo

    const taxPayable = Math.max(0, totalOutputTax - totalInputCredit);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Tax & GST Filing</h1>
                    <p className="text-text-secondary">GSTR-1, GSTR-3B & Input Tax Credit (ITC)</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="month"
                        value={period}
                        onChange={e => setPeriod(e.target.value)}
                        className="p-2 border rounded bg-surface"
                    />
                    <button className="px-4 py-2 bg-primary text-white rounded">File Return</button>
                </div>
            </div>

            {/* --- Summary Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                        <BanknotesIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-blue-800">Total Sales (Taxable)</h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">₹{totalSales.toLocaleString()}</p>
                    <p className="text-sm text-blue-700">Output Tax: ₹{totalOutputTax.toLocaleString()}</p>
                </Card>

                <Card className="bg-orange-50 border-orange-100">
                    <div className="flex items-center gap-2 mb-2">
                        <DocumentTextIcon className="w-5 h-5 text-orange-600" />
                        <h3 className="font-bold text-orange-800">Total Purchases (ITC)</h3>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">₹{totalPurchases.toLocaleString()}</p>
                    <p className="text-sm text-orange-700">Input Credit: ₹{totalInputCredit.toLocaleString()}</p>
                </Card>

                <Card className="bg-red-50 border-red-100">
                    <div className="flex items-center gap-2 mb-2">
                        <BanknotesIcon className="w-5 h-5 text-red-600" />
                        <h3 className="font-bold text-red-800">Net Tax Payable</h3>
                    </div>
                    <p className="text-2xl font-bold text-red-900">₹{taxPayable.toLocaleString()}</p>
                    <p className="text-sm text-red-700">After ITC Adjustment</p>
                </Card>

                <Card className="bg-green-50 border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                        <DocumentTextIcon className="w-5 h-5 text-green-600" />
                        <h3 className="font-bold text-green-800">Filing Status</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-900">Pending</p>
                    <p className="text-sm text-green-700">Due: 20th of next month</p>
                </Card>
            </div>

            {/* --- Detail Tabs --- */}
            <div className="border-b flex gap-4">
                <button
                    onClick={() => setView('summary')}
                    className={`py-2 px-4 border-b-2 ${view === 'summary' ? 'border-primary font-bold text-primary' : 'border-transparent'}`}
                >
                    GST Calculation Summary
                </button>
                <button
                    onClick={() => setView('gstr1')}
                    className={`py-2 px-4 border-b-2 ${view === 'gstr1' ? 'border-primary font-bold text-primary' : 'border-transparent'}`}
                >
                    GSTR-1 (Sales)
                </button>
                <button
                    onClick={() => setView('gstr3b')}
                    className={`py-2 px-4 border-b-2 ${view === 'gstr3b' ? 'border-primary font-bold text-primary' : 'border-transparent'}`}
                >
                    GSTR-2A (Purchases)
                </button>
            </div>

            <Card>
                {view === 'summary' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg">Tax Liability Calculation</h3>
                        <table className="w-full text-left">
                            <thead className="bg-subtle-background">
                                <tr>
                                    <th className="p-3">Description</th>
                                    <th className="p-3 text-right">Taxable Value</th>
                                    <th className="p-3 text-right">IGST</th>
                                    <th className="p-3 text-right">CGST</th>
                                    <th className="p-3 text-right">SGST</th>
                                    <th className="p-3 text-right">Total Tax</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="p-3">Outward Supplies (Sales)</td>
                                    <td className="p-3 text-right">₹{totalSales.toLocaleString()}</td>
                                    <td className="p-3 text-right">₹{(totalOutputTax * 0.5).toLocaleString()}</td>
                                    <td className="p-3 text-right">₹{(totalOutputTax * 0.25).toLocaleString()}</td>
                                    <td className="p-3 text-right">₹{(totalOutputTax * 0.25).toLocaleString()}</td>
                                    <td className="p-3 text-right font-bold">₹{totalOutputTax.toLocaleString()}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="p-3">Less: Inward Supplies (ITC)</td>
                                    <td className="p-3 text-right">₹{totalPurchases.toLocaleString()}</td>
                                    <td className="p-3 text-right">₹{(totalInputCredit * 0.5).toLocaleString()}</td>
                                    <td className="p-3 text-right">₹{(totalInputCredit * 0.25).toLocaleString()}</td>
                                    <td className="p-3 text-right">₹{(totalInputCredit * 0.25).toLocaleString()}</td>
                                    <td className="p-3 text-right font-bold text-green-600">(-) ₹{totalInputCredit.toLocaleString()}</td>
                                </tr>
                                <tr className="bg-subtle-background font-bold">
                                    <td className="p-3">Net Tax Payable in Cash</td>
                                    <td className="p-3 text-right">-</td>
                                    <td className="p-3 text-right">-</td>
                                    <td className="p-3 text-right">-</td>
                                    <td className="p-3 text-right">-</td>
                                    <td className="p-3 text-right text-red-600">₹{taxPayable.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {view === 'gstr1' && (
                    <div>
                        <h3 className="font-bold text-lg mb-4">GSTR-1: Details of Outward Supplies</h3>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-subtle-background">
                                <tr>
                                    <th className="p-2">Invoice Date</th>
                                    <th className="p-2">Invoice No</th>
                                    <th className="p-2">Customer</th>
                                    <th className="p-2 text-right">Taxable Value</th>
                                    <th className="p-2 text-right">Tax (18%)</th>
                                    <th className="p-2 text-right">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {periodInvoices.map(inv => (
                                    <tr key={inv.id} className="border-b">
                                        <td className="p-2">{new Date(inv.issueDate).toLocaleDateString()}</td>
                                        <td className="p-2">{inv.invoiceNumber}</td>
                                        <td className="p-2">{inv.clientName}</td>
                                        <td className="p-2 text-right">₹{(inv.total || 0).toLocaleString()}</td>
                                        <td className="p-2 text-right">₹{((inv.total || 0) * 0.18).toLocaleString()}</td>
                                        <td className="p-2 text-right">₹{((inv.total || 0) * 1.18).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {view === 'gstr3b' && (
                    <div>
                        <h3 className="font-bold text-lg mb-4">GSTR-2A/2B: Details of Inward Supplies</h3>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-subtle-background">
                                <tr>
                                    <th className="p-2">Bill Date</th>
                                    <th className="p-2">Bill No</th>
                                    <th className="p-2">Vendor</th>
                                    <th className="p-2 text-right">Taxable Value</th>
                                    <th className="p-2 text-right">ITC Available (18%)</th>
                                    <th className="p-2 text-right">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {periodBills.map(bill => (
                                    <tr key={bill.id} className="border-b">
                                        <td className="p-2">{new Date(bill.issueDate).toLocaleDateString()}</td>
                                        <td className="p-2">{bill.invoiceNumber}</td>
                                        <td className="p-2">{bill.vendorName}</td>
                                        <td className="p-2 text-right">₹{bill.amount.toLocaleString()}</td>
                                        <td className="p-2 text-right">₹{(bill.amount * 0.18).toLocaleString()}</td>
                                        <td className="p-2 text-right">₹{(bill.amount * 1.18).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TaxAndGSTPage;
