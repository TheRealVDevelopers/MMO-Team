




import { User, Lead, UserRole, Project, ProjectStatus, Vendor, Invoice, PaymentStatus, LeadPipelineStatus, Activity, ActivityStatus, SiteVisit, SiteVisitStatus, MaterialRequest, MaterialRequestStatus, Issue, ChecklistItem, CommunicationMessage, Expense, VendorBill, Attendance, AttendanceStatus, Document, QuotationRequest, QuotationRequestStatus, DrawingRequest, DrawingRequestStatus, ProcurementRequest, ProcurementRequestStatus, ExecutionRequest, ExecutionRequestStatus, AccountsRequest, AccountsRequestStatus, Item, ProjectTemplate, ExpenseClaim, ExpenseClaimStatus, Task, TaskStatus, ChatChannel, ChatMessage, Complaint, ComplaintType, ComplaintPriority, ComplaintStatus, SiteReport, RFQ, RFQStatus, Bid, BidStatus, PurchaseOrder, POStatus, Organization, GanttTask, JMS, PaymentRequest } from './types';

// New Organization Mock Data
export const ORGANIZATIONS: Organization[] = [
    {
        id: 'org-1',
        name: 'Innovate Corp',
        contactPerson: 'Amit Desai',
        contactEmail: 'amit@innovatecorp.com',
        contactPhone: '+91 9988776650',
        address: '555 Innovation Dr, Bangalore',
        gstin: '29AAAAA0000A1Z5',
        projects: ['proj-108', 'proj-1'],
        createdAt: new Date('2024-01-15'),
        createdBy: 'user-1'
    },
    {
        id: 'org-2',
        name: 'Finance Partners',
        contactPerson: 'Rajesh Gupta',
        contactEmail: 'rajesh@financepartners.com',
        contactPhone: '+91 9820198201',
        address: '444 Money Street, Mumbai',
        gstin: '27BBBBB0000B1Z5',
        projects: ['proj-107'],
        createdAt: new Date('2024-02-10'),
        createdBy: 'user-2'
    }
];

// Mock Gantt Data
export const MOCK_GANTT_DATA: GanttTask[] = [
    {
        id: 'task-1',
        name: 'Project Kickoff',
        start: new Date('2024-06-01'),
        end: new Date('2024-06-02'),
        progress: 100,
        status: 'Completed',
        type: 'milestone',
        displayOrder: 1
    },
    {
        id: 'task-2',
        name: 'Demolition & Site Clear',
        start: new Date('2024-06-03'),
        end: new Date('2024-06-10'),
        progress: 100,
        status: 'Completed',
        type: 'task',
        displayOrder: 2,
        assignedTo: 'user-8',
        dependencies: ['task-1']
    },
    {
        id: 'task-3',
        name: 'Civil Works',
        start: new Date('2024-06-11'),
        end: new Date('2024-07-05'),
        progress: 60,
        status: 'In Progress',
        type: 'task',
        displayOrder: 3,
        assignedTo: 'user-8',
        dependencies: ['task-2'],
        resources: [
            { id: 'res-1', name: 'Cement', quantity: 50, unit: 'bags', requiredDate: new Date('2024-06-11'), status: 'Delivered' },
            { id: 'res-2', name: 'Sand', quantity: 200, unit: 'cft', requiredDate: new Date('2024-06-12'), status: 'Delivered' }
        ]
    },
];

// Mock JMS Data
export const MOCK_JMS: JMS = {
    id: 'jms-1',
    projectId: 'proj-108',
    items: [
        { id: 'jms-i1', description: '2x2 Vitrified Tiles', quotedQuantity: 2000, deliveredQuantity: 2000, unit: 'sqft', verified: true, verifiedBy: 'both' },
        { id: 'jms-i2', description: 'Gypsum Board Ceiling', quotedQuantity: 1500, deliveredQuantity: 1450, unit: 'sqft', verified: true, verifiedBy: 'both', notes: 'Actual measurement slightly less' },
    ],
    status: 'Completed',
    completedAt: new Date(),
    clientSignature: 'Amit Desai',
    pmSignature: 'Chris Executor'
};

