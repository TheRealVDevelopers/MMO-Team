
import React, { useState } from 'react';
import AccountsOverviewPage from './accounts-team/AccountsOverviewPage';
import InvoicesPage from './accounts-team/InvoicesPage';
import ExpensesPage from './accounts-team/ExpensesPage';
import PaymentsPage from './accounts-team/PaymentsPage';
import ReportsPage from './accounts-team/ReportsPage';
import MyDayPage from './shared/MyDayPage';
import CommunicationDashboard from '../communication/CommunicationDashboard';
import EscalateIssuePage from '../escalation/EscalateIssuePage';
import { INVOICES, EXPENSES, VENDOR_BILLS, PROJECTS } from '../../constants';
import { Invoice, Expense, VendorBill, Project } from '../../types';

const AccountsTeamDashboard: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => {
  // Lift state up to manage data locally
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES);
  const [expenses, setExpenses] = useState<Expense[]>(EXPENSES);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>(VENDOR_BILLS);
  const [projects] = useState<Project[]>(PROJECTS); // Projects are read-only for now

  const handleAddInvoice = (newInvoice: Omit<Invoice, 'id'>) => {
    const fullInvoice: Invoice = { 
      ...newInvoice, 
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
     };
    setInvoices(prev => [fullInvoice, ...prev].sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime()));
  };

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
  };
  
  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    const fullExpense: Expense = { ...newExpense, id: `exp-${Date.now()}` };
    setExpenses(prev => [fullExpense, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp));
  };
  
  const handleAddVendorBill = (newBill: Omit<VendorBill, 'id'>) => {
    const fullBill: VendorBill = { ...newBill, id: `vb-${Date.now()}` };
    setVendorBills(prev => [fullBill, ...prev].sort((a,b) => b.dueDate.getTime() - a.dueDate.getTime()));
  };

  const handleUpdateVendorBill = (updatedBill: VendorBill) => {
    setVendorBills(prev => prev.map(bill => bill.id === updatedBill.id ? updatedBill : bill));
  };

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
      return <InvoicesPage 
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
      return <PaymentsPage 
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
