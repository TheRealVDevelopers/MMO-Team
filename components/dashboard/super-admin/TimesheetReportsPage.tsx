import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { UserRole, Case } from '../../../types';
import {
  exportUserTimesheet,
  exportCaseTimesheet,
  exportOrganizationTimesheet,
  exportRawTimeEntries,
  exportTimesheetSummary
} from '../../../services/timesheetExportService';
import { ContentCard } from '../shared/DashboardUI';
import { 
  DocumentArrowDownIcon, 
  UserIcon, 
  BuildingOfficeIcon, 
  FolderIcon,
  TableCellsIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface StaffUser {
  id: string;
  name: string;
  role: string;
  organizationId?: string;
}

interface Organization {
  id: string;
  name: string;
}

const TimesheetReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Permission check
  const canAccess = useMemo(() => {
    return currentUser?.role === UserRole.SUPER_ADMIN || 
           currentUser?.role === UserRole.ADMIN ||
           currentUser?.role === UserRole.MANAGER ||
           currentUser?.role === UserRole.SALES_GENERAL_MANAGER;
  }, [currentUser]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch staff users
        const usersSnapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.STAFF_USERS));
        const fetchedUsers: StaffUser[] = [];
        usersSnapshot.forEach(doc => {
          const data = doc.data();
          fetchedUsers.push({
            id: doc.id,
            name: data.name || 'Unknown',
            role: data.role || 'N/A',
            organizationId: data.organizationId
          });
        });
        setUsers(fetchedUsers.sort((a, b) => a.name.localeCompare(b.name)));

        // Fetch organizations
        const orgsSnapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.ORGANIZATIONS));
        const fetchedOrgs: Organization[] = [];
        orgsSnapshot.forEach(doc => {
          const data = doc.data();
          fetchedOrgs.push({
            id: doc.id,
            name: data.name || 'Unknown Org'
          });
        });
        setOrganizations(fetchedOrgs.sort((a, b) => a.name.localeCompare(b.name)));

        // Fetch cases (projects)
        const casesQuery = query(
          collection(db, FIRESTORE_COLLECTIONS.CASES),
          where('isProject', '==', true)
        );
        const casesSnapshot = await getDocs(casesQuery);
        const fetchedCases: Case[] = [];
        casesSnapshot.forEach(doc => {
          const data = doc.data();
          fetchedCases.push({
            id: doc.id,
            ...data
          } as Case);
        });
        setCases(fetchedCases.sort((a, b) => a.title.localeCompare(b.title)));

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (canAccess) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [canAccess]);

  // Get selected user/org/case names
  const selectedUser = users.find(u => u.id === selectedUserId);
  const selectedOrg = organizations.find(o => o.id === selectedOrgId);
  const selectedCase = cases.find(c => c.id === selectedCaseId);

  // Export handlers
  const handleExportUserReport = async () => {
    if (!selectedUserId || !selectedUser) {
      alert('Please select a user');
      return;
    }
    setExporting(true);
    try {
      await exportUserTimesheet(selectedUserId, selectedUser.name, startDate, endDate);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export. Check console for details.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportProjectReport = async () => {
    if (!selectedCaseId || !selectedCase) {
      alert('Please select a project');
      return;
    }
    setExporting(true);
    try {
      await exportCaseTimesheet(selectedCaseId, selectedCase.title, startDate, endDate);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export. Check console for details.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportOrgReport = async () => {
    if (!selectedOrgId || !selectedOrg) {
      alert('Please select an organization');
      return;
    }
    setExporting(true);
    try {
      await exportOrganizationTimesheet(selectedOrgId, selectedOrg.name, startDate, endDate);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export. Check console for details.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportRawLogs = async () => {
    setExporting(true);
    try {
      await exportRawTimeEntries(startDate, endDate);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export. Check console for details.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportSummary = async () => {
    setExporting(true);
    try {
      await exportTimesheetSummary(startDate, endDate, selectedOrgId || undefined);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export. Check console for details.');
    } finally {
      setExporting(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="p-6">
        <ContentCard>
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
            <p className="text-text-secondary mt-2">
              Only Super Admin, Admin, and Manager can access Timesheet Reports.
            </p>
          </div>
        </ContentCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Timesheet Reports</h1>
        <p className="text-text-secondary mt-1">
          Export staff timesheets to Excel. Sessions are derived dynamically from time entries.
        </p>
      </div>

      {/* Date Range Filter */}
      <ContentCard className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Date Range</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                setStartDate(d.toISOString().split('T')[0]);
                setEndDate(new Date().toISOString().split('T')[0]);
              }}
              className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-background"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                setStartDate(d.toISOString().split('T')[0]);
                setEndDate(new Date().toISOString().split('T')[0]);
              }}
              className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-background"
            >
              Last 30 Days
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                setStartDate(firstDay.toISOString().split('T')[0]);
                setEndDate(now.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-background"
            >
              This Month
            </button>
          </div>
        </div>
      </ContentCard>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* User Report */}
        <ContentCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">User Report</h3>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
            >
              <option value="">-- Select User --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleExportUserReport}
            disabled={exporting || !selectedUserId}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            {exporting ? 'Exporting...' : 'Download User Report'}
          </button>
        </ContentCard>

        {/* Project Report */}
        <ContentCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <FolderIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Project Report</h3>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Project</label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
            >
              <option value="">-- Select Project --</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} - {c.clientName}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleExportProjectReport}
            disabled={exporting || !selectedCaseId}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            {exporting ? 'Exporting...' : 'Download Project Report'}
          </button>
        </ContentCard>

        {/* Organization Report */}
        <ContentCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <BuildingOfficeIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Organization Report</h3>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Organization</label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
            >
              <option value="">-- Select Organization --</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleExportOrgReport}
            disabled={exporting || !selectedOrgId}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            {exporting ? 'Exporting...' : 'Download Org Report'}
          </button>
        </ContentCard>

        {/* Raw Logs */}
        <ContentCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <TableCellsIcon className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold">Raw Time Logs</h3>
          </div>
          
          <p className="text-sm text-text-secondary mb-4">
            Export all time entries with derived sessions for the selected date range. 
            Includes UNTRACKED gaps (&gt;15 min).
          </p>
          
          <button
            onClick={handleExportRawLogs}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            {exporting ? 'Exporting...' : 'Download All Raw Logs'}
          </button>
        </ContentCard>

        {/* Summary Report */}
        <ContentCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-teal-100 rounded-xl">
              <ChartBarIcon className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold">Summary Report</h3>
          </div>
          
          <p className="text-sm text-text-secondary mb-4">
            Aggregated view by user: Total login hours, active task time, break time, 
            untracked time, and productivity percentage.
          </p>
          
          <button
            onClick={handleExportSummary}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            {exporting ? 'Exporting...' : 'Download Summary Report'}
          </button>
        </ContentCard>
      </div>

      {/* Info Box */}
      <ContentCard className="mt-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">How Sessions are Derived</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li><strong>LOGIN:</strong> Clock In → Clock Out (full work day)</li>
          <li><strong>TASK:</strong> Activity Start → Activity End</li>
          <li><strong>BREAK:</strong> Break Start → Break End</li>
          <li><strong>UNTRACKED:</strong> Gaps greater than 15 minutes between sessions</li>
        </ul>
        <p className="text-sm text-blue-600 mt-3">
          <strong>Note:</strong> Data is generated live from timeEntries. Nothing is stored.
        </p>
      </ContentCard>
    </div>
  );
};

export default TimesheetReportsPage;
