

export enum LeadPipelineStatus {
  NEW_NOT_CONTACTED = "New - Not Contacted",
  CONTACTED_CALL_DONE = "Contacted - Call Done",
  SITE_VISIT_SCHEDULED = "Site Visit Scheduled",
  SITE_VISIT_RESCHEDULED = "Site Visit Rescheduled",
  WAITING_FOR_DRAWING = "Waiting for Drawing",
  DRAWING_IN_PROGRESS = "Drawing In Progress",
  DRAWING_REVISIONS = "Drawing Revisions",
  WAITING_FOR_QUOTATION = "Waiting for Quotation",
  QUOTATION_SENT = "Quotation Sent",
  NEGOTIATION = "Negotiation",
  IN_SOURCING = "In Sourcing",
  IN_EXECUTION = "In Execution",
  WON = "Won",
  LOST = "Lost",
}

// Project Enquiry Status
export enum EnquiryStatus {
  NEW = "New",
  ASSIGNED = "Assigned",
  CONVERTED_TO_LEAD = "Converted to Lead",
  REJECTED = "Rejected",
}

// Time Tracking Status
export enum TimeTrackingStatus {
  CLOCKED_OUT = "Clocked Out",
  CLOCKED_IN = "Clocked In",
  ON_BREAK = "On Break",
}

export interface TimeActivity {
  id: string;
  name: string; // e.g., "Designing UI", "Meeting with Client"
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  tags?: string[];
}

export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  clockIn: Date;
  clockOut?: Date;
  breaks: BreakEntry[];
  activities: TimeActivity[]; // New field for detailed tracking
  totalWorkHours?: number;
  totalBreakMinutes?: number;
  date: string; // YYYY-MM-DD format
  status: TimeTrackingStatus;
}

export interface BreakEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
}

export interface CurrentTimeStatus {
  userId: string;
  status: TimeTrackingStatus;
  currentEntryId?: string;
  clockInTime?: Date;
  currentBreakStartTime?: Date;
}

// Project Enquiry (from "Start Your Project" form)
export interface ProjectEnquiry {
  id: string;
  enquiryId: string; // ENQ-2025-00123
  clientName: string;
  email: string;
  mobile: string;
  city: string;
  projectType: string;
  spaceType: string;
  area: string;
  numberOfZones?: string;
  isRenovation: string;
  designStyle: string;
  budgetRange: string;
  startTime: string;
  completionTimeline: string;
  additionalNotes?: string;
  status: EnquiryStatus;
  assignedTo?: string; // User ID
  assignedToName?: string; // User name
  clientPassword?: string; // Set when assigning
  convertedLeadId?: string; // Lead ID after conversion
  createdAt: Date;
  updatedAt?: Date;
  viewedBy: string[]; // Array of user IDs who viewed this
  isNew: boolean; // Notification flag
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
  MANAGER = "Manager",
  DESIGNER = "Designer",
  SALES_GENERAL_MANAGER = "Sales General Manager",
  SALES_TEAM_MEMBER = "Sales Team Member",
  DRAWING_TEAM = "Drawing Team",
  QUOTATION_TEAM = "Quotation Team",
  SITE_ENGINEER = "Site Engineer",
  SOURCING_TEAM = "Sourcing Team",
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

  // Performance Metrics
  activeTaskCount?: number;
  overdueTaskCount?: number;
  upcomingDeadlineCount?: number;
  performanceFlag?: 'green' | 'yellow' | 'red';
  flagReason?: string;
  flagUpdatedAt?: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  user_id: string; // who should see it
  entity_type: 'lead' | 'project' | 'message' | 'task' | 'system';
  entity_id?: string;
  is_read: boolean;
  is_demo: boolean;
  created_at: Date;
  type?: 'info' | 'success' | 'warning' | 'error';
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
    sourcingRequests?: string[];
    executionRequests?: string[];
    accountsRequests?: string[];
  }
  // Project tracking fields
  clientEmail: string;
  clientMobile: string;
  currentStage?: number; // 1-8 project stages
  deadline?: Date;
  milestones?: ProjectMilestone[];
  communicationMessages?: LeadCommunicationMessage[];
  files?: LeadFile[];
  is_demo?: boolean;
}