export const formatCurrencyINR = (value: number) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
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

export const formatDateTime = (date: Date | string) => {
    const d = (typeof date === 'string' || typeof date === 'number') ? new Date(date) : date;
    if (!(d instanceof Date) || isNaN(d.getTime())) return 'Invalid Date';
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
};

export const formatDate = (date: Date | string) => {
    const d = (typeof date === 'string' || typeof date === 'number') ? new Date(date) : date;
    if (!(d instanceof Date) || isNaN(d.getTime())) return 'Invalid Date';
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
};

export const numberToWordsINR = (num: number): string => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const number = parseFloat(num.toString()).toFixed(2).split('.');
    const main = parseInt(number[0]);

    if (main.toString().length > 9) return 'overflow';
    const n = ('000000000' + main).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (parseInt(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (parseInt(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (parseInt(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (parseInt(n[4]) != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (parseInt(n[5]) != 0) ? str != '' ? 'and ' : '' + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';

    return str.replace(/\s+/g, ' ').trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Rupees Only';
}

export const COMPANY_DETAILS = {
    name: 'Make My Office Pvt Ltd',
    logo: '/mmo-logo-full.png',
    address: '123 Business Avenue, Gurgaon, Haryana, 122001',
    gstin: '06AAPDE1234F1Z5',
    email: 'accounts@makemyoffice.com',
    phone: '+91 987 654 3210'
};

export const BANK_DETAILS = {
    name: 'Make My Office Pvt Ltd',
    bank: 'HDFC Bank',
    accountNo: '50100234567890',
    ifsc: 'HDFC0000123'
};


const now = new Date();

export const USERS: User[] = [
    // Admin user required for initial login if auth is skipped, keeping one for safety or migration
    {
        id: 'user-1',
        name: 'Admin',
        role: UserRole.SUPER_ADMIN,
        avatar: 'https://i.pravatar.cc/150?u=user-1',
        currentTask: 'System Admin',
        lastUpdateTimestamp: new Date(),
        email: 'admin@makemyoffice.com',
        phone: '+91 98765 43210',
        currentTaskDetails: { title: 'System Admin', type: 'Desk Work', status: 'In Progress', startTime: new Date() }
    }
];


export const LEADS: Lead[] = [];

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

export const EXPENSES: Expense[] = [];

export const DOCUMENTS: Document[] = [
    { id: 'doc-1', name: 'Client_Brief_v1.pdf', type: 'pdf', url: '#', uploaded: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), size: '1.2MB' },
    { id: 'doc-2', name: 'Floorplan_Draft.pdf', type: 'pdf', url: '#', uploaded: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000), size: '3.5MB' },
    { id: 'doc-3', name: 'Inspiration_Images.zip', type: 'zip', url: '#', uploaded: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), size: '15.7MB' },
    { id: 'doc-4', name: 'Contract_Signed.pdf', type: 'pdf', url: '#', uploaded: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), size: '800KB' },
];

export const PROJECTS: Project[] = [];

export const VENDORS: Vendor[] = [
    { id: 'ven-1', name: 'Furniture World', category: 'Furniture', email: 'vendor@makemyoffice.com', phone: '+91 9876500001', rating: 4.8, specialization: 'Office Workstations & Chairs', address: '12 IND Estate, Okhla', gstin: '07AAAAA0000A1Z5', paymentTerms: '50% Advance' },
    { id: 'ven-2', name: 'Lighting Fast', category: 'Lighting', email: 'contact@lightingfast.com', phone: '+91 9876500002', rating: 4.5, specialization: 'LED & Architectural Lighting', address: '45 Light Market, Bhagirath Palace', gstin: '07BBBBB0000B1Z5', paymentTerms: '100% Against Delivery' },
    { id: 'ven-3', name: 'Paint Masters', category: 'Painting', email: 'info@paintmasters.com', phone: '+91 9876500003', rating: 4.9, specialization: 'Interior & Exterior Painting', address: '88 Color Road, Delhi', gstin: '07CCCCC0000C1Z5', paymentTerms: '30 days Credit' },
    { id: 'ven-4', name: 'ElectroSource', category: 'Electronics', email: 'b2b@electrosource.com', phone: '+91 9876500004', rating: 4.2, specialization: 'AV & Networking Gear', address: 'Nehru Place, Delhi', gstin: '07DDDDD0000D1Z5', paymentTerms: 'Advance Only' },
    { id: 'ven-5', name: 'Super Woodworks', category: 'Carpentry', email: 'hello@superwood.com', phone: '+91 9876500005', rating: 4.6, specialization: 'Custom Joinery', address: 'Kirti Nagar, Delhi', gstin: '07EEEEE0000E1Z5', paymentTerms: 'Milestone Based' },
];

export const RFQS: RFQ[] = [
    {
        id: 'rfq-1',
        rfqNumber: 'RFQ-2024-101',
        projectId: 'proj-104',
        projectName: 'Full Floor Fit-out',
        procurementRequestId: 'mr-2',
        items: [
            { id: 'item-1', name: 'LED Panel 2x2', description: '36W Cool White, Philips or Equivalent', quantity: 100, unit: 'nos', targetPrice: 2200 },
            { id: 'item-2', name: 'Track Light 15W', description: 'Warm White, Adjustable Beam', quantity: 40, unit: 'nos', targetPrice: 1500 }
        ],
        createdDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        status: RFQStatus.OPEN,
        invitedVendorIds: ['ven-2', 'ven-4'],
        createdBy: 'user-7'
    },
    {
        id: 'rfq-2',
        rfqNumber: 'RFQ-2024-102',
        projectId: 'proj-101',
        projectName: 'Pantry Renovation',
        items: [
            { id: 'item-3', name: 'Modular Pantry Cabinet', description: 'Waterproof Ply, Laminate Finish', quantity: 1, unit: 'lot' },
            { id: 'item-4', name: 'Quartz Countertop', description: 'Calacatta White, 18mm', quantity: 40, unit: 'sqft' }
        ],
        createdDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: RFQStatus.OPEN,
        invitedVendorIds: ['ven-1', 'ven-5'],
        createdBy: 'user-7'
    }
];

export const BIDS_DATA: Bid[] = [
    {
        id: 'bid-1',
        rfqId: 'rfq-1',
        vendorId: 'ven-2',
        vendorName: 'Lighting Fast',
        submittedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        validityDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        items: [
            { rfqItemId: 'item-1', unitPrice: 2100, totalPrice: 210000, remarks: 'Philips Brand' },
            { rfqItemId: 'item-2', unitPrice: 1450, totalPrice: 58000 }
        ],
        totalAmount: 268000,
        deliveryTimeline: '7 Days',
        paymentTerms: '100% Against Delivery',
        warranty: '2 Years Manufacturer Warranty',
        status: BidStatus.SUBMITTED
    },
    {
        id: 'bid-2',
        rfqId: 'rfq-1',
        vendorId: 'ven-4',
        vendorName: 'ElectroSource',
        submittedDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        validityDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        items: [
            { rfqItemId: 'item-1', unitPrice: 2050, totalPrice: 205000, remarks: 'Wipro Brand' },
            { rfqItemId: 'item-2', unitPrice: 1600, totalPrice: 64000 }
        ],
        totalAmount: 269000,
        deliveryTimeline: '5 Days',
        paymentTerms: 'Advance Only',
        warranty: '1 Year Warranty',
        status: BidStatus.SUBMITTED
    }
];

export const PURCHASE_ORDERS: PurchaseOrder[] = [
    {
        id: 'po-1',
        poNumber: 'PO-2024-055',
        rfqId: 'rfq-prev-1',
        bidId: 'bid-prev-1',
        vendorId: 'ven-1',
        projectId: 'proj-106',
        items: [
            { name: 'Executive Chair (Leather)', quantity: 10, unitPrice: 12000, total: 120000 },
            { name: 'Conf Table 8-Seater', quantity: 1, unitPrice: 45000, total: 45000 }
        ],
        totalAmount: 165000,
        taxAmount: 29700, // 18%
        grandTotal: 194700,
        issueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        expectedDeliveryDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // was due 2 days ago
        status: POStatus.IN_TRANSIT,
        billingAddress: COMPANY_DETAILS.address,
        shippingAddress: '333 Wellness Rd, Hyderabad',
        termsAndConditions: 'Standard MMO Procurement Terms apply.'
    }
];


export const INVOICES: Invoice[] = [];

export const VENDOR_BILLS: VendorBill[] = [
    { id: 'vb-001', vendorId: 'ven-3', vendorName: 'Paint Masters', invoiceNumber: 'PM-8372', amount: 200000, issueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), status: 'Approved', projectId: 'proj-104', poReference: 'PO-00123' },
    { id: 'vb-002', vendorId: 'ven-4', vendorName: 'ElectroSource', invoiceNumber: 'ES-2910', amount: 1200000, issueDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), status: 'Paid', projectId: 'proj-105', paymentDate: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000) },
    { id: 'vb-003', vendorId: 'ven-1', vendorName: 'Furniture World', invoiceNumber: 'FW-4401', amount: 1760000, issueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000), status: 'Pending Approval', projectId: 'proj-108' },
    { id: 'vb-004', vendorId: 'ven-2', vendorName: 'Lighting Fast', invoiceNumber: 'LF-9182', amount: 656000, issueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), status: 'Overdue', projectId: 'proj-106' },
    { id: 'vb-005', vendorId: 'ven-1', vendorName: 'Furniture World', invoiceNumber: 'FW-4590', amount: 840000, issueDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000), status: 'Scheduled', projectId: 'proj-101', paymentDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) },
];

