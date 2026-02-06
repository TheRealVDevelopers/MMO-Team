// ========================================
// CASE-CENTRIC ARCHITECTURE TYPES
// Organizations/{orgId}/cases/{caseId}
// ========================================

// ========================================
// ENUMS
// ========================================

export enum UserRole {
  SUPER_ADMIN = "Super Admin",
  ADMIN = "Admin",
  MANAGER = "Manager",
  SALES_GENERAL_MANAGER = "Sales General Manager",
  SALES_TEAM_MEMBER = "Sales Team Member",
  DRAWING_TEAM = "Drawing Team",
  QUOTATION_TEAM = "Quotation Team",
  SITE_ENGINEER = "Site Engineer",
  PROCUREMENT_TEAM = "Procurement Team",
  EXECUTION_TEAM = "Execution Team",
  PROJECT_HEAD = "Project Head",
  ACCOUNTS_TEAM = "Accounts Team",
  DESIGNER = "Designer",
}

export enum CaseStatus {
  LEAD = "lead",
  SITE_VISIT = "site_visit",
  DRAWING = "drawing",
  BOQ = "boq",
  QUOTATION = "quotation",
  EXECUTION = "execution",
  COMPLETED = "completed",
}

export enum TaskType {
  SITE_VISIT = "site_visit",
  DRAWING = "drawing",
  BOQ = "boq",
  QUOTATION = "quotation",
  EXECUTION = "execution",
}

export enum TaskStatus {
  PENDING = "pending",
  STARTED = "started",
  COMPLETED = "completed",
  ACKNOWLEDGED = "acknowledged",
  ASSIGNED = "assigned",
}

// Legacy enum for backward compatibility
export enum ApprovalRequestType {
  SITE_VISIT = "site_visit",
  DRAWING = "drawing",
  QUOTATION = "quotation",
  MATERIAL_REQUEST = "material_request",
  EXPENSE_APPROVAL = "expense_approval",
  VENDOR_BILL = "vendor_bill",
  STAFF_REGISTRATION = "staff_registration",
}

export enum ApprovalStatus {
  PENDING = "pending",
  ASSIGNED = "assigned",
  ONGOING = "ongoing",
  COMPLETED = "completed",
  ACKNOWLEDGED = "acknowledged",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  HALF_DAY = "half_day",
  LEAVE = "leave",
}

export enum DocumentType {
  TWO_D = "2d",
  THREE_D = "3d",
  BOQ = "boq",
  QUOTATION = "quotation",
  PDF = "pdf",
  IMAGE = "image",
  RECCE = "recce",
}

export enum ExpenseCategory {
  MATERIAL = "material",
  LABOR = "labor",
  TRANSPORT = "transport",
  EQUIPMENT = "equipment",
  MISC = "misc",
}

// Legacy enum for backward compatibility
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
  IN_PROCUREMENT = "In Procurement",
  IN_EXECUTION = "In Execution",
  WON = "Won",
  LOST = "Lost",
}

// Legacy enum for backward compatibility
export enum ProjectStatus {
  PLANNING = "Planning",
  IN_PROGRESS = "In Progress",
  ON_HOLD = "On Hold",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
  AWAITING_DESIGN = "Awaiting Design",
  DESIGN_IN_PROGRESS = "Design In Progress",
  PENDING_REVIEW = "Pending Review",
  REVISIONS_REQUESTED = "Revisions Requested",
  AWAITING_QUOTATION = "Awaiting Quotation",
  QUOTATION_SENT = "Quotation Sent",
  NEGOTIATING = "Negotiating",
  REJECTED = "Rejected",
  SITE_VISIT_PENDING = "Site Visit Pending",
  DRAWING_PENDING = "Drawing Pending",
  BOQ_PENDING = "BOQ Pending",
}

export enum MaterialRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  ORDERED = "ordered",
  DELIVERED = "delivered",
}

