import React, { useState } from 'react';
import CreateBOQModal from './CreateBOQModal';
import { 
    doc, 
    updateDoc, 
    addDoc, 
    collection, 
    serverTimestamp,
    getDoc,
    Timestamp 
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { TaskStatus, TaskType, Case } from '../../../types';
import { XMarkIcon, DocumentArrowUpIcon, TableCellsIcon } from '@heroicons/react/24/outline';

interface DrawingCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: any;
    currentUser: any;
}

interface BOQItem {
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
}

const DrawingCompletionModal: React.FC<DrawingCompletionModalProps> = ({
    isOpen,
    onClose,
    task,
    currentUser
}) => {
    const [showBOQModal, setShowBOQModal] = useState(false);
    const [boqCreated, setBOQCreated] = useState(false);
    const [file2D, setFile2D] = useState<File | null>(null);
    const [filePDF, setFilePDF] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleCreateBOQ = () => {
        setShowBOQModal(true);
    };

    const handleBOQCreated = () => {
        setBOQCreated(true);
        setShowBOQModal(false);
        alert('✅ BOQ created successfully! You can now optionally upload drawings and complete the task.');
    };

    const handleCompleteTask = async () => {
        if (!boqCreated) {
            alert('❌ BOQ is mandatory! Please create BOQ first.');
            return;
        }

        setSubmitting(true);
        try {
            // Complete drawing task
            const taskRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS, task.id);
            await updateDoc(taskRef, {
                status: TaskStatus.COMPLETED,
                completedAt: serverTimestamp()
            });

            // Update case status
            const caseRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId);
            await updateDoc(caseRef, {
                status: 'BOQ_COMPLETED',
                updatedAt: serverTimestamp()
            });

            // If files were uploaded, save them to documents
            if (file2D || filePDF) {
                const drawingDoc = {
                    type: 'DRAWING',
                    caseId: task.caseId,
                    taskId: task.id,
                    uploadedBy: currentUser.id,
                    uploadedAt: serverTimestamp(),
                    files: {
                        has2D: file2D !== null,
                        hasPDF: filePDF !== null,
                        file2DName: file2D?.name || null,
                        filePDFName: filePDF?.name || null
                    }
                };

                await addDoc(
                    collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, 'documents'),
                    drawingDoc
                );
            }

            console.log('[Drawing] ✅ Task completed, BOQ created, Quotation task assigned');
            alert('✅ Drawing task completed successfully!');
            onClose();
        } catch (error) {
            console.error('[Drawing] Error:', error);
            alert('Failed to complete drawing task.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-2xl">
                        <h2 className="text-2xl font-bold">Complete Drawing Task</h2>
                        <p className="text-indigo-100 text-sm mt-1">BOQ is mandatory, drawings are optional</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* 1. BOQ - MANDATORY */}
                        <div className={`p-5 rounded-xl border-2 ${
                            boqCreated ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">
                                        1. Bill of Quantities (BOQ) 
                                        <span className="text-red-600 ml-2">*MANDATORY*</span>
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Create BOQ with items, quantities, and units
                                    </p>
                                </div>
                                {boqCreated ? (
                                    <div className="text-green-600 font-bold flex items-center gap-2">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        BOQ Created
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleCreateBOQ}
                                        className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                                    >
                                        Create BOQ
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2. 2D Drawing - OPTIONAL */}
                        <div className="p-5 bg-gray-50 rounded-xl border border-gray-300">
                            <h3 className="font-bold text-gray-900 text-lg mb-3">
                                2. 2D Drawing File <span className="text-gray-500 text-sm">(Optional)</span>
                            </h3>
                            <input
                                type="file"
                                accept=".dwg,.dxf,.pdf"
                                onChange={(e) => setFile2D(e.target.files?.[0] || null)}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            {file2D && (
                                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {file2D.name}
                                </p>
                            )}
                        </div>

                        {/* 3. PDF Drawing - OPTIONAL */}
                        <div className="p-5 bg-gray-50 rounded-xl border border-gray-300">
                            <h3 className="font-bold text-gray-900 text-lg mb-3">
                                3. PDF Drawing <span className="text-gray-500 text-sm">(Optional)</span>
                            </h3>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setFilePDF(e.target.files?.[0] || null)}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            />
                            {filePDF && (
                                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {filePDF.name}
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-end pt-4 border-t">
                            <button
                                onClick={onClose}
                                disabled={submitting}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCompleteTask}
                                disabled={!boqCreated || submitting}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Completing...' : '✓ Complete Drawing Task'}
                            </button>
                        </div>

                        {!boqCreated && (
                            <p className="text-red-600 text-sm text-center">
                                ⚠️ Please create BOQ before completing the task
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* BOQ Creation Modal */}
            <CreateBOQModal
                isOpen={showBOQModal}
                onClose={() => {
                    setShowBOQModal(false);
                }}
                onBOQCreated={handleBOQCreated}
                caseId={task.caseId}
                currentUser={currentUser}
            />
        </>
    );
};

export default DrawingCompletionModal;
