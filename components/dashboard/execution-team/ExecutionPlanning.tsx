import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Case, CaseStatus, UserRole } from '../../../types';
import { FIRESTORE_COLLECTIONS, formatCurrencyINR } from '../../../constants';
import { useCatalog } from '../../../hooks/useCatalog';
import { useVendors } from '../../../hooks/useVendors';
import { useUsers } from '../../../hooks/useUsers';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  CubeIcon,
  TruckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface Props {
  caseId: string | null;
  setCurrentPage: (page: string) => void;
}

interface PhaseMaterial {
  catalogItemId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
  vendorId?: string;
}

interface Phase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  materials: PhaseMaterial[];
  laborCost: number;
  miscCost: number;
  notes: string;
  expanded: boolean;
}

interface Approvals {
  projectHead: boolean;
  projectHeadAt?: Date;
  admin: boolean;
  adminAt?: Date;
  adminBy?: string;
  client: boolean;
  clientAt?: Date;
}

const ExecutionPlanning: React.FC<Props> = ({ caseId, setCurrentPage }) => {
  const { currentUser } = useAuth();
  const { items: catalogItems } = useCatalog(); // Alias items to catalogItems to match usage
  const { users } = useUsers();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'materials' | 'approvals'>('timeline');

  const { vendors } = useVendors();

  // Form state
  const [projectStartDate, setProjectStartDate] = useState('');
  const [projectEndDate, setProjectEndDate] = useState('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [approvals, setApprovals] = useState<Approvals>({
    projectHead: false,
    admin: false,
    client: false,
  });

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
          const data = { id: caseSnap.id, ...caseSnap.data() } as Case;
          setCaseData(data);

          // Pre-fill if execution plan exists
          if (data.executionPlan) {
            const plan = data.executionPlan;
            setProjectStartDate(formatDateForInput(plan.startDate));
            setProjectEndDate(formatDateForInput(plan.endDate));

            if (plan.phases && plan.phases.length > 0) {
              setPhases(plan.phases.map((p: any) => ({
                ...p,
                // Ensure array existence to prevent reduce crash
                materials: p.materials || [],
                laborCost: p.laborCost || 0,
                miscCost: p.miscCost || 0,
                startDate: formatDateForInput(p.startDate),
                endDate: formatDateForInput(p.endDate),
                expanded: false,
              })));
            }

            if (plan.approvals) {
              setApprovals(plan.approvals);
            }
          } else {
            // Initialize with one empty phase
            setPhases([createEmptyPhase()]);
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

  const formatDateForInput = (date: any): string => {
    if (!date) return '';
    if (date.toDate) date = date.toDate();
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return String(date).split('T')[0];
  };

  const createEmptyPhase = (): Phase => ({
    id: Date.now().toString(),
    name: '',
    startDate: '',
    endDate: '',
    materials: [],
    laborCost: 0,
    miscCost: 0,
    notes: '',
    expanded: true,
  });

  // Calculations
  const phaseCosts = useMemo(() => {
    return phases.map(phase => {
      const materialsCost = phase.materials.reduce((sum, m) => sum + m.totalCost, 0);
      const total = materialsCost + phase.laborCost + phase.miscCost;
      return { materialsCost, laborCost: phase.laborCost, miscCost: phase.miscCost, total };
    });
  }, [phases]);

  const totalProjectCost = useMemo(() => {
    return phaseCosts.reduce((sum, pc) => sum + pc.total, 0);
  }, [phaseCosts]);

  const projectBudget = caseData?.financial?.totalBudget || 0;
  const budgetVariance = projectBudget - totalProjectCost;
  const isOverBudget = budgetVariance < 0;

  // Phase management
  const addPhase = () => {
    setPhases([...phases, createEmptyPhase()]);
  };

  const removePhase = (id: string) => {
    if (phases.length <= 1) return;
    setPhases(phases.filter(p => p.id !== id));
  };

  const updatePhase = (id: string, updates: Partial<Phase>) => {
    setPhases(phases.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const togglePhaseExpanded = (id: string) => {
    setPhases(phases.map(p => p.id === id ? { ...p, expanded: !p.expanded } : p));
  };

  // Material management
  const addMaterialToPhase = (phaseId: string, catalogItemId: string) => {
    const catalogItem = catalogItems.find(c => c.id === catalogItemId);
    if (!catalogItem) return;

    const newMaterial: PhaseMaterial = {
      catalogItemId,
      name: catalogItem.name,
      quantity: 1,
      unit: catalogItem.unit || 'unit',
      unitPrice: catalogItem.price || 0,
      totalCost: catalogItem.price || 0,
    };

    setPhases(phases.map(p => {
      if (p.id === phaseId) {
        return { ...p, materials: [...p.materials, newMaterial] };
      }
      return p;
    }));
  };

  const updateMaterial = (phaseId: string, materialIndex: number, updates: Partial<PhaseMaterial>) => {
    setPhases(phases.map(p => {
      if (p.id === phaseId) {
        const updatedMaterials = [...p.materials];
        const material = { ...updatedMaterials[materialIndex], ...updates };
        // Recalculate total cost
        material.totalCost = material.quantity * material.unitPrice;
        updatedMaterials[materialIndex] = material;
        return { ...p, materials: updatedMaterials };
      }
      return p;
    }));
  };

  const removeMaterial = (phaseId: string, materialIndex: number) => {
    setPhases(phases.map(p => {
      if (p.id === phaseId) {
        const updatedMaterials = [...p.materials];
        updatedMaterials.splice(materialIndex, 1);
        return { ...p, materials: updatedMaterials };
      }
      return p;
    }));
  };

  // Save plan
  const handleSavePlan = async (submitForApproval: boolean = false) => {
    if (!caseId || !currentUser) return;

    setSaving(true);
    try {
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);

      const executionPlan = {
        startDate: new Date(projectStartDate),
        endDate: new Date(projectEndDate),
        phases: phases.map(p => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
          expanded: undefined, // Don't save UI state
        })),
        totalBudget: totalProjectCost,
        approvals: submitForApproval ? {
          ...approvals,
          projectHead: true,
          projectHeadAt: new Date(),
        } : approvals,
        submittedAt: submitForApproval ? serverTimestamp() : null,
        submittedBy: submitForApproval ? currentUser.id : null,
      };

      await updateDoc(caseRef, {
        executionPlan,
        updatedAt: serverTimestamp(),
      });

      // Refresh case data
      const caseSnap = await getDoc(caseRef);
      if (caseSnap.exists()) {
        setCaseData({ id: caseSnap.id, ...caseSnap.data() } as Case);
        if (submitForApproval) {
          setApprovals(prev => ({ ...prev, projectHead: true, projectHeadAt: new Date() }));
          setActiveTab('approvals');
        }
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Admin/Client approval actions
  const handleApprove = async (role: 'admin' | 'client') => {
    if (!caseId || !currentUser) return;

    setSaving(true);
    try {
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);

      const newApprovals = {
        ...approvals,
        [role]: true,
        [`${role}At`]: new Date(),
        ...(role === 'admin' ? { adminBy: currentUser.id } : {}),
      };

      // Check if all approvals are complete
      const allApproved = newApprovals.projectHead && newApprovals.admin && newApprovals.client;

      const updates: any = {
        'executionPlan.approvals': newApprovals,
        updatedAt: serverTimestamp(),
      };

      // If all approved, activate project and initialize cost center
      if (allApproved) {
        updates.status = CaseStatus.ACTIVE;
        updates.costCenter = {
          totalBudget: totalProjectCost,
          spentAmount: 0,
          remainingAmount: totalProjectCost,
          expenses: 0,
          materials: 0,
          salaries: 0,
        };
      }

      await updateDoc(caseRef, updates);

      setApprovals(newApprovals);

      if (allApproved) {
        alert('All approvals complete! Project is now ACTIVE.');
        setCurrentPage('overview');
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!caseId || !currentUser) return;

    setSaving(true);
    try {
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);

      await updateDoc(caseRef, {
        executionPlan: null,
        updatedAt: serverTimestamp(),
      });

      // Reset local state
      setPhases([createEmptyPhase()]);
      setApprovals({ projectHead: false, admin: false, client: false });
      setActiveTab('timeline');

      alert('Plan rejected. Project Head can create a new plan.');
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Role checks
  const isProjectHead = caseData?.projectHeadId === currentUser?.id;
  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN;
  const canEdit = isProjectHead && !approvals.projectHead;
  const planExists = !!caseData?.executionPlan;
  const pendingAdminApproval = approvals.projectHead && !approvals.admin;
  const pendingClientApproval = approvals.admin && !approvals.client;

  // Empty state
  if (!caseId) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl border border-border">
        <CalendarIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-text-primary mb-2">No Project Selected</h3>
        <p className="text-text-secondary mb-6">Select a project from the Projects tab to view or create its execution plan.</p>
        <button
          onClick={() => setCurrentPage('overview')}
          className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold"
        >
          Go to Projects
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-secondary mt-4">Loading execution plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button + Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPage('overview')}
            className="p-2 hover:bg-subtle-background rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{caseData?.title}</h1>
            <p className="text-sm text-text-secondary">{caseData?.clientName} • {caseData?.siteAddress}</p>
          </div>
        </div>

        {/* Budget Summary */}
        <div className="flex items-center gap-6 bg-surface border border-border rounded-xl px-6 py-3">
          <div>
            <p className="text-xs text-text-tertiary uppercase font-bold">Project Budget</p>
            <p className="text-lg font-bold">{formatCurrencyINR(projectBudget)}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-xs text-text-tertiary uppercase font-bold">Planned Cost</p>
            <p className="text-lg font-bold">{formatCurrencyINR(totalProjectCost)}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-xs text-text-tertiary uppercase font-bold">Variance</p>
            <p className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              {isOverBudget ? '-' : '+'}{formatCurrencyINR(Math.abs(budgetVariance))}
            </p>
          </div>
        </div>
      </div>

      {/* Over Budget Warning */}
      {isOverBudget && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
          <p className="text-red-700 font-medium">
            Planned cost exceeds budget by {formatCurrencyINR(Math.abs(budgetVariance))}. Please revise the plan.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['timeline', 'materials', 'approvals'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold capitalize border-b-2 transition-colors ${activeTab === tab
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
          >
            {tab === 'timeline' && '📅 '}
            {tab === 'materials' && '🧱 '}
            {tab === 'approvals' && '✅ '}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Project Dates */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">Project Timeline</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Project Start Date</label>
                  <input
                    type="date"
                    value={projectStartDate}
                    onChange={(e) => setProjectStartDate(e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Project End Date</label>
                  <input
                    type="date"
                    value={projectEndDate}
                    onChange={(e) => setProjectEndDate(e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text-primary disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Phases */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-primary">Phases ({phases.length})</h3>
                {canEdit && (
                  <button
                    onClick={addPhase}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Phase
                  </button>
                )}
              </div>

              {phases.map((phase, phaseIndex) => (
                <motion.div
                  key={phase.id}
                  layout
                  className="bg-surface border border-border rounded-xl overflow-hidden"
                >
                  {/* Phase Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-subtle-background"
                    onClick={() => togglePhaseExpanded(phase.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                        {phaseIndex + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-text-primary">
                          {phase.name || `Phase ${phaseIndex + 1}`}
                        </h4>
                        <p className="text-sm text-text-secondary">
                          {phase.startDate && phase.endDate
                            ? `${phase.startDate} → ${phase.endDate}`
                            : 'Dates not set'}
                          {' • '}
                          {formatCurrencyINR(phaseCosts[phaseIndex]?.total || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canEdit && phases.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removePhase(phase.id); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                      {phase.expanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-text-tertiary" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-text-tertiary" />
                      )}
                    </div>
                  </div>

                  {/* Phase Content */}
                  <AnimatePresence>
                    {phase.expanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 border-t border-border space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Phase name"
                              value={phase.name}
                              onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                              disabled={!canEdit}
                              className="px-4 py-2.5 border border-border rounded-lg bg-background disabled:opacity-50"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                value={phase.startDate}
                                onChange={(e) => updatePhase(phase.id, { startDate: e.target.value })}
                                disabled={!canEdit}
                                className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm disabled:opacity-50"
                              />
                              <input
                                type="date"
                                value={phase.endDate}
                                onChange={(e) => updatePhase(phase.id, { endDate: e.target.value })}
                                disabled={!canEdit}
                                className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm disabled:opacity-50"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-text-tertiary uppercase mb-1">Labor Cost (₹)</label>
                              <input
                                type="number"
                                value={phase.laborCost || ''}
                                onChange={(e) => updatePhase(phase.id, { laborCost: parseFloat(e.target.value) || 0 })}
                                disabled={!canEdit}
                                placeholder="0"
                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-text-tertiary uppercase mb-1">Misc Cost (₹)</label>
                              <input
                                type="number"
                                value={phase.miscCost || ''}
                                onChange={(e) => updatePhase(phase.id, { miscCost: parseFloat(e.target.value) || 0 })}
                                disabled={!canEdit}
                                placeholder="0"
                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background disabled:opacity-50"
                              />
                            </div>
                          </div>

                          {/* Phase Materials Summary */}
                          <div className="bg-subtle-background rounded-lg p-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-secondary">Materials: {phase.materials.length} items</span>
                              <span className="font-semibold">{formatCurrencyINR(phaseCosts[phaseIndex]?.materialsCost || 0)}</span>
                            </div>
                          </div>

                          <textarea
                            placeholder="Notes for this phase..."
                            value={phase.notes}
                            onChange={(e) => updatePhase(phase.id, { notes: e.target.value })}
                            disabled={!canEdit}
                            rows={2}
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background resize-none disabled:opacity-50"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Save Button */}
            {canEdit && (
              <div className="flex gap-4">
                <button
                  onClick={() => handleSavePlan(false)}
                  disabled={saving}
                  className="px-6 py-2.5 border border-primary text-primary rounded-lg hover:bg-primary/10 font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleSavePlan(true)}
                  disabled={saving || !projectStartDate || !projectEndDate || phases.some(p => !p.name) || isOverBudget}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold disabled:opacity-50"
                >
                  {saving ? 'Submitting...' : 'Submit for Approval'}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <motion.div
            key="materials"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {phases.map((phase, phaseIndex) => (
              <div key={phase.id} className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <CubeIcon className="w-5 h-5 text-primary" />
                    {phase.name || `Phase ${phaseIndex + 1}`} - Materials
                  </h3>
                  <span className="text-sm font-semibold text-text-secondary">
                    {formatCurrencyINR(phaseCosts[phaseIndex]?.materialsCost || 0)}
                  </span>
                </div>

                {/* Materials List */}
                {phase.materials.length > 0 && (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-semibold text-text-secondary">Material</th>
                          <th className="text-left py-2 px-3 font-semibold text-text-secondary">Qty</th>
                          <th className="text-left py-2 px-3 font-semibold text-text-secondary">Unit</th>
                          <th className="text-left py-2 px-3 font-semibold text-text-secondary">Unit Price</th>
                          <th className="text-left py-2 px-3 font-semibold text-text-secondary">Vendor</th>
                          <th className="text-left py-2 px-3 font-semibold text-text-secondary">Total</th>
                          {canEdit && <th className="w-10"></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {phase.materials.map((material, materialIndex) => (
                          <tr key={materialIndex} className="border-b border-border/50">
                            <td className="py-2 px-3 font-medium">{material.name}</td>
                            <td className="py-2 px-3">
                              {canEdit ? (
                                <input
                                  type="number"
                                  value={material.quantity}
                                  onChange={(e) => updateMaterial(phase.id, materialIndex, { quantity: parseInt(e.target.value) || 1 })}
                                  min="1"
                                  className="w-20 px-2 py-1 border border-border rounded"
                                />
                              ) : (
                                material.quantity
                              )}
                            </td>
                            <td className="py-2 px-3">{material.unit}</td>
                            <td className="py-2 px-3">₹{material.unitPrice}</td>
                            <td className="py-2 px-3">
                              {canEdit ? (
                                <select
                                  value={material.vendorId || ''}
                                  onChange={(e) => updateMaterial(phase.id, materialIndex, { vendorId: e.target.value })}
                                  className="w-full px-2 py-1 border border-border rounded text-sm"
                                >
                                  <option value="">Select Vendor</option>
                                  {vendors.map((v) => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                  ))}
                                </select>
                              ) : (
                                vendors.find(v => v.id === material.vendorId)?.name || '-'
                              )}
                            </td>
                            <td className="py-2 px-3 font-semibold">₹{material.totalCost.toLocaleString()}</td>
                            {canEdit && (
                              <td className="py-2 px-3">
                                <button
                                  onClick={() => removeMaterial(phase.id, materialIndex)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add Material from Catalog */}
                {canEdit && (
                  <div className="flex items-center gap-3">
                    <TruckIcon className="w-5 h-5 text-text-tertiary" />
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addMaterialToPhase(phase.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-background"
                    >
                      <option value="">+ Add material from catalog...</option>
                      {catalogItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} - ₹{item.price}/{item.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {phase.materials.length === 0 && !canEdit && (
                  <p className="text-text-tertiary text-sm">No materials added to this phase.</p>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* APPROVALS TAB */}
        {activeTab === 'approvals' && (
          <motion.div
            key="approvals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-text-primary mb-6">Approval Status</h3>

              <div className="space-y-4">
                {/* Project Head Approval */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${approvals.projectHead ? 'bg-green-50 border border-green-200' : 'bg-subtle-background border border-border'}`}>
                  <div className="flex items-center gap-3">
                    {approvals.projectHead ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    ) : (
                      <ClockIcon className="w-6 h-6 text-text-tertiary" />
                    )}
                    <div>
                      <p className="font-semibold text-text-primary">Project Head</p>
                      <p className="text-sm text-text-secondary">
                        {approvals.projectHead ? 'Plan submitted for approval' : 'Awaiting plan submission'}
                      </p>
                    </div>
                  </div>
                  {approvals.projectHead && (
                    <span className="text-sm text-green-600 font-semibold">Approved</span>
                  )}
                </div>

                {/* Admin Approval */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${approvals.admin ? 'bg-green-50 border border-green-200' : 'bg-subtle-background border border-border'}`}>
                  <div className="flex items-center gap-3">
                    {approvals.admin ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    ) : pendingAdminApproval ? (
                      <ClockIcon className="w-6 h-6 text-amber-500" />
                    ) : (
                      <ClockIcon className="w-6 h-6 text-text-tertiary" />
                    )}
                    <div>
                      <p className="font-semibold text-text-primary">Admin Approval</p>
                      <p className="text-sm text-text-secondary">
                        {approvals.admin
                          ? `Approved by ${users.find(u => u.id === approvals.adminBy)?.name || 'Admin'}`
                          : pendingAdminApproval
                            ? 'Waiting for admin review'
                            : 'Pending Project Head submission'}
                      </p>
                    </div>
                  </div>
                  {isAdmin && pendingAdminApproval && !approvals.admin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove('admin')}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={saving}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {approvals.admin && (
                    <span className="text-sm text-green-600 font-semibold">Approved</span>
                  )}
                </div>

                {/* Client Approval */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${approvals.client ? 'bg-green-50 border border-green-200' : 'bg-subtle-background border border-border'}`}>
                  <div className="flex items-center gap-3">
                    {approvals.client ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    ) : pendingClientApproval ? (
                      <ClockIcon className="w-6 h-6 text-amber-500" />
                    ) : (
                      <ClockIcon className="w-6 h-6 text-text-tertiary" />
                    )}
                    <div>
                      <p className="font-semibold text-text-primary">Client Approval</p>
                      <p className="text-sm text-text-secondary">
                        {approvals.client
                          ? 'Client approved the plan'
                          : pendingClientApproval
                            ? 'Waiting for client confirmation'
                            : 'Pending admin approval'}
                      </p>
                    </div>
                  </div>
                  {isAdmin && pendingClientApproval && !approvals.client && (
                    <button
                      onClick={() => handleApprove('client')}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold disabled:opacity-50"
                    >
                      Mark Client Approved
                    </button>
                  )}
                  {approvals.client && (
                    <span className="text-sm text-green-600 font-semibold">Approved</span>
                  )}
                </div>
              </div>

              {/* All Approved Message */}
              {approvals.projectHead && approvals.admin && approvals.client && (
                <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-green-800 font-semibold text-center">
                    ✓ All approvals complete! Project is now ACTIVE.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExecutionPlanning;
