# Request Inbox & Tasks Page Implementation

- [x] Update `types.ts` to support Task lifecycle in `ApprovalRequest` <!-- id: 1 -->
    - Add `ASSIGNED`, `ONGOING`, `COMPLETED`, `ACKNOWLEDGED` to `ApprovalStatus`
    - Add lifecycle timestamps (`startedAt`, `completedAt`, `acknowledgedAt`)
- [x] Update `useApprovalSystem.ts` <!-- id: 2 -->
    - Update `approveRequest` to use `ASSIGNED` status
    - Add `startRequest`, `completeRequest`, `acknowledgeRequest` functions
- [x] Create `TasksPage.tsx` <!-- id: 3 -->
    - Available to all roles
    - Shows Assigned/Ongoing/Completed tasks (from ApprovalRequests)
- [x] Update `ApprovalsPage.tsx` (Request Inbox) <!-- id: 4 -->
    - Add "Ongoing Works" section (Assigned/Ongoing)
    - Add "Completed" section with Acknowledge action
- [x] Update `MyDayPage.tsx` <!-- id: 5 -->
    - Integrate assigned `ApprovalRequests` into My Day view
- [x] Verify Notifications & Feedback Loop <!-- id: 6 -->
