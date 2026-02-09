/**
 * Accounts: List procurement plans with status DELIVERED and no invoice yet.
 * Create purchase invoice from plan → then mark plan INVOICED (cost center updated by usePurchaseInvoices).
 */
import React, { useState } from 'react';
import { useDeliveredPlansPendingInvoice, markProcurementPlanInvoiced } from '../../../hooks/useProcurementPlans';
import { formatDate } from '../../../constants';
import { TruckIcon } from '@heroicons/react/24/outline';

interface DeliveredPendingInvoicePageProps {
  setCurrentPage: (page: string) => void;
  onCreatePurchaseInvoice: (input: {
    caseId?: string;
    vendorName: string;
    invoiceNumber: string;
    amount: number;
    issueDate: Date;
    dueDate?: Date;
  }) => Promise<string>;
}

const DeliveredPendingInvoicePage: React.FC<DeliveredPendingInvoicePageProps> = ({
  setCurrentPage,
  onCreatePurchaseInvoice,
}) => {
  const { plans, loading, error } = useDeliveredPlansPendingInvoice();
  const [creatingFor, setCreatingFor] = useState<{ caseId: string; planId: string; vendorName: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCreateInvoice = async () => {
    if (!creatingFor) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Enter a valid amount.');
      return;
    }
    if (!invoiceNumber.trim()) {
      alert('Enter invoice number.');
      return;
    }
    setBusy(true);
    try {
      const invoiceId = await onCreatePurchaseInvoice({
        caseId: creatingFor.caseId,
        vendorName: creatingFor.vendorName,
        invoiceNumber: invoiceNumber.trim(),
        amount: amt,
        issueDate: new Date(),
      });
      await markProcurementPlanInvoiced(creatingFor.caseId, creatingFor.planId, invoiceId);
      setCreatingFor(null);
      setAmount('');
      setInvoiceNumber('');
    } catch (e) {
      console.error(e);
      alert('Failed to create invoice.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentPage('vendor-bills')}
          className="text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <TruckIcon className="w-6 h-6" />
            Delivered – Pending Invoice
          </h2>
          <p className="text-sm text-text-secondary">Create purchase invoice from delivered procurement plans. Cost center is updated on create.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-text-secondary">Loading…</p>
      ) : plans.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-secondary">
          No delivered plans pending invoice.
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-subtle-background">
              <tr>
                <th className="p-3 text-left">Item</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-left">Vendor</th>
                <th className="p-3 text-left">Case</th>
                <th className="p-3 text-left">Delivered</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 font-medium">{p.itemName}</td>
                  <td className="p-3 text-right">{p.quantity}</td>
                  <td className="p-3">{p.vendorName}</td>
                  <td className="p-3">{p.caseId}</td>
                  <td className="p-3">{p.deliveredAt ? formatDate(p.deliveredAt) : '—'}</td>
                  <td className="p-3">
                    <button
                      onClick={() =>
                        setCreatingFor({
                          caseId: p.caseId,
                          planId: p.id,
                          vendorName: p.vendorName,
                        })
                      }
                      className="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                    >
                      Create invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creatingFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Create purchase invoice</h3>
            <p className="text-sm text-text-secondary mb-2">Vendor: {creatingFor.vendorName}</p>
            <p className="text-sm text-text-secondary mb-4">Case: {creatingFor.caseId}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Invoice number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. PI-2024-001"
                  className="w-full p-2 border border-border rounded-lg bg-background"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateInvoice}
                disabled={busy}
                className="flex-1 py-2 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
              >
                {busy ? 'Creating…' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setCreatingFor(null);
                  setAmount('');
                  setInvoiceNumber('');
                }}
                className="px-4 py-2 border border-border rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveredPendingInvoicePage;
