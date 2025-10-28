

import { User, Lead, UserRole, Project, ProjectStatus, Vendor, Invoice, PaymentStatus, Bid, LeadPipelineStatus, Activity, ActivityStatus, SiteVisit, SiteVisitStatus, MaterialRequest, MaterialRequestStatus, Issue, ChecklistItem, CommunicationMessage, Expense, VendorBill, Attendance, AttendanceStatus, Document, QuotationRequest, QuotationRequestStatus, DrawingRequest, DrawingRequestStatus, ProcurementRequest, ProcurementRequestStatus, ExecutionRequest, ExecutionRequestStatus, AccountsRequest, AccountsRequestStatus, Item, ProjectTemplate, ExpenseClaim, ExpenseClaimStatus, Task, TaskStatus, ChatChannel, ChannelType, ChatMessage, QuickClarifyQuestion, QuestionCategory, QuestionUrgency, Complaint, ComplaintType, ComplaintPriority, ComplaintStatus, SiteReport } from './types';

export const formatCurrencyINR = (value: number) => 
    new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR', 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);

export const formatLargeNumberINR = (value: number): string => {
    if (value >= 10000000) {
        return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) {
        return `₹${(value / 100000).toFixed(2)} L`;
    }
    return formatCurrencyINR(value);
};

export const formatDateTime = (date: Date) => 
    new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);

export const formatDate = (date: Date) => 
    new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date);


const now = new Date();

