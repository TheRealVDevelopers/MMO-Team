import React, { useState } from 'react';
import { useCaseDocuments } from '../../../hooks/useCaseDocuments'; // Adjust path if needed
import { useAuth } from '../../../context/AuthContext';
import { UserRole, DocumentType } from '../../../types';
import { XMarkIcon, CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline'; // Adjust icons
import { PrimaryButton, SecondaryButton } from '../shared/DashboardUI'; // Adjust UI components

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseId: string;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose, caseId }) => {
    const { currentUser } = useAuth();
    const { uploadFileWithStorage } = useCaseDocuments({ caseId });

    const [file, setFile] = useState<File | null>(null);
    const [docType, setDocType] = useState<DocumentType>(DocumentType.PDF);
    const [visibleToClient, setVisibleToClient] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !currentUser) {
            setError('Please select a file.');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // Determine auto-approval based on role
            const canAutoApprove = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_HEAD].includes(currentUser.role);
            const approvalStatus = canAutoApprove ? 'approved' : 'pending';
            const approvedBy = canAutoApprove ? currentUser.id : undefined;
            const approvedAt = canAutoApprove ? new Date() : undefined;


            await uploadFileWithStorage(
                file,
                docType,
                currentUser.id,
                {
                    visibleToClient,
                    approvalStatus,
                    approvedBy,
                    approvedAt
                }
            );

            onClose();
            setFile(null); // Reset
            setVisibleToClient(false);
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || 'Failed to upload document.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">Upload Document</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* File Drop Zone / Input */}
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer relative">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {file ? (
                            <div className="flex flex-col items-center">
                                <DocumentIcon className="w-10 h-10 text-primary mb-2" />
                                <p className="text-sm font-medium text-gray-900 truncate max-w-full px-4">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <CloudArrowUpIcon className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-600">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-400">PDF, Images, Excel, etc.</p>
                            </div>
                        )}
                    </div>

                    {/* Doc Type Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Document Type</label>
                        <select
                            value={docType}
                            onChange={(e) => setDocType(e.target.value as DocumentType)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                        >
                            <option value={DocumentType.PDF}>PDF Document</option>
                            <option value={DocumentType.IMAGE}>Image</option>
                            <option value={DocumentType.TWO_D}>2D Drawing</option>
                            <option value={DocumentType.THREE_D}>3D Render</option>
                            <option value={DocumentType.BOQ}>BOQ</option>
                            <option value={DocumentType.QUOTATION}>Quotation</option>
                            <option value={DocumentType.RECCE}>Recce Report</option>
                        </select>
                    </div>

                    {/* Visibility Toggle */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Visible to Client</p>
                            <p className="text-xs text-gray-500">Show this document in client portal</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={visibleToClient}
                                onChange={(e) => setVisibleToClient(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
                            {error}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <SecondaryButton onClick={onClose} disabled={isUploading}>Cancel</SecondaryButton>
                    <PrimaryButton onClick={handleUpload} disabled={isUploading || !file}>
                        {isUploading ? 'Uploading...' : 'Upload Document'}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
};

export default DocumentUploadModal;
