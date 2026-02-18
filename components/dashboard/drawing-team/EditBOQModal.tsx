import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { useCatalog } from '../../../hooks/useCatalog';
import { CaseBOQ, BOQItemData, Case } from '../../../types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { generateBOQPDF } from '../../../services/pdfGenerationService';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CatalogSelectorModal } from './CreateBOQModal';

interface EditBOQModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  boqId: string;
  existingBOQ: CaseBOQ;
  currentUser: any;
  onBOQSaved?: () => void;
}

const EditBOQModal: React.FC<EditBOQModalProps> = ({
  isOpen,
  onClose,
  caseId,
  boqId,
  existingBOQ,
  currentUser,
  onBOQSaved,
}) => {
  const { items: catalogItems } = useCatalog();
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [boqItems, setBoqItems] = useState<BOQItemData[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && existingBOQ?.items?.length) {
      setBoqItems(
        existingBOQ.items.map((it) => ({
          catalogItemId: it.catalogItemId || '',
          name: it.name || 'Item',
          unit: it.unit || 'pcs',
          quantity: it.quantity ?? 0,
          rate: it.rate ?? 0,
          total: it.total ?? it.quantity * it.rate,
        }))
      );
    }
  }, [isOpen, existingBOQ]);

  if (!isOpen) return null;

  const addItemsFromCatalog = (selectedItems: any[]) => {
    const newItems: BOQItemData[] = selectedItems.map((item) => ({
      catalogItemId: item.id,
      name: item.name,
      unit: item.unit || 'pcs',
      quantity: 1,
      rate: 0,
      total: 0,
    }));
    setBoqItems([...boqItems, ...newItems]);
    setShowCatalogModal(false);
  };

  const updateItem = (index: number, field: keyof BOQItemData, value: any) => {
    setBoqItems((items) =>
      items.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          return updated;
        }
        return item;
      })
    );
  };

  const removeItem = (index: number) => {
    setBoqItems((items) => items.filter((_, i) => i !== index));
  };

  const subtotal = 0;

  const handleSubmit = async () => {
    if (boqItems.length === 0) {
      alert('❌ Please add at least one item');
      return;
    }

    setSubmitting(true);

    try {
      const caseRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, caseId);
      const caseSnap = await getDoc(caseRef);

      if (!caseSnap.exists()) {
        throw new Error('Case not found');
      }

      const caseData = caseSnap.data() as Case;
      const boqRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.BOQ, boqId);

      const boqWithId: CaseBOQ = {
        id: boqId,
        caseId,
        items: boqItems,
        subtotal,
        createdBy: existingBOQ.createdBy,
        createdAt: existingBOQ.createdAt,
      };

      await updateDoc(boqRef, {
        items: boqItems,
        subtotal,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.id,
      });

      const pdfUrl = await generateBOQPDF(boqWithId, { ...caseData, id: caseId });
      await updateDoc(boqRef, { pdfUrl });

      await addDoc(
        collection(db!, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
        {
          caseId,
          action: `BOQ updated with ${boqItems.length} items`,
          by: currentUser.id,
          timestamp: serverTimestamp(),
        }
      );

      alert('✅ BOQ updated successfully!');
      if (onBOQSaved) onBOQSaved();
      onClose();
    } catch (error) {
      console.error('[EditBOQModal] Error:', error);
      alert('Failed to update BOQ. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Edit BOQ</h2>
              <p className="text-purple-100 text-sm mt-1">Update items and quantities</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900">BOQ Items</h3>
            <button
              onClick={() => setShowCatalogModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              + Add from Catalog
            </button>
          </div>

          {boqItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500">No items. Click "Add from Catalog" to add.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-600 px-3">
                <div className="col-span-1">#</div>
                <div className="col-span-6">Item</div>
                <div className="col-span-3">Quantity</div>
                <div className="col-span-2">Unit</div>
              </div>
              {boqItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded-lg border">
                  <div className="col-span-1 font-bold text-gray-500">{index + 1}</div>
                  <div className="col-span-6">
                    <p className="text-sm font-medium">{item.name}</p>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Quantity"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <p className="text-sm font-medium flex-1">{item.unit}</p>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 px-3 pt-4 border-t-2">
                <div className="col-span-12 text-right font-bold text-lg">Total Items: {boqItems.length}</div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || boqItems.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {showCatalogModal && (
          <CatalogSelectorModal
            catalogItems={catalogItems}
            onSelect={addItemsFromCatalog}
            onClose={() => setShowCatalogModal(false)}
            hidePricing={true}
          />
        )}
      </div>
    </div>
  );
};

export default EditBOQModal;
