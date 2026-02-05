# Request Inbox & Tasks Page Implementation Plan

The goal is to implement a unified Request Inbox and Task system where authorized requests become tasks without duplication, ensuring a single source of truth (`ApprovalRequest` collection).

## User Review Required
> [!IMPORTANT]
> This change modifies the `ApprovalStatus` enum and `ApprovalRequest` interface. Using `ApprovalRequest` as the primary Task object means all "Tasks" that originate from requests will technically be `ApprovalRequests` in the database.

## Proposed Changes

### Core Types
#### [MODIFY] [types.ts](file:///c:/Users/pc/OneDrive/Documents/MMO-Team/types.ts)
- Update `ApprovalStatus` enum to include:
    - `ASSIGNED`
    - `ONGOING`
    - `COMPLETED`
    - `ACKNOWLEDGED`
    - (Keep `PENDING`, `APPROVED` as intermediate if needed, or map `APPROVED` -> `ASSIGNED` via logic)
- Update `ApprovalRequest` interface:
    - Add `startedAt?: Date`
    - Add `completedAt?: Date`
    - Add `acknowledgedAt?: Date`
    - Add `authorizedBy?: string` (Admin ID)
    - Add `authorizedAt?: Date`

### Hooks & Logic
#### [MODIFY] [useApprovalSystem.ts](file:///c:/Users/pc/OneDrive/Documents/MMO-Team/hooks/useApprovalSystem.ts)
- Update `approveRequest` function:
    - Instead of just setting status to `APPROVED`, set it to `ASSIGNED` (or `APPROVED` then auto-transition to `ASSIGNED` if assignee exists).
    - Set `authorizedBy`, `authorizedAt`.
- Add new functions:
    - `startRequest(requestId)`: Sets status to `ONGOING`, sets `startedAt`.
    - `completeRequest(requestId)`: Sets status to `COMPLETED`, sets `completedAt`, sends notifications.
    - `acknowledgeRequest(requestId)`: Sets status to `ACKNOWLEDGED`, sets `acknowledgedAt`.

### UI Components

#### [MODIFY] [ApprovalsPage.tsx](file:///c:/Users/pc/OneDrive/Documents/MMO-Team/components/dashboard/super-admin/ApprovalsPage.tsx)
- **Request Inbox (Admin View)**
- Add "Ongoing Works" Section:
    - Filters: `ASSIGNED`, `ONGOING`
    - Display: Task Cards reuse existing UI or new TaskCard.
- Add "Completed" Section:
    - Filters: `COMPLETED`
    - Action: "Acknowledge" button (calls `acknowledgeRequest`).

#### [NEW] [TasksPage.tsx](file:///c:/Users/pc/OneDrive/Documents/MMO-Team/components/dashboard/shared/TasksPage.tsx)
- New Page available to all users.
- Fetches `ApprovalRequests` where `assigneeId === currentUser.id`.
- Columns/Sections:
    - **Assigned**: Status `ASSIGNED`. Action: "Start".
    - **Ongoing**: Status `ONGOING`. Action: "Complete".
    - **Completed**: Status `COMPLETED`. Status text: "Waiting for Admin Acknowledgement".

#### [MODIFY] [MyDayPage.tsx](file:///c:/Users/pc/OneDrive/Documents/MMO-Team/components/dashboard/shared/MyDayPage.tsx)
- Integrate `ApprovalRequests` (Assignments) into the "Execution Stream".
- Ensure they appear alongside manual `myDayTasks`.

## Verification Plan

### Manual Verification
1.  **Admin Flow:**
    - Login as Admin.
    - Go to "Request Inbox" (Approvals Page).
    - Approve a PENDING request and assign it to a user.
    - Verify it moves to "Ongoing Works" section in Inbox.
    - Verify status is `ASSIGNED`.
2.  **User Flow:**
    - Login as Assigned User.
    - Go to new `/tasks` page.
    - Verify the request appears in "Assigned".
    - Click "Start". Verify status changes to `ONGOING` and moves to Ongoing column.
    - Check "My Day" page. Verify it appears there too.
    - Click "Complete". Verify status changes to `COMPLETED`.
3.  **Completion Flow:**
    - Admin: Check "Request Inbox". Verify task is in "Completed" section.
    - Admin: Click "Acknowledge".
    - Verify task status becomes `ACKNOWLEDGED` (and potentially disappears from Inbox default view).
