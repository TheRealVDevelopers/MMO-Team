import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot, doc, getDocs } from 'firebase/firestore';
import { UserRole } from '../../../types';
import ClientDashboardPage from '../../landing/ClientDashboardPage';
import {
    BuildingOfficeIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

const B2IParentDashboard: React.FC = () => {
    const { user, staffUser } = useAuth();
    const [childOrgs, setChildOrgs] = useState<any[]>([]); // Using any for flexibility or define a type
    const [loading, setLoading] = useState(true);
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

    useEffect(() => {
        if (!staffUser || staffUser.role !== UserRole.B2I_PARENT) {
            setLoading(false);
            return;
        }

        // Fetch B2I Client details to get the list of child organizations
        // The b2iId is stored in staffUser.b2iId
        if (staffUser.b2iId) {
            const b2iRef = doc(db, 'b2i_clients', staffUser.b2iId);
            const unsubscribeValid = onSnapshot(b2iRef, (docSnap) => {
                if (docSnap.exists()) {
                    const b2iData = docSnap.data();
                    // Now fetch organizations linked to this B2I Client
                    // Assuming organizations have a field 'b2iClientId'
                    const orgsRef = collection(db, 'organizations');
                    const q = query(orgsRef, where('b2iClientId', '==', staffUser.b2iId));

                    // Also fetch cases for these organizations
                    onSnapshot(q, async (snapshot) => {
                        const orgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                        // For each org, try to find an active case
                        // Optimization: can fetch all cases relevant to these orgs if needed, or fetch on demand.

                        setChildOrgs(orgs);
                        setLoading(false);
                    });
                } else {
                    setLoading(false);
                }
            });
            return () => unsubscribeValid();
        } else {
            setLoading(false);
        }

    }, [staffUser]);

    // Helper to find case for an org when clicked
    const handleOrgClick = async (org: any) => {
        setLoading(true);
        try {
            // Find a case associated with this organization
            // Strategy: Query Cases where 'clientUid' == org.id 
            // OR checks if there is a 'client' document with this orgId?

            // Assuming Org ID matches Client UID for B2B or checking direct mapping
            let q = query(collection(db, 'cases'), where('clientUid', '==', org.id));
            let snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Try searching by organizationId field on case if it exists
                // q = query(collection(db, 'cases'), where('organizationId', '==', org.id));
                // snapshot = await getDocs(q);

                // If that also fails, alert user
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
