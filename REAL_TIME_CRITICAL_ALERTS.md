# Real-Time Critical Attention Required - Implementation Guide

## Overview

The "CRITICAL ATTENTION REQUIRED" feature has been fully implemented with real-time functionality across the entire application. This system provides instant, automatic updates without requiring manual page refreshes or delays.

## Key Features

### 1. **Real-Time Monitoring**
- **Firestore Listeners**: Uses `onSnapshot` to listen to task changes in real-time
- **Automatic Recalculation**: Performance flags update instantly when tasks change
- **Time-Based Triggers**: Monitors current time every minute to catch deadline-based alerts (4 PM warning, 6 PM red flag)
- **Zero Latency**: Updates appear immediately as changes occur in the database

### 2. **Critical Alert Categories**

The system monitors and displays alerts in these categories:

#### **Critical Severity**
- Tasks overdue by more than 24 hours
- Tasks incomplete after 6 PM (red flag rule)

#### **High Severity**
- Tasks recently overdue (less than 24 hours)

#### **Medium Severity**
- Tasks approaching deadline (within 1 hour)
- Tasks pending after 4 PM (yellow flag warning)

## Implementation Components

### Core Hook: `useCriticalAlerts`
**Location**: `hooks/useCriticalAlerts.ts`

This is the central hook that powers real-time critical alerts across the application.

**Features**:
- Real-time task monitoring using Firestore `onSnapshot`
- Real-time user data monitoring for assignee information
- Automatic time-based recalculation every minute
- Categorization by severity (critical, high, medium)
- Type classification (overdue, approaching_deadline, red_flag, yellow_flag)

**Usage Example**:
```typescript
import { useCriticalAlerts } from '../hooks/useCriticalAlerts';

// Team view (shows all team tasks)
const { alerts, counts, loading, hasCriticalAlerts } = useCriticalAlerts(true);

// Personal view (can be filtered by userId later)
const { alerts, counts, loading, hasCriticalAlerts } = useCriticalAlerts(false);
```

**Return Values**:
```typescript
{
  alerts: CriticalAlert[],        // Array of all current alerts
  counts: {
    critical: number,             // Count of critical alerts
    high: number,                 // Count of high severity alerts
    medium: number,               // Count of medium severity alerts
    total: number,                // Total alert count
    overdue: number,              // Overdue tasks count
    approaching: number,          // Approaching deadline count
    redFlags: number,             // Red flag count
    yellowFlags: number           // Yellow flag count
  },
  loading: boolean,               // Loading state
  hasCriticalAlerts: boolean,     // True if any critical alerts exist
  hasAlerts: boolean              // True if any alerts exist
}
```

### Enhanced Components

#### 1. **RedFlagsHeader** (Admin Dashboard)
**Location**: `components/dashboard/admin/RedFlagsHeader.tsx`

**Features**:
- Real-time alert display with animated pulse on new critical items
- Expandable detail view
- Color-coded severity indicators
- Automatic refresh when tasks change
- Animated entry/exit transitions

**Integration**:
```typescript
import RedFlagsHeader from './admin/RedFlagsHeader';

// In your dashboard component
<RedFlagsHeader />
```

#### 2. **CriticalAlertBanner** (All Dashboards)
**Location**: `components/dashboard/shared/CriticalAlertBanner.tsx`

**Features**:
- Compact and full-size display modes
- Dismissible with auto-reappear on new critical alerts
- Preview of top 3 most critical alerts
- Smooth scroll to detailed section
- User-specific filtering for personal dashboards

**Integration Examples**:

```typescript
import CriticalAlertBanner from '../shared/CriticalAlertBanner';

// Full banner (team view)
<CriticalAlertBanner teamView={true} />

// Compact banner (personal view)
<CriticalAlertBanner userId={currentUser.id} compact={true} />
```

### Real-Time Performance Service
**Location**: `services/performanceService.ts`

**New Functions**:

#### `monitorUserPerformance(userId, onUpdate)`
Sets up real-time monitoring for a specific user's performance flag.

```typescript
// Returns unsubscribe function
const unsubscribe = monitorUserPerformance('user-123', (flag, reason) => {
  console.log(`Performance updated: ${flag} - ${reason}`);
});

// Clean up when done
unsubscribe();
```

#### `monitorAllUsersPerformance()`
Sets up real-time monitoring for all users in the system.

```typescript
// Returns cleanup function
const cleanup = await monitorAllUsersPerformance();

// Clean up when done
cleanup();
```

### Enhanced Performance Monitor Hook
**Location**: `hooks/usePerformanceMonitor.ts`

**Changes**:
- Now uses real-time Firestore listeners instead of polling
- Automatically monitors all users for Super Admin and Manager roles
- Backup polling every 5 minutes (instead of 1 minute) for resilience
- Automatic cleanup on unmount

## How Real-Time Updates Work

### 1. **Task Changes**
```
User adds/updates task
    ↓
Firestore write
    ↓
onSnapshot triggers in useCriticalAlerts
    ↓
Alerts recalculated instantly
    ↓
Components re-render with new data
    ↓
UI updates without page refresh
```

### 2. **Time-Based Alerts**
```
Every minute timer fires
    ↓
Current time updated in hook state
    ↓
useMemo recalculates alerts with new time
    ↓
New alerts appear (e.g., 4 PM warning triggers)
    ↓
UI updates automatically
```

### 3. **Performance Flag Updates**
```
Task created/updated/completed
    ↓
onSnapshot in monitorUserPerformance triggers
    ↓
calculateUserPerformance runs
    ↓
User document updated with new flag
    ↓
Notifications sent to managers if red flag
    ↓
All connected clients see update instantly
```