export const USERS: User[] = [
  { id: 'user-1', name: 'Admin', role: UserRole.SUPER_ADMIN, avatar: 'https://i.pravatar.cc/150?u=user-1', currentTask: 'Reviewing Q3 performance reports.', lastUpdateTimestamp: new Date(now.getTime() - 15 * 60 * 1000), email: 'admin@makemyoffice.com', phone: '+91 98765 43210' },
  { id: 'user-2', name: 'Sarah Manager', role: UserRole.SALES_GENERAL_MANAGER, avatar: 'https://i.pravatar.cc/150?u=user-2', currentTask: 'Finalizing sales strategy for new quarter.', lastUpdateTimestamp: new Date(now.getTime() - 30 * 60 * 1000), email: 'sarah.m@makemyoffice.com', phone: '+91 98765 43211' },
  { id: 'user-3', name: 'John Sales', role: UserRole.SALES_TEAM_MEMBER, avatar: 'https://i.pravatar.cc/150?u=user-3', currentTask: 'Preparing proposal for Innovate Corp.', lastUpdateTimestamp: new Date(now.getTime() - 5 * 60 * 1000), region: 'North', email: 'john.s@makemyoffice.com', phone: '+91 98765 43212' },
  { id: 'user-4', name: 'Emily Designer', role: UserRole.DRAWING_TEAM, avatar: 'https://i.pravatar.cc/150?u=user-4', currentTask: 'Working on 3D renders for Pantry Renovation.', lastUpdateTimestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), email: 'emily.d@makemyoffice.com', phone: '+91 98765 43213' },
  { id: 'user-5', name: 'Mike Quote', role: UserRole.QUOTATION_TEAM, avatar: 'https://i.pravatar.cc/150?u=user-5', currentTask: 'Revising quote for Art Studio Conversion.', lastUpdateTimestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), email: 'mike.q@makemyoffice.com', phone: '+91 98765 43214' },
  { id: 'user-6', name: 'David Engineer', role: UserRole.SITE_ENGINEER, avatar: 'https://i.pravatar.cc/150?u=user-6', currentTask: 'On-site visit at Enterprise Suites.', lastUpdateTimestamp: new Date(now.getTime() - 45 * 60 * 1000), email: 'david.e@makemyoffice.com', phone: '+91 98765 43215' },
  { id: 'user-7', name: 'Anna Procurement', role: UserRole.PROCUREMENT_TEAM, avatar: 'https://i.pravatar.cc/150?u=user-7', currentTask: 'Negotiating with furniture vendors.', lastUpdateTimestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), email: 'anna.p@makemyoffice.com', phone: '+91 98765 43216' },
  { id: 'user-8', name: 'Chris Executor', role: UserRole.EXECUTION_TEAM, avatar: 'https://i.pravatar.cc/150?u=user-8', currentTask: 'Supervising electrical work at Enterprise Suites.', lastUpdateTimestamp: new Date(now.getTime() - 10 * 60 * 1000), email: 'chris.e@makemyoffice.com', phone: '+91 98765 43217' },
  { id: 'user-9', name: 'Olivia Accounts', role: UserRole.ACCOUNTS_TEAM, avatar: 'https://i.pravatar.cc/150?u=user-9', currentTask: 'Processing invoices for completed projects.', lastUpdateTimestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), email: 'olivia.a@makemyoffice.com', phone: '+91 98765 43218' },
  { id: 'user-10', name: 'Jane Doe', role: UserRole.SALES_TEAM_MEMBER, avatar: 'https://i.pravatar.cc/150?u=user-10', currentTask: 'Following up with Tech Solutions Ltd.', lastUpdateTimestamp: new Date(now.getTime() - 25 * 60 * 1000), region: 'South', email: 'jane.d@makemyoffice.com', phone: '+91 98765 43219' },
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
        value: 12000000,
        source: 'Website',
        history: [
            { action: 'Lead Created', user: 'System', timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) }
        ],
        priority: 'High',
        tasks: {
            siteVisits: ['sv-1'],
            quotationRequests: ['qr-2'],
        }
    },
    { 
        id: 'lead-2', 
        clientName: 'Tech Solutions Ltd.', 
        projectName: 'New Office Wing', 
        status: LeadPipelineStatus.CONTACTED_CALL_DONE, 
        lastContacted: '1 day ago', 
        assignedTo: 'user-10',
        inquiryDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        value: 22000000,
        source: 'Referral',
        history: [
            { action: 'Lead Created', user: 'System', timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
            { action: 'Initial Call', user: 'Jane Doe', timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), notes: 'Client is interested in a modern design.' }
        ],
        priority: 'High',
        reminders: [
            { id: 'rem-1', date: new Date(now.getTime() + 2 * 60 * 1000), notes: 'Follow up about the new design mockups.', completed: false },
            { id: 'rem-2', date: new Date(now.getTime() - 24 * 60 * 60 * 1000), notes: 'Send brochure.', completed: true }
        ],
        tasks: {
            siteVisits: ['sv-4', 'sv-6'],
            drawingRequests: ['dr-1'],
        }
    },
    { 
        id: 'lead-3', 
        clientName: 'Global Ventures', 
        projectName: 'Pantry Renovation', 
        status: LeadPipelineStatus.SITE_VISIT_SCHEDULED, 
        lastContacted: '3 days ago', 
        assignedTo: 'user-3',
        inquiryDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        value: 6000000,
        source: 'Cold Call',
        history: [
             { action: 'Lead Created', user: 'John Sales', timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
             { action: 'Initial Call', user: 'John Sales', timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
             { action: 'Site Visit Scheduled', user: 'John Sales', timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), notes: 'Visit booked for next Tuesday.' }
        ],
        priority: 'Medium',
        reminders: [
            { id: 'rem-3', date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), notes: 'Prepare for site visit on Tuesday.', completed: false }
        ],
        tasks: {
            siteVisits: ['sv-3', 'sv-5'],
        }
    },
    { 
        id: 'lead-4', 
        clientName: 'Startup Hub', 
        projectName: 'Co-working Space Design', 
        status: LeadPipelineStatus.QUOTATION_SENT, 
        lastContacted: '5 hours ago', 
        assignedTo: 'user-10',
        inquiryDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        value: 36000000,
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
        value: 9600000,
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
        value: 25600000,
        source: 'Referral',
        history: [
             { action: 'Deal Won', user: 'Jane Doe', timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }
        ],
        priority: 'High',
        tasks: {
            quotationRequests: ['qr-1'],
            procurementRequests: ['pr-1'],
            executionRequests: ['er-1'],
            accountsRequests: ['ar-1'],
        }
    },
    { 
        id: 'lead-7', 
        clientName: 'Health First Clinic', 
        projectName: 'Reception Redesign', 
        status: LeadPipelineStatus.LOST, 
        lastContacted: '1 month ago', 
        assignedTo: 'user-3',
        inquiryDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        value: 7600000,
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
        value: 16800000,
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
    { id: 'exp-1', projectId: 'proj-104', category: 'Material', description: 'Paint Supplies from Paint Masters', amount: 200000, date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), status: 'Paid'},
    { id: 'exp-2', projectId: 'proj-104', category: 'Vendor', description: 'Plumbing Subcontractor Invoice', amount: 600000, date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), status: 'Pending'},
    { id: 'exp-3', projectId: 'proj-105', category: 'Material', description: 'AV Equipment from ElectroSource', amount: 1200000, date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), status: 'Paid'},
    { id: 'exp-4', projectId: 'proj-106', category: 'Labor', description: 'On-site labor charges - Week 1', amount: 320000, date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), status: 'Paid'},
    { id: 'exp-5', projectId: 'proj-104', category: 'Labor', description: 'Electrician hourly charges', amount: 256000, date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), status: 'Approved' },
    { id: 'exp-6', projectId: 'proj-108', category: 'Material', description: 'Specialty light fixtures', amount: 440000, date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), status: 'Paid' },
];

export const DOCUMENTS: Document[] = [
    { id: 'doc-1', name: 'Client_Brief_v1.pdf', type: 'pdf', url: '#', uploaded: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), size: '1.2MB' },
    { id: 'doc-2', name: 'Floorplan_Draft.pdf', type: 'pdf', url: '#', uploaded: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000), size: '3.5MB' },
    { id: 'doc-3', name: 'Inspiration_Images.zip', type: 'zip', url: '#', uploaded: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), size: '15.7MB' },
    { id: 'doc-4', name: 'Contract_Signed.pdf', type: 'pdf', url: '#', uploaded: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), size: '800KB' },
];

