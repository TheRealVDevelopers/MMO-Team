import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CloudArrowDownIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { fetchJustDialLeads, importJustDialLeadsToFirestore, isJustDialConfigured } from '../../../services/justDialService';

interface JustDialImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: () => void;
}

type ImportStatus = 'idle' | 'checking' | 'fetching' | 'importing' | 'complete' | 'error';

const JustDialImportModal: React.FC<JustDialImportModalProps> = ({ isOpen, onClose, onImportComplete }) => {
    const [status, setStatus] = useState<ImportStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
    const [isConfigured, setIsConfigured] = useState(false);

    useEffect(() => {
        if (isOpen) {
            checkConfiguration();
        }
    }, [isOpen]);

    const checkConfiguration = async () => {
        setStatus('checking');
        setError(null);
        
        try {
            const configured = await isJustDialConfigured();
            setIsConfigured(configured);
            
            if (!configured) {
                setError('Just Dial integration is not configured. Please contact your administrator to set up the API key.');
                setStatus('error');
            } else {
                setStatus('idle');
            }
        } catch (err) {
            setError('Failed to check configuration. Please try again.');
            setStatus('error');
        }
    };

    const handleImport = async () => {
        setStatus('fetching');
        setError(null);
        setProgress({ current: 0, total: 0 });
        setResult(null);

        try {
            // Fetch leads from Just Dial
            const justDialLeads = await fetchJustDialLeads();
            
            if (justDialLeads.length === 0) {
                setError('No new leads found in Just Dial.');
                setStatus('complete');
                return;
            }

            // Import to Firestore
            setStatus('importing');
            setProgress({ current: 0, total: justDialLeads.length });

            const importResult = await importJustDialLeadsToFirestore(
                justDialLeads,
                (current, total) => {
                    setProgress({ current, total });
                }
            );

            setResult(importResult);
            setStatus('complete');

            if (importResult.success > 0) {
                setTimeout(() => {
                    onImportComplete();
                }, 2000);
            }
        } catch (err: any) {
            console.error('Import error:', err);
            setError(err.message || 'Failed to import leads. Please try again.');
            setStatus('error');
        }
    };

    const handleClose = () => {
        if (status === 'fetching' || status === 'importing') {
            return; // Prevent closing during import
        }
        onClose();
        // Reset after animation
        setTimeout(() => {
            setStatus('idle');
            setError(null);
            setProgress({ current: 0, total: 0 });
            setResult(null);
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <CloudArrowDownIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import from Just Dial</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Fetch and import new leads</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={status === 'fetching' || status === 'importing'}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Error State */}
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                                        {!isConfigured && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                                Please go to Settings → Just Dial Integration to configure the API key.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Status Messages */}
                        <div className="space-y-4">
                            {status === 'checking' && (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">Checking configuration...</p>
                                </div>
                            )}

                            {status === 'fetching' && (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-gray-900 dark:text-white font-medium">Fetching leads from Just Dial...</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait</p>
                                </div>
                            )}

                            {status === 'importing' && (
                                <div className="py-8">
                                    <div className="text-center mb-4">
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            Importing leads {progress.current} of {progress.total}
                                        </p>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                        />
                                    </div>
                                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        {Math.round((progress.current / progress.total) * 100)}% complete
                                    </p>
                                </div>
                            )}

                            {status === 'complete' && result && (
                                <div className="py-6">
                                    <div className="flex items-center justify-center mb-4">
                                        <CheckCircleIcon className="w-16 h-16 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-4">
                                        Import Complete!
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Successfully imported:</span>
                                            <span className="font-semibold text-green-600 dark:text-green-400">{result.success} leads</span>
                                        </div>
                                        {result.failed > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Failed:</span>
                                                <span className="font-semibold text-red-600 dark:text-red-400">{result.failed} leads</span>
                                            </div>
                                        )}
                                    </div>
                                    {result.errors.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Errors:</p>
                                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 max-h-40 overflow-y-auto text-xs text-red-700 dark:text-red-300 space-y-1">
                                                {result.errors.map((err, idx) => (
                                                    <div key={idx}>• {err}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-4">
                                        Imported leads are now available in your lead management system
                                    </p>
                                </div>
                            )}

                            {status === 'idle' && isConfigured && (
                                <div className="py-6 text-center">
                                    <CloudArrowDownIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                                        Click the button below to fetch and import new leads from Just Dial
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                        This will import all new leads from your Just Dial account
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                        {status === 'idle' && isConfigured && (
                            <>
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
                                >
                                    Import Leads
                                </button>
                            </>
                        )}
                        {status === 'complete' && (
                            <button
                                onClick={handleClose}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
                            >
                                Done
                            </button>
                        )}
                        {status === 'error' && (
                            <button
                                onClick={handleClose}
                                className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default JustDialImportModal;
