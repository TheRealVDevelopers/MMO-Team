

export enum UserRole {
  SUPER_ADMIN = "Super Admin",
  SALES_GENERAL_MANAGER = "Sales General Manager",
  SALES_TEAM_MEMBER = "Sales Team Member",
  DRAWING_TEAM = "Drawing Team",
  QUOTATION_TEAM = "Quotation Team",
  SITE_ENGINEER = "Site Engineer",
  PROCUREMENT_TEAM = "Procurement Team",
  EXECUTION_TEAM = "Execution Team",
  ACCOUNTS_TEAM = "Accounts Team",
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  currentTask: string;
  lastUpdateTimestamp: Date;
  region?: string; // e.g., 'North', 'South', 'West', 'East'
}

export enum LeadPipelineStatus {
  NEW_NOT_CONTACTED = "New - Not Contacted",
  CONTACTED_CALL_DONE = "Contacted - Call Done",
  SITE_VISIT_SCHEDULED = "Site Visit Scheduled",
  WAITING_FOR_DRAWING = "Waiting for Drawing",
  QUOTATION_SENT = "Quotation Sent",
  NEGOTIATION = "Negotiation",
  WON = "Won",
  LOST = "Lost",
}


export interface LeadHistory {
    action: string;
    user: string;
    timestamp: Date;
    notes?: string;
}

export interface Lead {
  id: string;
  clientName: string;
  projectName: string;
  status: LeadPipelineStatus;
  lastContacted: string; // This can be deprecated in favor of history
  assignedTo: string; // User ID
  inquiryDate: Date;
  value: number;
  source: string;
  history: LeadHistory[];
  priority: 'High' | 'Medium' | 'Low';
}

export enum ProjectStatus {
    AWAITING_DESIGN = "Awaiting Design",
    DESIGN_IN_PROGRESS = "Design In Progress",
    PENDING_REVIEW = "Pending Review",
    REVISIONS_REQUESTED = "Revisions Requested",
    AWAITING_QUOTATION = "Awaiting Quotation",
    QUOTATION_SENT = "Quotation Sent",
    NEGOTIATING = "Negotiating",
    APPROVED = "Approved",
    REJECTED = "Rejected",
    PROCUREMENT = "Procurement",
    IN_EXECUTION = "In Execution",
    COMPLETED = "Completed",
    ON_HOLD = "On Hold",
}

export enum PaymentStatus {
    PENDING = "Pending",
    PAID = "Paid",
    OVERDUE = "Overdue",
    DRAFT = "Draft",
    SENT = "Sent",
    PARTIALLY_PAID = "Partially Paid",
}

export interface Issue {
    id: string;
    projectId: string;
    title: string;
    status: 'Open' | 'In Progress' | 'Resolved';
    priority: 'High' | 'Medium' | 'Low';
    reportedBy: string;
    timestamp: Date;
}

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface CommunicationMessage {
    id: string;
    user: string;
    avatar: string;
    message: string;
    timestamp: Date;
}

export interface Expense {
    id: string;
    projectId: string;
    category: 'Vendor' | 'Material' | 'Labor' | 'Other';
    description: string;
    amount: number;
    date: Date;
    status: 'Pending' | 'Approved' | 'Paid';
}


export interface Project {
    id: string;
    clientName: string;
    projectName: string;
    status: ProjectStatus;
    deadline?: string;
    priority: 'High' | 'Medium' | 'Low';
    budget: number;
    progress: number; // 0-100
    assignedTeam: {
        drawing?: string;
        quotation?: string;
        site_engineer?: string;
        execution?: string[];
    };
    milestones: { name: string; completed: boolean }[];
    startDate: Date;
    endDate: Date;
    issues?: Issue[];
    checklists?: {
        daily: ChecklistItem[];
        quality: ChecklistItem[];
    };
    communication?: CommunicationMessage[];
    totalExpenses?: number;
}

export enum SiteVisitStatus {
    SCHEDULED = "Scheduled",
    COMPLETED = "Completed",
    REPORT_SUBMITTED = "Report Submitted",
}

export interface SiteVisit {
    id: string;
    projectId: string;
    projectName: string;
    clientName: string;
    date: Date;
    status: SiteVisitStatus;
}

export interface Vendor {
    id: string;
    name: string;
    category: string;
    rating: number;
}

export interface Bid {
    vendorId: string;
    vendorName: string;
    amount: number;
    timestamp: string;
}

export enum MaterialRequestStatus {
    RFQ_PENDING = "RFQ Pending",
    BIDDING_OPEN = "Bidding Open",
    UNDER_EVALUATION = "Under Evaluation",
    NEGOTIATION = "Negotiation",
    PO_READY = "PO Ready",
    ORDER_PLACED = "Order Placed",
    DELIVERED = "Delivered",
}

export interface MaterialRequest {
    id: string;
    projectId: string;
    projectName: string;
    materials: { name:string, spec:string }[];
    requiredBy: Date;
    status: MaterialRequestStatus;
    priority: 'High' | 'Medium' | 'Low';
}

export interface MaterialOrder {
    id: string;
    material: string;
    quantity: number;
    vendorId: string;
    status: 'Ordered' | 'Shipped' | 'Delivered';
}

export interface Invoice {
    id: string;
    projectId: string;
    projectName: string;
    clientName: string;
    amount: number;
    paidAmount: number;
    issueDate: Date;
    dueDate: Date;
    status: PaymentStatus;
}

export interface VendorBill {
    id: string;
    vendorId: string;
    vendorName: string;
    invoiceNumber: string;
    amount: number;
    issueDate: Date;
    dueDate: Date;
    status: 'Pending' | 'Scheduled' | 'Paid';
    projectId?: string;
}

export enum ActivityStatus {
    DONE = "Done",
    IN_PROGRESS = "In Progress",
    PENDING = "Pending",
}

export interface Activity {
    id: string;
    description: string;
    team: UserRole;
    user: string; // user name
    timestamp: Date;
    status: ActivityStatus;
    projectId?: string;
}