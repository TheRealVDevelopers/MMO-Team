

import { User, Lead, UserRole, Project, ProjectStatus, Vendor, Invoice, PaymentStatus, Bid, LeadPipelineStatus, Activity, ActivityStatus, SiteVisit, SiteVisitStatus, MaterialRequest, MaterialRequestStatus, Issue, ChecklistItem, CommunicationMessage, Expense, VendorBill } from './types';

const now = new Date();

export const USERS: User[] = [
  { id: 'user-1', name: 'Admin', role: UserRole.SUPER_ADMIN, avatar: 'https://i.pravatar.cc/150?u=user-1', currentTask: 'Reviewing Q3 performance reports.', lastUpdateTimestamp: new Date(now.getTime() - 15 * 60 * 1000) },
  { id: 'user-2', name: 'Sarah Manager', role: UserRole.SALES_GENERAL_MANAGER, avatar: 'https://i.pravatar.cc/150?u=user-2', currentTask: 'Finalizing sales strategy for new quarter.', lastUpdateTimestamp: new Date(now.getTime() - 30 * 60 * 1000) },
  { id: 'user-3', name: 'John Sales', role: UserRole.SALES_TEAM_MEMBER, avatar: 'https://i.pravatar.cc/150?u=user-3', currentTask: 'Preparing proposal for Innovate Corp.', lastUpdateTimestamp: new Date(now.getTime() - 5 * 60 * 1000), region: 'North' },
  { id: 'user-4', name: 'Emily Designer', role: UserRole.DRAWING_TEAM, avatar: 'https://i.pravatar.cc/150?u=user-4', currentTask: 'Working on 3D renders for Pantry Renovation.', lastUpdateTimestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
  { id: 'user-5', name: 'Mike Quote', role: UserRole.QUOTATION_TEAM, avatar: 'https://i.pravatar.cc/150?u=user-5', currentTask: 'Revising quote for Art Studio Conversion.', lastUpdateTimestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
  { id: 'user-6', name: 'David Engineer', role: UserRole.SITE_ENGINEER, avatar: 'https://i.pravatar.cc/150?u=user-6', currentTask: 'On-site visit at Enterprise Suites.', lastUpdateTimestamp: new Date(now.getTime() - 45 * 60 * 1000) },
  { id: 'user-7', name: 'Anna Procurement', role: UserRole.PROCUREMENT_TEAM, avatar: 'https://i.pravatar.cc/150?u=user-7', currentTask: 'Negotiating with furniture vendors.', lastUpdateTimestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
  { id: 'user-8', name: 'Chris Executor', role: UserRole.EXECUTION_TEAM, avatar: 'https://i.pravatar.cc/150?u=user-8', currentTask: 'Supervising electrical work at Enterprise Suites.', lastUpdateTimestamp: new Date(now.getTime() - 10 * 60 * 1000) },
  { id: 'user-9', name: 'Olivia Accounts', role: UserRole.ACCOUNTS_TEAM, avatar: 'https://i.pravatar.cc/150?u=user-9', currentTask: 'Processing invoices for completed projects.', lastUpdateTimestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000) },
  { id: 'user-10', name: 'Jane Doe', role: UserRole.SALES_TEAM_MEMBER, avatar: 'https://i.pravatar.cc/150?u=user-10', currentTask: 'Following up with Tech Solutions Ltd.', lastUpdateTimestamp: new Date(now.getTime() - 25 * 60 * 1000), region: 'South' },
];


export const LEADS: Lead[] = [
    { 
        id: 'lead-1', 
        clientName: 'Innovate Corp', 
        projectName: 'HQ Remodel', 
        status: LeadPipelineStatus.NEW_NOT_CONTACTED, 
        lastContacted: '2 hours ago', 
        assignedTo: 'user-3',
        inquiryDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        value: 150000,
        source: 'Website',
        history: [
            { action: 'Lead Created', user: 'System', timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) }
        ],
        priority: 'High',
    },
    { 
        id: 'lead-2', 
        clientName: 'Tech Solutions Ltd.', 
        projectName: 'New Office Wing', 
        status: LeadPipelineStatus.CONTACTED_CALL_DONE, 
        lastContacted: '1 day ago', 
        assignedTo: 'user-10',
        inquiryDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        value: 275000,
        source: 'Referral',
        history: [
            { action: 'Lead Created', user: 'System', timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
            { action: 'Initial Call', user: 'Jane Doe', timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), notes: 'Client is interested in a modern design.' }
        ],
        priority: 'High',
    },
    { 
        id: 'lead-3', 
        clientName: 'Global Ventures', 
        projectName: 'Pantry Renovation', 
        status: LeadPipelineStatus.SITE_VISIT_SCHEDULED, 
        lastContacted: '3 days ago', 
        assignedTo: 'user-3',
        inquiryDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        value: 75000,
        source: 'Cold Call',
        history: [
             { action: 'Lead Created', user: 'John Sales', timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
             { action: 'Initial Call', user: 'John Sales', timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
             { action: 'Site Visit Scheduled', user: 'John Sales', timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), notes: 'Visit booked for next Tuesday.' }
        ],
        priority: 'Medium',
    },
    { 
        id: 'lead-4', 
        clientName: 'Startup Hub', 
        projectName: 'Co-working Space Design', 
        status: LeadPipelineStatus.QUOTATION_SENT, 
        lastContacted: '5 hours ago', 
        assignedTo: 'user-10',
        inquiryDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        value: 450000,
        source: 'Website',
        history: [
            { action: 'Quotation Sent', user: 'Mike Quote', timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), notes: 'Quotation v1 sent.' }
        ],
        priority: 'High',
    },
    { 
        id: 'lead-5', 
        clientName: 'Marketing Gurus', 
        projectName: 'Creative Studio Setup', 
        status: LeadPipelineStatus.NEGOTIATION, 
        lastContacted: '1 week ago', 
        assignedTo: 'user-3',
        inquiryDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        value: 120000,
        source: 'Event',
        history: [
            { action: 'Negotiation Call', user: 'John Sales', timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), notes: 'Client is asking for a 10% discount.' }
        ],
        priority: 'Medium',
    },
    { 
        id: 'lead-6', 
        clientName: 'Finance Partners', 
        projectName: 'Executive Floor Interiors', 
        status: LeadPipelineStatus.WON, 
        lastContacted: '2 days ago', 
        assignedTo: 'user-10',
        inquiryDate: new Date(new Date().setDate(2)), // this month
        value: 320000,
        source: 'Referral',
        history: [
             { action: 'Deal Won', user: 'Jane Doe', timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }
        ],
        priority: 'High',
    },
    { 
        id: 'lead-7', 
        clientName: 'Health First Clinic', 
        projectName: 'Reception Redesign', 
        status: LeadPipelineStatus.LOST, 
        lastContacted: '1 month ago', 
        assignedTo: 'user-3',
        inquiryDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        value: 95000,
        source: 'Website',
        history: [
             { action: 'Deal Lost', user: 'John Sales', timestamp: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), notes: 'Lost to competitor pricing.' }
        ],
        priority: 'Low',
    },
    { 
        id: 'lead-8', 
        clientName: 'Highrise Apartments', 
        projectName: 'Lobby Interior', 
        status: LeadPipelineStatus.NEW_NOT_CONTACTED, 
        lastContacted: '48 hours ago', 
        assignedTo: 'user-10',
        inquiryDate: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        value: 210000,
        source: 'Website',
        history: [
            { action: 'Lead Created', user: 'System', timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000) }
        ],
        priority: 'Medium',
    }
];

