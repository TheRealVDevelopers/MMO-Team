import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { ImportedLead } from '../../types';
import { useSmartAssignment } from '../../hooks/useSmartAssignment';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import * as pdfjs from 'pdfjs-dist';
import Modal from '../shared/Modal';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface LeadImporterProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete?: () => void;
}

const LeadImporter: React.FC<LeadImporterProps> = ({ isOpen, onClose, onImportComplete }) => {
    const { currentUser } = useAuth();
    const { distributeLeads, getDistributionSummary, sessions } = useSmartAssignment();

    const [file, setFile] = useState<File | null>(null);
    const [parsedLeads, setParsedLeads] = useState<ImportedLead[]>([]);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handlePdfParse = async (pdfFile: File) => {
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n';
            }

            // Simple heuristic to extract leads from PDF text
            const lines = fullText.split('\n').filter(line => line.trim().length > 0);
            const leads: ImportedLead[] = [];

            lines.forEach(line => {
                const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                const mobileMatch = line.match(/\d{10,}/);

                if (emailMatch || mobileMatch) {
                    const parts = line.split(/\s{2,}|\t/);
                    if (parts.length >= 2) {
                        leads.push({
                            clientName: parts[0]?.trim() || 'Unknown Client',
                            projectName: parts[1]?.trim() || 'Imported Project',
                            clientEmail: emailMatch?.[0] || '',
                            clientMobile: mobileMatch?.[0] || '',
                            value: 0,
                            source: 'PDF Import',
                            priority: 'Medium'
                        });
                    }
                }
            });

            if (leads.length === 0) {
                setError('No leads could be clearly identified in the PDF. Please ensure the formatting is clean.');
                return;
            }

            setParsedLeads(leads);
        } catch (err) {
            console.error('Error parsing PDF:', err);
            setError('Failed to parse PDF file. Please ensure it is a valid document.');
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError('');
        setParsedLeads([]);
        setSuccess(false);

        const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

        if (!['xlsx', 'xls', 'csv', 'pdf'].includes(fileExtension || '')) {
            setError('Please upload an Excel (.xlsx, .xls), CSV, or PDF file');
            return;
        }

        if (fileExtension === 'pdf') {
            handlePdfParse(selectedFile);
            return;
        }

        try {
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const data = event.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    // Parse and validate the data
                    const leads: ImportedLead[] = jsonData.map((row: any) => ({
                        clientName: row['Client Name'] || row['clientName'] || row['name'] || '',
                        projectName: row['Project Name'] || row['projectName'] || row['project'] || '',
                        clientEmail: row['Email'] || row['email'] || row['clientEmail'] || '',
                        clientMobile: row['Mobile'] || row['mobile'] || row['phone'] || row['clientMobile'] || '',
                        value: Number(row['Value'] || row['value'] || row['budget'] || 0),
                        source: row['Source'] || row['source'] || 'Import',
                        priority: (row['Priority'] || row['priority'] || 'Medium') as 'High' | 'Medium' | 'Low',
                    })).filter(lead => lead.clientName && lead.projectName); // Filter out invalid leads

                    if (leads.length === 0) {
                        setError('No valid leads found in the file. Please check the format.');
                        return;
                    }

                    setParsedLeads(leads);
                } catch (err) {
                    console.error('Error parsing file:', err);
                    setError('Failed to parse file. Please ensure it follows the correct format.');
                }
            };

            reader.readAsBinaryString(selectedFile);
        } catch (err) {
            console.error('Error reading file:', err);
            setError('Failed to read file');
        }
    };

    const handleImport = async () => {
        if (parsedLeads.length === 0 || !currentUser) return;

        setImporting(true);
        setError('');

        try {
            await distributeLeads(parsedLeads, currentUser.id, 'import');
            setSuccess(true);
            setTimeout(() => {
                onImportComplete?.();
                handleClose();
            }, 2000);
        } catch (err: any) {
            console.error('Import error:', err);
            setError(err.message || 'Failed to import leads. Please try again.');
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setParsedLeads([]);
        setError('');
        setSuccess(false);
        onClose();
    };

    const distributionSummary = parsedLeads.length > 0 ? getDistributionSummary(parsedLeads.length) : null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Import Leads"
            size="2xl"
        >
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-text-secondary mb-4">Upload Excel or CSV file to import leads</p>

                    {/* File Upload */}
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv,.pdf"
                            onChange={handleFileSelect}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            id="file-upload"
                        />
                        <Upload className="w-12 h-12 mx-auto text-text-secondary mb-3" />
                        <p className="text-text-primary font-medium">
                            {file ? file.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-sm text-text-secondary mt-1">
                            Excel (.xlsx, .xls), CSV, or PDF files
                        </p>
                    </div>
                </div>

                {/* File Format Guide */}
                <div className="bg-subtle-background border border-border rounded-lg p-4">
                    <h3 className="font-medium text-text-primary mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Expected File Format
                    </h3>
                    <p className="text-sm text-text-secondary mb-2">
                        Your file should have the following columns:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-text-secondary">• Client Name</div>
                        <div className="text-text-secondary">• Project Name</div>
                        <div className="text-text-secondary">• Email</div>
                        <div className="text-text-secondary">• Mobile</div>
                        <div className="text-text-secondary">• Value (Budget)</div>
                        <div className="text-text-secondary">• Source</div>
                        <div className="text-text-secondary">• Priority (High/Medium/Low)</div>
                    </div>
                </div>

                {/* Parsed Leads Preview */}
                {parsedLeads.length > 0 && (
                    <div className="bg-subtle-background border border-border rounded-lg p-4">
                        <h3 className="font-medium text-text-primary mb-3">
                            Found {parsedLeads.length} Lead{parsedLeads.length !== 1 ? 's' : ''}
                        </h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                            {parsedLeads.map((lead, index) => (
                                <div key={index} className="text-sm p-2 bg-surface rounded border border-border flex justify-between">
                                    <span>
                                        <span className="font-medium text-text-primary">{lead.clientName}</span>
                                        <span className="text-text-secondary"> - {lead.projectName}</span>
                                    </span>
                                    <span className="text-xs font-bold text-primary">₹{lead.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Distribution Summary */}
                {distributionSummary && distributionSummary.totalMembers > 0 && (
                    <div className="bg-subtle-background border border-border rounded-lg p-4">
                        <h3 className="font-medium text-text-primary mb-3">Smart Distribution Preview</h3>
                        <p className="text-sm text-text-secondary mb-3">
                            Leads will be distributed among {distributionSummary.totalMembers} active team member{distributionSummary.totalMembers !== 1 ? 's' : ''}:
                        </p>
                        <div className="space-y-2">
                            {distributionSummary.assignments.map((assignment, index) => (
                                <div key={index} className="flex justify-between items-center text-sm p-2 bg-surface rounded">
                                    <div>
                                        <span className="font-medium text-text-primary">{assignment.userName}</span>
                                        <span className="text-xs text-text-secondary ml-2">(Login #{assignment.loginPosition})</span>
                                    </div>
                                    <span className="font-semibold text-primary">{assignment.assignedCount} lead{assignment.assignedCount !== 1 ? 's' : ''}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Active Members Warning */}
                {parsedLeads.length > 0 && sessions.length === 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-red-800">No Active Team Members</h4>
                            <p className="text-sm text-red-700 mt-1">
                                There are no sales team members currently logged in. Leads cannot be auto-assigned.
                            </p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-green-800">Import Successful!</h4>
                            <p className="text-sm text-green-700 mt-1">
                                {parsedLeads.length} leads have been imported and assigned to team members.
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 border border-border rounded-xl text-text-secondary font-bold hover:bg-subtle-background transition-colors"
                        disabled={importing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={parsedLeads.length === 0 || importing || sessions.length === 0}
                        className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-primary/20"
                    >
                        {importing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Importing Assets...
                            </>
                        ) : (
                            <>Initialize {parsedLeads.length} Lead{parsedLeads.length !== 1 ? 's' : ''}</>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default LeadImporter;
