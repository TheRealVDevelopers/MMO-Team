/**
 * Procurement: Vendors list from organizations/{orgId}/vendors. No budget editing.
 */
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useVendors } from '../../../hooks/useVendors';
import { ArrowLeftIcon } from '../../icons/IconComponents';

interface VendorManagementPageProps {
  setCurrentPage: (page: string) => void;
}

const VendorManagementPage: React.FC<VendorManagementPageProps> = ({ setCurrentPage }) => {
  const { currentUser } = useAuth();
  const orgId = currentUser?.organizationId;
  const { vendors, loading, addVendor } = useVendors(orgId);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vendor name is required.');
      return;
    }
    if (!currentUser?.id) return;
    setSaving(true);
    try {
      await addVendor({
        name: name.trim(),
        category: category.trim() || 'General',
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        isActive: true,
        createdBy: currentUser.id,
      });
      setShowAdd(false);
      setName('');
      setCategory('');
      setContactPerson('');
      setPhone('');
      setEmail('');
    } catch (e) {
      console.error(e);
      alert('Failed to add vendor.');
    } finally {
      setSaving(false);
    }
  };

  if (!orgId) {
    return (
      <div className="p-6">
        <p className="text-text-secondary">Organization context required to view vendors.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPage('audit')}
            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>
          <h2 className="text-2xl font-bold text-text-primary">Vendors</h2>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
        >
          Add vendor
        </button>
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading vendors…</p>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-subtle-background">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Phone / Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                    No vendors yet. Add one to invite to bid rounds.
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-subtle-background">
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{v.name}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{v.category}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{v.contactPerson ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {[v.phone, v.email].filter(Boolean).join(' · ') || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Add vendor</h3>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-background"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Electrical, Furniture"
                  className="w-full p-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Contact person</label>
                <input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  className="w-full p-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full p-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary text-white rounded-xl font-medium disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border border-border rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagementPage;
