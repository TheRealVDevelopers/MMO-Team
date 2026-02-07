# Implementation Plan - Execution Planning Panel

The "Project Planning & Budget" panel has been successfully implemented and integrated into both the Execution Team Dashboard and the Client Portal.

## key Components

### 1. ExecutionProjectPlanningPanel.tsx
This is the core component that serves as the "Master Project Contract".
- **Location**: `components/dashboard/execution-team/ExecutionProjectPlanningPanel.tsx`
- **Data Source**: Fetches directly from `cases/{caseId}` to ensure single source of truth.
- **State**: Manages `paymentMilestones`, `materialSchedule`, `vendorAssignments`, `boqItems` (computed), and `approvals`.
- **Modes**:
  - **Staff View**: Full access to edit milestones, assign vendors, schedule materials, and view budget/profit.
  - **Client View** (`isClientView={true}`): Restricted access.
    - **Visible**: Timeline, Document Center, BOQ, Payment Milestones (Read-only), Final Approval (Client toggle only).
    - **Hidden**: Total Budget Card, Material Schedule, Vendor Assignment, Save Button.

### 2. ClientDashboardPage.tsx
- **Location**: `components/landing/ClientDashboardPage.tsx`
- **Integration**: The planning panel is embedded directly into the client dashboard, below the header.
- **Props**: Passes `caseId={project.projectId}` and `isClientView={true}`.
- **Visibility**: The panel automatically handles its own visibility based on project status (`WAITING_FOR_PLANNING` or `ACTIVE`).

### 3. ExecutionTeamDashboard.tsx
- **Integration**: Added a new tab "Project Plan" that renders this panel.
- **Route**: `'project-plan'` added to render logic.

## Data Structure
All planning data is stored in the `executionPlan` map within the `Case` document:
```typescript
executionPlan: {
  paymentMilestones: [...],
  materialSchedule: [...],
  vendorAssignments: [...],
  approvals: { projectHead: boolean, admin: boolean, client: boolean },
  locked: boolean,
  startDate: timestamp,
  endDate: timestamp,
  phases: [...] // Visualized in Timeline
}
```

## Approval Flow
1. **Project Head**: Approves via checkbox in panel.
2. **Admin**: Approves via checkbox (restricted to SUPER_ADMIN).
3. **Client**: Approves via checkbox in Client Portal.
4. **Activation**: When ALL 3 are true -> Project Status becomes `ACTIVE`, Plan is `LOCKED`, Cost Center is initialized.

## Security
- **Access Control**: Validates `currentUser.role` for staff actions.
- **Client Restrictions**: `isClientView` prop forces UI into read-only/restricted mode.
- **Firestore**: Fetches full document; relies on UI hiding for granular field security (per user requirements).

## Next Steps
- Monitor user feedback on the "Master Plan" view.
- Potential enhancement: Add "Reject" flow or comments for approvals.
