# MMO-Team Project Workflow & Documentation

Welcome to the **Make My Office (MMO)** Operational Guide. This document details the end-to-end workflow of a project, from the initial lead acquisition to the final handover (JMS), explaining the roles, pages, and actions involved at each step.

---

## � Overview of Roles

| Role | Primary Responsibility | Key Pages |
|------|------------------------|-----------|
| **Super Admin** | Full system access, approvals, team management | Overview, Team, Projects, Leads, Request Inbox |
| **Sales General Manager** | Lead oversight, team performance, quotation approval | Dashboard, Leads, Organizations, Team |
| **Sales Team Member** | Lead nurturing, client communication | My Day, My Registry, My Requests |
| **Site Engineer** | Site inspections, measurements, field reports | My Day, Projects |
| **Drawing Team / Designer** | 2D/3D drawings based on site measurements | My Day, Projects |
| **Quotation Team** | BOQ creation, pricing, commercial proposals | My Day, Create Quotation, Items Catalog |
| **Procurement/Sourcing Team** | Vendor negotiations, RFQ management, bidding | My Day, Audit Quotations, Procurement |
| **Execution Team** | On-site project execution, daily updates | My Day, Projects, Budgets, Tasks |
| **Accounts Team** | Financial control, invoicing, P&L tracking | Overview, GRIN, GROUT, Expenses, Project P&L |

---

## �🏗️ End-to-End Workflow

### Stage 1: Lead Acquisition & Assignment
**Primary Actor:** Sales General Manager (SGM) / Super Admin  
**Page:** `Leads` (Lead Management Page)

- **Step 1:** The SGM clicks the **"Add Lead"** button.
- **Step 2:** Customer details are entered:
  - Client Name, Company, Mobile, Email
  - Project Type (Office, Retail, Factory, etc.)
  - Estimated Value, Priority
  - Source (Just Dial, Reference, Website, etc.)
- **Step 3:** The lead is assigned to a **Sales Team Member** as the owner.
- **System Action:** Lead is created with status `New - Not Contacted` and a history entry is logged.

---

### Stage 2: Lead Nurturing & Follow-up
**Primary Actor:** Sales Team Member  
**Page:** `My Registry` (Lead Management)

**Workflow:**
1. The sales member sees assigned leads in their **My Registry** page.
2. They contact the client and log the call/meeting in the **Activity History**.
3. Lead status is updated through the pipeline:
   - `New - Not Contacted` → `Contacted - Discovery` → `Follow-up` → `Interested - Site Visit Pending`
4. **Document Attachments:** Photos, requirement documents can be uploaded.

**Key Actions:**
- **Log Activity:** Record calls, emails, meetings with notes.
- **Set Reminders:** Schedule follow-up reminders.
- **Schedule Visit:** Once the client expresses interest, click **"Schedule Visit"** to request a site inspection.

---

### Stage 3: Site Inspection (Recce)
**Primary Actor:** Site Engineer (SE)  
**Page:** Site Engineer's `My Day` or `Projects` page

**Trigger:** Sales member clicks **"Schedule Visit"** from the Lead Detail modal.

**SE Workflow:**
1. **Start Travel:** Click to log travel start time (GPS-verified).
2. **Check-in:** Upon arrival, capture GPS location and timestamp.
3. **Site Report Submission:**
   - Fill out the **Dynamic Inspection Form**.
   - Upload **Site Photos** with descriptions.
   - Log **Site Measurements** (carpet area, height, etc.).
   - Note client requirements and site constraints.
4. **Expense Logging:** Record travel, food, and other site-related expenses for approval.

**System Action:** Lead moves to `Waiting for Drawing` upon report submission.

---

### Stage 4: Drawing & Designing
**Primary Actor:** Drawing Team / Designer  
**Page:** Drawing Team's `Projects` page

**Trigger:** Site report is submitted by the Engineer.

**Workflow:**
1. The team reviews the site measurements from the report.
2. Creates and uploads:
   - **2D Layout Drawings** (AutoCAD/SketchUp exports)
   - **3D Renders** (photorealistic views)
   - **PDF Proposals** for client presentation
3. **Version Control:** Multiple revisions can be uploaded.
4. **Handover:** Notifies the Sales team that drawings are ready for client presentation.

**System Action:** Lead moves to `Drawings Created - Review Pending`.

---

### Stage 5: Commercial (BOQ & Quotation)
**Primary Actor:** Quotation Team  
**Page:** `Create Quotation` (Quotation Engine)

**Workflow:**
1. **BOQ Creation:**
   - Select items from the **Items Catalog** (saved templates available).
   - Define quantities based on site measurements.
   - Apply **Make Type** (e.g., Asian Paints, Kajaria).
2. **Internal Pricing:**
   - Set **Labor Costs** per item.
   - Define **Profit Margin** (internal ratio).
   - View **Total Quote** = Material Cost + Labor + Margin.
3. **Vendor Bidding (Optional):**
   - If procurement is needed, initiate an **RFQ** to vendors.
   - Compare vendor bids and select **L1** (lowest bidder).
