import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { User, TimeEntry } from '../../../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useProjects } from '../../../hooks/useProjects';
import { useLeads } from '../../../hooks/useLeads';

interface ExportDeploymentReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[]; // Can be a single user or a whole team
    initialStartDate?: string;
    initialEndDate?: string;
}

const ExportDeploymentReportModal: React.FC<ExportDeploymentReportModalProps> = ({
    isOpen,
    onClose,
    users,
    initialStartDate,
    initialEndDate
}) => {
    const [startDate, setStartDate] = useState(initialStartDate || new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(initialEndDate || new Date().toISOString().split('T')[0]);
    const [isExporting, setIsExporting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // Fetch projects and leads for activity descriptions
    const { projects } = useProjects();
    const { leads } = useLeads();

    // Helper function to convert Firestore timestamp to Date
    const toDate = (timestamp: any): Date | null => {
        if (!timestamp) return null;
        if (timestamp instanceof Date) return timestamp;
        if (timestamp.toDate) return timestamp.toDate();
        if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
        return new Date(timestamp);
    };

    // Helper function to format time
    const formatTime = (timestamp: any): string => {
        const date = toDate(timestamp);
        if (!date) return '-';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // Helper function to get detailed activity description
    const getActivityDescription = (activity: any): string => {
        const tags = activity.tags || [];

        // Check for project association
        const projectTag = tags.find((t: string) => t.startsWith('project:'));
        if (projectTag) {
            const projectId = projectTag.split(':')[1];
            const project: any = projects.find((p: any) => p.id === projectId);
            if (project) {
                const projectName = project.title || project.name || project.projectName || 'Unknown Project';
                const clientName = project.clientName || 'Unknown Client';
                return `${activity.name} - Project: ${projectName} (Client: ${clientName})`;
            }
        }

        // Check for lead association
        const leadTag = tags.find((t: string) => t.startsWith('lead:'));
        if (leadTag) {
            const leadId = leadTag.split(':')[1];
            const lead: any = leads.find((l: any) => l.id === leadId);
            if (lead) {
                const leadName = lead.projectName || lead.name || 'Unknown Lead';
                const clientName = lead.clientName || 'Unknown Client';
                return `${activity.name} - Lead: ${leadName} (Client: ${clientName})`;
            }
        }

        // Fallback to activity name with tags
        return tags.length > 0 ? `${activity.name} (${tags.join(', ')})` : activity.name;
    };

    // Helper function to calculate idle time for a day
    const calculateIdleTime = (entry: any): number => {
        const clockIn = toDate(entry.clockIn);
        const isToday = entry.date === new Date().toLocaleDateString('en-CA');
        const clockOut = toDate(entry.clockOut) || (isToday ? new Date() : clockIn);

        if (!clockIn || !clockOut || clockOut <= clockIn) return 0;

        const totalTime = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60); // minutes

        // Sum break time
        const breakTime = (entry.breaks || []).reduce((sum: number, b: any) => {
            const start = toDate(b.startTime);
            const end = toDate(b.endTime) || (isToday ? new Date() : start);
            if (start && end && end > start) {
                return sum + (end.getTime() - start.getTime()) / (1000 * 60);
            }
            return sum;
        }, 0);

        // Sum activity time
        const activityTime = (entry.activities || []).reduce((sum: number, a: any) => {
            const start = toDate(a.startTime);
            const end = toDate(a.endTime) || (isToday ? new Date() : start);
            if (start && end && end > start) {
                return sum + (end.getTime() - start.getTime()) / (1000 * 60);
            }
            return sum;
        }, 0);

        return Math.max(0, totalTime - breakTime - activityTime);
    };

    const handleExport = async () => {
        if (!startDate || !endDate) return;

        setIsExporting(true);
        setStatusMessage('Fetching data...');

        try {
            const allEntries: any[] = [];
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Deployment Report', {
                views: [{ showGridLines: false }]
            });

            // --- 1. SETUP COLUMNS & WIDTHS ---
            worksheet.columns = [
                { width: 15 }, // A: Date
                { width: 25 }, // B: Team Member
                { width: 15 }, // C: Role
                { width: 15 }, // D: Type
                { width: 30 }, // E: Activity/Project
                { width: 15 }, // F: Start Time
                { width: 15 }, // G: End Time
                { width: 15 }, // H: Duration
                { width: 15 }  // I: Status
            ];

            // --- 2. ADD LOGO ---
            // Fetch the logo image (must be in public folder)
            try {
                const response = await fetch('/mmo-logo-full.png');
                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();

                const imageId = workbook.addImage({
                    buffer: arrayBuffer,
                    extension: 'png',
                });

                // Place logo in top left, spanning a few columns/rows
                worksheet.addImage(imageId, {
                    tl: { col: 0, row: 0 },
                    ext: { width: 180, height: 60 }, // Adjust size as needed
                    editAs: 'absolute'
                });
            } catch (err) {
                console.warn("Could not load logo for Excel export", err);
            }

            // --- 3. ADD HEADERS & TITLE ---
            // Skip rows for logo (approx 4 rows)
            worksheet.spliceRows(1, 4);

            // Main Title
            const titleRow = worksheet.getRow(5);
            titleRow.getCell(1).value = "DEPLOYMENT ACTIVITY REPORT";
            titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF2D3748' } };
            worksheet.mergeCells('A5:I5');
            titleRow.getCell(1).alignment = { horizontal: 'center' };

            // Sub-info: Date Range
            const dateRow = worksheet.getRow(6);
            dateRow.getCell(1).value = `Period: ${format(new Date(startDate), 'PPP')} - ${format(new Date(endDate), 'PPP')}`;
            dateRow.getCell(1).font = { italic: true, size: 11, color: { argb: 'FF718096' } };
            worksheet.mergeCells('A6:I6');
            dateRow.getCell(1).alignment = { horizontal: 'center' };

            // Generated Info
            const metaRow = worksheet.getRow(7);
            const teamInfo = users.length > 1 ? `Team: ${users.length} Members` : `Staff: ${users[0]?.name} (${users[0]?.role})`;
            metaRow.getCell(1).value = `${teamInfo} | Generated on: ${format(new Date(), 'PPpp')}`;
            metaRow.getCell(1).font = { size: 10, color: { argb: 'FFA0AEC0' } };
            worksheet.mergeCells('A7:I7');
            metaRow.getCell(1).alignment = { horizontal: 'center' };

            // Spacing
            worksheet.addRow([]);

            // --- 4. TABLE HEADER ---
            const headerRow = worksheet.addRow([
                'Date', 'Team Member', 'Role', 'Type', 'Activity/Project', 'Start Time', 'End Time', 'Duration', 'Status'
            ]);

            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF3182CE' } // Primary Blue
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
            });

            // --- 5. DATA FETCHING ---
            for (const user of users) {
                const q = query(
                    collection(db, 'timeEntries'),
                    where('userId', '==', user.id)
                );

                const snapshot = await getDocs(q);
                const userEntries = snapshot.docs
                    .map(doc => doc.data() as TimeEntry)
                    .filter(entry => entry.date >= startDate && entry.date <= endDate)
                    .sort((a, b) => a.date.localeCompare(b.date));

                userEntries.forEach(entry => {
                    const dateStr = entry.date;

                    // 1. Clock In/Out Summary
                    worksheet.addRow([
                        dateStr,
                        user.name,
                        user.role,
                        'Attendance',
                        'Daily Summary',
                        entry.clockIn ? formatTime(entry.clockIn) : '-',
                        entry.clockOut ? formatTime(entry.clockOut) : '-',
                        entry.totalWorkHours ? `${entry.totalWorkHours.toFixed(2)} hrs` : '-',
                        entry.status.toUpperCase()
                    ]).eachCell(c => c.font = { bold: true, color: { argb: 'FF1A202C' } });

                    // 2. Breaks
                    (entry.breaks || []).forEach(b => {
                        let duration = 0;
                        const start = toDate(b.startTime);
                        const end = b.endTime ? toDate(b.endTime) : null;
                        if (start && end) {
                            duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                        }

                        const row = worksheet.addRow([
                            dateStr,
                            user.name,
                            user.role,
                            'Break',
                            'Break',
                            formatTime(b.startTime),
                            b.endTime ? formatTime(b.endTime) : 'Ongoing',
                            duration > 0 ? `${duration} mins` : '-',
                            'On Break'
                        ]);
                        row.getCell(4).font = { color: { argb: 'FFD69E2E' } }; // Yellowish for Break
                    });

                    // 3. Activities
                    (entry.activities || []).forEach(a => {
                        let duration = 0;
                        const start = toDate(a.startTime);
                        const end = a.endTime ? toDate(a.endTime) : null;
                        if (start && end) {
                            duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                        }

                        const row = worksheet.addRow([
                            dateStr,
                            user.name,
                            user.role,
                            'Activity',
                            getActivityDescription(a),
                            formatTime(a.startTime),
                            a.endTime ? formatTime(a.endTime) : 'In Progress',
                            duration > 0 ? `${duration} mins` : '-',
                            'Active'
                        ]);
                        row.getCell(4).font = { color: { argb: 'FF38A169' } }; // Green for Activity
                    });

                    // 4. Idle Time Summary
                    const idleMinutes = calculateIdleTime(entry);
                    if (idleMinutes > 0) {
                        const idleRow = worksheet.addRow([
                            dateStr,
                            user.name,
                            user.role,
                            'Idle Time',
                            'Time not on tasks or breaks',
                            '-',
                            '-',
                            `${Math.round(idleMinutes)} mins`,
                            'Idle'
                        ]);
                        idleRow.getCell(4).font = { color: { argb: 'FFEF4444' }, italic: true }; // Red for Idle
                    }
                });
            }

            if (worksheet.rowCount <= 9) { // Header rows + table header = ~9
                setStatusMessage('No data found for selected range.');
                setIsExporting(false);
                return;
            }

            // Apply global borders to data cells
            const START_ROW = 10;
            const endRow = worksheet.rowCount;
            for (let r = START_ROW; r <= endRow; r++) {
                worksheet.getRow(r).eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                    };
                    cell.alignment = { vertical: 'middle', wrapText: true };
                });
            }

            setStatusMessage('Writing Excel file...');

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            const fileName = users.length > 1
                ? `Team_Deployment_Report_${startDate}_to_${endDate}.xlsx`
                : `${users[0].name.replace(' ', '_')}_Report_${startDate}_to_${endDate}.xlsx`;

            saveAs(blob, fileName);

            setStatusMessage('Download started!');
            setTimeout(() => {
                onClose();
                setStatusMessage('');
                setIsExporting(false);
            }, 1000);

        } catch (error) {
            console.error("Export Error:", error);
            setStatusMessage('Error generating report.');
            setIsExporting(false);
        }
    };



    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-md w-full rounded-2xl bg-white dark:bg-surface border border-border shadow-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <Dialog.Title className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <ArrowDownTrayIcon className="w-5 h-5 text-primary" />
                            Export Deployment Report
                        </Dialog.Title>
                        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-text-secondary">
                            Generate a detailed Excel report for <strong>{users.length > 1 ? `${users.length} Team Members` : users[0]?.name}</strong>.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-subtle-background border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-subtle-background border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                        </div>

                        {statusMessage && (
                            <div className={`text-xs font-medium text-center p-2 rounded ${statusMessage.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                {statusMessage}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-subtle-background rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isExporting ? 'Generating...' : 'Download Excel'}
                            </button>
                        </div>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default ExportDeploymentReportModal;