export const ISSUES: Issue[] = [
    { id: 'issue-1', projectId: 'proj-104', title: 'Socket placement incorrect in west wing', status: 'Open', priority: 'High', reportedBy: 'Chris Executor', timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    { id: 'issue-2', projectId: 'proj-104', title: 'Paint color mismatch in conference room', status: 'In Progress', priority: 'Medium', reportedBy: 'David Engineer', timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    { id: 'issue-3', projectId: 'proj-108', title: 'Client requested minor change to lighting plan', status: 'Resolved', priority: 'Low', reportedBy: 'Chris Executor', timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
];

export const CHECKLISTS: Record<string, { daily: ChecklistItem[], quality: ChecklistItem[] }> = {
    'proj-104': {
        daily: [
            { id: 'd1', text: 'Site safety briefing', completed: true },
            { id: 'd2', text: 'Check material delivery schedule', completed: true },
            { id: 'd3', text: 'Update daily progress report', completed: false },
        ],
        quality: [
            { id: 'q1', text: 'First-fix electricals inspection', completed: true },
            { id: 'q2', text: 'Plumbing pressure test', completed: false },
            { id: 'q3', text: 'Drywall finishing check', completed: false },
        ]
    },
    'proj-108': {
        daily: [
            { id: 'd4', text: 'Confirm client access for the day', completed: true },
            { id: 'd5', text: 'Toolbox talk', completed: true },
            { id: 'd6', text: 'Submit time sheets', completed: false },
        ],
        quality: [
            { id: 'q4', text: 'Final furniture placement review', completed: true },
            { id: 'q5', text: 'Snag list creation', completed: true },
            { id: 'q6', text: 'Client handover checklist', completed: false },
        ]
    }
};

export const COMMUNICATION: Record<string, CommunicationMessage[]> = {
    'proj-104': [
        { id: 'c1', user: 'Anna Procurement', avatar: 'https://i.pravatar.cc/150?u=user-7', message: 'Just a heads-up, the light fixtures will be on site by Thursday.', timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000) },
        { id: 'c2', user: 'Chris Executor', avatar: 'https://i.pravatar.cc/150?u=user-8', message: 'Thanks, Anna. We\'ll be ready for them.', timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000) },
        { id: 'c3', user: 'Sarah Manager', avatar: 'https://i.pravatar.cc/150?u=user-2', message: 'Client called, they are very happy with the progress so far!', timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
    ],
    'proj-108': [
         { id: 'c4', user: 'Chris Executor', avatar: 'https://i.pravatar.cc/150?u=user-8', message: 'Team, we are on track for the final handover next Monday. Let\'s ensure all punch list items are cleared.', timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    ]
};

export const EXPENSES: Expense[] = [
    { id: 'exp-1', projectId: 'proj-104', category: 'Material', description: 'Paint Supplies from Paint Masters', amount: 2500, date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), status: 'Paid'},
    { id: 'exp-2', projectId: 'proj-104', category: 'Vendor', description: 'Plumbing Subcontractor Invoice', amount: 7500, date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), status: 'Pending'},
    { id: 'exp-3', projectId: 'proj-105', category: 'Material', description: 'AV Equipment from ElectroSource', amount: 15000, date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), status: 'Paid'},
    { id: 'exp-4', projectId: 'proj-106', category: 'Labor', description: 'On-site labor charges - Week 1', amount: 4000, date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), status: 'Paid'},
    { id: 'exp-5', projectId: 'proj-104', category: 'Labor', description: 'Electrician hourly charges', amount: 3200, date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), status: 'Approved' },
    { id: 'exp-6', projectId: 'proj-108', category: 'Material', description: 'Specialty light fixtures', amount: 5500, date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), status: 'Paid' },

];