4. **Submit for Approval:**
   - Click **"Submit for Approval"** to send the commercial proposal to the Admin.

**System Action:** Lead status changes to `Approval Requested`.

---

### Stage 6: Admin Approval & Payment Verification
**Primary Actor:** Super Admin / Sales General Manager / Accounts Team  
**Page:** `Request Inbox` (Approvals Page)

**Admin Workflow:**
1. Review the quotation in the **Request Inbox**.
2. Either:
   - **Approve:** Accept the quotation as final.
   - **Revise:** Send back with notes for changes.
   - **Reject:** Decline the quotation.

**Payment Verification (Accounts Team):**
**Page:** `Payment Requests` (Accounts Team)

1. Once the client agrees to the quotation, the Sales team logs an **Advance Payment**.
2. The Accounts Team reviews the payment receipt in the **Payment Verification Inbox**.
3. **Verify Payment:** Confirm the deposit amount matches the record.
4. **Conversion:** Upon verification, the **Lead is automatically converted into a Project**.

**System Action:** A new Project record is created with status `Site Visit Pending` or `In Execution`.

---

### Stage 7: Financial Infrastructure Setup
**Primary Actor:** Accounts Team  
**Pages:** `Project P&L`, `GRIN` (Sales Invoices), `GROUT` (Vendor Bills)

**Actions:**
1. **Ledger Initialization:** A dedicated P&L ledger is created for the new project.
2. **Advance Invoice (GRIN):**
   - Generate a **Sales Invoice** for the advance amount received.
   - Apply GST, taxes, and send to the client.
3. **Budget Heads Setup:** (For Execution Team)
   - Define cost centers like Flooring, Electrical, Plumbing, etc.
4. **Compliance:** Tax settings (GST, TDS) are applied to the project financials.

---

### Stage 8: Execution Planning & Budget Allocation
**Primary Actor:** Execution Team (Project Head)  
**Pages:** `Budgets`, `Tasks`, `Projects Board`

**Budget Allocation (Budget Management Page):**
1. Select the project from the active projects list.
2. Define the **Total Budget** for the project.
3. Allocate budget to **Budget Heads** (e.g., Flooring: 20%, Electrical: 15%).
4. View **Allocated vs. Total Budget** progress.

**Task Setup (Task Assignment Page):**
1. Create tasks under the project.
2. Assign tasks to team members (Engineers, Workers).
3. Set deadlines and priority.

**Gantt Chart:**
- Visualize the project timeline.
- Track task dependencies and milestones.

---

### Stage 9: Project Execution & On-Site Work
**Primary Actor:** Execution Team  
**Page:** `Projects` (Execution Board), `Project Detail`

**Daily Workflow:**
1. **Daily Updates:**
   - Log work progress for each task.
   - Upload **Before/After Photos** with descriptions.
   - Note any blockers or issues.
2. **Material Requests:**
   - If materials are needed, raise a **Material Request**.
   - Specify item, quantity, and urgency.
3. **Issues & Risks:**
   - Log site issues (delays, material shortage, client changes).
   - Assign priority and track resolution.

**Financial Controls (Accounts Team):**
- **Expense Approval:** Approve site travel and food expenses via the `Expenses` page.
- **Vendor Bill Processing (GROUT):** Verify vendor bills against material requests.
- **Milestone Billing (GRIN):** Generate invoices as project milestones are completed.
- **P&L Monitoring:** Track Project Profit & Loss to ensure budget adherence.

---

### Stage 10: Completion & JMS Handover
**Primary Actor:** Execution Team (Project Head) / Client  
**Page:** `Project Detail` → `Completion & Handover` Tab

**Workflow:**
1. **Pre-JMS Checklist:** Ensure all tasks are marked complete and snag list is resolved.
2. **Launch JMS:** Click **"Launch JMS"** (Joint Measurement Sheet) button.
3. **JMS Process:**
   - Walk through the site with the client.
   - Verify final measurements vs. quoted measurements.
   - Note any deviations or client-requested changes.
4. **Sign-Off:**
   - Both parties sign off (digitally or physically).
   - Upload final photographs and handover documents.
5. **Project Closure:**
   - Project status is updated to **Completed**.
   - Final invoice is generated by Accounts Team.

---

## 📄 Page-by-Page Feature Breakdown

### 1. Lead Management (Sales)
**Who Uses:** Sales GM, Sales Team Member, Super Admin

| Feature | Description |
|---------|-------------|
| **Kanban Pipeline** | Visual board with columns for each lead stage |
| **Search & Filter** | Filter by status, priority, assigned owner, date range |
| **Lead Detail Modal** | View all lead info, activity history, documents |
| **Activity Logging** | Add calls, emails, meetings with notes and attachments |
| **Reminders** | Set follow-up reminders with notifications |
| **Document Attachments** | Upload photos, requirements, site documents |
| **Pipeline Stats** | Win/loss ratio, pipeline value, conversion metrics |
| **Assign/Reassign** | Transfer lead ownership to another team member |

---

