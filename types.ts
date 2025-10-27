




export enum LeadPipelineStatus {
  NEW_NOT_CONTACTED = "New - Not Contacted",
  CONTACTED_CALL_DONE = "Contacted - Call Done",
  SITE_VISIT_SCHEDULED = "Site Visit Scheduled",
  WAITING_FOR_DRAWING = "Waiting for Drawing",
  QUOTATION_SENT = "Quotation Sent",
  NEGOTIATION = "Negotiation",
  IN_PROCUREMENT = "In Procurement",
  IN_EXECUTION = "In Execution",
  WON = "Won",
  LOST = "Lost",
}
// Fix: Removed self-import of 'Document' which conflicts with the local declaration.
export interface Reminder {
  id: string;
  date: Date;
  notes: string;
  completed: boolean;
}

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
  email: string;
  phone: string;
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
  reminders?: Reminder[];
  tasks?: {
    siteVisits?: string[];
    drawingRequests?: string[];
    quotationRequests?: string[];
    procurementRequests?: string[];
    executionRequests?: string[];
    accountsRequests?: string[];
  }
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

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'jpg' | 'zip';
  url: string; // just a placeholder
  uploaded: Date;
  size: string; // e.g., '2.5MB'
}

export interface Project {
    id: string;
    clientName: string;
    projectName: string;
    status: ProjectStatus;
    deadline?: string;
    priority: 'High' | 'Medium' | 'Low';
    budget: number;
    advancePaid: number;
    clientAddress: string;
    clientContact: { name: string; phone: string; };
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
    documents?: Document[];
    salespersonId?: string; // User ID of the salesperson who won the deal
}

export enum SiteVisitStatus {
    SCHEDULED = "Scheduled",
    TRAVELING = "Traveling",
    ON_SITE = "On Site",
    COMPLETED = "Completed",
    REPORT_SUBMITTED = "Report Submitted",
}

export type SiteType = 'Apartment' | 'Office' | 'School' | 'Hospital' | 'Other';

export interface SiteVisit {
    id: string;
    leadId: string;
    projectName: string;
    clientName: string;
    date: Date;
    status: SiteVisitStatus;
    requesterId: string; // The sales person who requested it
    assigneeId: string; // The site engineer assigned
    siteAddress?: string;
    siteType?: SiteType;
    priority?: 'High' | 'Medium' | 'Low';
    notes?: {
        keyPoints?: string;
        measurements?: string;
        clientPreferences?: string;
        potentialChallenges?: string;
        photosRequired?: boolean;
    };
    attachments?: Document[];
    reportId?: string;
    travelStartTime?: Date;
    onSiteTime?: Date;
    completionTime?: Date;
}

export enum QuotationRequestStatus {
    REQUESTED = "Requested",
    IN_PROGRESS = "In Progress",
    COMPLETED = "Completed",
}

export interface QuotationRequest {
    id: string;
    leadId: string;
    projectName: string;
    clientName: string;
    requesterId: string; // Sales Team Member
    assigneeId: string; // Quotation Team Member
    status: QuotationRequestStatus;
    requestDate: Date;
    deadline?: Date;
    scopeOfWork?: {
        projectType?: string;
        materialQuality?: string;
        designStyle?: string;
        budgetRange?: string;
        timeline?: string;
        exclusions?: string;
        clientRequests?: string;
    };
    attachments?: Document[];
    notes?: string; // General notes
    quotedAmount?: number;
}

// Fix: Add missing Item interface for QuotationDetailModal
export interface Item {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
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
    userId: string;
    timestamp: Date;
    status: ActivityStatus;
    projectId?: string;
}

export enum AttendanceStatus {
    PRESENT = "Present",
    ABSENT = "Absent",
    HALF_DAY = "Half-day",
    LEAVE = "Leave",
}

export interface Attendance {
    date: Date;
    status: AttendanceStatus;
}
export enum DrawingRequestStatus {
    REQUESTED = "Requested",
    IN_PROGRESS = "In Progress",
    COMPLETED = "Completed",
}

export interface DrawingRequest {
    id: string;
    leadId: string;
    projectName: string;
    clientName: string;
    requesterId: string;
    assigneeId: string;
    status: DrawingRequestStatus;
    requestDate: Date;
    deadline?: Date;
    notes?: string;
}

export enum ProcurementRequestStatus {
    REQUESTED = "Requested",
    IN_PROGRESS = "In Progress",
    COMPLETED = "Completed",
}

export interface ProcurementRequest {
    id: string;
    leadId: string;
    projectName: string;
    requesterId: string;
    assigneeId: string;
    status: ProcurementRequestStatus;
    requestDate: Date;
    requiredByDate?: Date;
    materials: string;
}

export enum ExecutionRequestStatus {
    REQUESTED = "Requested",
    IN_PROGRESS = "In Progress",
    COMPLETED = "Completed",
}

export interface ExecutionRequest {
    id: string;
    leadId: string;
    projectName: string;
    requesterId: string;
    assigneeId: string;
    status: ExecutionRequestStatus;
    requestDate: Date;
    notes?: string;
}

export enum AccountsRequestStatus {
    REQUESTED = "Requested",
    IN_PROGRESS = "In Progress",
    COMPLETED = "Completed",
}

export interface AccountsRequest {
    id: string;
    leadId: string;
    projectName: string;
    requesterId: string;
    assigneeId: string;
    status: AccountsRequestStatus;
    requestDate: Date;
    notes?: string;
    task: 'Generate Proforma' | 'Verify Payment Terms' | 'Client Credit Check';
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  projectType: 'Office' | 'Residential' | 'Commercial';
  itemCount: number;
  avgCost: number;
}

export enum ExpenseClaimStatus {
    SUBMITTED = "Submitted",
    UNDER_REVIEW = "Under Review",
    APPROVED = "Approved",
    REJECTED = "Rejected",
    PAID = "Paid",
}

export interface ExpenseItem {
    id: string;
    type: 'Travel' | 'Parking' | 'Materials' | 'Other';
    description: string;
    amount: number;
    receiptUrl?: string;
}

export interface ExpenseClaim {
    id: string;
    visitId: string;
    engineerId: string;
    submissionDate: Date;
    totalAmount: number;
    status: ExpenseClaimStatus;
    items: ExpenseItem[];
}

export interface SiteMeasurement {
    roomName: string;
    length: number;
    width: number;
    height: number;
}

export interface SiteReport {
    id: string;
    visitId: string;
    checklistItems: { text: string; checked: boolean }[];
    measurements: SiteMeasurement[];
    photos: { url: string; caption: string }[];
    notes: string;
    expenseClaimId?: string;
}