export interface ApprovalAction {
  userId: string;
  userName: string;
  role: UserRole;
  timestamp: any; // Firestore Timestamp
  comments?: string;
}

export interface ApprovalRequest {
  id: string;
  caseId: string;
  stage: string;
  stageName: string;
  status: ApprovalStatus;
  requesterId: string;
  requesterName: string;
  requiredRoles: UserRole[];
  approvedBy: ApprovalAction[];
  rejectedBy: ApprovalAction[];
  comments: string[];
  assignedTo?: string;
  startedAt?: Date;
  completedAt?: Date;
  acknowledgedAt?: Date;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// ========================================
// CORE CASE INTERFACE (ROOT DOCUMENT)
// Path: organizations/{orgId}/cases/{caseId}
// ========================================

export interface Case {
  // Identifiers
  id: string;
  organizationId: string;

  // Core Info
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone: string;
  siteAddress: string;

  // Timestamps
  createdAt: Date;
  createdBy: string; // User ID
  updatedAt?: Date;

  // Assignment
  assignedSales?: string; // User ID
  projectHead?: string; // User ID (when converted to project)

  // Project Flag
  isProject: boolean; // FALSE = Lead, TRUE = Project

  // Status
  status: CaseStatus;

  // Workflow State
  workflow: CaseWorkflow;

  // Budget (only when isProject = true)
  budget?: CaseBudget;

  // Execution (only when isProject = true)
  execution?: CaseExecution;

