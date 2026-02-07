import React, { useState } from 'react';
import UnifiedProjectsPage from './shared/UnifiedProjectsPage';
import { useInvoices, addInvoice, updateInvoice } from '../../hooks/useInvoices';
import { useExpenses, addExpense, updateExpense } from '../../hooks/useExpenses';
import { useVendorBills, addVendorBill, updateVendorBill } from '../../hooks/useVendorBills';
import { useProjects, addProject } from '../../hooks/useProjects';
import { useLeads, updateLead } from '../../hooks/useLeads';
import { convertLeadToProject } from '../../hooks/useCases';
import { useAuth } from '../../context/AuthContext';
import AccountsOverviewPage from './accounts-team/AccountsOverviewPage';
import SalesInvoicesPage from './accounts-team/SalesInvoicesPage';
import ExpensesPage from './accounts-team/ExpensesPage';
import PurchaseInvoicesPage from './accounts-team/PurchaseInvoicesPage';
import ApprovalInbox from './accounts-team/ApprovalInbox';
import ReportsPage from './accounts-team/ReportsPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import MyDayPage from './shared/MyDayPage';
import ProjectPnLPage from './accounts-team/ProjectPnLPage';
import AccountsApprovalsPage from './accounts-team/AccountsApprovalsPage';
import AccountsBudgetApprovalPage from './accounts-team/AccountsBudgetApprovalPage';
import SalaryPage from './accounts-team/SalaryPage';
import InventoryPage from './accounts-team/InventoryPage';
import AccountsTasksPage from './accounts-team/AccountsTasksPage';
import { Invoice, VendorBill, Expense, Project, LeadPipelineStatus, ProjectStatus, ProjectLifecycleStatus } from '../../types';

import GeneralLedgerPage from './accounts-team/GeneralLedgerPage';
import PaymentVerificationInbox from './accounts-team/PaymentVerificationInbox';

// Placeholder for new pages
const ComingSoonPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <div className="bg-surface p-8 rounded-2xl border border-border bg-opacity-50">
      <h2 className="text-2xl font-bold text-text-primary mb-2">{title}</h2>
      <p className="text-text-secondary">This module is currently under development.</p>
    </div>
  </div>
);

interface AccountsTeamDashboardProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const AccountsTeamDashboard: React.FC<AccountsTeamDashboardProps> = ({ currentPage, setCurrentPage }) => {
  const { currentUser } = useAuth();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { vendorBills, loading: billsLoading } = useVendorBills();
  const { projects, loading: projectsLoading } = useProjects();
  const { leads, loading: leadsLoading } = useLeads();

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
      await addExpense(newExpense);
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
      await addVendorBill(newBill);
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

  if (invoicesLoading || expensesLoading || billsLoading || projectsLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Routing Logic based on Sidebar IDs
  switch (currentPage) {
    case 'my-day':
      return <MyDayPage />;

    case 'payment-verification':
      return <PaymentVerificationInbox />;

    case 'tasks':
      return <AccountsTasksPage />;

    // Overview
    case 'overview':
      return <AccountsOverviewPage
        setCurrentPage={setCurrentPage}
        invoices={invoices}
        projects={projects}
        expenses={expenses}
        vendorBills={vendorBills}
      />;

    // Sales Invoices
    case 'sales-invoices':
      return <SalesInvoicesPage
        setCurrentPage={setCurrentPage}
        invoices={invoices}
        projects={projects}
        onAddInvoice={handleAddInvoice}
        onUpdateInvoice={handleUpdateInvoice}
      />;

    // Vendor Bills (mapped from purchase-invoices)
    case 'vendor-bills':
      return <PurchaseInvoicesPage
        setCurrentPage={setCurrentPage}
        vendorBills={vendorBills}
        onAddVendorBill={handleAddVendorBill}
        onUpdateVendorBill={handleUpdateVendorBill}
      />;

    // Expenses
    case 'expenses':
      return <ExpensesPage
        setCurrentPage={setCurrentPage}
        expenses={expenses}
        projects={projects}
        onAddExpense={handleAddExpense}
        onUpdateExpense={handleUpdateExpense}
      />;

    // New Modules
    case 'projects':
      return <UnifiedProjectsPage roleView="accounts" />;

    case 'project-pnl':
      return <ProjectPnLPage setCurrentPage={setCurrentPage} />;

    case 'salary':
      return <SalaryPage />;

    case 'inventory':
      return <InventoryPage />;

    // Approvals - UNIFIED INBOX
    case 'approvals':
      return <ApprovalInbox />;

    case 'budget-approvals':
      return <ApprovalInbox />; // Unified View (filtered by role internally)

    case 'general-ledger':
      return <GeneralLedgerPage />;

    // Shared / Misc
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