export const PROJECTS: Project[] = [
    { id: 'proj-101', clientName: 'Global Ventures', projectName: 'Pantry Renovation', status: ProjectStatus.DESIGN_IN_PROGRESS, deadline: '5 days', priority: 'High', budget: 15000, progress: 10, assignedTeam: { drawing: 'user-4' }, milestones: [{name: 'Initial Design', completed: false}], startDate: new Date(2024, 5, 1), endDate: new Date(2024, 6, 15), totalExpenses: 1200 },
    { id: 'proj-102', clientName: 'Data Systems Inc', projectName: 'Server Room Layout', status: ProjectStatus.AWAITING_QUOTATION, deadline: '3 days', priority: 'Medium', budget: 35000, progress: 25, assignedTeam: { drawing: 'user-4', quotation: 'user-5' }, milestones: [{name: 'Initial Design', completed: true}, {name: 'Client Feedback', completed: false}], startDate: new Date(2024, 5, 10), endDate: new Date(2024, 7, 1), totalExpenses: 4500 },
    { id: 'proj-103', clientName: 'Creative Minds', projectName: 'Art Studio Conversion', status: ProjectStatus.NEGOTIATING, deadline: '3 days', priority: 'High', budget: 75000, progress: 40, assignedTeam: { quotation: 'user-5' }, milestones: [], startDate: new Date(2024, 6, 1), endDate: new Date(2024, 8, 30), totalExpenses: 0 },
    { id: 'proj-104', clientName: 'Enterprise Suites', projectName: 'Full Floor Fit-out', status: ProjectStatus.IN_EXECUTION, priority: 'Medium', budget: 250000, progress: 60, assignedTeam: { execution: ['user-8'], site_engineer: 'user-6' }, milestones: [{name: 'Advance Paid', completed: true}, {name: 'Milestone 1', completed: false}], startDate: new Date(2024, 4, 15), endDate: new Date(2024, 9, 15), issues: ISSUES.filter(i => i.projectId === 'proj-104'), checklists: CHECKLISTS['proj-104'], communication: COMMUNICATION['proj-104'], totalExpenses: 110000 },
    { id: 'proj-105', clientName: 'Legal Eagles LLP', projectName: 'Conference Room AV', status: ProjectStatus.COMPLETED, priority: 'Low', budget: 45000, progress: 100, assignedTeam: { drawing: 'user-4' }, milestones: [{name: 'Project Handover', completed: true}], startDate: new Date(2024, 3, 1), endDate: new Date(2024, 4, 30), totalExpenses: 32000 },
    { id: 'proj-106', clientName: 'Health First Clinic', projectName: 'Reception Area Redesign', status: ProjectStatus.PROCUREMENT, priority: 'Medium', budget: 60000, progress: 50, assignedTeam: {}, milestones: [], startDate: new Date(2024, 6, 20), endDate: new Date(2024, 8, 20), totalExpenses: 15000 },
    { id: 'proj-107', clientName: 'Finance Partners', projectName: 'Executive Floor Interiors', status: ProjectStatus.APPROVED, priority: 'High', budget: 320000, progress: 100, assignedTeam: { drawing: 'user-4', quotation: 'user-5' }, milestones: [], startDate: new Date(2024, 2, 1), endDate: new Date(2024, 5, 30), totalExpenses: 250000 },
    { id: 'proj-108', clientName: 'Innovate Corp', projectName: 'HQ Remodel', status: ProjectStatus.PENDING_REVIEW, priority: 'High', budget: 150000, progress: 95, assignedTeam: { execution: ['user-8'], drawing: 'user-4', site_engineer: 'user-6' }, milestones: [], startDate: new Date(2024, 5, 1), endDate: new Date(2024, 10, 1), issues: ISSUES.filter(i => i.projectId === 'proj-108'), checklists: CHECKLISTS['proj-108'], communication: COMMUNICATION['proj-108'], totalExpenses: 95000 },
    { id: 'proj-109', clientName: 'Startup Hub', projectName: 'Co-working Space', status: ProjectStatus.REVISIONS_REQUESTED, priority: 'Medium', budget: 450000, progress: 30, assignedTeam: { drawing: 'user-4' }, milestones: [], startDate: new Date(2024, 6, 1), endDate: new Date(2025, 1, 1), totalExpenses: 120000 },
    { id: 'proj-110', clientName: 'Alpha Logistics', projectName: 'Warehouse Office', status: ProjectStatus.AWAITING_DESIGN, deadline: '2 days', priority: 'High', budget: 90000, progress: 0, assignedTeam: { drawing: 'user-4' }, milestones: [], startDate: new Date(), endDate: new Date(new Date().setDate(now.getDate() + 30)), totalExpenses: 0 },
    { id: 'proj-111', clientName: 'Beta Software', projectName: 'Break Room', status: ProjectStatus.DESIGN_IN_PROGRESS, deadline: '10 days', priority: 'Low', budget: 25000, progress: 15, assignedTeam: { drawing: 'user-4' }, milestones: [], startDate: new Date(), endDate: new Date(new Date().setDate(now.getDate() + 45)), totalExpenses: 1000 },
    { id: 'proj-112', clientName: 'Quantum Solutions', projectName: 'Lab Fit-out', status: ProjectStatus.AWAITING_QUOTATION, deadline: '1 day', priority: 'High', budget: 180000, progress: 20, assignedTeam: { drawing: 'user-4', quotation: 'user-5' }, milestones: [], startDate: new Date(), endDate: new Date(new Date().setDate(now.getDate() + 60)), totalExpenses: 25000 },
    { id: 'proj-113', clientName: 'Sunrise Cafe', projectName: 'New Cafe Interior', status: ProjectStatus.QUOTATION_SENT, deadline: 'N/A', priority: 'Medium', budget: 55000, progress: 35, assignedTeam: { quotation: 'user-5' }, milestones: [], startDate: new Date(), endDate: new Date(new Date().setDate(now.getDate() + 40)), totalExpenses: 0 },
    { id: 'proj-114', clientName: 'Zenith Bank', projectName: 'Branch Office Renovation', status: ProjectStatus.REJECTED, deadline: 'N/A', priority: 'Low', budget: 220000, progress: 40, assignedTeam: { quotation: 'user-5' }, milestones: [], startDate: new Date(), endDate: new Date(new Date().setDate(now.getDate() + 90)), totalExpenses: 0 },
];