  // Closure (only when completed)
  closure?: CaseClosure;
}

export interface CaseWorkflow {
  currentStage: CaseStatus;
  siteVisitDone: boolean;
  drawingDone: boolean;
  boqDone: boolean;
  quotationDone: boolean;
  paymentVerified: boolean;
  executionApproved: boolean;
}

export interface CaseBudget {
  totalBudget: number;
  allocated: number;
  approved: boolean;
  approvedBy?: string; // User ID
  approvedAt?: Date;
}

export interface CaseExecution {
  gantt: GanttStage[];
  milestones: Milestone[];
  dailyUpdates: DailyUpdate[];
}

export interface GanttStage {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string; // User ID
}

export interface Milestone {
  id: string;
  name: string;
  targetDate: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface DailyUpdate {
  id: string;
  date: Date;
  description: string;
  addedBy: string; // User ID
  photos?: string[]; // Storage URLs
}

export interface CaseClosure {
  jmsSigned: boolean;
  jmsSignedAt?: Date;
  jmsUrl?: string; // Storage URL
  warranties: Warranty[];
  finalDocs: string[]; // Storage URLs
  completedAt?: Date;
}

export interface Warranty {
  id: string;
  item: string;
  duration: string; // e.g., "1 year", "5 years"
  expiryDate: Date;
}

// ========================================
// CASE SUBCOLLECTIONS
// ========================================

// Path: organizations/{orgId}/cases/{caseId}/tasks/{taskId}
export interface CaseTask {
  id: string;
  caseId: string;
  type: TaskType;
  assignedTo: string; // User ID
  assignedBy: string; // User ID
  status: TaskStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  acknowledgedAt?: Date;
  kmTravelled?: number; // For site visit tasks
  notes?: string;
}

// Path: organizations/{orgId}/cases/{caseId}/siteVisits/{visitId}
export interface CaseSiteVisit {
  id: string;
  caseId: string;
  engineerId: string; // User ID
  startedAt: Date;
  endedAt?: Date;
  distanceKm: number;
  measurements?: string;
  notes?: string;
  photos: string[]; // Storage URLs
}

// Path: organizations/{orgId}/cases/{caseId}/documents/{docId}
export interface CaseDocument {
  id: string;
  caseId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string; // Storage URL
  uploadedBy: string; // User ID
  uploadedAt: Date;
  notes?: string;
}

// Path: organizations/{orgId}/cases/{caseId}/expenses/{expenseId}
export interface CaseExpense {
  id: string;
  caseId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  paidBy: string; // User ID
  paidAt: Date;
  approvedBy?: string; // User ID
  approvedAt?: Date;
  receiptUrl?: string; // Storage URL
}

// Path: organizations/{orgId}/cases/{caseId}/vendorBills/{billId}
export interface CaseVendorBill {
  id: string;
  caseId: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  billNumber: string;
  billDate: Date;
  dueDate?: Date;
  paid: boolean;
  paidAt?: Date;
  paidBy?: string; // User ID
  billUrl?: string; // Storage URL
}

// Path: organizations/{orgId}/cases/{caseId}/materials/{materialId}
export interface CaseMaterial {
  id: string;
  caseId: string;
  itemName: string;
  quantity: number;
  unit: string;
  requestedBy: string; // User ID
  requestedAt: Date;
  approvedBy?: string; // User ID
  approvedAt?: Date;
  orderedAt?: Date;
  receivedAt?: Date;
  status: 'requested' | 'approved' | 'ordered' | 'received';
}

// Path: organizations/{orgId}/cases/{caseId}/activities/{activityId}
export interface CaseActivity {
  id: string;
  caseId: string;
  action: string; // e.g., "Lead created", "Task assigned", "Drawing uploaded"
  by: string; // User ID
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ========================================
// ORGANIZATION LEVEL TYPES
// ========================================

// Path: organizations/{orgId}
export interface Organization {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  settings?: OrganizationSettings;
}

export interface OrganizationSettings {
  currency: string;
  timezone: string;
  fiscalYearStart?: string; // MM-DD format
}

// Path: organizations/{orgId}/members/{memberId}
export interface OrganizationMember {
  id: string;
  userId: string;
  role: UserRole;
  joinedAt: Date;
}

// Path: organizations/{orgId}/vendors/{vendorId}
export interface Vendor {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  category: string; // e.g., "Furniture", "Lighting", "Flooring"
  gstNumber?: string;
}

// Path: organizations/{orgId}/ledger/{entryId}
export interface LedgerEntry {
  id: string;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  createdBy: string; // User ID
}

// Path: organizations/{orgId}/payroll/{payrollId}
export interface PayrollEntry {
  id: string;
  userId: string;
  month: string; // YYYY-MM format
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paidAt?: Date;
  paidBy?: string; // User ID
}

// Path: organizations/{orgId}/invoices/{invoiceId}
export interface Invoice {
  id: string;
  invoiceNumber: string;
  caseId?: string; // Optional link to case
  clientName: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  issuedAt: Date;
  dueDate?: Date;
  paidAt?: Date;
  status: 'pending' | 'paid' | 'overdue';
}

// ========================================
// GLOBAL USER TYPES
// ========================================

// Path: staffUsers/{userId}
export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  organizationId: string;
  avatar?: string;
  createdAt: Date;
  isActive: boolean;
}

// Path: staffUsers/{userId}/notifications/{notificationId}
export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  actionUrl?: string; // Deep link to relevant page
  metadata?: Record<string, any>;
}

// ========================================
// GLOBAL COLLECTIONS (NOT NESTED)
// ========================================

// Path: timeEntries/{entryId}
export interface TimeEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  clockIn: Date;
  clockOut?: Date;
  totalHours?: number;
  status: 'clocked_in' | 'clocked_out' | 'on_break';
}

// Path: chat_channels/{channelId}
export interface ChatChannel {
  id: string;
  name: string;
  members: string[]; // User IDs
  createdAt: Date;
  lastMessageAt?: Date;
}

// Path: chat_messages/{messageId}
export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  attachments?: string[]; // Storage URLs
}

// Path: catalog/{itemId}
export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  unit: string;
  images?: string[]; // Storage URLs
}

// ========================================
// UTILITY TYPES
// ========================================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FilterOptions {
  status?: CaseStatus | CaseStatus[];
  assignedTo?: string;
  isProject?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

// ========================================
// WORKFLOW AUTOMATION TYPES
// ========================================

