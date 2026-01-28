import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CloudArrowUpIcon, DocumentTextIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format, addHours, differenceInHours } from 'date-fns';
import { useToast } from '../../shared/toast/ToastProvider';
import { uploadToStorage } from '../../../services/storageService';

interface RECCEDrawingUploadProps {
    leadId: string;
    siteVisitCompletedAt: Date;
    onUploadComplete: (fileUrl: string, fileName: string) => void;
}

const RECCEDrawingUpload: React.FC<RECCEDrawingUploadProps> = ({ leadId, siteVisitCompletedAt, onUploadComplete }) => {
    const toast = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Calculate Deadline
    const calculateDeadline = () => {
        const completionHour = siteVisitCompletedAt.getHours();
        // If before 2 PM (14:00), deadline is 12 hours. Else 24 hours.
        const hoursToAdd = completionHour < 14 ? 12 : 24;
        return addHours(siteVisitCompletedAt, hoursToAdd);
    };

    const deadline = calculateDeadline();
    const hoursRemaining = differenceInHours(deadline, new Date());
    const isOverdue = hoursRemaining < 0;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
        } else {
            toast.error('Please select a valid PDF file.');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const safeName = file.name.replace(/[^\w.\-() ]+/g, '_');
            const storagePath = `projects/${leadId}/recce/${Date.now()}-${safeName}`;
            const result = await uploadToStorage({
                path: storagePath,
                file,
                onProgress: setUploadProgress,
            });
            toast.success('RECCE drawing uploaded.');
            onUploadComplete(result.url, result.name);
            setFile(null);
        } catch (err) {
            console.error('RECCE upload failed:', err);
            toast.error('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upload RECCE Drawing</h3>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                    <ClockIcon className="w-4 h-4" />
                    <span>
                        {isOverdue ? 'Overdue by ' + Math.abs(hoursRemaining) + 'h' : hoursRemaining + 'h remaining'}
                    </span>
                </div>
            </div>

            <div className="mb-4 text-sm text-gray-500">
                Deadline: <span className="font-medium">{format(deadline, 'PP p')}</span>
            </div>

            {!file ? (
                <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">
                        Click or drag PDF here to upload
                    </p>
                    <p className="text-xs text-gray-400">PDF files up to 10MB</p>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <DocumentTextIcon className="w-8 h-8 text-red-500" />
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                                {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    </div>
                    {!isUploading && (
                        <button
                            onClick={() => setFile(null)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full"
                        >
                            <XMarkIcon className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>
            )}

            {isUploading && (
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Uploading...</span>
                        <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {file && !isUploading && (
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleUpload}
                        className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-secondary transition-colors shadow-lg shadow-primary/20"
                    >
                        Submit Drawing
                    </button>
                </div>
            )}
        </div>
    );
};

export default RECCEDrawingUpload;
