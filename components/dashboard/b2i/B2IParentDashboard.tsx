import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot, doc, getDocs } from 'firebase/firestore';
import { UserRole } from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import ClientDashboardPage from '../../landing/ClientDashboardPage';
import {
    BuildingOfficeIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

const B2IParentDashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const [childOrgs, setChildOrgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
    const orgUnsubRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!currentUser || currentUser.role !== UserRole.B2I_PARENT) {
            setLoading(false);
            return;
        }
        const b2iId =
            currentUser.b2iId != null && typeof currentUser.b2iId === 'string' && currentUser.b2iId.trim()
                ? currentUser.b2iId.trim()
                : '';
        if (!b2iId) {
            setLoading(false);
            return;
        }

        const b2iRef = doc(db, FIRESTORE_COLLECTIONS.B2I_CLIENTS, b2iId);
        const unsubscribeB2I = onSnapshot(b2iRef, (docSnap) => {
            if (!docSnap.exists()) {
                setLoading(false);
                return;
            }
            // Clean up previous org listener if any
            if (orgUnsubRef.current) {
                orgUnsubRef.current();
                orgUnsubRef.current = null;
            }
            const orgsRef = collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS);
            const q = query(orgsRef, where('b2iParentId', '==', b2iId));
            orgUnsubRef.current = onSnapshot(
                q,
                (snapshot) => {
                    const orgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                    setChildOrgs(orgs);
                    setLoading(false);
                },
                (err) => {
                    console.error('[B2IParentDashboard] Error fetching child orgs:', err);
                    setLoading(false);
                }
            );
        });

        return () => {
            unsubscribeB2I();
            if (orgUnsubRef.current) {
                orgUnsubRef.current();
                orgUnsubRef.current = null;
            }
        };
    }, [currentUser?.id, currentUser?.b2iId]);

    // Helper to find case for an org when clicked (cases linked via organizationId)
    const handleOrgClick = async (org: any) => {
        if (!org?.id) {
            console.warn('[B2IParentDashboard] Org has no id');
            return;
        }
        setLoading(true);
        try {
            // Find cases associated with this organization via organizationId (never pass undefined to where())
            const q = query(
                collection(db, FIRESTORE_COLLECTIONS.CASES),
                where('organizationId', '==', org.id)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                alert("No active project found for this organization.");
                setLoading(false);
                return;
            }

            const caseDoc = snapshot.docs[0];
            setSelectedCaseId(caseDoc.id);
            setSelectedOrgId(org.id);
        } catch (e) {
            console.error(e);
            alert("Error fetching project details.");
        } finally {
            setLoading(false);
        }
    };


    if (selectedCaseId) {
        return (
            <ClientDashboardPage
                clientUser={null}
                onLogout={() => { }}
                caseId={selectedCaseId}
                isReadOnly={true}
                onBack={() => {
                    setSelectedCaseId(null);
                    setSelectedOrgId(null);
                }}
            />
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
                <p className="text-gray-500">Select an organization to view its project status.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {childOrgs.map((org) => (
                    <div
                        key={org.id}
                        onClick={() => handleOrgClick(org)}
                        className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <BuildingOfficeIcon className="w-6 h-6" />
                            </div>
                            <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{org.name}</h3>
                        <p className="text-sm text-gray-500">{org.address || 'No address'}</p>
                    </div>
                ))}

                {childOrgs.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                        No child organizations found linked to your account.
                    </div>
                )}
            </div>
        </div>
    );
};

export default B2IParentDashboard;