export const PROJECTS: Project[] = [
    { id: 'proj-101', clientName: 'Global Ventures', projectName: 'Pantry Renovation', status: ProjectStatus.DESIGN_IN_PROGRESS, deadline: '5 days', priority: 'High', budget: 1200000, advancePaid: 600000, clientAddress: '123 Business Bay, Mumbai', clientContact: { name: 'Rohan Sharma', phone: '+91 9820098200' }, progress: 10, assignedTeam: { drawing: 'user-4' }, milestones: [{name: 'Initial Design', completed: false}], startDate: new Date(2024, 5, 1), endDate: new Date(2024, 6, 15), totalExpenses: 96000, salespersonId: 'user-3', documents: [DOCUMENTS[0], DOCUMENTS[1]] },
    { id: 'proj-102', clientName: 'Data Systems Inc', projectName: 'Server Room Layout', status: ProjectStatus.AWAITING_QUOTATION, deadline: '3 days', priority: 'Medium', budget: 2800000, advancePaid: 1000000, clientAddress: '456 Tech Park, Bangalore', clientContact: { name: 'Priya Patel', phone: '+91 9988776655' }, progress: 25, assignedTeam: { drawing: 'user-4', quotation: 'user-5' }, milestones: [{name: 'Initial Design', completed: true}, {name: 'Client Feedback', completed: false}], startDate: new Date(2024, 5, 10), endDate: new Date(2024, 7, 1), totalExpenses: 360000, salespersonId: 'user-10' },
    { id: 'proj-103', clientName: 'Creative Minds', projectName: 'Art Studio Conversion', status: ProjectStatus.NEGOTIATING, deadline: '3 days', priority: 'High', budget: 6000000, advancePaid: 2500000, clientAddress: '789 Art Lane, Delhi', clientContact: { name: 'Anjali Mehta', phone: '+91 9123456789' }, progress: 40, assignedTeam: { quotation: 'user-5' }, milestones: [], startDate: new Date(2024, 6, 1), endDate: new Date(2024, 8, 30), totalExpenses: 0, salespersonId: 'user-3' },
    { id: 'proj-104', clientName: 'Enterprise Suites', projectName: 'Full Floor Fit-out', status: ProjectStatus.IN_EXECUTION, priority: 'Medium', budget: 20000000, advancePaid: 10000000, clientAddress: '101 Corporate Towers, Gurgaon', clientContact: { name: 'Vikram Singh', phone: '+91 9876543210' }, progress: 60, assignedTeam: { execution: ['user-8'], site_engineer: 'user-6' }, milestones: [{name: 'Advance Paid', completed: true}, {name: 'Milestone 1', completed: false}], startDate: new Date(2024, 4, 15), endDate: new Date(2024, 9, 15), issues: ISSUES.filter(i => i.projectId === 'proj-104'), checklists: CHECKLISTS['proj-104'], communication: COMMUNICATION['proj-104'], totalExpenses: 8800000 },
    { id: 'proj-105', clientName: 'Legal Eagles LLP', projectName: 'Conference Room AV', status: ProjectStatus.COMPLETED, priority: 'Low', budget: 3600000, advancePaid: 3600000, clientAddress: '212 Law Chambers, Pune', clientContact: { name: 'Sunita Rao', phone: '+91 9555512345' }, progress: 100, assignedTeam: { drawing: 'user-4' }, milestones: [{name: 'Project Handover', completed: true}], startDate: new Date(2024, 3, 1), endDate: new Date(2024, 4, 30), totalExpenses: 2560000 },
    { id: 'proj-106', clientName: 'Health First Clinic', projectName: 'Reception Area Redesign', status: ProjectStatus.PROCUREMENT, priority: 'Medium', budget: 4800000, advancePaid: 2000000, clientAddress: '333 Wellness Rd, Hyderabad', clientContact: { name: 'Dr. Kumar', phone: '+91 9000011111' }, progress: 50, assignedTeam: {}, milestones: [], startDate: new Date(2024, 6, 20), endDate: new Date(2024, 8, 20), totalExpenses: 1200000, salespersonId: 'user-3' },
    { id: 'proj-107', clientName: 'Finance Partners', projectName: 'Executive Floor Interiors', status: ProjectStatus.APPROVED, priority: 'High', budget: 25600000, advancePaid: 12800000, clientAddress: '444 Money Street, Mumbai', clientContact: { name: 'Rajesh Gupta', phone: '+91 9820198201' }, progress: 100, assignedTeam: { drawing: 'user-4', quotation: 'user-5' }, milestones: [], startDate: new Date(2024, 2, 1), endDate: new Date(2024, 5, 30), totalExpenses: 20000000, salespersonId: 'user-10', documents: [DOCUMENTS[3]] },
    { id: 'proj-108', clientName: 'Innovate Corp', projectName: 'HQ Remodel', status: ProjectStatus.PENDING_REVIEW, priority: 'High', budget: 12000000, advancePaid: 6000000, clientAddress: '555 Innovation Dr, Bangalore', clientContact: { name: 'Amit Desai', phone: '+91 9988776650' }, progress: 95, assignedTeam: { execution: ['user-8'], drawing: 'user-4', site_engineer: 'user-6' }, milestones: [], startDate: new Date(2024, 5, 1), endDate: new Date(2024, 10, 1), issues: ISSUES.filter(i => i.projectId === 'proj-108'), checklists: CHECKLISTS['proj-108'], communication: COMMUNICATION['proj-108'], totalExpenses: 7600000, salespersonId: 'user-3' },
    { id: 'proj-109', clientName: 'Startup Hub', projectName: 'Co-working Space', status: ProjectStatus.REVISIONS_REQUESTED, priority: 'Medium', budget: 36000000, advancePaid: 15000000, clientAddress: '666 Growth Ave, Delhi', clientContact: { name: 'Sneha Reddy', phone: '+91 9123456780' }, progress: 30, assignedTeam: { drawing: 'user-4' }, milestones: [], startDate: new Date(2024, 6, 1), endDate: new Date(2025, 1, 1), totalExpenses: 9600000, salespersonId: 'user-10' },
    { id: 'proj-110', clientName: 'Alpha Logistics', projectName: 'Warehouse Office', status: ProjectStatus.AWAITING_DESIGN, deadline: '2 days', priority: 'High', budget: 7200000, advancePaid: 3000000, clientAddress: '777 Supply Chain, Chennai', clientContact: { name: 'Karthik Iyer', phone: '+91 9444455555' }, progress: 0, assignedTeam: { drawing: 'user-4' }, milestones: [], startDate: new Date(), endDate: new Date(new Date().setDate(now.getDate() + 30)), totalExpenses: 0 },
    { id: 'proj-111', clientName: 'Beta Software', projectName: 'Break Room', status: ProjectStatus.DESIGN_IN_PROGRESS, deadline: '10 days', priority: 'Low', budget: 2000000, advancePaid: 1000000, clientAddress: '888 Code Vista, Pune', clientContact: { name: 'Neha Joshi', phone: '+91 9555512346' }, progress: 15, assignedTeam: { drawing: 'user-4' }, milestones: [], startDate: new Date(), endDate: new Date(new Date().setDate(now.getDate() + 45)), totalExpenses: 80000 },
    { id: 'proj-112', clientName: 'Quantum Solutions', projectName: 'Lab Fit-out', status: ProjectStatus.AWAITING_QUOTATION, deadline: '1 day', priority: 'High', budget: 14400000, advancePaid: 7000000, clientAddress: '999 Research Blvd, Hyderabad', clientContact: { name: 'Dr. Venkat', phone: '+91 9000011112' }, progress: 20, assignedTeam: { drawing: 'user-4', quotation: 'user-5' }, milestones: [], startDate: new Date(), endDate: new Date(new Date().setDate(now.getDate() + 60)), totalExpenses: 2000000 },
    { id: 'proj-113', clientName: 'Sunrise Cafe', projectName: 'New Cafe Interior', status: ProjectStatus.QUOTATION_SENT, deadline: 'N/A', priority: 'Medium', budget: 4400000, advancePaid: 2200000, clientAddress: '12 Morning Glory, Mumbai', clientContact: { name: 'Aditya Chopra', phone: '+91 9820098202' }, progress: 35, assignedTeam: { quotation: 'user-5' }, milestones: [], startDate: new Date(), endDate: new Date(new Date().setDate(now.getDate() + 40)), totalExpenses: 0 },
    { id: 'proj-114', clientName: 'Zenith Bank', projectName: 'Branch Office Renovation', status: ProjectStatus.REJECTED, deadline: 'N/A', priority: 'Low', budget: 17600000, advancePaid: 0, clientAddress: '34 Central Plaza, Delhi', clientContact: { name: 'Manish Kumar', phone: '+91 9123456781' }, progress: 40, assignedTeam: { quotation: 'user-5' }, milestones: [], startDate: new Date(), endDate: new Date(new Date().setDate(now.getDate() + 90)), totalExpenses: 0 },
];

