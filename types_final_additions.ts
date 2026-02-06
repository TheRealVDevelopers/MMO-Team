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
