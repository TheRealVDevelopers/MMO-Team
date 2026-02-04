import React, { useState } from 'react';
import { useInvoices, addInvoice, updateInvoice } from '../../hooks/useInvoices';
import { useExpenses, addExpense, updateExpense } from '../../hooks/useExpenses';
import { useVendorBills, addVendorBill, updateVendorBill } from '../../hooks/useVendorBills';
import { useProjects, addProject } from '../../hooks/useProjects';
import { useLeads, updateLead } from '../../hooks/useLeads';
import AccountsOverviewPage from './accounts-team/AccountsOverviewPage';
import SalesInvoicesPage from './accounts-team/SalesInvoicesPage';
import ExpensesPage from './accounts-team/ExpensesPage';
import PurchaseInvoicesPage from './accounts-team/PurchaseInvoicesPage';
import PaymentVerificationInbox from './accounts-team/PaymentVerificationInbox';
import ReportsPage from './accounts-team/ReportsPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import MyDayPage from './shared/MyDayPage';
import ProjectPnLPage from './accounts-team/ProjectPnLPage';
import AccountsApprovalsPage from './accounts-team/AccountsApprovalsPage';
import AccountsBudgetApprovalPage from './accounts-team/AccountsBudgetApprovalPage';
import SalaryPage from './accounts-team/SalaryPage';
import InventoryPage from './accounts-team/InventoryPage';
import { Invoice, VendorBill, Expense, Project, LeadPipelineStatus, ProjectStatus, ProjectLifecycleStatus } from '../../types';
import { PAYMENT_VERIFICATION_REQUESTS } from '../../constants';

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
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { vendorBills, loading: billsLoading } = useVendorBills();
  const { projects, loading: projectsLoading } = useProjects();
  const { leads, loading: leadsLoading } = useLeads();

  // Local state for payment requests
  const [paymentRequests, setPaymentRequests] = useState(PAYMENT_VERIFICATION_REQUESTS);

  const handleVerifyPayment = async (requestId: string) => {
    const request = paymentRequests.find(r => r.id === requestId);
    if (!request) return;

    try {
      const leadId = request.projectId;
      const lead = leads.find(l => l.id === leadId);

      if (lead) {
        await updateLead(leadId, {
          status: LeadPipelineStatus.WON
        });

        // Create a new Project
        const newProject: Omit<Project, 'id'> = {
          projectName: lead.projectName,
          clientName: lead.clientName,
          status: ProjectStatus.SITE_VISIT_PENDING,
          lifecycleStatus: ProjectLifecycleStatus.ADVANCE_PAID,
          priority: lead.priority || 'Medium',
          budget: lead.value || 0,
          advancePaid: request.amount,
          clientAddress: '',
          clientContact: {
            name: lead.clientName,
            phone: lead.clientMobile || ''
          },
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          progress: 5,
          assignedTeam: {
            drawing: '',
            execution: [],
            quotation: ''
          },
          stages: [
            { id: 'stage-1', name: 'Site Visit', status: 'Pending', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            { id: 'stage-2', name: 'Drawing', status: 'Pending', deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
            { id: 'stage-3', name: 'BOQ', status: 'Pending', deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) }
          ],
          milestones: [
            { name: 'Site Visit Completed', completed: false },
            { name: 'Design Approved', completed: false },
            { name: 'BOQ Signed', completed: false }
          ],
          documents: [],
          history: [
            {
              action: 'Project Created',
              user: 'System',
              timestamp: new Date(),
              notes: 'Created automatically after advance payment verification.'
            }
          ]
        };

        await addProject(newProject);
        alert(`Payment confirmed! Lead "${lead.clientName}" converted to Project.`);
      }

      setPaymentRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error("Error verifying payment:", error);
      alert('Failed to verify payment and create project.');
    }
  };

  const handleRejectPayment = (requestId: string) => {
    setPaymentRequests(prev => prev.filter(r => r.id !== requestId));
  };

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
    case 'project-pnl':
      return <ProjectPnLPage setCurrentPage={setCurrentPage} />;

    case 'salary':
      return <SalaryPage />;

    case 'inventory':
      return <InventoryPage />;

    // Approvals
    case 'approvals':
      return <AccountsApprovalsPage />;

    case 'budget-approvals':
      return <AccountsBudgetApprovalPage />;

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