export const VENDORS: Vendor[] = [
    { id: 'ven-1', name: 'Furniture World', category: 'Furniture', rating: 4.8 },
    { id: 'ven-2', name: 'Lighting Fast', category: 'Lighting', rating: 4.5 },
    { id: 'ven-3', name: 'Paint Masters', category: 'Painting', rating: 4.9 },
    { id: 'ven-4', name: 'ElectroSource', category: 'Electronics', rating: 4.2 },
];

export const BIDS: Bid[] = [
    { vendorId: 'ven-1', vendorName: 'Furniture World', amount: 1000000, timestamp: '2 hours ago' },
    { vendorId: 'ven-2', vendorName: 'Lighting Fast', amount: 656000, timestamp: '1 day ago' },
    { vendorId: 'ven-3', vendorName: 'Paint Masters', amount: 360000, timestamp: '3 hours ago' },
    { vendorId: 'ven-4', vendorName: 'ElectroSource', amount: 1200000, timestamp: '5 hours ago' },
     { vendorId: 'ven-1', vendorName: 'Desks & Co.', amount: 944000, timestamp: '1 hour ago' },
];


export const INVOICES: Invoice[] = [
    { id: 'inv-001', projectId: 'proj-105', projectName: 'Conference Room AV', clientName: 'Legal Eagles LLP', amount: 3600000, paidAmount: 3600000, issueDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), status: PaymentStatus.PAID },
    { id: 'inv-002', projectId: 'proj-104', projectName: 'Full Floor Fit-out', clientName: 'Enterprise Suites', amount: 8000000, paidAmount: 4000000, issueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), status: PaymentStatus.PARTIALLY_PAID },
    { id: 'inv-003', projectId: 'proj-102', projectName: 'Server Room Layout', clientName: 'Data Systems Inc', amount: 840000, paidAmount: 0, issueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), status: PaymentStatus.OVERDUE },
    { id: 'inv-004', projectId: 'proj-106', projectName: 'Reception Area Redesign', clientName: 'Health First Clinic', amount: 1920000, paidAmount: 0, issueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000), status: PaymentStatus.DRAFT },
    { id: 'inv-005', projectId: 'proj-107', projectName: 'Executive Floor Interiors', clientName: 'Finance Partners', amount: 12000000, paidAmount: 12000000, issueDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), status: PaymentStatus.PAID },
    { id: 'inv-006', projectId: 'proj-108', projectName: 'HQ Remodel', clientName: 'Innovate Corp', amount: 6000000, paidAmount: 0, issueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 27 * 24 * 60 * 60 * 1000), status: PaymentStatus.SENT },
];

