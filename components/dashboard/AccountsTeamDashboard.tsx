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
import PaymentVerificationInbox from './accounts-team/PaymentVerificationInbox';
import { useInvoices, addInvoice, updateInvoice } from '../../hooks/useInvoices';
import { useExpenses, updateExpense, addExpense } from '../../hooks/useExpenses';
import { useVendorBills, updateVendorBill, addVendorBill } from '../../hooks/useVendorBills';
import { useProjects } from '../../hooks/useProjects';
import { useLeads, updateLead } from '../../hooks/useLeads';
import { Invoice, Expense, VendorBill, Project, LeadPipelineStatus, ProjectStatus, ProjectLifecycleStatus } from '../../types';
import { db } from '../../firebase';
// Mock data import
import { PAYMENT_VERIFICATION_REQUESTS } from '../../constants';

const AccountsTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { vendorBills, loading: billsLoading } = useVendorBills();
  const { projects, loading: projectsLoading, addProject } = useProjects();
  const { leads, loading: leadsLoading } = useLeads();

  // Local state for payment requests (demo only)
  const [paymentRequests, setPaymentRequests] = useState(PAYMENT_VERIFICATION_REQUESTS);

  const handleVerifyPayment = async (requestId: string) => {
    const request = paymentRequests.find(r => r.id === requestId);
    if (!request) return;

    try {
      // 1. Update Lead Status to WON
      const leadId = request.projectId; // projectId field in PaymentRequest holds leadId for new projects
      const lead = leads.find(l => l.id === leadId);

      if (lead) {
        await updateLead(leadId, {
          status: LeadPipelineStatus.WON
        });

        // 2. Create a new Project
        const newProject: Omit<Project, 'id'> = {
          projectName: lead.projectName,
          clientName: lead.clientName,
          status: ProjectStatus.SITE_VISIT_PENDING,
          lifecycleStatus: ProjectLifecycleStatus.ADVANCE_PAID,
          priority: lead.priority || 'Medium',
          budget: lead.value || 0,
          advancePaid: request.amount, // Advance that was just verified
          clientAddress: '', // Lead doesn't have address, can be added later
          clientContact: {
            name: lead.clientName,
            phone: lead.clientMobile || ''
          },
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months default
          progress: 5, // Initial progress
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

    // New Case for Payment Verifications
    case 'verification-requests':
    case 'approvals': // Using 'approvals' as the general inbox for now
      return (
        <div className="max-w-4xl mx-auto p-6">
          <h2 className="text-2xl font-bold mb-6">Payment Verifications</h2>
          <PaymentVerificationInbox
            requests={paymentRequests}
            onVerify={handleVerifyPayment}
            onReject={handleRejectPayment}
          />
        </div>
      );

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
