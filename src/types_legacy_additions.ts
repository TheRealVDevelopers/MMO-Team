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
