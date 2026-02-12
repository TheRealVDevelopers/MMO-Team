import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, getDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Case, UserRole, CaseStatus } from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { isCaseCompleted } from '../../../services/executionStatusService';

interface Props {
  caseId: string | null;
  caseStatus?: CaseStatus;
}

interface Material {
  id: string;
  caseId: string;
  itemName: string;
  quantity: number;
  unit: string;
  requestedBy: string;
  requestedAt: any;
  approvedBy?: string;
  approvedAt?: any;
  status: 'requested' | 'approved' | 'ordered' | 'received';
  estimatedCost?: number;
}

const ExecutionMaterials: React.FC<Props> = ({ caseId, caseStatus }) => {
  const { currentUser } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('pcs');
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    // Fetch case data for costCenter
    const fetchCase = async () => {
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
      const caseSnap = await getDoc(caseRef);
      if (caseSnap.exists()) {
        setCaseData(caseSnap.data() as Case);
      }
    };
    fetchCase();

    // Fetch materials
    const materialsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.MATERIALS);
    const q = query(materialsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMaterials = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Material[];
      setMaterials(fetchedMaterials);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching materials:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [caseId]);

  const handleRequestMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !currentUser) return;

    setSaving(true);
    try {
      const materialsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.MATERIALS);
      await addDoc(materialsRef, {
        caseId,
        itemName,
        quantity,
        unit,
        estimatedCost: estimatedCost || 0,
        requestedBy: currentUser.id,
        requestedAt: serverTimestamp(),
        status: 'requested'
      });

      setItemName('');
      setQuantity(0);
      setUnit('pcs');
      setEstimatedCost(0);
      setShowRequestForm(false);
      
      alert('Material request submitted!');
    } catch (error) {
      console.error('Error requesting material:', error);
      alert('Failed to submit material request.');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveMaterial = async (materialId: string, material: Material) => {
    if (!caseId || !currentUser) return;

    try {
      // Update material status
      const materialRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.MATERIALS, materialId);
      await updateDoc(materialRef, {
        status: 'approved',
        approvedBy: currentUser.id,
        approvedAt: serverTimestamp()
      });

      alert(`Material approved!`);
    } catch (error) {
      console.error('Error approving material:', error);
      alert('Failed to approve material.');
    }
  };

  if (!caseId) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary text-lg">No project selected.</p>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN;
  const isCompleted = caseStatus ? isCaseCompleted(caseStatus) : false;

  const getStatusBadge = (status: string) => {
    const config: any = {
      requested: { label: 'Requested', color: 'bg-yellow-500' },
      approved: { label: 'Approved', color: 'bg-green-500' },
      ordered: { label: 'Ordered', color: 'bg-blue-500' },
      received: { label: 'Received', color: 'bg-gray-500' }
    };
    const cfg = config[status] || { label: status, color: 'bg-gray-500' };
    return <span className={`px-2 py-1 rounded text-white text-xs ${cfg.color}`}>{cfg.label}</span>;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Materials Management</h1>
        <button
          onClick={() => setShowRequestForm(!showRequestForm)}
          disabled={isCompleted}
          className={`px-4 py-2 rounded-lg ${isCompleted ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/90"}`}
        >
          {showRequestForm ? 'Cancel' : '+ Request Material'}
        </button>
      </div>

      {/* Cost Center Budget Display */}
      {caseData?.costCenter && (
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Budget Overview</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Total Budget</p>
              <p className="text-xl font-bold">₹{caseData.costCenter.totalBudget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Spent Amount</p>
              <p className="text-xl font-bold text-red-600">₹{caseData.costCenter.spentAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Remaining Amount</p>
              <p className="text-xl font-bold text-green-600">₹{caseData.costCenter.remainingAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Materials Cost</p>
              <p className="text-xl font-bold">₹{caseData.costCenter.materials.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${(caseData.costCenter.spentAmount / caseData.costCenter.totalBudget) * 100}%` }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {((caseData.costCenter.spentAmount / caseData.costCenter.totalBudget) * 100).toFixed(1)}% of budget used
            </p>
          </div>
        </div>
      )}

      {/* Request Form */}
      {showRequestForm && (
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Request Material</h2>
          
          <form onSubmit={handleRequestMaterial} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Item Name *</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                placeholder="e.g., Cement bags, Steel rods..."
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Unit *</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                >
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="ton">Tons</option>
                  <option value="bag">Bags</option>
                  <option value="box">Boxes</option>
                  <option value="m">Meters</option>
                  <option value="sqm">Square Meters</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estimated Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      {/* Materials List */}
      {loading ? (
        <div className="text-center py-12"><p>Loading materials...</p></div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary">No material requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {materials.map((material) => (
            <div key={material.id} className="bg-surface border border-border rounded-xl p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{material.itemName}</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Quantity: {material.quantity} {material.unit}
                    {material.estimatedCost && ` • Cost: ₹${material.estimatedCost.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Requested: {material.requestedAt?.toDate?.().toLocaleDateString() || 'N/A'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(material.status)}
                  
                  {isAdmin && material.status === 'requested' && (
                    <button
                      onClick={() => handleApproveMaterial(material.id, material)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExecutionMaterials;
