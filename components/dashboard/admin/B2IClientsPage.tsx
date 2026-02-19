import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, BuildingLibraryIcon, MagnifyingGlassIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, UserIcon, PencilIcon, XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { B2IClient } from '../../../types';
import { useB2IClients } from '../../../hooks/useB2IClients';
import { useAuth } from '../../../context/AuthContext';
import { createB2IParentAccount } from '../../../services/authService';

interface B2IClientsPageProps {
    setCurrentPage: (page: string) => void;
    onSelectB2I?: (b2iId: string) => void;
}

const B2IClientsPage: React.FC<B2IClientsPageProps> = ({ setCurrentPage, onSelectB2I }) => {
    const { currentUser } = useAuth();
    const { b2iClients, loading, error, addB2IClient, updateB2IClient, deleteB2IClient } = useB2IClients();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<B2IClient | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        contactPerson: '',
        status: 'active' as 'active' | 'inactive',
    });

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', address: '', contactPerson: '', status: 'active' });
        setEditingClient(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (client: B2IClient) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
            contactPerson: client.contactPerson,
            status: client.status,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await updateB2IClient(editingClient.id, formData);
            } else {
                // 1. Create B2I Client Doc
                const newB2IId = await addB2IClient({
                    ...formData,
                    createdBy: currentUser?.id || 'unknown',
                });

                // 2. Create Auth User + clients doc (role B2I_PARENT). No staff user.
                try {
                    const authUid = await createB2IParentAccount(
                        formData.email,
                        formData.name,
                        formData.phone,
                        newB2IId
                    );

                    // 3. Link authUid back to B2I Client
                    await updateB2IClient(newB2IId, { authUid });

                    alert(`B2I Client created successfully!\n\nDefault Login:\nEmail: ${formData.email}\nPassword: 123456`);
                } catch (authError) {
                    console.error("Error creating auth account for B2I:", authError);
                    alert("B2I Client created, but failed to create login account. Please contact support.");
                }
            }
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            console.error('Error saving B2I client:', err);
            alert('Failed to save B2I client.');
        }
    };

    const handleDelete = async (client: B2IClient) => {
        if (!confirm(`Delete "${client.name}"? All child organizations will be unlinked.`)) return;
        try {
            await deleteB2IClient(client.id);
        } catch (err) {
            console.error('Error deleting B2I client:', err);
            alert('Failed to delete B2I client.');
        }
    };

    const filteredClients = b2iClients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">B2I Clients</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage enterprise clients and their organizations</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add B2I Client
                </button>
            </div>

            {/* Search */}
            <div className="bg-surface p-4 rounded-xl shadow-sm border border-border">
                <div className="relative max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search B2I clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-text-primary"
                    />
                </div>
            </div>

            {/* Loading / Error */}
            {loading && (
                <div className="text-center py-12 text-text-secondary">Loading B2I clients...</div>
            )}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300">
                    Failed to load B2I clients. Please try again.
                </div>
            )}

            {/* Cards Grid */}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <motion.div
                            key={client.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow p-6 group cursor-pointer"
                            onClick={() => onSelectB2I?.(client.id)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <BuildingLibraryIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openEditModal(client); }}
                                        className="p-1.5 text-text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors bg-subtle-background"
                                        title="Edit"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${client.status === 'active'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {client.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                                {client.name}
                            </h3>

                            <div className="space-y-2 text-sm text-text-secondary">
                                <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    <span>{client.contactPerson || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <EnvelopeIcon className="w-4 h-4" />
                                    <span>{client.email || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <PhoneIcon className="w-4 h-4" />
                                    <span>{client.phone || '—'}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPinIcon className="w-4 h-4 mt-0.5" />
                                    <span className="line-clamp-2">{client.address || '—'}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                                <div className="text-xs text-text-tertiary">
                                    Since {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                                </div>
                                <span className="text-sm font-medium text-primary group-hover:text-primary/80">
                                    View Details →
                                </span>
                            </div>
                        </motion.div>
                    ))}

                    {filteredClients.length === 0 && !loading && (
                        <div className="col-span-full text-center py-12">
                            <BuildingLibraryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No B2I clients found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                    <div className="bg-surface rounded-xl p-6 w-full max-w-lg shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-text-primary">
                                {editingClient ? 'Edit B2I Client' : 'Add B2I Client'}
                            </h3>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-subtle-background rounded-full">
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Company Name *</label>
                                <input
                                    type="text" required value={formData.name}
                                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Email *</label>
                                    <input
                                        type="email" required value={formData.email}
                                        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Phone *</label>
                                    <input
                                        type="tel" required value={formData.phone}
                                        onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Address *</label>
                                <textarea
                                    required rows={2} value={formData.address}
                                    onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Contact Person *</label>
                                <input
                                    type="text" required value={formData.contactPerson}
                                    onChange={e => setFormData(p => ({ ...p, contactPerson: e.target.value }))}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData(p => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="px-4 py-2 text-text-secondary hover:bg-subtle-background rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-sm font-medium">
                                    {editingClient ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default B2IClientsPage;
