# Implementation Plan: Full Reference Page + Chat System

## Part 1: Expand Project Reference Page (Staff Side)

### Missing Editors (Client shows but staff can't update)
| Client Field | Source in Firestore | Staff Editor Status |
|---|---|---|
| Project Health / Completion / Risk | `health.*` | ✅ ProjectHealthEditor (exists) |
| Execution Plan Phases | `executionPlan.phases[]` | ✅ ExecutionPlanEditor (exists) |
| Payment Milestones | `financial.installmentSchedule[]` | ✅ FinancialEditor (exists) |
| Daily Logs | `dailyLogs[]` | ✅ DailyLogEditor (exists) |
| Lead Journey | `leadJourney.*` | ✅ LeadJourneyEditor (exists) |
| Chat | `chat[]` | ✅ ProjectChat (exists) |
| **Project Info** (name, type, area, site address) | `projectName, siteAddress` | ❌ MISSING |
| **Consultant/PM Info** (name, phone, email) | `assignedSales` + user lookup | ❌ MISSING |
| **Transparency** (delays, next action, estimated completion) | `health.*` | ❌ MISSING |
| **Documents** (drawings, reports) | `documents[]` | ❌ MISSING |
| **Approvals** | `approvals[]` | View-only (exists, no edit) |
| **Execution Timeline** (start/end dates) | `executionPlan.startDate/endDate` | ❌ MISSING |

### New Editors to Create:
1. **ProjectInfoEditor** - Edit project name, type, area, site address, client name
2. **ConsultantEditor** - Assign/update project consultant
3. **TransparencyEditor** - Set delays, next action, estimated completion
4. **DocumentsEditor** - Upload/manage project documents
5. **TimelineEditor** - Set overall project start/end dates (integrated into ExecutionPlanEditor)

## Part 2: Proper Chat System (Both Sides)
- Image upload support via Firebase Storage
- File attachments with preview
- Real-time messaging with read receipts
- Proper message input with image picker
- Shared component usable from both client portal and staff reference page