export interface WorkflowTrigger {
  event: 'task_completed' | 'payment_verified' | 'drawing_submitted';
  action: 'create_task' | 'update_status' | 'send_notification';
  targetRole?: UserRole;
  taskType?: TaskType;
}

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// ========================================
// LEGACY TYPES FOR BACKWARD COMPATIBILITY
// (Stubs to prevent import errors)
// ========================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  [key: string]: any;
}

export interface Project {
  id: string;
  projectName?: string;
  title?: string;
  clientName: string;
  status: ProjectStatus | string;
  budget?: number;
  [key: string]: any;
}

export interface Lead {
  id: string;
  projectName: string;
  clientName: string;
  status: LeadPipelineStatus | string;
  assignedTo?: string;
  value?: number;
  [key: string]: any;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  [key: string]: any;
}

export interface VendorBill {
  id: string;
  vendorName: string;
  amount: number;
  status: string;
  [key: string]: any;
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  [key: string]: any;
}

export interface ExecutionTask {
  id: string;
  projectId: string;
  assignedTo: string;
  status: string;
  [key: string]: any;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  [key: string]: any;
}

export interface FinanceRequest {
  id: string;
  type: string;
  amount: number;
  status: string;
  [key: string]: any;
}

export interface ApprovalRequest {
  id: string;
  type: ApprovalRequestType;
  status: ApprovalStatus;
  requestedBy: string;
  [key: string]: any;
}

export interface QuickClarifyQuestion {
  id: string;
  question: string;
  category: string;
  urgency: string;
  [key: string]: any;
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  OVERDUE = "overdue",
}

export enum PaymentMethod {
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
  CHEQUE = "cheque",
  UPI = "upi",
}

export enum TransactionType {
  INCOME = "income",
  EXPENSE = "expense",
}

export enum TransactionCategory {
  SALES = "sales",
  PURCHASE = "purchase",
  SALARY = "salary",
  OTHER = "other",
}

export enum QuestionUrgency {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum QuestionCategory {
  TECHNICAL = "technical",
  DESIGN = "design",
  BUDGET = "budget",
  TIMELINE = "timeline",
  OTHER = "other",
}

export enum TimeTrackingStatus {
  CLOCKED_IN = "clocked_in",
  CLOCKED_OUT = "clocked_out",
  ON_BREAK = "on_break",
}

export enum ComplaintPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ComplaintType {
  TECHNICAL = "technical",
  QUALITY = "quality",
  TIMELINE = "timeline",
  BUDGET = "budget",
  COMMUNICATION = "communication",
  OTHER = "other",
}

export enum ComplaintStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export enum EnquiryStatus {
  NEW = "new",
  VIEWED = "viewed",
  CONTACTED = "contacted",
  CONVERTED = "converted",
  CLOSED = "closed",
  ASSIGNED = "assigned",
  CONVERTED_TO_LEAD = "converted_to_lead",
}

export enum ActivityStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  DONE = "done",
}
/**
 * MASSIVE LEGACY TYPE ADDITIONS FOR COMPILE REPAIR
 * All missing types, interfaces, and enums to make project compile
 */

// Missing enum values
export enum ApprovalRequestTypeLegacy {
  STAFF_REGISTRATION = "staff_registration",
}

export enum TaskStatusLegacy {
  ASSIGNED = "assigned",
}

export enum EnquiryStatusLegacy {
  ASSIGNED = "assigned",
  CONVERTED_TO_LEAD = "converted_to_lead",
}

export enum ProjectStatusLegacy {
  AWAITING_DESIGN = "awaiting_design",
  DESIGN_IN_PROGRESS = "design_in_progress",
  PENDING_REVIEW = "pending_review",
  REVISIONS_REQUESTED = "revisions_requested",
  AWAITING_QUOTATION = "awaiting_quotation",
  QUOTATION_SENT = "quotation_sent",
  NEGOTIATING = "negotiating",
  REJECTED = "rejected",
  SITE_VISIT_PENDING = "site_visit_pending",
  DRAWING_PENDING = "drawing_pending",
  BOQ_PENDING = "boq_pending",
}