export enum ProjectStatus {
  AWAITING_DESIGN = "Awaiting Design",
  DESIGN_IN_PROGRESS = "Design In Progress",
  REVISIONS_IN_PROGRESS = "Revisions In Progress",
  PENDING_REVIEW = "Pending Review",
  REVISIONS_REQUESTED = "Revisions Requested",
  AWAITING_QUOTATION = "Awaiting Quotation",
  QUOTATION_SENT = "Quotation Sent",
  NEGOTIATING = "Negotiating",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  SOURCING = "Sourcing",
  IN_EXECUTION = "In Execution",
  COMPLETED = "Completed",
  ON_HOLD = "On Hold",
  SITE_VISIT_RESCHEDULED = "Site Visit Rescheduled",
  APPROVAL_REQUESTED = "Approval Requested",
  TERMINATED = "Terminated",
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

export interface LeadCommunicationMessage {
  id: string;
  leadId: string;
  senderId: string;
  senderName: string;
  senderRole: 'sales' | 'client';
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface LeadFile {
  id: string;
  leadId: string;
  fileName: string;
  fileUrl: string;
  fileType: string; // 'image' | 'document' | 'other'
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
}

export interface ProjectMilestone {
  id: string;
  leadId: string;
  stage: number; // 1-8
  stageName: string;
  status: 'pending' | 'in-progress' | 'completed';
  deadline?: Date;
  completedAt?: Date;
  notes?: string;
  updatedBy?: string;
  updatedAt?: Date;
}

// Approval Request Types
export enum ApprovalRequestType {
  LEAVE = "Leave Request",
  EARLY_DEPARTURE = "Early Departure",
  LATE_ARRIVAL = "Late Arrival",
  WORK_FROM_HOME = "Work From Home",
  TIME_OFF = "Time Off",
  OVERTIME = "Overtime Approval",
  EXPENSE = "Expense Approval",
  // Work Requests
  SITE_VISIT = "Site Visit",
  RESCHEDULE_SITE_VISIT = "Reschedule Site Visit",
  START_DRAWING = "Start Drawing",
  DESIGN_CHANGE = "Design Change",
  DRAWING_REVISIONS = "Drawing Revisions",
  MATERIAL_CHANGE = "Material Change",
  PAYMENT_QUERY = "Payment Query",
  CLARIFICATION = "Clarification",
  MODIFICATION = "Modification",
  REQUEST_FOR_QUOTATION = "Request for Quotation",

  // Legacy/Tokens (Keep for compatibility if needed, or consolidate)
  SITE_VISIT_TOKEN = "Site Visit Token", // Can be deprecated in favor of SITE_VISIT
  DESIGN_TOKEN = "Design Token",
  QUOTATION_TOKEN = "Quotation Token",
  SOURCING_TOKEN = "Sourcing Token",
  EXECUTION_TOKEN = "Execution Token",
  ACCOUNTS_TOKEN = "Accounts Token",
  QUOTATION_APPROVAL = "Quotation Approval",
  NEGOTIATION = "Negotiation",
  OTHER = "Other",
}

export enum ApprovalStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
}

export interface ApprovalRequest {
  id: string;
  requestType: ApprovalRequestType;
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  title: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  duration?: string; // e.g., "2 days", "4 hours"
  status: ApprovalStatus;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewerName?: string;
  reviewerComments?: string;
  attachments?: string[]; // URLs to uploaded documents
  priority: 'High' | 'Medium' | 'Low';

  // New fields for Workflow Orchestration
  targetRole?: UserRole; // The role that needs to be assigned for this token
  contextId?: string; // e.g., Lead ID or Project ID
  assigneeId?: string; // Populated by admin during approval
  is_demo?: boolean;
}

export type ExpenseCategory = 'Travel' | 'Site' | 'Office' | 'Client Meeting' | 'Other';
export type PaymentMethod = 'Cash' | 'Company Card' | 'Personal Card' | 'UPI';
export type ExpenseStatus = 'Pending' | 'Approved' | 'Rejected' | 'Paid';

export interface Expense {
  id: string;
  userId: string;
  projectId?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
  status: ExpenseStatus;
  paymentMethod: PaymentMethod;
  vendor?: string;
  receiptUrl?: string; // a string for mock
}

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'jpg' | 'zip';
  url: string; // just a placeholder
  uploaded: Date;
  size: string; // e.g., '2.5MB'
}