export const VENDOR_BILLS: VendorBill[] = [
    { id: 'vb-001', vendorId: 'ven-3', vendorName: 'Paint Masters', invoiceNumber: 'PM-8372', amount: 200000, issueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), status: 'Paid', projectId: 'proj-104' },
    { id: 'vb-002', vendorId: 'ven-4', vendorName: 'ElectroSource', invoiceNumber: 'ES-2910', amount: 1200000, issueDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), status: 'Paid', projectId: 'proj-105' },
    { id: 'vb-003', vendorId: 'ven-1', vendorName: 'Furniture World', invoiceNumber: 'FW-4401', amount: 1760000, issueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000), status: 'Pending', projectId: 'proj-108' },
    { id: 'vb-004', vendorId: 'ven-2', vendorName: 'Lighting Fast', invoiceNumber: 'LF-9182', amount: 656000, issueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000), status: 'Scheduled', projectId: 'proj-106' },
];

export const PENDING_APPROVALS_COUNT = 3;

export const ACTIVITIES: Activity[] = [
    { id: 'act-1', description: 'Assigned "Innovate Corp" lead to John Sales', team: UserRole.SALES_GENERAL_MANAGER, userId: 'user-2', timestamp: new Date(now.getTime() - 15 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'lead-1' },
    { id: 'act-2', description: 'Completed site visit for "Global Ventures"', team: UserRole.SITE_ENGINEER, userId: 'user-6', timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'proj-101' },
    { id: 'act-3', description: 'Design for "Pantry Renovation" in progress', team: UserRole.DRAWING_TEAM, userId: 'user-4', timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), status: ActivityStatus.IN_PROGRESS, projectId: 'proj-101' },
    { id: 'act-4', description: 'Submitted quote for "Co-working Space Design"', team: UserRole.QUOTATION_TEAM, userId: 'user-5', timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'lead-4' },
    { id: 'act-5', description: 'Vendor approval pending for "Lighting Fast"', team: UserRole.SUPER_ADMIN, userId: 'user-1', timestamp: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000), status: ActivityStatus.PENDING },
    { id: 'act-6', description: 'Payment of INV-002 is overdue', team: UserRole.ACCOUNTS_TEAM, userId: 'user-9', timestamp: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), status: ActivityStatus.PENDING, projectId: 'inv-002' },
    { id: 'act-7', description: 'Logged initial call with Tech Solutions Ltd.', team: UserRole.SALES_TEAM_MEMBER, userId: 'user-10', timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'lead-2'},
    { id: 'act-8', description: 'Won deal with Finance Partners', team: UserRole.SALES_TEAM_MEMBER, userId: 'user-10', timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'lead-6'},
    { id: 'act-9', description: 'Submitted design for Pantry Renovation', team: UserRole.DRAWING_TEAM, userId: 'user-4', timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'proj-101'},
    { id: 'act-10', description: 'Revised quote for Art Studio Conversion', team: UserRole.QUOTATION_TEAM, userId: 'user-5', timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'proj-103'},
    { id: 'act-11', description: 'Lost deal with Health First Clinic', team: UserRole.SALES_TEAM_MEMBER, userId: 'user-3', timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'lead-7'},
    { id: 'act-12', description: 'Started procurement for Reception Redesign', team: UserRole.PROCUREMENT_TEAM, userId: 'user-7', timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), status: ActivityStatus.IN_PROGRESS, projectId: 'proj-106'},
    { id: 'act-13', description: 'Processed invoice for Legal Eagles LLP', team: UserRole.ACCOUNTS_TEAM, userId: 'user-9', timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'inv-001'},
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