export const PENDING_APPROVALS_COUNT = 3;

export const ACTIVITIES: Activity[] = [
    { id: 'act-1', description: 'Assigned "Innovate Corp" lead to John Sales', team: UserRole.SALES_GENERAL_MANAGER, userId: 'user-2', timestamp: new Date(now.getTime() - 15 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'lead-1' },
    { id: 'act-2', description: 'Completed site visit for "Global Ventures"', team: UserRole.SITE_ENGINEER, userId: 'user-6', timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'proj-101' },
    { id: 'act-3', description: 'Design for "Pantry Renovation" in progress', team: UserRole.DRAWING_TEAM, userId: 'user-4', timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), status: ActivityStatus.IN_PROGRESS, projectId: 'proj-101' },
    { id: 'act-4', description: 'Submitted quote for "Co-working Space Design"', team: UserRole.QUOTATION_TEAM, userId: 'user-5', timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'lead-4' },
    { id: 'act-5', description: 'Vendor approval pending for "Lighting Fast"', team: UserRole.SUPER_ADMIN, userId: 'user-1', timestamp: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000), status: ActivityStatus.PENDING },
    { id: 'act-6', description: 'Payment of INV-002 is overdue', team: UserRole.ACCOUNTS_TEAM, userId: 'user-9', timestamp: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), status: ActivityStatus.PENDING, projectId: 'inv-002' },
    { id: 'act-7', description: 'Logged initial call with Tech Solutions Ltd.', team: UserRole.SALES_TEAM_MEMBER, userId: 'user-10', timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'lead-2' },
    { id: 'act-8', description: 'Won deal with Finance Partners', team: UserRole.SALES_TEAM_MEMBER, userId: 'user-10', timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'lead-6' },
    { id: 'act-9', description: 'Submitted design for Pantry Renovation', team: UserRole.DRAWING_TEAM, userId: 'user-4', timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'proj-101' },
    { id: 'act-10', description: 'Revised quote for Art Studio Conversion', team: UserRole.QUOTATION_TEAM, userId: 'user-5', timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'proj-103' },
    { id: 'act-11', description: 'Lost deal with Health First Clinic', team: UserRole.SALES_TEAM_MEMBER, userId: 'user-3', timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'lead-7' },
    { id: 'act-12', description: 'Started procurement for Reception Redesign', team: UserRole.PROCUREMENT_TEAM, userId: 'user-7', timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), status: ActivityStatus.IN_PROGRESS, projectId: 'proj-106' },
    { id: 'act-13', description: 'Processed invoice for Legal Eagles LLP', team: UserRole.ACCOUNTS_TEAM, userId: 'user-9', timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), status: ActivityStatus.DONE, projectId: 'inv-001' },
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
    { id: 'ar-1', leadId: 'lead-6', projectName: 'Executive Floor Interiors', requesterId: 'user-10', assigneeId: 'user-9', status: AccountsRequestStatus.REQUESTED, requestDate: new Date(now.getTime() - 10 * 60 * 60 * 1000), task: 'Generate Proforma', notes: 'Please prepare proforma invoice for 50% advance payment.' },
];