### 2. Site Visit Portal (Site Engineering)
**Who Uses:** Site Engineer

| Feature | Description |
|---------|-------------|
| **My Day View** | Today's scheduled visits and pending actions |
| **Travel Logging** | Start/End travel with GPS verification |
| **Check-in/Check-out** | Location-verified arrival and departure |
| **Site Report Form** | Dynamic form for measurements, photos, notes |
| **Photo Upload** | Capture site photos with descriptions |
| **Expense Submission** | Log travel, food, and site expenses |
| **Visit History** | View past visits for reference |

---

### 3. Quotation Engine (Commercial)
**Who Uses:** Quotation Team

| Feature | Description |
|---------|-------------|
| **Items Catalog** | Searchable database of items with pricing |
| **BOQ Builder** | Create bill of quantities from catalog items |
| **Template Library** | Save and reuse quotation templates |
| **Pricing Engine** | Calculate material, labor, margin, and total |
| **Vendor Bidding** | Compare L1/L2/L3 bids from vendors |
| **Submit for Approval** | Send quotation to admin for review |
| **Version History** | Track changes across quotation revisions |

---

### 4. Procurement Hub (Sourcing)
**Who Uses:** Procurement/Sourcing Team

| Feature | Description |
|---------|-------------|
| **Quotation Audit** | Review and verify quotations before bidding |
| **RFQ Management** | Create and send RFQs to vendors |
| **Bid Comparison** | Compare vendor bids with comparative statement |
| **L1 Selection** | Auto-highlight lowest bid |
| **Items Catalog** | Master catalog with specifications and pricing |
| **Vendor Management** | Track vendor performance and history |

---

### 5. Execution Board (Project Management)
**Who Uses:** Execution Team, Project Head

| Feature | Description |
|---------|-------------|
| **Kanban Board** | Visual project cards with status columns |
| **Project Detail View** | Deep-dive into project with tabs |
| **Overview Tab** | Progress, milestones, team, key metrics |
| **Timeline Tab** | Gantt chart with tasks and dependencies |
| **Daily Updates Tab** | Log and view daily progress |
| **Materials Tab** | Raise and track material requests |
| **Issues Tab** | Log and manage site issues and risks |
| **Completion Tab** | Handover checklist and JMS launch |
| **Budget Allocation** | Allocate budget to cost centers |
| **Task Assignment** | Create and assign tasks to team members |

---

### 6. Financial Command Center (Accounts)
**Who Uses:** Accounts Team

| Feature | Description |
|---------|-------------|
| **Overview Dashboard** | Financial KPIs, inflow/outflow summary |
| **GRIN (Sales Invoices)** | Create, manage, and track client invoices |
| **GROUT (Vendor Bills)** | Record, verify, and pay vendor bills |
| **Expenses** | Review and approve staff expense claims |
| **Project P&L** | Real-time profit/loss per project |
| **Payment Requests** | Verify advance payments from leads |
| **Salary & Payroll** | Manage staff salaries based on attendance |
| **Inventory** | Track warehouse materials and consumption |

---

### 7. Admin & Super Admin Dashboard
**Who Uses:** Super Admin

| Feature | Description |
|---------|-------------|
| **Overview** | High-level KPIs, team status, alerts |
| **Team Management** | View all staff, attendance, deployments |
| **Project Tracking** | All active projects with filters |
| **Request Inbox** | Approve quotations, expenses, requests |
| **Registrations** | Approve new staff registrations |
| **Finance Overview** | Company-wide financial metrics |
| **Complaints** | Handle escalated issues and complaints |

---

## 💰 Miscellaneous Financial Operations (Accounts Team)

Beyond project-specific workflows, the Accounts Team manages global operations:

| Operation | Description |
|-----------|-------------|
| **Payroll (Salary)** | Monthly calculation based on attendance and project assignments |
| **Inventory Management** | Periodic stock valuation and consumption reconciliation |
| **GST & Tax Compliance** | Generate GST, TDS, and other statutory reports |
| **Bank Reconciliation** | Match transactions with ledger entries |
| **Audit Reports** | Generate financial reports for management review |

---

## 📱 Shared Features (All Roles)

| Feature | Description |
|---------|-------------|
| **My Day** | Personalized dashboard with tasks, reminders, updates |
| **Communication** | Internal chat and messaging system |
| **Escalate Issue** | Raise issues to management with priority |
| **M-Workflow** | Visual guide to the complete operational workflow |
| **Clock In/Out** | Attendance tracking with location verification |
| **Profile Settings** | Update personal info, view role, change password |

---

## 🔄 System Integrations

| Integration | Purpose |
|-------------|---------|
| **Just Dial Import** | Import leads from Just Dial API |
| **GPS Verification** | Verify site engineer check-ins |
| **Firebase Auth** | Secure staff authentication |
| **Firestore Database** | Real-time data synchronization |

---

*This guide serves as the source of truth for MMO operations. For technical support, use the 'Escalate Issue' button in your workspace.*

**Version:** 1.1  
**Last Updated:** February 2026