export const SITE_VISITS: SiteVisit[] = [
    { id: 'sv-1', leadId: 'lead-1', requesterId: 'user-3', assigneeId: 'user-6', projectName: 'HQ Remodel', clientName: 'Innovate Corp', date: new Date(new Date().setHours(10, 0, 0, 0)), status: SiteVisitStatus.SCHEDULED, notes: { keyPoints: 'Initial site survey with client. Check for structural columns.' }, priority: 'High', siteAddress: '555 Innovation Dr, Bangalore', siteType: 'Office' },
    { id: 'sv-2', leadId: 'lead-4', requesterId: 'user-10', assigneeId: 'user-6', projectName: 'Full Floor Fit-out', clientName: 'Enterprise Suites', date: new Date(new Date().setHours(14, 30, 0, 0)), status: SiteVisitStatus.TRAVELING, notes: { keyPoints: 'Verify all electrical outlet placements against the plan.', photosRequired: true }, priority: 'Medium', travelStartTime: new Date(new Date().setHours(14, 10, 0, 0)) },
    { id: 'sv-3', leadId: 'lead-3', requesterId: 'user-3', assigneeId: 'user-6', projectName: 'Pantry Renovation', clientName: 'Global Ventures', date: new Date(new Date().setDate(today.getDate() - 1)), status: SiteVisitStatus.REPORT_SUBMITTED, priority: 'Medium', reportId: 'rep-1' },
    { id: 'sv-4', leadId: 'lead-2', requesterId: 'user-10', assigneeId: 'user-6', projectName: 'Co-working Space', clientName: 'Startup Hub', date: new Date(new Date().setDate(today.getDate() + 1)), status: SiteVisitStatus.SCHEDULED, priority: 'Low' },
    { id: 'sv-5', leadId: 'lead-3', requesterId: 'user-3', assigneeId: 'user-6', projectName: 'Pantry Renovation', clientName: 'Global Ventures', date: new Date(new Date().setDate(today.getDate() - 2)), status: SiteVisitStatus.COMPLETED, notes: { clientPreferences: 'Client discussed color palette and material preferences.', photosRequired: true, measurements: 'Take photos of existing tiles.' }, priority: 'Medium' },
    { id: 'sv-6', leadId: 'lead-2', requesterId: 'user-10', assigneeId: 'user-6', projectName: 'Server Room Layout', clientName: 'Data Systems Inc', date: new Date(new Date().setHours(11, 30, 0, 0)), status: SiteVisitStatus.ON_SITE, notes: { keyPoints: 'Follow-up visit to finalize layout. Confirm server rack dimensions.' }, priority: 'High', travelStartTime: new Date(new Date().setHours(11, 0, 0, 0)), onSiteTime: new Date(new Date().setHours(11, 25, 0, 0)) },
];

export const QUOTATION_REQUESTS: QuotationRequest[] = [
    { id: 'qr-1', leadId: 'lead-6', projectName: 'Executive Floor Interiors', clientName: 'Finance Partners', requesterId: 'user-10', assigneeId: 'user-5', status: QuotationRequestStatus.COMPLETED, requestDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), notes: 'Client wants premium materials. Focus on marble and teak wood finishes.', quotedAmount: 25600000, deadline: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000) },
    { id: 'qr-2', leadId: 'lead-1', projectName: 'HQ Remodel', clientName: 'Innovate Corp', requesterId: 'user-3', assigneeId: 'user-5', status: QuotationRequestStatus.IN_PROGRESS, requestDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), notes: 'Standard office package, but with a flexible layout for future expansion. Please provide options.', deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
];

export const DRAWING_REQUESTS: DrawingRequest[] = [
    { id: 'dr-1', leadId: 'lead-2', projectName: 'New Office Wing', clientName: 'Tech Solutions Ltd.', requesterId: 'user-10', assigneeId: 'user-4', status: DrawingRequestStatus.REQUESTED, requestDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), notes: 'Client wants a modern, open-plan layout. Please provide 2D floorplan and 3D renders.' },
];

export const PROCUREMENT_REQUESTS: ProcurementRequest[] = [
    { id: 'pr-1', leadId: 'lead-6', projectName: 'Executive Floor Interiors', requesterId: 'user-10', assigneeId: 'user-7', status: ProcurementRequestStatus.REQUESTED, requestDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), materials: 'Premium marble for flooring, teak wood for paneling.' },
];

export const EXECUTION_REQUESTS: ExecutionRequest[] = [
    { id: 'er-1', leadId: 'lead-6', projectName: 'Executive Floor Interiors', requesterId: 'user-10', assigneeId: 'user-8', status: ExecutionRequestStatus.REQUESTED, requestDate: new Date(now.getTime() - 12 * 60 * 60 * 1000), notes: 'Project approved. Ready for execution to begin next week.' },
];

export const ACCOUNTS_REQUESTS: AccountsRequest[] = [
    { id: 'ar-1', leadId: 'lead-6', projectName: 'Executive Floor Interiors', requesterId: 'user-10', assigneeId: 'user-9', status: AccountsRequestStatus.REQUESTED, requestDate: new Date(now.getTime() - 10 * 60 * 60 * 1000), task: 'Generate Proforma', notes: 'Please prepare proforma invoice for 50% advance payment.'},
];

export const ITEMS: Item[] = [
  { id: 'item-1', name: 'Executive Desk', category: 'Workstations', price: 45000, imageUrl: 'https://via.placeholder.com/150/007bff/ffffff?text=Desk' },
  { id: 'item-2', name: 'Ergonomic Chair', category: 'Chairs', price: 22000, imageUrl: 'https://via.placeholder.com/150/28a745/ffffff?text=Chair' },
  { id: 'item-3', name: 'Filing Cabinet', category: 'Storage', price: 18000, imageUrl: 'https://via.placeholder.com/150/6c757d/ffffff?text=Cabinet' },
  { id: 'item-4', name: 'LED Pendant Light', category: 'Lighting', price: 8500, imageUrl: 'https://via.placeholder.com/150/ffc107/ffffff?text=Light' },
  { id: 'item-5', name: 'Conference Table', category: 'Workstations', price: 85000, imageUrl: 'https://via.placeholder.com/150/17a2b8/ffffff?text=Table' },
  { id: 'item-6', name: 'Visitor Chair', category: 'Chairs', price: 9500, imageUrl: 'https://via.placeholder.com/150/fd7e14/ffffff?text=Chair' },
];

