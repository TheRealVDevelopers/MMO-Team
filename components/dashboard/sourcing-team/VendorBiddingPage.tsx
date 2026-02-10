/**
 * Procurement: Vendor Bidding after quotation approval.
 * List cases with approved quotation → create bid round → invite vendors → compare bids → select vendor → admin approval → lock.
 */
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApprovedQuotationsForBidding } from '../../../hooks/useApprovedQuotationsForBidding';
import { useQuotationBids } from '../../../hooks/useQuotationBids';
import { useVendors } from '../../../hooks/useVendors';
import { formatCurrencyINR } from '../../../constants';
import { createVendorAccount } from '../../../services/authService';
import { UserRole } from '../../../types';
import type { QuotationBidDoc, QuotationBidLine } from '../../../types';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const VendorBiddingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { casesWithQuotations, loading: loadingCases, error: casesError } = useApprovedQuotationsForBidding();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null);

  const { bids, loading: loadingBids, createBidRound, selectVendor, setAdminApproval, lockVendor } = useQuotationBids(selectedCaseId ?? undefined);
  const selectedCase = casesWithQuotations.find((c) => c.caseId === selectedCaseId);
  const selectedQuotation = selectedCase?.quotations.find((q) => q.id === selectedQuotationId);
  const orgId = selectedCase?.organizationId;
  const { vendors, addVendor } = useVendors();

  const [inviteVendorIds, setInviteVendorIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  // Add Vendor Modal state
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorCategory, setVendorCategory] = useState('');
  const [vendorContactPerson, setVendorContactPerson] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorGst, setVendorGst] = useState('');
  const [savingVendor, setSavingVendor] = useState(false);

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      alert('Vendor name is required.');
      return;
    }
    if (!vendorEmail.trim()) {
      alert('Vendor email is required for login credentials.');
      return;
    }
    if (!currentUser?.id) {
      alert('You must be logged in to add a vendor.');
      return;
    }
    setSavingVendor(true);
    try {
      // 1) Create vendor document
      const vendorId = await addVendor({
        name: vendorName.trim(),
        category: vendorCategory.trim() || 'General',
        contactPerson: vendorContactPerson.trim() || undefined,
        phone: vendorPhone.trim() || undefined,
        email: vendorEmail.trim(),
        address: vendorAddress.trim() || undefined,
        gstNumber: vendorGst.trim() || undefined,
        isActive: true,
        createdBy: currentUser.id,
      });

      // 2) Create vendor login account with default password 123456
      try {
        await createVendorAccount({
          email: vendorEmail.trim(),
          name: vendorName.trim(),
          vendorId,
          phone: vendorPhone.trim() || '',
        });
        alert(`✅ Vendor "${vendorName}" created successfully!\n\nLogin credentials:\nEmail: ${vendorEmail.trim()}\nPassword: 123456\n\nVendor must change password on first login.\n\nYou have been signed out; please sign in again to continue.`);
      } catch (authErr: any) {
        console.error('Failed to create vendor auth account:', authErr);
        alert(`⚠️ Vendor "${vendorName}" added to list, but login account creation failed: ${authErr.message}\n\nYou may need to create the login manually.`);
      }

      // Reset form
      setShowAddVendor(false);
      setVendorName('');
      setVendorCategory('');
      setVendorContactPerson('');
      setVendorPhone('');
      setVendorEmail('');
      setVendorAddress('');
      setVendorGst('');
    } catch (e: any) {
      console.error(e);
      alert('Failed to add vendor: ' + (e.message || 'Unknown error'));
    } finally {
      setSavingVendor(false);
    }
  };

  const handleCreateBidRound = async () => {
    if (!selectedCaseId || !selectedQuotation || !currentUser) return;
    const itemLines: QuotationBidLine[] = selectedQuotation.items.map((it) => ({
      catalogItemId: it.catalogItemId,
      name: it.name,
      unit: it.unit,
      quantity: it.quantity,
      quotedRate: it.rate,
      total: it.total,
    }));
    if (inviteVendorIds.length === 0) {
      alert('Select at least one vendor to invite.');
      return;
    }
    setCreating(true);
    try {
      await createBidRound({
        quotationId: selectedQuotation.id,
        itemLines,
        invitedVendorIds: inviteVendorIds,
        createdBy: currentUser.id,
      });
      setSelectedQuotationId(null);
      setInviteVendorIds([]);
    } catch (e) {
      console.error(e);
      alert('Failed to create bid round.');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectVendor = async (bidDocId: string, vendorId: string) => {
    setActionBusy(bidDocId);
    try {
      await selectVendor(bidDocId, vendorId);
    } catch (e) {
      console.error(e);
      alert('Failed to select vendor.');
    } finally {
      setActionBusy(null);
    }
  };

  const handleAdminApproval = async (bidDocId: string) => {
    if (!currentUser || !isSuperAdmin) return;
    setActionBusy(bidDocId);
    try {
      await setAdminApproval(bidDocId, currentUser.id);
    } catch (e) {
      console.error(e);
      alert('Failed to record admin approval.');
    } finally {
      setActionBusy(null);
    }
  };

  const handleLockVendor = async (bidDocId: string) => {
    const bid = bids.find((b) => b.id === bidDocId);
    if (!bid?.adminApprovedAt) {
      alert('Admin approval is required before locking vendor.');
      return;
    }
    setActionBusy(bidDocId);
    try {
      await lockVendor(bidDocId);
    } catch (e) {
      console.error(e);
      alert('Failed to lock vendor.');
    } finally {
      setActionBusy(null);
    }
  };

  if (loadingCases) {
    return (
      <div className="p-6">
        <p className="text-text-secondary">Loading cases with approved quotations…</p>
      </div>
    );
  }
  if (casesError) {
    return (
      <div className="p-6">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">{casesError}</div>
      </div>
    );
  }

  // Add Vendor Modal – inlined JSX so inputs keep focus (no nested component re-creation)
  const addVendorModal = showAddVendor && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold text-text-primary">Add New Vendor</h3>
          <button type="button" onClick={() => setShowAddVendor(false)} className="p-2 hover:bg-subtle-background rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleAddVendor} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Vendor / Company Name *</label>
            <input
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full p-3 border border-border rounded-lg bg-background"
              placeholder="ABC Suppliers Pvt Ltd"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
            <input
              value={vendorCategory}
              onChange={(e) => setVendorCategory(e.target.value)}
              placeholder="e.g. Electrical, Furniture, Plumbing"
              className="w-full p-3 border border-border rounded-lg bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Contact Person</label>
            <input
              value={vendorContactPerson}
              onChange={(e) => setVendorContactPerson(e.target.value)}
              placeholder="John Doe"
              className="w-full p-3 border border-border rounded-lg bg-background"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Mobile Number</label>
              <input
                value={vendorPhone}
                onChange={(e) => setVendorPhone(e.target.value)}
                type="tel"
                placeholder="+91 98765 43210"
                className="w-full p-3 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Email * (for login)</label>
              <input
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                type="email"
                placeholder="vendor@example.com"
                className="w-full p-3 border border-border rounded-lg bg-background"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Address</label>
            <textarea
              value={vendorAddress}
              onChange={(e) => setVendorAddress(e.target.value)}
              placeholder="Full address including city, state, PIN"
              className="w-full p-3 border border-border rounded-lg bg-background"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">GST Number</label>
            <input
              value={vendorGst}
              onChange={(e) => setVendorGst(e.target.value)}
              placeholder="22AAAAA0000A1Z5"
              className="w-full p-3 border border-border rounded-lg bg-background"
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Login credentials:</strong> The vendor will be able to log in using their email and default password <strong>123456</strong>. They will be required to change their password on first login.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={savingVendor}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
            >
              {savingVendor ? 'Creating Vendor…' : 'Create Vendor'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddVendor(false)}
              className="px-4 py-3 border border-border rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Case list view
  if (!selectedCaseId) {
    return (
      <div className="p-6">
        {addVendorModal}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Vendor Bidding</h1>
            <p className="text-text-secondary">Start bidding for cases with approved quotations.</p>
          </div>
          <button
            onClick={() => setShowAddVendor(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Vendor
          </button>
        </div>
        {casesWithQuotations.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-8 text-center text-text-secondary">
            No cases with approved quotations. Approve a quotation in Audit Quotations first.
          </div>
        ) : (
          <div className="space-y-2">
            {casesWithQuotations.map((c) => (
              <button
                key={c.caseId}
                onClick={() => setSelectedCaseId(c.caseId)}
                className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-xl hover:bg-subtle-background text-left"
              >
                <div>
                  <p className="font-semibold text-text-primary">{c.caseTitle}</p>
                  <p className="text-sm text-text-secondary">{c.clientName} · {c.quotations.length} approved quotation(s)</p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-text-tertiary" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Case detail: quotations + bid rounds
  return (
    <div className="p-6">
      {addVendorModal}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { setSelectedCaseId(null); setSelectedQuotationId(null); setExpandedBidId(null); }}
          className="px-4 py-2 bg-subtle-background border border-border rounded-lg text-text-primary hover:bg-border/50"
        >
          ← Back to list
        </button>
        <button
          onClick={() => setShowAddVendor(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
        >
          <PlusIcon className="w-5 h-5" />
          Add New Vendor
        </button>
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">{selectedCase?.caseTitle}</h1>
      <p className="text-text-secondary mb-6">{selectedCase?.clientName}</p>

      {/* Start new bid round */}
      {selectedQuotation ? (
        <div className="mb-8 p-6 bg-surface border border-border rounded-xl">
          <h2 className="text-lg font-semibold text-text-primary mb-4">New bid round</h2>
          <p className="text-sm text-text-secondary mb-2">Quotation: {formatCurrencyINR(selectedQuotation.grandTotal)} · {selectedQuotation.items.length} items</p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-2">Invite vendors</label>
            <div className="flex flex-wrap gap-2">
              {vendors.map((v) => (
                <label key={v.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={inviteVendorIds.includes(v.id)}
                    onChange={(e) => {
                      if (e.target.checked) setInviteVendorIds((ids) => [...ids, v.id]);
                      else setInviteVendorIds((ids) => ids.filter((id) => id !== v.id));
                    }}
                    className="rounded border-border"
                  />
                  <span className="text-sm">{v.name}</span>
                </label>
              ))}
            </div>
            {vendors.length === 0 && (
              <p className="text-sm text-amber-600">
                No vendors available.{' '}
                <button
                  type="button"
                  onClick={() => setShowAddVendor(true)}
                  className="underline text-primary font-medium"
                >
                  Add a vendor
                </button>{' '}
                first.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateBidRound}
              disabled={creating || inviteVendorIds.length === 0}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create bid round'}
            </button>
            <button
              onClick={() => { setSelectedQuotationId(null); setInviteVendorIds([]); }}
              className="px-4 py-2 bg-subtle-background border border-border rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-sm text-text-secondary mb-2">Start a bid round from an approved quotation:</p>
          <div className="flex flex-wrap gap-2">
            {selectedCase?.quotations.map((q) => (
              <button
                key={q.id}
                onClick={() => setSelectedQuotationId(q.id)}
                className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20"
              >
                {formatCurrencyINR(q.grandTotal)} · {q.items.length} items
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Existing bid rounds */}
      <h2 className="text-lg font-semibold text-text-primary mb-4">Bid rounds</h2>
      {loadingBids ? (
        <p className="text-text-secondary">Loading…</p>
      ) : bids.length === 0 ? (
        <p className="text-text-secondary">No bid rounds yet.</p>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <BidRoundCard
              key={bid.id}
              bid={bid}
              vendors={vendors}
              expanded={expandedBidId === bid.id}
              onToggle={() => setExpandedBidId((id) => (id === bid.id ? null : bid.id))}
              onSelectVendor={handleSelectVendor}
              onAdminApproval={handleAdminApproval}
              onLockVendor={handleLockVendor}
              isSuperAdmin={isSuperAdmin}
              actionBusy={actionBusy}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function BidRoundCard({
  bid,
  vendors,
  expanded,
  onToggle,
  onSelectVendor,
  onAdminApproval,
  onLockVendor,
  isSuperAdmin,
  actionBusy,
}: {
  bid: QuotationBidDoc;
  vendors: { id: string; name: string }[];
  expanded: boolean;
  onToggle: () => void;
  onSelectVendor: (bidDocId: string, vendorId: string) => void;
  onAdminApproval: (bidDocId: string) => void;
  onLockVendor: (bidDocId: string) => void;
  isSuperAdmin: boolean;
  actionBusy: string | null;
}) {
  const locked = !!bid.lockedAt;
  const hasSelection = !!bid.selectedVendorId;
  const adminApproved = !!bid.adminApprovedAt;
  const selectedVendorName = hasSelection ? (bid.bids.find((b) => b.vendorId === bid.selectedVendorId)?.vendorName ?? vendors.find((v) => v.id === bid.selectedVendorId)?.name ?? bid.selectedVendorId) : null;
  const busy = actionBusy === bid.id;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-surface">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-subtle-background"
      >
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium text-text-primary">
              {bid.itemLines.length} items · {bid.bids.length} bid(s) · {bid.status}
            </p>
            {selectedVendorName && (
              <p className="text-sm text-text-secondary">Selected: {selectedVendorName}</p>
            )}
          </div>
          {locked && <LockClosedIcon className="w-5 h-5 text-green-600" />}
          {adminApproved && !locked && <CheckCircleIcon className="w-5 h-5 text-amber-600" title="Admin approved" />}
        </div>
        {expanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
      </button>
      {expanded && (
        <div className="p-4 border-t border-border space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary border-b">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Quoted rate</th>
              </tr>
            </thead>
            <tbody>
              {bid.itemLines.map((line, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2">{line.name}</td>
                  <td className="py-2 text-right">{line.quantity} {line.unit}</td>
                  <td className="py-2 text-right">{formatCurrencyINR(line.quotedRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <p className="text-sm font-medium text-text-primary mb-2">Bids</p>
            <div className="space-y-2">
              {bid.bids.map((b) => (
                <div key={b.vendorId} className="flex items-center justify-between p-2 bg-subtle-background rounded-lg">
                  <span className="font-medium">{b.vendorName}</span>
                  <span>{formatCurrencyINR(b.totalAmount)} · {b.deliveryDays} days</span>
                  {!locked && (
                    <button
                      onClick={() => onSelectVendor(bid.id, b.vendorId)}
                      disabled={busy}
                      className="px-3 py-1 bg-primary text-white rounded text-sm disabled:opacity-50"
                    >
                      {bid.selectedVendorId === b.vendorId ? 'Selected' : 'Select'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {!locked && hasSelection && (
            <div className="flex flex-wrap gap-2 pt-2">
              {isSuperAdmin && !adminApproved && (
                <button
                  onClick={() => onAdminApproval(bid.id)}
                  disabled={busy}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {busy ? '…' : 'Admin approve'}
                </button>
              )}
              {adminApproved && (
                <button
                  onClick={() => onLockVendor(bid.id)}
                  disabled={busy}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <LockClosedIcon className="w-4 h-4" />
                  {busy ? '…' : 'Lock vendor'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VendorBiddingPage;