export const VENDORS: Vendor[] = [
    { id: 'ven-1', name: 'Furniture World', category: 'Furniture', rating: 4.8 },
    { id: 'ven-2', name: 'Lighting Fast', category: 'Lighting', rating: 4.5 },
    { id: 'ven-3', name: 'Paint Masters', category: 'Painting', rating: 4.9 },
    { id: 'ven-4', name: 'ElectroSource', category: 'Electronics', rating: 4.2 },
];

export const BIDS: Bid[] = [
    { vendorId: 'ven-1', vendorName: 'Furniture World', amount: 12500, timestamp: '2 hours ago' },
    { vendorId: 'ven-2', vendorName: 'Lighting Fast', amount: 8200, timestamp: '1 day ago' },
    { vendorId: 'ven-3', vendorName: 'Paint Masters', amount: 4500, timestamp: '3 hours ago' },
    { vendorId: 'ven-4', vendorName: 'ElectroSource', amount: 15000, timestamp: '5 hours ago' },
     { vendorId: 'ven-1', vendorName: 'Desks & Co.', amount: 11800, timestamp: '1 hour ago' },
];


export const INVOICES: Invoice[] = [
    { id: 'inv-001', projectId: 'proj-105', projectName: 'Conference Room AV', clientName: 'Legal Eagles LLP', amount: 45000, paidAmount: 45000, issueDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), status: PaymentStatus.PAID },
    { id: 'inv-002', projectId: 'proj-104', projectName: 'Full Floor Fit-out', clientName: 'Enterprise Suites', amount: 100000, paidAmount: 50000, issueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), status: PaymentStatus.PARTIALLY_PAID },
    { id: 'inv-003', projectId: 'proj-102', projectName: 'Server Room Layout', clientName: 'Data Systems Inc', amount: 10500, paidAmount: 0, issueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), status: PaymentStatus.OVERDUE },
    { id: 'inv-004', projectId: 'proj-106', projectName: 'Reception Area Redesign', clientName: 'Health First Clinic', amount: 24000, paidAmount: 0, issueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000), status: PaymentStatus.DRAFT },
    { id: 'inv-005', projectId: 'proj-107', projectName: 'Executive Floor Interiors', clientName: 'Finance Partners', amount: 150000, paidAmount: 150000, issueDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), status: PaymentStatus.PAID },
    { id: 'inv-006', projectId: 'proj-108', projectName: 'HQ Remodel', clientName: 'Innovate Corp', amount: 75000, paidAmount: 0, issueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 27 * 24 * 60 * 60 * 1000), status: PaymentStatus.SENT },
];

