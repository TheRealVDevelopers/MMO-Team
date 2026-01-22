
import React, { useState } from 'react';
import AccountsOverviewPage from './accounts-team/AccountsOverviewPage';
import SalesInvoicesPage from './accounts-team/SalesInvoicesPage';
import PurchaseInvoicesPage from './accounts-team/PurchaseInvoicesPage';
import ExpensesPage from './accounts-team/ExpensesPage';
import PaymentsPage from './accounts-team/PaymentsPage'; // Deprecated but kept for imports if needed
import ReportsPage from './accounts-team/ReportsPage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import { useInvoices, addInvoice, updateInvoice } from '../../hooks/useInvoices';
import { useExpenses, updateExpense } from '../../hooks/useExpenses';
import { useVendorBills, updateVendorBill } from '../../hooks/useVendorBills';
import { useProjects } from '../../hooks/useProjects';
import { Invoice, Expense, VendorBill, Project } from '../../types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const AccountsTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { vendorBills, loading: billsLoading } = useVendorBills();
  const { projects, loading: projectsLoading } = useProjects();

  const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id'>) => {
    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
      await addInvoice({
        ...newInvoice,
        invoiceNumber,
      });
    } catch (error) {
      console.error("Error adding invoice:", error);
    }
  };

  const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
    try {
      const { id, ...data } = updatedInvoice;
      await updateInvoice(id, data);
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
  };

  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    try {
      await addDoc(collection(db, 'expenses'), newExpense);
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleUpdateExpense = async (updatedExpense: Expense) => {
    try {
      const { id, ...data } = updatedExpense;
      await updateExpense(id, data);
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const handleAddVendorBill = async (newBill: Omit<VendorBill, 'id'>) => {
    try {
      await addDoc(collection(db, 'vendorBills'), newBill);
    } catch (error) {
      console.error("Error adding vendor bill:", error);
    }
  };

  const handleUpdateVendorBill = async (updatedBill: VendorBill) => {
    try {
      const { id, ...data } = updatedBill;
      await updateVendorBill(id, data);
    } catch (error) {
      console.error("Error updating vendor bill:", error);
    }
  };

  if (invoicesLoading || expensesLoading || billsLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  switch (currentPage) {
    case 'my-day':
      return <MyDayPage />;
    case 'overview':
      return <AccountsOverviewPage
        setCurrentPage={setCurrentPage}
        invoices={invoices}
        projects={projects}
        expenses={expenses}
        vendorBills={vendorBills}
      />;
    case 'invoices':
    case 'sales-invoices':
      return <SalesInvoicesPage
        setCurrentPage={setCurrentPage}
        invoices={invoices}
        projects={projects}
        onAddInvoice={handleAddInvoice}
        onUpdateInvoice={handleUpdateInvoice}
      />;
    case 'expenses':
      return <ExpensesPage
        setCurrentPage={setCurrentPage}
        expenses={expenses}
        projects={projects}
        onAddExpense={handleAddExpense}
        onUpdateExpense={handleUpdateExpense}
      />;
    case 'payments':
    case 'purchase-invoices':
      return <PurchaseInvoicesPage
        setCurrentPage={setCurrentPage}
        vendorBills={vendorBills}
        onAddVendorBill={handleAddVendorBill}
        onUpdateVendorBill={handleUpdateVendorBill}
      />;
    case 'reports':
      return <ReportsPage setCurrentPage={setCurrentPage} />;
    case 'communication':
      return <CommunicationDashboard />;
    case 'escalate-issue':
      return <EscalateIssuePage setCurrentPage={setCurrentPage} />;
    default:
      return <MyDayPage />;
  }
};

export default AccountsTeamDashboard;