export const ITEMS: Item[] = [
    { id: 'item-1', name: 'Executive Desk', category: 'Workstations', price: 45000, imageUrl: 'https://placehold.co/150/007bff/ffffff?text=Desk', unit: 'pcs', gstRate: 18 },
    { id: 'item-2', name: 'Ergonomic Chair', category: 'Chairs', price: 22000, imageUrl: 'https://placehold.co/150/28a745/ffffff?text=Chair', unit: 'pcs', gstRate: 18 },
    { id: 'item-3', name: 'Filing Cabinet', category: 'Storage', price: 18000, imageUrl: 'https://placehold.co/150/6c757d/ffffff?text=Cabinet', unit: 'pcs', gstRate: 18 },
    { id: 'item-4', name: 'LED Pendant Light', category: 'Lighting', price: 8500, imageUrl: 'https://placehold.co/150/ffc107/ffffff?text=Light', unit: 'pcs', gstRate: 18 },
    { id: 'item-5', name: 'Conference Table', category: 'Workstations', price: 85000, imageUrl: 'https://placehold.co/150/17a2b8/ffffff?text=Table', unit: 'pcs', gstRate: 18 },
    { id: 'item-6', name: 'Visitor Chair', category: 'Chairs', price: 9500, imageUrl: 'https://placehold.co/150/fd7e14/ffffff?text=Chair', unit: 'pcs', gstRate: 18 },
];