## Integration Guide

### For Personal Dashboards
Add the compact banner at the top of the dashboard:

```typescript
import CriticalAlertBanner from '../shared/CriticalAlertBanner';
import { useAuth } from '../../context/AuthContext';

const MyDashboard = () => {
  const { currentUser } = useAuth();
  
  return (
    <div>
      <CriticalAlertBanner userId={currentUser.id} compact={true} />
      {/* Rest of dashboard */}
    </div>
  );
};
```

### For Team/Admin Dashboards
Use the full banner or RedFlagsHeader:

```typescript
import RedFlagsHeader from './admin/RedFlagsHeader';
// OR
import CriticalAlertBanner from '../shared/CriticalAlertBanner';

const AdminDashboard = () => {
  return (
    <div>
      <RedFlagsHeader />
      {/* OR */}
      <CriticalAlertBanner teamView={true} />
      {/* Rest of dashboard */}
    </div>
  );
};
```

### For Custom Alert Display
Use the hook directly:

```typescript
import { useCriticalAlerts } from '../../hooks/useCriticalAlerts';

const CustomComponent = () => {
  const { alerts, counts, hasCriticalAlerts } = useCriticalAlerts(true);
  
  if (hasCriticalAlerts) {
    return (
      <div className="alert-critical">
        {alerts.map(alert => (
          <div key={alert.id}>
            <h4>{alert.title}</h4>
            <p>{alert.description}</p>
          </div>
        ))}
      </div>
    );
  }
  
  return null;
};
```

## Performance Considerations

### Optimizations Implemented

1. **Efficient Queries**: Uses indexed Firestore queries with proper where clauses
2. **Memoization**: Alert calculation is memoized to prevent unnecessary recalculations
3. **Debounced Updates**: Time-based checks run every minute, not every second
4. **Selective Filtering**: Can filter by user or team to reduce data processing
5. **Cleanup**: All listeners properly unsubscribe on component unmount

### Firestore Indexes Required

Ensure these composite indexes exist in Firestore:

```
Collection: myDayTasks
- userId (Ascending) + created_at (Descending)
- userId (Ascending) + status (Ascending)

Collection: notifications
- user_id (Ascending) + created_at (Descending)
```

## Alert Types Reference

### Alert Properties
```typescript
interface CriticalAlert {
  id: string;                    // Unique identifier
  type: 'overdue' | 'approaching_deadline' | 'red_flag' | 'yellow_flag';
  severity: 'critical' | 'high' | 'medium';
  title: string;                 // Alert title
  description: string;           // Detailed description
  taskId?: string;              // Associated task ID
  userId?: string;              // User responsible
  userName?: string;            // User's display name
  timestamp: Date;              // When alert was triggered
  deadline?: Date;              // Task deadline
  hoursOverdue?: number;        // Hours past deadline (if overdue)
}
```

### Alert Generation Rules

| Condition | Type | Severity | Example |
|-----------|------|----------|---------|
| Overdue > 24h | overdue | critical | Task is 48 hours past deadline |
| Overdue < 24h | overdue | high | Task is 3 hours past deadline |
| Deadline < 1h | approaching_deadline | medium | Task due in 45 minutes |
| Time >= 6 PM + Pending | red_flag | critical | Task incomplete at 7 PM |
| Time >= 4 PM + Pending | yellow_flag | medium | Task pending at 5 PM |

## Testing the Real-Time Functionality

### Test Scenario 1: Task Creation
1. Open dashboard in two browser windows
2. Create a task with a deadline in 30 minutes
3. Verify alert appears instantly in both windows without refresh

### Test Scenario 2: Task Completion
1. Complete an overdue task
2. Verify alert disappears immediately without refresh

### Test Scenario 3: Time-Based Trigger
1. Create a task for today
2. Wait until 4 PM
3. Verify yellow flag alert appears automatically at 4:00 PM

### Test Scenario 4: Deadline Approaching
1. Create a task with deadline in 59 minutes
2. Wait one minute
3. Verify "approaching deadline" alert appears

## Troubleshooting

### Issue: Alerts not updating in real-time
**Solution**: 
- Check browser console for Firestore connection errors
- Verify Firebase configuration is correct
- Ensure user has proper Firestore permissions

### Issue: Performance degradation
**Solution**:
- Check number of active listeners (should be limited)
- Verify indexes are created in Firestore console
- Reduce polling frequency if needed

### Issue: Duplicate alerts
**Solution**:
- Ensure unique alert IDs are being generated
- Check that component isn't mounting multiple times
- Verify proper cleanup in useEffect

## Future Enhancements

Potential improvements for the real-time system:

1. **Push Notifications**: Browser notifications for critical alerts
2. **Sound Alerts**: Audio notification for critical items
3. **Smart Grouping**: Group related alerts together
4. **Snooze Feature**: Temporarily dismiss alerts with reminder
5. **Priority Sorting**: User-customizable alert priority
6. **Alert History**: Track when alerts were triggered and resolved

## Summary

The real-time "CRITICAL ATTENTION REQUIRED" feature is now fully implemented with:

✅ Instant updates without manual refresh  
✅ Automatic time-based alert triggers  
✅ Real-time performance flag monitoring  
✅ Animated visual feedback for new alerts  
✅ Multiple display modes (compact/full)  
✅ User and team filtering  
✅ Proper cleanup and memory management  
✅ Optimized Firestore queries  

The system ensures that critical tasks and alerts are displayed to users **immediately** as they become active, providing true real-time functionality across the entire application.