export const MATERIAL_REQUESTS: MaterialRequest[] = [
    { id: 'mr-1', projectId: 'proj-106', projectName: 'Reception Area Redesign', materials: [{ name: 'Reception Desk', spec: 'Custom Oak, 8ft' }, { name: 'Visitor Chairs', spec: 'Leather, Set of 6' }], requiredBy: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), status: MaterialRequestStatus.RFQ_PENDING, priority: 'High' },
    { id: 'mr-2', projectId: 'proj-104', projectName: 'Full Floor Fit-out', materials: [{ name: 'LED Downlights', spec: '4-inch, Warm White, 100 units' }], requiredBy: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), status: MaterialRequestStatus.BIDDING_OPEN, priority: 'Medium' },
    { id: 'mr-3', projectId: 'proj-108', projectName: 'HQ Remodel', materials: [{ name: 'Wall Paint', spec: 'Azure Blue, 20 gallons' }, { name: 'Acoustic Panels', spec: '2x4ft, 50 units' }], requiredBy: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), status: MaterialRequestStatus.UNDER_EVALUATION, priority: 'Medium' },
    { id: 'mr-4', projectId: 'proj-101', projectName: 'Pantry Renovation', materials: [{ name: 'Quartz Countertop', spec: 'Calacatta Gold, 40 sqft' }], requiredBy: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), status: MaterialRequestStatus.NEGOTIATION, priority: 'High' },
    { id: 'mr-5', projectId: 'proj-109', projectName: 'Co-working Space', materials: [{ name: 'Modular Desks', spec: 'Set of 20' }], requiredBy: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), status: MaterialRequestStatus.ORDER_PLACED, priority: 'Low' },
    { id: 'mr-6', projectId: 'proj-105', projectName: 'Conference Room AV', materials: [{ name: 'HDMI Cables', spec: '25ft, 2 pack' }], requiredBy: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), status: MaterialRequestStatus.DELIVERED, priority: 'Low' },
];

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
    { id: 'pt-1', name: 'Small Office (10-20 ppl)', description: 'Basic fit-out for a small team, includes workstations, 1 meeting room, and a pantry.', projectType: 'Office', itemCount: 45, avgCost: 1500000 },
    { id: 'pt-2', name: 'Executive Cabin', description: 'Premium setup for a single executive cabin, with high-end furniture and finishes.', projectType: 'Office', itemCount: 15, avgCost: 800000 },
    { id: 'pt-3', name: '2BHK Apartment - Modern', description: 'Complete interior solution for a 2-bedroom apartment with a modern aesthetic.', projectType: 'Residential', itemCount: 120, avgCost: 2500000 },
];

export const SITE_REPORTS: SiteReport[] = [
    { id: 'rep-1', visitId: 'sv-3', checklistItems: [{ text: 'Measure total carpet area', checked: true }], measurements: [{ roomName: 'Pantry', length: 15, width: 10, height: 9 }], photos: [], notes: 'Site is ready for design work.', expenseClaimId: 'ec-1' },
];

export const EXPENSE_CLAIMS: ExpenseClaim[] = [
    { id: 'ec-1', visitId: 'sv-3', engineerId: 'user-6', submissionDate: new Date(new Date().setDate(today.getDate() - 1)), totalAmount: 850, status: ExpenseClaimStatus.SUBMITTED, items: [{ id: 'ei-1', type: 'Travel', description: 'Fuel for visit', amount: 600 }, { id: 'ei-2', type: 'Parking', description: 'Parking at site', amount: 250 }] },
    { id: 'ec-2', visitId: 'sv-5', engineerId: 'user-6', submissionDate: new Date(new Date().setDate(today.getDate() - 2)), totalAmount: 1200, status: ExpenseClaimStatus.APPROVED, items: [{ id: 'ei-3', type: 'Travel', description: 'Fuel for visit', amount: 900 }, { id: 'ei-4', type: 'Other', description: 'Client lunch', amount: 300 }] },
];

export const TASKS: Task[] = [
    { id: 'task-1', title: 'Prepare proposal for Innovate Corp', userId: 'user-3', status: TaskStatus.IN_PROGRESS, timeSpent: 3600, priority: 'High', isPaused: false, startTime: Date.now() - 3600 * 1000 },
    { id: 'task-2', title: 'Follow up with Global Ventures re: pantry', userId: 'user-3', status: TaskStatus.PENDING, timeSpent: 0, priority: 'Medium', isPaused: false },
    { id: 'task-3', title: 'Update CRM with new contacts', userId: 'user-3', status: TaskStatus.COMPLETED, timeSpent: 1800, priority: 'Low', isPaused: false, endTime: Date.now() - 2 * 3600 * 1000 },
    { id: 'task-4', title: '3D renders for Pantry Renovation', userId: 'user-4', status: TaskStatus.IN_PROGRESS, timeSpent: 7200, priority: 'High', isPaused: false, startTime: Date.now() - 7200 * 1000 },
    { id: 'task-5', title: 'Draft floorplan for Server Room Layout', userId: 'user-4', status: TaskStatus.PENDING, timeSpent: 0, priority: 'Medium', isPaused: false },
    { id: 'task-6', title: 'Revise quote for Art Studio Conversion', userId: 'user-5', status: TaskStatus.IN_PROGRESS, timeSpent: 900, priority: 'High', isPaused: false, startTime: Date.now() - 900 * 1000 },
];