export const VENDOR_BILLS: VendorBill[] = [
    { id: 'vb-001', vendorId: 'ven-3', vendorName: 'Paint Masters', invoiceNumber: 'PM-8372', amount: 2500, issueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), status: 'Paid', projectId: 'proj-104' },
    { id: 'vb-002', vendorId: 'ven-4', vendorName: 'ElectroSource', invoiceNumber: 'ES-2910', amount: 15000, issueDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), status: 'Paid', projectId: 'proj-105' },
    { id: 'vb-003', vendorId: 'ven-1', vendorName: 'Furniture World', invoiceNumber: 'FW-4401', amount: 22000, issueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000), status: 'Pending', projectId: 'proj-108' },
    { id: 'vb-004', vendorId: 'ven-2', vendorName: 'Lighting Fast', invoiceNumber: 'LF-9182', amount: 8200, issueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000), status: 'Scheduled', projectId: 'proj-106' },
];

export const PENDING_APPROVALS_COUNT = 3;

export const ACTIVITIES: Activity[] = [
    { id: 'act-1', description: 'Assigned "Innovate Corp" lead to John Sales', team: UserRole.SALES_GENERAL_MANAGER, user: 'Sarah Manager', timestamp: new Date(now.getTime() - 15 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'lead-1' },
    { id: 'act-2', description: 'Completed site visit for "Global Ventures"', team: UserRole.SITE_ENGINEER, user: 'David Engineer', timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'proj-101' },
    { id: 'act-3', description: 'Design for "Pantry Renovation" in progress', team: UserRole.DRAWING_TEAM, user: 'Emily Designer', timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), status: ActivityStatus.IN_PROGRESS, projectId: 'proj-101' },
    { id: 'act-4', description: 'Submitted quote for "Co-working Space Design"', team: UserRole.QUOTATION_TEAM, user: 'Mike Quote', timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'lead-4' },
    { id: 'act-5', description: 'Vendor approval pending for "Lighting Fast"', team: UserRole.SUPER_ADMIN, user: 'Admin', timestamp: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000), status: ActivityStatus.PENDING },
    { id: 'act-6', description: 'Payment of INV-002 is overdue', team: UserRole.ACCOUNTS_TEAM, user: 'Olivia Accounts', timestamp: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), status: ActivityStatus.PENDING, projectId: 'inv-002' },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

