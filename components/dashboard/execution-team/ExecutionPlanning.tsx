import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Case, CaseStatus, UserRole } from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../constants';

interface Props {
  caseId: string | null;
  setCurrentPage: (page: string) => void;
}

interface Phase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  materials: Array<{
    name: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
  }>;
  estimatedCost: number;
}

const ExecutionPlanning: React.FC<Props> = ({ caseId, setCurrentPage }) => {
  const { currentUser } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [phases, setPhases] = useState<Phase[]>([{
    id: Date.now().toString(),
    name: '',
    startDate: '',
    endDate: '',
    materials: [],
    estimatedCost: 0
  }]);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    const fetchCase = async () => {
      try {
        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
        const caseSnap = await getDoc(caseRef);
        
        if (caseSnap.exists()) {
          const data = caseSnap.data() as Case;
          setCaseData(data);
          
          // Pre-fill if execution plan exists
          if (data.executionPlan) {
            setStartDate(data.executionPlan.startDate?.toString().split('T')[0] || '');
            setEndDate(data.executionPlan.endDate?.toString().split('T')[0] || '');
            if (data.executionPlan.phases && data.executionPlan.phases.length > 0) {
              setPhases(data.executionPlan.phases.map(p => ({
                ...p,
                startDate: p.startDate?.toString().split('T')[0] || '',
                endDate: p.endDate?.toString().split('T')[0] || '',
              })));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching case:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [caseId]);

  const addPhase = () => {
    setPhases([...phases, {
      id: Date.now().toString(),
      name: '',
      startDate: '',
      endDate: '',
      materials: [],
      estimatedCost: 0
    }]);
  };

  const removePhase = (id: string) => {
    setPhases(phases.filter(p => p.id !== id));
  };

  const updatePhase = (id: string, field: keyof Phase, value: any) => {
    setPhases(phases.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmitPlan = async () => {
    if (!caseId || !currentUser) return;

    setSaving(true);
    try {
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
      const totalBudget = phases.reduce((sum, p) => sum + p.estimatedCost, 0);

      await updateDoc(caseRef, {
        executionPlan: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          phases: phases.map(p => ({
            ...p,
            startDate: new Date(p.startDate),
            endDate: new Date(p.endDate),
          })),
          approved: false,
          approvedBy: null,
          approvedAt: null,
          totalBudget
        },
        status: CaseStatus.WAITING_FOR_PLANNING,
        updatedAt: serverTimestamp()
      });

      alert('Execution plan submitted successfully! Waiting for admin approval.');
      window.location.reload();
    } catch (error) {
      console.error('Error submitting plan:', error);
      alert('Failed to submit plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!caseId || !currentUser || !caseData?.executionPlan) return;

    setSaving(true);
    try {
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
      const totalBudget = caseData.executionPlan.phases.reduce((sum: number, p: any) => sum + p.estimatedCost, 0);

      await updateDoc(caseRef, {
        'executionPlan.approved': true,
        'executionPlan.approvedBy': currentUser.id,
        'executionPlan.approvedAt': serverTimestamp(),
        status: CaseStatus.ACTIVE,
        costCenter: {
          totalBudget,
          spentAmount: 0,
          remainingAmount: totalBudget,
          expenses: 0,
          materials: 0,
          salaries: 0
        },
        updatedAt: serverTimestamp()
      });

      alert('Execution plan approved! Project is now ACTIVE.');
      window.location.reload();
    } catch (error) {
      console.error('Error approving plan:', error);
      alert('Failed to approve plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRejectPlan = async () => {
    if (!caseId || !currentUser) return;

    setSaving(true);
    try {
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);

      await updateDoc(caseRef, {
        executionPlan: null,
        status: CaseStatus.WAITING_FOR_PLANNING,
        updatedAt: serverTimestamp()
      });

      alert('Execution plan rejected. Project Head can submit a new plan.');
      window.location.reload();
    } catch (error) {
      console.error('Error rejecting plan:', error);
      alert('Failed to reject plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!caseId) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary text-lg">Please select a project from the overview page.</p>
          <button
            onClick={() => setCurrentPage('overview')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Go to Overview
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p>Loading execution plan...</p>
        </div>
      </div>
    );
  }

  const isProjectHead = currentUser?.role === UserRole.PROJECT_HEAD;
  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN;
  const planExists = caseData?.executionPlan;
  const planApproved = caseData?.executionPlan?.approved;

  // Admin view - show submitted plan for approval
  if (isAdmin && planExists && !planApproved) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Review Execution Plan</h1>
        
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Project: {caseData?.title}</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-text-secondary">Start Date</p>
              <p className="font-semibold">{caseData?.executionPlan?.startDate?.toString().split('T')[0]}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">End Date</p>
              <p className="font-semibold">{caseData?.executionPlan?.endDate?.toString().split('T')[0]}</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-3">Phases</h3>
          {caseData?.executionPlan?.phases.map((phase: any, idx: number) => (
            <div key={idx} className="mb-4 p-4 bg-background rounded-lg">
              <p className="font-semibold">{phase.name}</p>
              <p className="text-sm text-text-secondary">
                {phase.startDate?.toString().split('T')[0]} to {phase.endDate?.toString().split('T')[0]}
              </p>
              <p className="text-sm mt-2">Estimated Cost: ₹{phase.estimatedCost?.toLocaleString()}</p>
            </div>
          ))}

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleApprovePlan}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Approving...' : 'Approve Plan'}
            </button>
            <button
              onClick={handleRejectPlan}
              disabled={saving}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Rejecting...' : 'Reject Plan'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show approved plan (read-only)
  if (planApproved) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Execution Plan (Approved)</h1>
        
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-6">
          <p className="text-green-800 font-semibold">✓ Plan approved and project is now ACTIVE</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-text-secondary">Start Date</p>
              <p className="font-semibold">{caseData?.executionPlan?.startDate?.toString().split('T')[0]}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">End Date</p>
              <p className="font-semibold">{caseData?.executionPlan?.endDate?.toString().split('T')[0]}</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-3">Phases</h3>
          {caseData?.executionPlan?.phases.map((phase: any, idx: number) => (
            <div key={idx} className="mb-4 p-4 bg-background rounded-lg">
              <p className="font-semibold">{phase.name}</p>
              <p className="text-sm text-text-secondary">
                {phase.startDate?.toString().split('T')[0]} to {phase.endDate?.toString().split('T')[0]}
              </p>
              <p className="text-sm mt-2">Estimated Cost: ₹{phase.estimatedCost?.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Project Head form - create/edit plan
  if (isProjectHead) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Create Execution Plan</h1>
        
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-3">Phases</h3>
          {phases.map((phase, idx) => (
            <div key={phase.id} className="mb-4 p-4 bg-background rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold">Phase {idx + 1}</h4>
                {phases.length > 1 && (
                  <button
                    onClick={() => removePhase(phase.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Phase name"
                  value={phase.name}
                  onChange={(e) => updatePhase(phase.id, 'name', e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Estimated cost"
                  value={phase.estimatedCost || ''}
                  onChange={(e) => updatePhase(phase.id, 'estimatedCost', parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 border border-border rounded-lg"
                />
                <input
                  type="date"
                  value={phase.startDate}
                  onChange={(e) => updatePhase(phase.id, 'startDate', e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg"
                />
                <input
                  type="date"
                  value={phase.endDate}
                  onChange={(e) => updatePhase(phase.id, 'endDate', e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg"
                />
              </div>
            </div>
          ))}

          <button
            onClick={addPhase}
            className="mb-6 px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10"
          >
            + Add Phase
          </button>

          <div className="flex gap-4">
            <button
              onClick={handleSubmitPlan}
              disabled={saving || !startDate || !endDate || phases.some(p => !p.name)}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="text-center py-12 bg-surface rounded-xl border border-border">
        <p className="text-text-secondary">You don't have permission to view this page.</p>
      </div>
    </div>
  );
};

export default ExecutionPlanning;