export const ATTENDANCE_DATA: Record<string, Attendance[]> = {};
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
['user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-9', 'user-10'].forEach(userId => {
    ATTENDANCE_DATA[userId] = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentYear, currentMonth, i);
        if (date > now) continue; 
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue; 
        const rand = Math.random();
        let status: AttendanceStatus;
        if (rand < 0.85) { status = AttendanceStatus.PRESENT; } 
        else if (rand < 0.9) { status = AttendanceStatus.HALF_DAY; } 
        else if (rand < 0.95) { status = AttendanceStatus.LEAVE; } 
        else { status = AttendanceStatus.ABSENT; }
        ATTENDANCE_DATA[userId].push({ date, status });
    }
});

export const CHAT_CHANNELS: ChatChannel[] = [
    { id: 'channel-1', name: 'general', type: ChannelType.WORK_STREAM },
    { id: 'channel-2', name: 'design-team', type: ChannelType.WORK_STREAM },
    { id: 'channel-3', name: 'proj-104-fitout', type: ChannelType.WORK_STREAM, isProject: true },
    { id: 'channel-4', name: 'sales-north', type: ChannelType.WORK_STREAM },
    { id: 'channel-5', name: 'quick-clarify', type: ChannelType.QUICK_CLARIFY },
    { id: 'dm-user-3-user-4', name: 'Emily Designer', type: ChannelType.DIRECT_MESSAGE, members: ['user-3', 'user-4'] },
];

export const CHAT_MESSAGES: ChatMessage[] = [
    { id: 'msg-1', channelId: 'channel-1', senderId: 'user-2', content: 'Morning team! Let\'s have a great week.', timestamp: new Date(now.getTime() - 8 * 3600 * 1000) },
    { id: 'msg-2', channelId: 'channel-2', senderId: 'user-4', content: 'Need feedback on the Pantry Renovation renders, please.', timestamp: new Date(now.getTime() - 2 * 3600 * 1000) },
    { id: 'msg-3', channelId: 'dm-user-3-user-4', senderId: 'user-3', content: 'Hey Emily, client is asking for a quick update on the renders.', timestamp: new Date(now.getTime() - 1 * 3600 * 1000) },
    { id: 'msg-4', channelId: 'dm-user-3-user-4', senderId: 'user-4', content: 'Just finishing them up, John. Will send over in an hour.', timestamp: new Date(now.getTime() - 55 * 60 * 1000) },
];

export const QUICK_CLARIFY_QUESTIONS: QuickClarifyQuestion[] = [
    { id: 'qc-1', channelId: '#quick-clarify', senderId: 'user-6', timestamp: new Date(now.getTime() - 3 * 3600 * 1000), category: QuestionCategory.SITE, urgency: QuestionUrgency.HIGH, regarding: 'Enterprise Suites (proj-104)', question: 'Is the new electrical socket placement approved by the client? The diagram seems ambiguous.' },
    { id: 'qc-2', channelId: '#quick-clarify', senderId: 'user-4', timestamp: new Date(now.getTime() - 24 * 3600 * 1000), category: QuestionCategory.DESIGN, urgency: QuestionUrgency.MEDIUM, regarding: 'HQ Remodel (proj-108)', question: 'What is the approved paint finish for the accent wall? (Matte/Satin/Gloss)' },
];

export const COMPLAINTS: Complaint[] = [
    { id: 'comp-1', submittedBy: 'user-3', against: 'Emily Designer', type: ComplaintType.TIMELINE_VIOLATIONS, priority: ComplaintPriority.MEDIUM, status: ComplaintStatus.SUBMITTED, projectContext: 'HQ Remodel (proj-108)', description: 'Drawings were promised EOD yesterday but have not been received. This is delaying the client presentation.', evidence: ['Chat logs from yesterday'], resolutionAttempts: 'Followed up on chat twice, no response.', desiredResolution: 'Immediate delivery of the drawings.', submissionDate: new Date(now.getTime() - 18 * 3600 * 1000) },
    { id: 'comp-2', submittedBy: 'user-8', against: UserRole.PROCUREMENT_TEAM, type: ComplaintType.WORKFLOW_BLOCKAGES, priority: ComplaintPriority.HIGH, status: ComplaintStatus.UNDER_REVIEW, projectContext: 'Full Floor Fit-out (proj-104)', description: 'Materials for the west wing are delayed by 3 days, causing a halt in work. No clear ETA provided by procurement.', evidence: ['Material request ticket', 'Email chain'], resolutionAttempts: 'Called procurement lead twice, was told they are "looking into it".', desiredResolution: 'A clear delivery date and a plan to expedite.', submissionDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000) },
];