export const SITE_VISITS: SiteVisit[] = [
    { id: 'sv-1', projectId: 'proj-108', projectName: 'HQ Remodel', clientName: 'Innovate Corp', date: new Date(today.setHours(10, 0, 0, 0)), status: SiteVisitStatus.SCHEDULED },
    { id: 'sv-2', projectId: 'proj-104', projectName: 'Full Floor Fit-out', clientName: 'Enterprise Suites', date: new Date(today.setHours(14, 30, 0, 0)), status: SiteVisitStatus.SCHEDULED },
    { id: 'sv-3', projectId: 'proj-101', projectName: 'Pantry Renovation', clientName: 'Global Ventures', date: new Date(yesterday.setHours(11, 0, 0, 0)), status: SiteVisitStatus.REPORT_SUBMITTED },
    { id: 'sv-4', projectId: 'proj-109', projectName: 'Co-working Space', clientName: 'Startup Hub', date: new Date(tomorrow.setHours(9, 0, 0, 0)), status: SiteVisitStatus.SCHEDULED },
];

export const MATERIAL_REQUESTS: MaterialRequest[] = [
    { id: 'mr-1', projectId: 'proj-106', projectName: 'Reception Area Redesign', materials: [{ name: 'Reception Desk', spec: 'Custom Oak, 8ft' }, { name: 'Visitor Chairs', spec: 'Leather, Set of 6' }], requiredBy: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), status: MaterialRequestStatus.RFQ_PENDING, priority: 'High' },
    { id: 'mr-2', projectId: 'proj-104', projectName: 'Full Floor Fit-out', materials: [{ name: 'LED Downlights', spec: '4-inch, Warm White, 100 units' }], requiredBy: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), status: MaterialRequestStatus.BIDDING_OPEN, priority: 'Medium' },
    { id: 'mr-3', projectId: 'proj-108', projectName: 'HQ Remodel', materials: [{ name: 'Wall Paint', spec: 'Azure Blue, 20 gallons' }, { name: 'Acoustic Panels', spec: '2x4ft, 50 units' }], requiredBy: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), status: MaterialRequestStatus.UNDER_EVALUATION, priority: 'Medium' },
    { id: 'mr-4', projectId: 'proj-101', projectName: 'Pantry Renovation', materials: [{ name: 'Quartz Countertop', spec: 'Calacatta Gold, 40 sqft' }], requiredBy: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), status: MaterialRequestStatus.NEGOTIATION, priority: 'High' },
    { id: 'mr-5', projectId: 'proj-109', projectName: 'Co-working Space', materials: [{ name: 'Modular Desks', spec: 'Set of 20' }], requiredBy: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), status: MaterialRequestStatus.ORDER_PLACED, priority: 'Low' },
    { id: 'mr-6', projectId: 'proj-105', projectName: 'Conference Room AV', materials: [{ name: 'HDMI Cables', spec: '25ft, 10 pack' }], requiredBy: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), status: MaterialRequestStatus.DELIVERED, priority: 'Low' },
];