export const MATERIAL_REQUESTS: MaterialRequest[] = [
    { id: 'mr-1', projectId: 'proj-106', projectName: 'Reception Area Redesign', materials: [{ name: 'Reception Desk', spec: 'Custom Oak, 8ft' }, { name: 'Visitor Chairs', spec: 'Leather, Set of 6' }], requiredDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: MaterialRequestStatus.RFQ_PENDING, priority: 'High', itemName: 'Multiple Items', itemId: 'multi', quantityRequested: 1, unit: 'lot', requestedBy: 'user-8', createdAt: new Date() },
    { id: 'mr-2', projectId: 'proj-104', projectName: 'Full Floor Fit-out', materials: [{ name: 'LED Downlights', spec: '4-inch, Warm White, 100 units' }], requiredDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), status: MaterialRequestStatus.BIDDING_OPEN, priority: 'Medium', itemName: 'Multiple Items', itemId: 'multi', quantityRequested: 1, unit: 'lot', requestedBy: 'user-8', createdAt: new Date() },
    { id: 'mr-3', projectId: 'proj-108', projectName: 'HQ Remodel', materials: [{ name: 'Wall Paint', spec: 'Azure Blue, 20 gallons' }, { name: 'Acoustic Panels', spec: '2x4ft, 50 units' }], requiredDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(), status: MaterialRequestStatus.UNDER_EVALUATION, priority: 'Medium', itemName: 'Multiple Items', itemId: 'multi', quantityRequested: 1, unit: 'lot', requestedBy: 'user-8', createdAt: new Date() },
    { id: 'mr-4', projectId: 'proj-101', projectName: 'Pantry Renovation', materials: [{ name: 'Quartz Countertop', spec: 'Calacatta Gold, 40 sqft' }], requiredDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: MaterialRequestStatus.NEGOTIATION, priority: 'High', itemName: 'Multiple Items', itemId: 'multi', quantityRequested: 1, unit: 'lot', requestedBy: 'user-8', createdAt: new Date() },
    { id: 'mr-5', projectId: 'proj-109', projectName: 'Co-working Space', materials: [{ name: 'Modular Desks', spec: 'Set of 20' }], requiredDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), status: MaterialRequestStatus.ORDER_PLACED, priority: 'Low', itemName: 'Multiple Items', itemId: 'multi', quantityRequested: 1, unit: 'lot', requestedBy: 'user-8', createdAt: new Date() },
    { id: 'mr-6', projectId: 'proj-105', projectName: 'Conference Room AV', materials: [{ name: 'HDMI Cables', spec: '25ft, 2 pack' }], requiredDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), status: MaterialRequestStatus.DELIVERED, priority: 'Low', itemName: 'Multiple Items', itemId: 'multi', quantityRequested: 1, unit: 'lot', requestedBy: 'user-8', createdAt: new Date() },
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
    { id: 'task-1', title: 'Prepare proposal for Innovate Corp', userId: 'user-3', status: TaskStatus.IN_PROGRESS, timeSpent: 3600, priority: 'High', isPaused: false, startTime: Date.now() - 3600 * 1000, date: new Date().toISOString().split('T')[0], createdAt: new Date() },
    { id: 'task-2', title: 'Follow up with Global Ventures re: pantry', userId: 'user-3', status: TaskStatus.PENDING, timeSpent: 0, priority: 'Medium', isPaused: false, date: new Date().toISOString().split('T')[0], createdAt: new Date() },
    { id: 'task-3', title: 'Update CRM with new contacts', userId: 'user-3', status: TaskStatus.COMPLETED, timeSpent: 1800, priority: 'Low', isPaused: false, endTime: Date.now() - 2 * 3600 * 1000, date: new Date().toISOString().split('T')[0], createdAt: new Date() },
    { id: 'task-4', title: '3D renders for Pantry Renovation', userId: 'user-4', status: TaskStatus.IN_PROGRESS, timeSpent: 7200, priority: 'High', isPaused: false, startTime: Date.now() - 7200 * 1000, date: new Date().toISOString().split('T')[0], createdAt: new Date() },
    { id: 'task-5', title: 'Draft floorplan for Server Room Layout', userId: 'user-4', status: TaskStatus.PENDING, timeSpent: 0, priority: 'Medium', isPaused: false, date: new Date().toISOString().split('T')[0], createdAt: new Date() },
    { id: 'task-6', title: 'Revise quote for Art Studio Conversion', userId: 'user-5', status: TaskStatus.IN_PROGRESS, timeSpent: 900, priority: 'High', isPaused: false, startTime: Date.now() - 900 * 1000, date: new Date().toISOString().split('T')[0], createdAt: new Date() },
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

