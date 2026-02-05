import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCases } from '../../../hooks/useCases';
import { Case, UserRole } from '../../../types';
import { formatCurrencyINR } from '../../../constants';
import Card from '../../shared/Card';
import { PrimaryButton } from './DashboardUI';

/**
 * Reference List Page
 * Shows all references with "View Details" button
 */

const ReferenceListPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { cases, loading } = useCases();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    if (!currentUser) return null;

    // Filter: Only show projects (isProject = true) as references
    const references = cases.filter(c => c.isProject === true);

    // Filter by search
    const filteredReferences = references.filter(r => 
        r.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-text-secondary">Loading references...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-text-primary mb-2">Reference</h1>
                    <p className="text-text-secondary">View all reference details, drawings, BOQs, and quotations</p>
                </div>

                {/* Search */}
                <Card className="mb-6">
                    <div className="p-4">
                        <input
                            type="text"
                            placeholder="Search references..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </Card>

                {/* References Grid */}
                {filteredReferences.length === 0 ? (
                    <Card>
                        <div className="p-12 text-center">
                            <p className="text-text-secondary">No references found</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredReferences.map(reference => (
                            <Card key={reference.id} className="hover:shadow-lg transition-shadow">
                                <div className="p-6">
                                    {/* Status Badge */}
                                    <div className="mb-4">
                                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                            {reference.status}
                                        </span>
                                    </div>

                                    {/* Reference Info */}
                                    <h3 className="text-xl font-bold text-text-primary mb-2">
                                        {reference.projectName}
                                    </h3>
                                    <p className="text-text-secondary mb-4">
                                        {reference.clientName}
                                    </p>

                                    {/* Budget */}
                                    {reference.budget && (
                                        <p className="text-lg font-bold text-primary mb-4">
                                            {formatCurrencyINR(reference.budget)}
                                        </p>
                                    )}

                                    {/* Progress Bar */}
                                    {reference.progress !== undefined && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-text-tertiary mb-1">
                                                <span>Progress</span>
                                                <span>{reference.progress}%</span>
                                            </div>
                                            <div className="w-full bg-border rounded-full h-2">
                                                <div 
                                                    className="bg-primary h-2 rounded-full transition-all"
                                                    style={{ width: `${reference.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* View Details Button */}
                                    <PrimaryButton
                                        onClick={() => navigate(`/reference/${reference.id}`)}
                                        className="w-full"
                                    >
                                        View Details
                                    </PrimaryButton>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReferenceListPage;