export enum ActivityStatusLegacy {
  DONE = "done",
}

export enum UserRoleLegacy {
  DESIGNER = "Designer",
}

// Missing interfaces
export interface Item {
  id: string;
  name: string;
  category: string;
  price: number;
  [key: string]: any;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  userId?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
  [key: string]: any;
}

export interface Task {
  id: string;
  title: string;
  status: string;
  assignedTo?: string;
  [key: string]: any;
}

export interface RFQ {
  id: string;
  title: string;
  description: string;
  [key: string]: any;
}

export interface Bid {
  id: string;
  rfqId: string;
  vendorId: string;
  amount: number;
  status: string;
  [key: string]: any;
}

export enum BidStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

export interface LeadHistoryAttachment {
  id: string;
  name: string;
  url: string;
  [key: string]: any;
}

export interface ProjectEnquiry {
  id: string;
  projectId: string;
  query: string;
  status: string;
  [key: string]: any;
}

export interface CostCenter {
  id: string;
  name: string;
  budget: number;
  [key: string]: any;
}

export interface SalaryRecord {
  id: string;
  userId: string;
  amount: number;
  month: string;
  [key: string]: any;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  [key: string]: any;
}

export interface GREntry {
  id: string;
  date: Date;
  items: GRItem[];
  [key: string]: any;
}

export interface GRItem {
  id: string;
  name: string;
  quantity: number;
  [key: string]: any;
}

export interface MaterialRequest {
  id: string;
  projectId: string;
  items: any[];
  status: string;
  [key: string]: any;
}

export interface Quotation {
  id: string;
  projectId: string;
  amount: number;
  status: string;
  [key: string]: any;
}

export interface QuotationVersion {
  id: string;
  quotationId: string;
  version: number;
  [key: string]: any;
}

export interface QuotationAuditLog {
  id: string;
  quotationId: string;
  action: string;
  timestamp: Date;
  [key: string]: any;
}

export interface BreakEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  [key: string]: any;
}

export interface CurrentTimeStatus {
  status: string;
  clockedInAt?: Date;
  [key: string]: any;
}

export interface StoredRedFlag {
  id: string;
  type: string;
  message: string;
  [key: string]: any;
}

export interface ChatChannel {
  id: string;
  name: string;
  members: string[];
  lastMessage?: any;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface DailyUpdate {
  id: string;
  projectId: string;
  date: Date;
  description: string;
  addedBy: string;
  [key: string]: any;
}

export interface TimeEntry {
  id: string;
  userId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  totalHours?: number;
  totalWorkHours?: number;
  breaks?: BreakEntry[];
  totalBreakMinutes?: number;
  userName?: string;
  [key: string]: any;
}

export interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  status: string;
  issuedAt: Date;
  issueDate?: Date;
  projectId?: string;
  total?: number;
  [key: string]: any;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  paymentTerms?: string;
  [key: string]: any;
}
// FINAL COMPREHENSIVE TYPE ADDITIONS - Add to end of types.ts

// Additional missing interfaces
export interface Complaint {
  id: string;
  type: ComplaintType;
  priority: ComplaintPriority;
  status: string;
  description: string;
  [key: string]: any;
}

export interface AccountsRequest {
  id: string;
  type: string;
  amount: number;
  status: string;
  [key: string]: any;
}

export enum AccountsRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface Attendance {
  id: string;
  userId: string;
  date: Date;
  status: string;
  [key: string]: any;
}

export enum AttendanceType {
  PRESENT = "present",
  ABSENT = "absent",
  LEAVE = "leave",
}

export interface BOQ {
  id: string;
  projectId: string;
  items: BOQItem[];
  total: number;
  [key: string]: any;
}

