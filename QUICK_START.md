# 🎯 QUICK START GUIDE - Unified Project System

## 📋 WHAT WAS BUILT

### ✅ Core Features (All Complete):

1. **Unified Project Page** - One page for all roles at `/projects/{caseId}`
2. **Quotation Approval Flow** - PENDING_APPROVAL → APPROVED with notifications
3. **Task Feedback Loop** - Auto-notifies creator & project head on completion
4. **Projects List** - Role-based filtering (assignedUsers array)
5. **Notification Routing** - Click notification → open correct project tab
6. **Role-Based Access** - Each role sees only their permitted tabs
7. **Deep Linking** - URLs with tab parameters work correctly

---

## 🚀 HOW TO USE

### For Quotation Team:
```
1. Go to Quotation Team dashboard
2. Click "Create Quotation" 
3. Select case and add items
4. Click "Submit Quotation"
   → Status: PENDING_APPROVAL
   → Wait for Admin/Sales Manager approval
5. Receive notification when approved/rejected
6. Click notification → Opens project quotations tab
```

### For Admin/Sales Manager:
```
1. Click "Projects" in navigation
2. Find project with pending quotation
3. Click project card
4. Go to "Quotations" tab
5. See quotation with "🟡 Not Approved Yet" badge
6. Click "Approve" or "Reject" (with reason)
   → Quotation team gets notified automatically
```

### For Task Creators:
```
1. Create task using: createCaseTask(caseId, { ... })
2. Task automatically includes:
   - notifyOnComplete: [creator, projectHead]
3. When task completed:
   - You receive notification
   - Project head receives notification
   - Click notification → opens project Tasks tab
```

### For All Roles:
```
1. Click "Projects" in sidebar
2. See only YOUR assigned projects
   (Admin sees all projects)
3. Click any project to view details
4. See tabs based on your role
5. All changes update in real-time
```

---

## 📁 KEY FILES TO KNOW

### Main Components:
- `ProjectDetailsPage.tsx` - The unified project page
- `ProjectsListPage.tsx` - Filtered projects list
- `CustomerQuotationBuilder.tsx` - Quotation submission

### Helper Functions:
- `approveQuotation()` - in `useCases.ts`
- `rejectQuotation()` - in `useCases.ts`
- `createCaseTask()` - in `useCases.ts`
- `handleNotificationClick()` - in `notificationRouting.ts`

---

## 🔑 KEY CONCEPTS

### assignedUsers Array:
Every project/case should have:
```typescript
assignedUsers: ['userId1', 'userId2', 'userId3']
```
This controls who sees the project in the list.

### notifyOnComplete Array:
Every task should have:
```typescript
notifyOnComplete: [creatorId, projectHeadId]
```
These users get notified when task completes.

### Quotation Status Flow:
```
Draft → Pending Approval → Approved/Rejected
```
Only "Approved" quotations can proceed.

### Role-Based Tabs:
```
Admin          → Everything
Sales Manager  → Overview, Quotations, Timeline
Sales Team     → Overview, Quotations
Drawing Team   → Drawings ONLY
Quotation Team → Quotations ONLY
Execution Team → Overview, Drawings, BOQ, Tasks, Materials
```

---

## ⚡ QUICK ACTIONS

### Approve Quotation:
```typescript
await approveQuotation(caseId, quotationId, currentUser.id, currentUser.name);
```

### Reject Quotation:
```typescript
await rejectQuotation(caseId, quotationId, userId, userName, reason);
```

### Create Task with Feedback:
```typescript
await createCaseTask(caseId, {
  title: 'Create BOQ',
  assignedTo: userId,
  assignedToName: userName,
  createdBy: currentUser.id,
  createdByName: currentUser.name,
  taskType: 'BOQ',
  priority: 'High'
});
```

### Handle Notification Click:
```typescript
handleNotificationClick(notification, setCurrentPage, markAsRead);
```

---

## 🎨 UI INDICATORS

### Status Colors:
- 🟡 Yellow = Pending/Warning
- ✅ Green = Approved/Success/Completed
- 🔵 Blue = In Progress
- ❌ Red = Rejected/Error/Blocked

### Badges:
- **Not Approved Yet** - Quotation pending approval
- **Approved** - Shows "Approved by [name] on [date]"
- **Rejected** - Shows rejection reason

---

## 🔍 TROUBLESHOOTING

### Quotation not saving:
→ Run migration: `window.migrateAllToCases()`

### Project not showing in list:
→ Check `assignedUsers` array includes current user

### Notification not routing:
→ Verify `entity_type` and `entity_id` are set correctly

### Tab not accessible:
→ Role-based - check user's role permissions

---

## ✅ SYSTEM IS READY

Everything is implemented and working:
- ✅ All types updated
- ✅ All hooks created
- ✅ All components built
- ✅ All workflows functional
- ✅ Real-time updates enabled
- ✅ Role-based access enforced
- ✅ Notifications integrated

**You can now test the complete system!**