// Consolidated PaymentRequest is imported from types.ts
export const PAYMENT_VERIFICATION_REQUESTS: PaymentRequest[] = [
    {
        id: 'pvr-1',
        projectId: 'lead-6', // leadId or projectId
        clientId: 'client-6',
        clientName: 'Finance Partners',
        amount: 2500000,
        paymentMethod: 'Other', // Matching PaymentRequest.paymentMethod type
        utrNumber: 'IBKL92837465',
        status: 'Pending',
        submittedAt: new Date(new Date().getTime() - 1 * 60 * 60 * 1000)
    }
];

export const CHAT_CHANNELS: Omit<ChatChannel, 'lastMessage'>[] = [
    {
        id: 'channel-1',
        name: 'General',
        isGroup: true,
        avatar: 'https://i.pravatar.cc/150?u=group-general',
        members: ['user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-9', 'user-10']
    },
    {
        id: 'channel-3',
        name: 'Project: Enterprise Fitout',
        isGroup: true,
        avatar: 'https://i.pravatar.cc/150?u=group-proj-104',
        members: ['user-2', 'user-6', 'user-8', 'user-4']
    },
    {
        id: 'dm-user-3-user-4',
        name: 'Emily Designer',
        isGroup: false,
        avatar: USERS.find(u => u.id === 'user-4')?.avatar || '',
        members: ['user-3', 'user-4']
    },
    {
        id: 'dm-user-10-user-2',
        name: 'Sarah Manager',
        isGroup: false,
        avatar: USERS.find(u => u.id === 'user-2')?.avatar || '',
        members: ['user-10', 'user-2']
    },
];