export interface BOQItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  [key: string]: any;
}

export interface CaseBOQ extends BOQ {}
export interface CaseDrawing {
  id: string;
  caseId: string;
  fileName: string;
  url: string;
  [key: string]: any;
}

export interface CaseQuotation {
  id: string;
  caseId: string;
  amount: number;
  items: any[];
  [key: string]: any;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  [key: string]: any;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  [key: string]: any;
}

export interface DrawingRequest {
  id: string;
  projectId: string;
  status: string;
  [key: string]: any;
}

export enum DrawingRequestStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export interface DrawingTask extends Task {}

export interface ExecutionRequest {
  id: string;
  projectId: string;
  status: string;
  [key: string]: any;
}

export enum ExecutionRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface ExecutionStage {
  id: string;
  name: string;
  status: string;
  [key: string]: any;
}

export interface ExpenseClaim {
  id: string;
  userId: string;
  amount: number;
  status: string;
  [key: string]: any;
}

export enum ExpenseClaimStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  [key: string]: any;
}

export enum ExpenseStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  [key: string]: any;
}

export interface ImportedLead {
  id: string;
  source: string;
  data: any;
  [key: string]: any;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  [key: string]: any;
}

export interface JMS {
  id: string;
  projectId: string;
  date: Date;
  details: string;
  [key: string]: any;
}

export interface LeadCommunicationMessage {
  id: string;
  leadId: string;
  message: string;
  timestamp: Date;
  [key: string]: any;
}

export interface LeadFile {
  id: string;
  name: string;
  url: string;
  [key: string]: any;
}

export interface LeadHistory {
  id: string;
  action: string;
  timestamp: Date;
  [key: string]: any;
}

export interface PaymentRequest {
  id: string;
  projectId: string;
  amount: number;
  status: string;
  [key: string]: any;
}

export interface PaymentTerm {
  id: string;
  description: string;
  amount: number;
  [key: string]: any;
}

export enum POStatus {
  DRAFT = "draft",
  SENT = "sent",
  APPROVED = "approved",
}

export interface ProcurementRequest {
  id: string;
  projectId: string;
  items: any[];
  status: string;
  [key: string]: any;
}

export enum ProcurementRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum ProjectLifecycleStatus {
  INITIATED = "initiated",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export interface ProjectMilestone {
  id: string;
  name: string;
  dueDate: Date;
  completed: boolean;
  [key: string]: any;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  [key: string]: any;
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  items: any[];
  total: number;
  status: string;
  [key: string]: any;
}

export interface QuotationRequest {
  id: string;
  projectId: string;
  status: string;
  [key: string]: any;
}

export enum QuotationRequestStatus {
  PENDING = "pending",
  SUBMITTED = "submitted",
  APPROVED = "approved",
}

export interface Reminder {
  id: string;
  title: string;
  date: Date;
  [key: string]: any;
}

export interface RFQItem {
  id: string;
  description: string;
  quantity: number;
  [key: string]: any;
}

export enum RFQStatus {
  OPEN = "open",
  CLOSED = "closed",
}

export interface SiteMeasurement {
  id: string;
  projectId: string;
  measurements: any;
  [key: string]: any;
}

export interface SiteReport {
  id: string;
  siteVisitId: string;
  findings: string;
  [key: string]: any;
}

export enum SiteType {
  RESIDENTIAL = "residential",
  COMMERCIAL = "commercial",
  INDUSTRIAL = "industrial",
}

export interface SiteVisit {
  id: string;
  projectId: string;
  date: Date;
  status: string;
  [key: string]: any;
}

export enum SiteVisitStatus {
  SCHEDULED = "scheduled",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum VendorBillStatus {
  PENDING = "pending",
  PAID = "paid",
  OVERDUE = "overdue",
}

export interface TimeActivity {
  id: string;
  userId: string;
  activity: string;
  timestamp: Date;
  [key: string]: any;
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  [key: string]: any;
}