export interface CounterOffer {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  timestamp: Date;
  notes?: string;
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
  history?: LeadHistory[];
  is_demo?: boolean;
  items?: Item[];
  counterOffers?: CounterOffer[];
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
  materials: { name: string, spec: string }[];
  requiredBy: Date;
  status: MaterialRequestStatus;
  priority: 'High' | 'Medium' | 'Low';
}

export interface Vendor {
  id: string;
  name: string;
  category: string; // e.g., 'Furniture', 'Electrical'
  email: string; // For login
  phone: string;
  rating: number;
  specialization: string;
  address: string;
  gstin: string;
  paymentTerms: string; // e.g., "50% Advance"
}

export enum RFQStatus {
  DRAFT = "Draft",
  OPEN = "Open", // Bidding is active
  CLOSED = "Closed", // Deadline passed
  CANCELLED = "Cancelled"
}

export interface RFQItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string; // e.g. 'sqft', 'nos'
  targetPrice?: number;
}

export interface RFQ {
  id: string;
  rfqNumber: string; // RFQ-2024-001
  projectId: string;
  projectName: string;
  sourcingRequestId?: string; // Link to internal PR
  items: RFQItem[];
  createdDate: Date;
  deadline: Date;
  status: RFQStatus;
  invitedVendorIds: string[];
  notes?: string;
  createdBy: string;
}

export enum BidStatus {
  SUBMITTED = "Submitted",
  UNDER_REVIEW = "Under Review",
  SHORTLISTED = "Shortlisted",
  REJECTED = "Rejected",
  ACCEPTED = "Accepted" // Winner
}

export interface Bid {
  id: string;
  rfqId: string;
  vendorId: string;
  vendorName: string; // Denormalized for easier display
  submittedDate: Date;
  validityDate: Date;
  items: {
    rfqItemId: string;
    unitPrice: number;
    totalPrice: number;
    remarks?: string
  }[];
  totalAmount: number;
  deliveryTimeline: string; // e.g., "10 Days"
  paymentTerms: string;
  warranty: string;
  status: BidStatus;
  notes?: string;
  isUpdated?: boolean;
}

export enum POStatus {
  ISSUED = "Issued",
  ACCEPTED = "Accepted", // Vendor acknowledged
  IN_TRANSIT = "In Transit",
  PARTIALLY_DELIVERED = "Partially Delivered",
  DELIVERED = "Delivered",
  CANCELLED = "Cancelled"
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // PO-2024-001
  rfqId: string;
  bidId: string;
  vendorId: string;
  projectId: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  issueDate: Date;
  expectedDeliveryDate: Date;
  status: POStatus;
  billingAddress: string;
  shippingAddress: string;
  termsAndConditions: string;
}

export interface GRN {
  id: string;
  poId: string;
  receivedDate: Date;
  receivedBy: string; // Internal User
  itemsReceived: {
    itemName: string;
    quantityReceived: number;
    quantityAccepted: number;
    quantityRejected: number;
    rejectionReason?: string;
  }[];
  notes?: string;
}

export interface MaterialOrder {
  id: string;
  material: string;
  quantity: number;
  vendorId: string;
  status: 'Ordered' | 'Shipped' | 'Delivered';
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  rate: number;
  taxRate: number; // e.g., 18 for 18%
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  projectName: string;
  clientName: string;
  clientAddress: string;
  clientGstin: string;

  issueDate: Date;
  dueDate: Date;

  items: InvoiceItem[];

  subTotal: number;
  discountValue: number; // as a value, not percentage
  taxAmount: number;
  total: number;
  amountInWords: string;
  paidAmount: number;

  status: PaymentStatus;

  terms: string;
  notes: string;
  attachments?: Document[];
  bankDetails: {
    name: string;
    bank: string;
    accountNo: string;
    ifsc: string;
  }
}

export type VendorBillStatus = 'Pending Approval' | 'Approved' | 'Scheduled' | 'Paid' | 'Overdue';

