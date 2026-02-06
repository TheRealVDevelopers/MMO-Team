import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { CaseExpense, CaseVendorBill, CaseMaterial } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

interface UseCaseFinanceOptions {
  organizationId: string;
  caseId: string;
}

export const useCaseFinance = (options: UseCaseFinanceOptions) => {
  const [expenses, setExpenses] = useState<CaseExpense[]>([]);
  const [vendorBills, setVendorBills] = useState<CaseVendorBill[]>([]);
  const [materials, setMaterials] = useState<CaseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listeners for all finance data
  useEffect(() => {
    if (!db || !options.organizationId || !options.caseId) {
      setLoading(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];

    try {
      // Listen to expenses
      const expensesRef = collection(
        db,
        FIRESTORE_COLLECTIONS.ORGANIZATIONS,
        options.organizationId,
        FIRESTORE_COLLECTIONS.CASES,
        options.caseId,
        FIRESTORE_COLLECTIONS.EXPENSES
      );
      const expensesQuery = query(expensesRef, orderBy('paidAt', 'desc'));
      const expensesUnsub = onSnapshot(expensesQuery, (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            ...d,
            id: doc.id,
            paidAt: d.paidAt instanceof Timestamp ? d.paidAt.toDate() : new Date(d.paidAt),
            approvedAt: d.approvedAt instanceof Timestamp ? d.approvedAt.toDate() : d.approvedAt ? new Date(d.approvedAt) : undefined,
          } as CaseExpense;
        });
        setExpenses(data);
      });
      unsubscribers.push(expensesUnsub);

      // Listen to vendor bills
      const vendorBillsRef = collection(
        db,
        FIRESTORE_COLLECTIONS.ORGANIZATIONS,
        options.organizationId,
        FIRESTORE_COLLECTIONS.CASES,
        options.caseId,
        FIRESTORE_COLLECTIONS.VENDOR_BILLS
      );
      const billsQuery = query(vendorBillsRef, orderBy('billDate', 'desc'));
      const billsUnsub = onSnapshot(billsQuery, (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            ...d,
            id: doc.id,
            billDate: d.billDate instanceof Timestamp ? d.billDate.toDate() : new Date(d.billDate),
            dueDate: d.dueDate instanceof Timestamp ? d.dueDate.toDate() : d.dueDate ? new Date(d.dueDate) : undefined,
            paidAt: d.paidAt instanceof Timestamp ? d.paidAt.toDate() : d.paidAt ? new Date(d.paidAt) : undefined,
          } as CaseVendorBill;
        });
        setVendorBills(data);
      });
      unsubscribers.push(billsUnsub);

      // Listen to materials
      const materialsRef = collection(
        db,
        FIRESTORE_COLLECTIONS.ORGANIZATIONS,
        options.organizationId,
        FIRESTORE_COLLECTIONS.CASES,
        options.caseId,
        FIRESTORE_COLLECTIONS.MATERIALS
      );
      const materialsQuery = query(materialsRef, orderBy('requestedAt', 'desc'));
      const materialsUnsub = onSnapshot(materialsQuery, (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            ...d,
            id: doc.id,
            requestedAt: d.requestedAt instanceof Timestamp ? d.requestedAt.toDate() : new Date(d.requestedAt),
            approvedAt: d.approvedAt instanceof Timestamp ? d.approvedAt.toDate() : d.approvedAt ? new Date(d.approvedAt) : undefined,
            orderedAt: d.orderedAt instanceof Timestamp ? d.orderedAt.toDate() : d.orderedAt ? new Date(d.orderedAt) : undefined,
            receivedAt: d.receivedAt instanceof Timestamp ? d.receivedAt.toDate() : d.receivedAt ? new Date(d.receivedAt) : undefined,
          } as CaseMaterial;
        });
        setMaterials(data);
      });
      unsubscribers.push(materialsUnsub);

      setLoading(false);
      setError(null);

      return () => {
        unsubscribers.forEach((unsub) => unsub());
      };
    } catch (err: any) {
      console.error('Error setting up finance listeners:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [options.organizationId, options.caseId]);

  // Add expense
  const addExpense = useCallback(
    async (expenseData: Omit<CaseExpense, 'id'>) => {
      if (!db || !options.organizationId || !options.caseId) {
        throw new Error('Database, organization, or case not initialized');
      }

      try {
        const expensesRef = collection(
          db,
          FIRESTORE_COLLECTIONS.ORGANIZATIONS,
          options.organizationId,
          FIRESTORE_COLLECTIONS.CASES,
          options.caseId,
          FIRESTORE_COLLECTIONS.EXPENSES
        );

        const docRef = await addDoc(expensesRef, {
          ...expenseData,
          paidAt: serverTimestamp(),
        });

        return docRef.id;
      } catch (err: any) {
        console.error('Error adding expense:', err);
        throw err;
      }
    },
    [options.organizationId, options.caseId]
  );

  // Add vendor bill
  const addVendorBill = useCallback(
    async (billData: Omit<CaseVendorBill, 'id'>) => {
      if (!db || !options.organizationId || !options.caseId) {
        throw new Error('Database, organization, or case not initialized');
      }

      try {
        const billsRef = collection(
          db,
          FIRESTORE_COLLECTIONS.ORGANIZATIONS,
          options.organizationId,
          FIRESTORE_COLLECTIONS.CASES,
          options.caseId,
          FIRESTORE_COLLECTIONS.VENDOR_BILLS
        );

        const docRef = await addDoc(billsRef, {
          ...billData,
          billDate: serverTimestamp(),
        });

        return docRef.id;
      } catch (err: any) {
        console.error('Error adding vendor bill:', err);
        throw err;
      }
    },
    [options.organizationId, options.caseId]
  );

  // Request material
  const requestMaterial = useCallback(
    async (materialData: Omit<CaseMaterial, 'id' | 'status'>) => {
      if (!db || !options.organizationId || !options.caseId) {
        throw new Error('Database, organization, or case not initialized');
      }

      try {
        const materialsRef = collection(
          db,
          FIRESTORE_COLLECTIONS.ORGANIZATIONS,
          options.organizationId,
          FIRESTORE_COLLECTIONS.CASES,
          options.caseId,
          FIRESTORE_COLLECTIONS.MATERIALS
        );

        const docRef = await addDoc(materialsRef, {
          ...materialData,
          status: 'requested',
          requestedAt: serverTimestamp(),
        });

        return docRef.id;
      } catch (err: any) {
        console.error('Error requesting material:', err);
        throw err;
      }
    },
    [options.organizationId, options.caseId]
  );

  // Approve material request
  const approveMaterial = useCallback(
    async (materialId: string, userId: string) => {
      if (!db || !options.organizationId || !options.caseId) {
        throw new Error('Database, organization, or case not initialized');
      }

      try {
        const materialRef = doc(
          db,
          FIRESTORE_COLLECTIONS.ORGANIZATIONS,
          options.organizationId,
          FIRESTORE_COLLECTIONS.CASES,
          options.caseId,
          FIRESTORE_COLLECTIONS.MATERIALS,
          materialId
        );

        await updateDoc(materialRef, {
          status: 'approved',
          approvedBy: userId,
          approvedAt: serverTimestamp(),
        });
      } catch (err: any) {
        console.error('Error approving material:', err);
        throw err;
      }
    },
    [options.organizationId, options.caseId]
  );

  return {
    expenses,
    vendorBills,
    materials,
    loading,
    error,
    addExpense,
    addVendorBill,
    requestMaterial,
    approveMaterial,
  };
};
