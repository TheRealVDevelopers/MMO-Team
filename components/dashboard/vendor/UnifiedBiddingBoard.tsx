/**
 * Vendor Portal: Assigned bid rounds (from quotationBids where invited) + delivery schedules (procurementPlans by vendor).
 * Vendor can submit/update bid (price, delivery days). Vendor cannot see other vendors or budgets.
 */
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useQuotationBidsForVendor, submitVendorBid } from '../../../hooks/useQuotationBids';
import { useProcurementPlansByVendor } from '../../../hooks/useProcurementPlans';
import { formatCurrencyINR, formatDate } from '../../../constants';
import { DocumentTextIcon, TruckIcon } from '@heroicons/react/24/outline';
import type { QuotationBidDoc } from '../../../types';

const UnifiedBiddingBoard: React.FC = () => {
  const { currentVendor } = useAuth();
  const { bids, loading: loadingBids, error: bidsError } = useQuotationBidsForVendor(currentVendor?.id);
  const { plans, loading: loadingPlans } = useProcurementPlansByVendor(currentVendor?.id);

  const openBids = bids.filter((b) => b.status === 'open');
  const [selectedBid, setSelectedBid] = useState<QuotationBidDoc | null>(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const myBidFor = (bid: QuotationBidDoc) => bid.bids.find((b) => b.vendorId === currentVendor?.id);

  const handleSubmitBid = async () => {
    if (!selectedBid || !currentVendor) return;
    const amount = parseFloat(totalAmount);
    const days = parseInt(deliveryDays, 10);
    if (isNaN(amount) || amount < 0 || isNaN(days) || days < 0) {
      alert('Enter valid amount and delivery days.');
      return;
    }
    setSubmitting(true);
    try {
      await submitVendorBid(selectedBid.caseId, selectedBid.id, {
        vendorId: currentVendor.id,
        vendorName: currentVendor.name,
        totalAmount: amount,
        deliveryDays: days,
      });
      setSelectedBid(null);
      setTotalAmount('');
      setDeliveryDays('');
    } catch (e) {
      console.error(e);
      alert('Failed to submit bid.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentVendor) {
    return (
      <div className="p-8 text-center text-text-secondary">
        Vendor session not found. Please sign in again.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-serif font-black text-text-primary">Live Bidding Board</h2>
        <p className="text-text-secondary text-sm">View invited bid rounds and submit your quotation.</p>
      </div>

      {bidsError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">{bidsError}</div>
      )}

      {/* Bid rounds */}
      <section>
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5" />
          Invited bid rounds
        </h3>
        {loadingBids ? (
          <p className="text-text-secondary">Loading…</p>
        ) : openBids.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center text-text-secondary">
            No open bid rounds at the moment. New invitations will appear here.
          </div>
        ) : (
          <div className="space-y-4">
            {openBids.map((bid) => {
              const myBid = myBidFor(bid);
              return (
                <div
                  key={bid.id}
                  className="bg-surface border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-text-primary">{bid.itemLines.length} items</p>
                      <p className="text-sm text-text-secondary mt-1">
                        {bid.itemLines.map((l) => l.name).join(', ').slice(0, 80)}
                        {bid.itemLines.map((l) => l.name).join('').length > 80 ? '…' : ''}
                      </p>
                      {myBid && (
                        <p className="text-sm text-primary font-medium mt-2">
                          Your bid: {formatCurrencyINR(myBid.totalAmount)} · {myBid.deliveryDays} days
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBid(bid);
                        const b = myBidFor(bid);
                        setTotalAmount(b ? String(b.totalAmount) : '');
                        setDeliveryDays(b ? String(b.deliveryDays) : '');
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90"
                    >
                      {myBid ? 'Update bid' : 'Submit bid'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Delivery schedules */}
      <section>
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <TruckIcon className="w-5 h-5" />
          Your delivery schedules
        </h3>
        {loadingPlans ? (
          <p className="text-text-secondary">Loading…</p>
        ) : plans.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-6 text-center text-text-secondary text-sm">
            No delivery schedules assigned yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-subtle-background">
                <tr>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-left">Expected delivery</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3 font-medium">{p.itemName}</td>
                    <td className="p-3 text-right">{p.quantity}</td>
                    <td className="p-3">{p.expectedDeliveryDate ? formatDate(p.expectedDeliveryDate) : '—'}</td>
                    <td className="p-3">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Submit/Update bid modal */}
      {selectedBid && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Submit your bid</h3>
            <p className="text-sm text-text-secondary mb-4">{selectedBid.itemLines.length} items</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Total amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Delivery (days)</label>
                <input
                  type="number"
                  min="0"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-background"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSubmitBid}
                disabled={submitting}
                className="flex-1 py-2 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
              <button
                onClick={() => { setSelectedBid(null); setTotalAmount(''); setDeliveryDays(''); }}
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

export default UnifiedBiddingBoard;
