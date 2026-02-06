// ========================================
// FIRESTORE COLLECTIONS (CASE-CENTRIC)
// ========================================

export const FIRESTORE_COLLECTIONS = {
  // Organization root
  ORGANIZATIONS: 'organizations',
  
  // Global collections
  STAFF_USERS: 'staffUsers',
  TIME_ENTRIES: 'timeEntries',
  CHAT_CHANNELS: 'chat_channels',
  CHAT_MESSAGES: 'chat_messages',
  CATALOG: 'catalog',
  SYSTEM: 'system',
  
  // Subcollections under organizations/{orgId}
  CASES: 'cases',
  MEMBERS: 'members',
  VENDORS: 'vendors',
  LEDGER: 'ledger',
  PAYROLL: 'payroll',
  INVOICES: 'invoices',
  
  // Subcollections under cases/{caseId}
  TASKS: 'tasks',
  SITE_VISITS: 'siteVisits',
  DOCUMENTS: 'documents',
  EXPENSES: 'expenses',
  VENDOR_BILLS: 'vendorBills',
  MATERIALS: 'materials',
  ACTIVITIES: 'activities',
  
  // Subcollections under staffUsers/{userId}
  NOTIFICATIONS: 'notifications',
  
  // Legacy collections for backward compatibility
  LEADS: 'leads',
  PROJECTS: 'projects',
} as const;

// ========================================
// HELPER FUNCTIONS
// ========================================

export const formatCurrencyINR = (value: number): string =>
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

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return 'Invalid Date';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return 'Invalid Date';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
};

// Safe Date Formatter (handles Firestore Timestamps)
export const safeDate = (ts: any): string => {
  if (!ts) return '—';
  try {
    if (ts instanceof Date) return ts.toLocaleDateString();
    if (typeof ts === 'string') return new Date(ts).toLocaleDateString();
    if (typeof ts.toDate === 'function') return ts.toDate().toLocaleDateString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
    return '—';
  } catch (e) {
    return 'Invalid Date';
  }
};

export const safeDateTime = (ts: any): string => {
  if (!ts) return '—';
  try {
    let date: Date | undefined;
    if (ts instanceof Date) date = ts;
    else if (typeof ts === 'string') date = new Date(ts);
    else if (typeof ts.toDate === 'function') date = ts.toDate();
    else if (ts.seconds) date = new Date(ts.seconds * 1000);

    if (!date || isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

export const numberToWordsINR = (num: number): string => {
  const a = [
    '',
    'one ',
    'two ',
    'three ',
    'four ',
    'five ',
    'six ',
    'seven ',
    'eight ',
    'nine ',
    'ten ',
    'eleven ',
    'twelve ',
    'thirteen ',
    'fourteen ',
    'fifteen ',
    'sixteen ',
    'seventeen ',
    'eighteen ',
    'nineteen ',
  ];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const number = parseFloat(num.toString()).toFixed(2).split('.');
  const main = parseInt(number[0]);

  if (main.toString().length > 9) return 'overflow';
  const n = ('000000000' + main).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += parseInt(n[1]) != 0 ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
  str += parseInt(n[2]) != 0 ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
  str += parseInt(n[3]) != 0 ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
  str += parseInt(n[4]) != 0 ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
  str +=
    parseInt(n[5]) != 0
      ? str != ''
        ? 'and '
        : '' + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]])
      : '';

  return (
    str
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + ' Rupees Only'
  );
};

// ========================================
// COMPANY DETAILS
// ========================================

export const COMPANY_DETAILS = {
  name: 'Make My Office Pvt Ltd',
  logo: '/mmo-logo-full.png',
  address: '123 Business Avenue, Gurgaon, Haryana, 122001',
  gstin: '06AAPDE1234F1Z5',
  email: 'accounts@makemyoffice.com',
  phone: '+91 987 654 3210',
};

export const BANK_DETAILS = {
  name: 'Make My Office Pvt Ltd',
  bank: 'HDFC Bank',
  accountNo: '50100234567890',
  ifsc: 'HDFC0000123',
};

// ========================================
// DEFAULT VALUES / CONSTANTS
// ========================================

export const DEFAULT_ORGANIZATION_ID = 'org-test';

export const CASE_STATUS_LABELS = {
  lead: 'Lead',
  site_visit: 'Site Visit',
  drawing: 'Drawing',
  boq: 'BOQ',
  quotation: 'Quotation',
  execution: 'Execution',
  completed: 'Completed',
};

export const TASK_TYPE_LABELS = {
  site_visit: 'Site Visit',
  drawing: 'Drawing',
  boq: 'BOQ',
  quotation: 'Quotation',
  execution: 'Execution',
};

export const TASK_STATUS_LABELS = {
  pending: 'Pending',
  started: 'Started',
  completed: 'Completed',
  acknowledged: 'Acknowledged',
};

export const DOCUMENT_TYPE_LABELS = {
  '2d': '2D Drawing',
  '3d': '3D Render',
  boq: 'BOQ',
  quotation: 'Quotation',
  pdf: 'PDF',
  image: 'Image',
  recce: 'RECCE',
};

export const EXPENSE_CATEGORY_LABELS = {
  material: 'Material',
  labor: 'Labor',
  transport: 'Transport',
  equipment: 'Equipment',
  misc: 'Miscellaneous',
};

// ========================================
// DEMO DATA (REMOVED)
// ========================================
// All demo data has been removed.
// Data should be fetched from Firestore using the appropriate hooks.
// For development/testing, use Firebase Emulator with seed data.

export const USERS: any[] = [];
export const LEADS: any[] = [];
export const PROJECTS: any[] = [];
export const ORGANIZATIONS: any[] = [];
export const VENDORS: any[] = [];
export const INVOICES: any[] = [];
export const EXPENSES: any[] = [];
export const TASKS: any[] = [];
export const ACTIVITIES: any[] = [];
export const SITE_VISITS: any[] = [];
export const DOCUMENTS: any[] = [];
export const ATTENDANCE_DATA: any[] = [];
export const MATERIAL_REQUESTS: any[] = [];
export const PAYMENT_VERIFICATION_REQUESTS: any[] = [];
export const BIDS_DATA: any[] = [];
export const EXPENSE_CLAIMS: any[] = [];
export const ISSUES: any[] = [];
export const PROJECT_TEMPLATES: any[] = [];
export const PURCHASE_ORDERS: any[] = [];
export const RFQS: any[] = [];