export const CHAT_MESSAGES: ChatMessage[] = [
    // General channel
    { id: 'msg-1', channelId: 'channel-1', senderId: 'user-2', content: 'Morning team! Let\'s have a great week.', timestamp: new Date(now.getTime() - 24 * 3600 * 1000) },
    { id: 'msg-g2', channelId: 'channel-1', senderId: 'user-7', content: 'Morning! Anyone have an update on the vendor for the HQ Remodel?', timestamp: new Date(now.getTime() - 23 * 3600 * 1000) },
    { id: 'msg-g3', channelId: 'channel-1', senderId: 'user-3', content: 'I believe we are finalizing with Furniture World today.', timestamp: new Date(now.getTime() - 22 * 3600 * 1000) },

    // Project channel
    { id: 'msg-p1', channelId: 'channel-3', senderId: 'user-6', content: 'Team, I\'m on-site at Enterprise. The client is asking about the revised lighting plan.', timestamp: new Date(now.getTime() - 5 * 3600 * 1000) },
    { id: 'msg-p2', channelId: 'channel-3', senderId: 'user-4', content: 'I\'m sending it over now, David. Just finished the renders.', timestamp: new Date(now.getTime() - 4 * 3600 * 1000) },
    { id: 'msg-p3', channelId: 'channel-3', senderId: 'user-2', content: 'Great work, team. Keep the client updated.', timestamp: new Date(now.getTime() - 3 * 3600 * 1000) },

    // DM between John Sales (user-3) and Emily Designer (user-4)
    { id: 'msg-3', channelId: 'dm-user-3-user-4', senderId: 'user-3', content: 'Hey Emily, client is asking for a quick update on the renders.', timestamp: new Date(now.getTime() - 1 * 3600 * 1000) },
    { id: 'msg-4', channelId: 'dm-user-3-user-4', senderId: 'user-4', content: 'Just finishing them up, John. Will send over in an hour.', timestamp: new Date(now.getTime() - 55 * 60 * 1000) },

    // DM between Jane Doe (user-10) and Sarah Manager (user-2)
    { id: 'msg-d2-1', channelId: 'dm-user-10-user-2', senderId: 'user-10', content: 'Hi Sarah, I need your approval on the discount for the Tech Solutions deal.', timestamp: new Date(now.getTime() - 2 * 24 * 3600 * 1000) },
    { id: 'msg-d2-2', channelId: 'dm-user-10-user-2', senderId: 'user-2', content: 'Looks good, Jane. Proceed with 10%.', timestamp: new Date(now.getTime() - 2 * 24 * 3600 * 1000 + 5 * 60 * 1000) },
];


export const COMPLAINTS: Complaint[] = [
    { id: 'comp-1', submittedBy: 'user-3', against: 'Emily Designer', type: ComplaintType.TIMELINE_VIOLATIONS, priority: ComplaintPriority.MEDIUM, status: ComplaintStatus.SUBMITTED, projectContext: 'HQ Remodel (proj-108)', description: 'Drawings were promised EOD yesterday but have not been received. This is delaying the client presentation.', evidence: ['Chat logs from yesterday'], resolutionAttempts: 'Followed up on chat twice, no response.', desiredResolution: 'Immediate delivery of the drawings.', submissionDate: new Date(now.getTime() - 18 * 3600 * 1000) },
    { id: 'comp-2', submittedBy: 'user-8', against: UserRole.PROCUREMENT_TEAM, type: ComplaintType.WORKFLOW_BLOCKAGES, priority: ComplaintPriority.HIGH, status: ComplaintStatus.UNDER_REVIEW, projectContext: 'Full Floor Fit-out (proj-104)', description: 'Materials for the west wing are delayed by 3 days, causing a halt in work. No clear ETA provided by procurement.', evidence: ['Material request ticket', 'Email chain'], resolutionAttempts: 'Called procurement lead twice, was told they are "looking into it".', desiredResolution: 'A clear delivery date and a plan to expedite.', submissionDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000) },
];