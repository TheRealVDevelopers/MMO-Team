# TIME SYSTEM AUDIT - COMPLETE MAP

## 📊 AUDIT FINDINGS

### Current TimeEntry Schema Locations:
1. **types.ts** (Line 605-620) - Multiple conflicting TimeEntry interfaces
2. **services/timesheetExportService.ts** - Custom TimeEntryData interface
3. **hooks/useTimeTracking.ts** - Uses inconsistent schema

### Files Using Time Calculations:

#### **DASHBOARD COMPONENTS:**
| File | Component | Fields Used | Data Source |
|------|-----------|-------------|-------------|
| `components/dashboard/super-admin/OverviewDashboard.tsx` | OverviewDashboard | activeHours, idleHours, loggedHours | ❌ LOCAL CALCULATION |
| `components/dashboard/super-admin/TeamMemberDetailView.tsx` | TeamMemberDetailView | activeHours, idleHours, loggedHours | ❌ LOCAL CALCULATION |
| `components/dashboard/sales-manager/SalesOverviewPage.tsx` | SalesOverviewPage | activeHours, idleHours, teamMetrics | ❌ LOCAL CALCULATION |
| `components/dashboard/sales-team/SalesOverviewPage.tsx` | SalesTeamOverview | stats from useDashboardStats | ❌ MIXED |
| `components/dashboard/accounts-team/AccountsOverviewPage.tsx` | AccountsOverview | useTimeEntries | ✅ FIRESTORE |
| `components/dashboard/shared/MyDayPage.tsx` | MyDayPage | useTimeEntries, addActivity | ✅ FIRESTORE |
| `components/dashboard/TimeTrackingSummary.tsx` | TimeTrackingSummary | useTimeEntries, calculateTotalHours | ❌ MIXED |

#### **HOOKS:**
| Hook | Purpose | Issues |
|------|---------|--------|
| `hooks/useTimeTracking.ts` | Main time tracking hook | ❌ Mixed schema, legacy fields |
| `hooks/useDashboardStats.ts` | Dashboard statistics | ❌ Uses useTimeEntries but local calculations |

#### **SERVICES:**
| Service | Purpose | Issues |
|---------|---------|--------|
| `services/timesheetExportService.ts` | Excel export | ✅ Reads Firestore correctly |
| `services/performanceService.ts` | Performance metrics | ❌ STUB - needs rebuild |

#### **WIDGETS:**
| Widget | Fields | Issues |
|--------|--------|--------|
| `components/dashboard/ClockInOutWidget.tsx` | useCurrentTimeStatus, clockIn/Out | ✅ Uses hooks |
| `components/dashboard/shared/TimeTimeline.tsx` | clockIn/Out, breaks, activities | ✅ Uses hooks |
| `components/dashboard/shared/ExportDeploymentReportModal.tsx` | breakTime calculations | ❌ LOCAL |

### TIME-RELATED FUNCTIONS:
```
hooks/useTimeTracking.ts:
- useTimeEntries() ✅
- useTeamTimeEntries() ✅
- useCurrentTimeStatus() ✅
- clockIn() ✅
- clockOut() ✅
- startBreak() ✅
- endBreak() ✅
- addActivity() ✅
- calculateTotalHours() ❌ LOCAL
- getTimeTrackingSummary() ❌ LOCAL
- formatDuration() ✅ UTIL
```

### SCHEMA CONFLICTS:

**Current TimeEntry in types.ts (INCONSISTENT):**
```typescript
// Line 605-620
export interface TimeEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  clockIn: Date;
  clockOut?: Date;
  totalWorkHours?: number;
  totalBreakMinutes?: number;
  breaks?: BreakEntry[];
  activities?: TimeActivity[];
  status: TimeTrackingStatus;
  userName?: string;
}

// Line 1087-1098 (DUPLICATE!)
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
```

## 🔥 CRITICAL ISSUES FOUND:

1. **DUPLICATE INTERFACES** - TimeEntry defined TWICE in types.ts
2. **LOCAL CALCULATIONS** - 5+ components calculate time independently
3. **INCONSISTENT FIELD NAMES** - clockIn vs clockInTime
4. **STORED TOTALS** - totalWorkHours stored (should be computed)
5. **MISSING organizationId** - No org scoping in TimeEntry
6. **NO SECONDS TRACKING** - Only minutes/hours
7. **MIXED SOURCES** - Some use Firestore, some use local state

## ✅ ACTION PLAN:

### STEP 1: Schema Consolidation
- Delete duplicate TimeEntry interface
- Create canonical schema with organizationId
- Use seconds (not hours/minutes)
- Remove stored totals

### STEP 2: Remove Local Calculations
Files to modify:
- `components/dashboard/super-admin/OverviewDashboard.tsx`
- `components/dashboard/super-admin/TeamMemberDetailView.tsx`
- `components/dashboard/sales-manager/SalesOverviewPage.tsx`
- `components/dashboard/shared/ExportDeploymentReportModal.tsx`
- `hooks/useDashboardStats.ts`

### STEP 3: Create Unified Hook
- `hooks/useTimeAnalytics.ts` - Single source of truth

### STEP 4: Dashboard Rewiring
All dashboards must use ONLY useTimeAnalytics()

### STEP 5: Reset to Zero
- Remove all mock data
- Remove totalWorkHours from Firestore writes
- Start fresh

---

**Total Files to Modify: 12+**
**Total Lines of Code Affected: ~2000+**

This is a FULL SYSTEM REBUILD.
