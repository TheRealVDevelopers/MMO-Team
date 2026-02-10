/**
 * Request Validation – for all staff.
 * Submit expense, travel, leave, or other requests for validation.
 * Once admin approves, they go to Accounts and can be added to salary.
 */

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSubmitValidationRequest, useValidationRequests } from '../../../hooks/useValidationRequests';
import { ValidationRequestType, ValidationRequest } from '../../../types';
import { formatCurrencyINR, safeDateTime } from '../../../constants';
import { ClipboardDocumentCheckIcon, PlusIcon, XMarkIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ContentCard } from './DashboardUI';
import { DEFAULT_ORGANIZATION_ID } from '../../../constants';

const TYPE_LABELS: Record<ValidationRequestType, string> = {
  EXPENSE: 'Expense / Company purchase',
  TRAVEL: 'Travel / Distance',
  LEAVE: 'Leave request',
  OTHER: 'Other',
};

const RequestValidationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const orgId = currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;
  const { submit, submitting, error: submitError } = useSubmitValidationRequest();
  const { requests: myRequests, loading } = useValidationRequests({ organizationId: orgId, userId: currentUser?.id });
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<ValidationRequestType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = amount ? parseFloat(amount) : undefined;
    const numDist = distanceKm ? parseFloat(distanceKm) : undefined;
    const id = await submit({
      type,
      amount: numAmount,
      distanceKm: numDist,
      description: description.trim(),
      receiptUrl: receiptUrl.trim() || undefined,
      leaveFrom: leaveFrom || undefined,
      leaveTo: leaveTo || undefined,
    });
    if (id) {
      setShowForm(false);
      setAmount('');
      setDistanceKm('');
      setDescription('');
      setReceiptUrl('');
      setLeaveFrom('');
      setLeaveTo('');
    }
  };

  const statusBadge = (r: ValidationRequest) => {
    if (r.status === 'APPROVED') return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Approved</span>;
    if (r.status === 'REJECTED') return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Pending</span>;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="w-7 h-7 text-primary" />
            Request Validation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit expenses, travel, leave or other requests. Once approved by admin, they go to Accounts and can be added to your salary.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90"
        >
          <PlusIcon className="w-5 h-5" />
          New request
        </button>
      </div>

      {showForm && (
        <ContentCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Submit validation request</h2>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-100">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ValidationRequestType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                required
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {(type === 'EXPENSE' || type === 'TRAVEL') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {type === 'EXPENSE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                )}
                {type === 'TRAVEL' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reimbursement amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {type === 'LEAVE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From date</label>
                  <input
                    type="date"
                    value={leaveFrom}
                    onChange={(e) => setLeaveFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To date</label>
                  <input
                    type="date"
                    value={leaveTo}
                    onChange={(e) => setLeaveTo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Describe what you spent, where you traveled, or reason for leave..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt / proof URL (optional)</label>
              <input
                type="url"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit for validation'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </form>
        </ContentCard>
      )}

      <ContentCard className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">My requests</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : myRequests.length === 0 ? (
          <p className="text-gray-500">No validation requests yet. Submit one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount / Details</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myRequests.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{TYPE_LABELS[r.type]}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{r.description}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {r.amount != null && r.amount > 0 && formatCurrencyINR(r.amount)}
                      {r.distanceKm != null && r.distanceKm > 0 && ` ${r.distanceKm} km`}
                      {r.leaveFrom && ` ${r.leaveFrom} → ${r.leaveTo || '-'}`}
                      {!r.amount && !r.distanceKm && !r.leaveFrom && '—'}
                    </td>
                    <td className="px-4 py-3">{statusBadge(r)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{safeDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>
    </div>
  );
};

export default RequestValidationPage;