export interface VendorBill {
  id: string;
  vendorId: string;
  vendorName: string;
  invoiceNumber: string;
  poReference?: string;
  amount: number;
  issueDate: Date;
  dueDate: Date;
  status: VendorBillStatus;
  projectId?: string;
  paymentDate?: Date;
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

export enum SourcingRequestStatus {
  REQUESTED = "Requested",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
}

export interface SourcingRequest {
  id: string;
  leadId: string;
  projectName: string;
  requesterId: string;
  assigneeId: string;
  status: SourcingRequestStatus;
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

// New types for Productivity System
export enum TaskStatus {
  PENDING_ACCEPTANCE = "Pending Acceptance",
  PENDING = "Pending",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
  OVERDUE = "Overdue",
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  userId: string;
  status: TaskStatus;
  startTime?: number; // timestamp
  endTime?: number; // timestamp
  timeSpent: number; // in seconds
  priority: 'High' | 'Medium' | 'Low';
  priorityOrder?: number; // 1, 2, 3... for ordering
  deadline?: string; // ISO date string for deadline (dueAt)
  dueAt?: Date; // Formal Date object for calculation
  isPaused: boolean;
  date: string; // YYYY-MM-DD to link to calendar
  createdBy?: string; // who created this task
  createdByName?: string; // name of creator
  createdAt: Date;
  completedAt?: Date;
  // Context for automated logging and notifications
  contextId?: string; // ID of Lead or Project
  contextType?: 'lead' | 'project';
  requesterId?: string; // Sales user who raised the request
}

export enum AttendanceType {
  ON_TIME = "On Time",
  LATE = "Late",
  HALF_DAY = "Half Day",
  ABSENT = "Absent",
}

export interface DailyAttendance {
  userId: string;
  date: string; // YYYY-MM-DD
  checkInTime: number; // timestamp
  status: AttendanceType;
}

// New Communication Types
export interface ChatChannel {
  id: string;
  name: string;
  isGroup: boolean;
  avatar: string;
  members: string[]; // user IDs
  lastMessage?: ChatMessage;

  // Extended fields
  type?: 'dm' | 'group';
  memberNames?: Record<string, string>;
  memberAvatars?: Record<string, string>;
  admins?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  is_demo?: boolean;
}

// Fix: Add missing types for the Quick Clarify communication feature.
export enum QuestionCategory {
  DESIGN = "Design",
  SITE = "Site",
  TECHNICAL = "Technical",
  CLIENT = "Client",
  PROCESS = "Process",
}

export enum QuestionUrgency {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
}

export interface QuickClarifyQuestion {
  id: string;
  channelId: string;
  senderId: string;
  timestamp: Date;
  category: QuestionCategory;
  urgency: QuestionUrgency;
  regarding?: string;
  question: string;
  deadline?: Date;
}

// New Complaint Escalation Types
export enum ComplaintType {
  WORK_NEGLECT = "Task Neglect",
  QUALITY_ISSUES = "Quality Issues",
  COMMUNICATION_BREAKDOWN = "Communication Breakdown",
  TIMELINE_VIOLATIONS = "Timeline Violations",
  COORDINATION_PROBLEMS = "Coordination Problems",
  UNPROFESSIONAL_BEHAVIOR = "Unprofessional Behavior",
  RESPONSIVENESS_ISSUES = "Responsiveness Issues",
  ACCOUNTABILITY_PROBLEMS = "Accountability Problems",
  TEAMWORK_CONCERNS = "Teamwork Concerns",
  WORKFLOW_BLOCKAGES = "Workflow Blockages",
  RESOURCE_ISSUES = "Resource Issues",
  SYSTEM_PROBLEMS = "System Problems",
}

export enum ComplaintPriority {
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical",
}

export enum ComplaintStatus {
  SUBMITTED = "Submitted",
  UNDER_REVIEW = "Under Review",
  INVESTIGATION = "Investigation",
  RESOLVED = "Resolved",
  ESCALATED = "Escalated",
}

export interface Complaint {
  id: string;
  submittedBy: string; // User ID
  against: string; // User ID or Department Name
  type: ComplaintType;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  projectContext: string;
  description: string;
  evidence: string[]; // notes for mock
  resolutionAttempts: string;
  desiredResolution: string;
  submissionDate: Date;
}