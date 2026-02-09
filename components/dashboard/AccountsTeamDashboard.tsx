import React, { useState } from 'react';
import UnifiedProjectsPage from './shared/UnifiedProjectsPage';
import { useSalesInvoices } from '../../hooks/useSalesInvoices';
import { usePurchaseInvoices } from '../../hooks/usePurchaseInvoices';
import { useExpensesForOrg } from '../../hooks/useExpensesForOrg';
import { useProjects } from '../../hooks/useProjects';
import { useLeads } from '../../hooks/useLeads';
import { useAuth } from '../../context/AuthContext';
import AccountsOverviewPage from './accounts-team/AccountsOverviewPage';
import SalesInvoicesPage from './accounts-team/SalesInvoicesPage';
import ExpensesPage from './accounts-team/ExpensesPage';
import PurchaseInvoicesPage from './accounts-team/PurchaseInvoicesPage';
import DeliveredPendingInvoicePage from './accounts-team/DeliveredPendingInvoicePage';
import ApprovalInbox from './accounts-team/ApprovalInbox';
import ReportsPage from './accounts-team/ReportsPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import MyDayPage from './shared/MyDayPage';
import ProjectPnLPage from './accounts-team/ProjectPnLPage';
import SalaryPage from './accounts-team/SalaryPage';
import InventoryPage from './accounts-team/InventoryPage';
import AccountsTasksPage from './accounts-team/AccountsTasksPage';
import { Invoice, Project } from '../../types';

import GeneralLedgerPage from './accounts-team/GeneralLedgerPage';

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
  const orgId = currentUser?.organizationId ?? undefined;
  const { invoices: salesInvoices, loading: salesLoading, createSalesInvoice } = useSalesInvoices(orgId);
  const { invoices: purchaseInvoices, loading: purchaseLoading, createPurchaseInvoice } = usePurchaseInvoices(orgId);
  const { expenses: expensesFromLedger, loading: expensesLoading } = useExpensesForOrg(orgId);
  const { projects, loading: projectsLoading } = useProjects();
  const { leads, loading: leadsLoading } = useLeads();

  const handleCreateSalesInvoice = async (input: { caseId: string; clientName: string; amount: number; taxAmount?: number; totalAmount: number; issueDate: Date; dueDate?: Date }) => {
    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(salesInvoices.length + 1).padStart(3, '0')}`;
      await createSalesInvoice({
        ...input,
        invoiceNumber,
      });
    } catch (error) {
      console.error("Error creating sales invoice:", error);
      throw error;
    }
  };

  const handleCreatePurchaseInvoice = async (input: { caseId?: string; vendorName: string; invoiceNumber: string; amount: number; issueDate: Date; dueDate?: Date }): Promise<string> => {
    try {
      const id = await createPurchaseInvoice(input);
      return id;
    } catch (error) {
      console.error("Error creating purchase invoice:", error);
      throw error;
    }
  };

  if (salesLoading || purchaseLoading || expensesLoading || projectsLoading || leadsLoading) {
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
      return <ApprovalInbox />;

    case 'tasks':
      return <AccountsTasksPage />;

    // Overview
    case 'overview':
      return <AccountsOverviewPage setCurrentPage={setCurrentPage} />;

    // Sales Invoices (GR OUT) — org salesInvoices
    case 'sales-invoices':
      return <SalesInvoicesPage
        setCurrentPage={setCurrentPage}
        salesInvoices={salesInvoices}
        projects={projects}
        onCreateSalesInvoice={handleCreateSalesInvoice}
      />;

    // Purchase Invoices (GR IN) — org purchaseInvoices
    case 'vendor-bills':
      return <PurchaseInvoicesPage
        setCurrentPage={setCurrentPage}
        purchaseInvoices={purchaseInvoices}
        onCreatePurchaseInvoice={handleCreatePurchaseInvoice}
      />;

    // Delivered procurement plans → create purchase invoice (then mark INVOICED)
    case 'delivered-pending-invoice':
      return <DeliveredPendingInvoicePage
        setCurrentPage={setCurrentPage}
        onCreatePurchaseInvoice={handleCreatePurchaseInvoice}
      />;

    // Expenses — ledger-based list (create via Approval flow)
    case 'expenses':
      return <ExpensesPage
        setCurrentPage={setCurrentPage}
        expenses={expensesFromLedger}
        projects={projects}
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
