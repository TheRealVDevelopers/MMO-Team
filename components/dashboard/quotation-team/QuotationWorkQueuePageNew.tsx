/**
 * PHASE 2: Quotation Work Queue Page - COMPLETE REBUILD
 * 
 * Features:
 * - LEFT: BOQ Viewer (pull latest from cases/{caseId}/boq)
 * - RIGHT: Quotation Builder with markup %, tax, internal PR code
 * - PR code visibility ONLY for Admin, Sales GM, Quotation user
 * - Submit to audit creates PROCUREMENT_AUDIT task
 * - Saves to cases/{caseId}/quotations with auditStatus='pending'
 * - Quotation History Panel showing all quotations with audit status
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import {
    collection,
    collectionGroup,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    getDocs,
    orderBy,
    getDoc
} from 'firebase/firestore';
import {
    CaseTask,
    TaskType,
    TaskStatus,
    Case,
    CaseStatus,
    UserRole,
    CaseBOQ,
    CaseQuotation,
    QuotationItemData
} from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import { generateQuotationPDF } from '../../../services/pdfGenerationService';
import {
    PlayIcon,
    DocumentTextIcon,
    CalculatorIcon,
    ClockIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

interface TaskWithCase extends CaseTask {
    projectName?: string;
    clientName?: string;
}

const QuotationWorkQueuePageNew: React.FC = () => {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState<TaskWithCase[]>([]);
    const [selectedTask, setSelectedTask] = useState<TaskWithCase | null>(null);
    const [latestBOQ, setLatestBOQ] = useState<CaseBOQ | null>(null);
    const [quotationHistory, setQuotationHistory] = useState<CaseQuotation[]>([]);
    
    // Quotation builder state
    const [quotationItems, setQuotationItems] = useState<QuotationItemData[]>([]);
    const [taxRate, setTaxRate] = useState(18);
    const [discount, setDiscount] = useState(0);
    const [prCode, setPrCode] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Check if user can see PR code
    const canSeePRCode = currentUser && [
        UserRole.ADMIN,
        UserRole.SALES_GENERAL_MANAGER,
        UserRole.QUOTATION_TEAM
    ].includes(currentUser.role as UserRole);

    // Load tasks for quotation team
    useEffect(() => {
        if (!db || !currentUser) return;

        const tasksQuery = query(
            collectionGroup(db, FIRESTORE_COLLECTIONS.TASKS),
            where('type', '==', TaskType.QUOTATION_TASK),
            where('assignedTo', '==', currentUser.id)
        );

        const unsubscribe = onSnapshot(tasksQuery, async (snapshot) => {
            const loadedTasks: TaskWithCase[] = [];

            for (const taskDoc of snapshot.docs) {
                const taskData = { id: taskDoc.id, ...taskDoc.data() } as CaseTask;

                // Get case data
                const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, taskData.caseId);
                const caseSnap = await getDoc(caseRef);

                if (caseSnap.exists()) {
                    const caseData = caseSnap.data() as Case;
                    loadedTasks.push({
                        ...taskData,
                        projectName: caseData.title,
                        clientName: caseData.clientName
                    });
                }
            }

            setTasks(loadedTasks);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Load BOQ when task is selected
    useEffect(() => {
        if (!db || !selectedTask) {
            setLatestBOQ(null);
            setQuotationHistory([]);
            return;
        }

        // Load latest BOQ
        const boqQuery = query(
            collection(db, FIRESTORE_COLLECTIONS.CASES, selectedTask.caseId, FIRESTORE_COLLECTIONS.BOQ),
            orderBy('createdAt', 'desc')
        );

        const unsubBOQ = onSnapshot(boqQuery, (snapshot) => {
            if (!snapshot.empty) {
                const boqData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CaseBOQ;
                setLatestBOQ(boqData);
                
                // Initialize quotation items from BOQ
                setQuotationItems(boqData.items.map(item => ({ ...item })));
            }
        });

        // Load quotation history
        const quotQuery = query(
            collection(db, FIRESTORE_COLLECTIONS.CASES, selectedTask.caseId, FIRESTORE_COLLECTIONS.QUOTATIONS),
            orderBy('createdAt', 'desc')
        );

        const unsubQuot = onSnapshot(quotQuery, (snapshot) => {
            const quots = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CaseQuotation[];
            setQuotationHistory(quots);
        });

        return () => {
            unsubBOQ();
            unsubQuot();
        };
    }, [selectedTask]);

    const handleStartTask = async (task: TaskWithCase) => {
        try {
            const taskRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS, task.id);
            await updateDoc(taskRef, {
                status: TaskStatus.STARTED,
                startedAt: serverTimestamp()
            });
            setSelectedTask({ ...task, status: TaskStatus.STARTED });
        } catch (error) {
            console.error('[Quotation] Error starting task:', error);
        }
    };

    const updateItemRate = (index: number, newRate: number) => {
        setQuotationItems(items => items.map((item, i) => {
            if (i === index) {
                return {
                    ...item,
                    rate: newRate,
                    total: item.quantity * newRate
                };
            }
            return item;
        }));
    };

    const subtotal = quotationItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
    const grandTotal = subtotalAfterDiscount + taxAmount;

    const handleSubmitToAudit = async () => {
        if (!selectedTask || quotationItems.length === 0) {
            alert('❌ Please ensure quotation has items');
            return;
        }

        setSubmitting(true);

        try {
            const caseRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, selectedTask.caseId);
            const caseSnap = await getDoc(caseRef);

            if (!caseSnap.exists()) {
                throw new Error('Case not found');
            }

            const caseData = caseSnap.data() as Case;

            // 1. Save quotation to cases/{caseId}/quotations (no undefined fields - Firestore rejects them)
            const quotationData: Record<string, unknown> = {
                caseId: selectedTask.caseId,
                boqId: latestBOQ?.id || '',
                items: quotationItems,
                subtotal,
                taxRate,
                taxAmount,
                discount,
                discountAmount,
                grandTotal,
                notes: notes || '',
                createdBy: currentUser!.id,
                createdAt: serverTimestamp(),
                auditStatus: 'pending',
                pdfUrl: ''
            };
            if (canSeePRCode && prCode) {
                quotationData.internalPRCode = prCode;
            }

            const quotRef = await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, selectedTask.caseId, FIRESTORE_COLLECTIONS.QUOTATIONS),
                quotationData
            );

            console.log('[Quotation] ✅ Quotation created:', quotRef.id);
            console.log('[Quotation] Collection path:', `cases/${selectedTask.caseId}/quotations`);
            console.log('[Quotation] Audit Status:', quotationData.auditStatus);
            console.log('[Quotation] Data:', quotationData);

            // 2. Generate PDF (without PR code); quotation doc already saved, update pdfUrl on success
            const quotWithId: CaseQuotation = {
                ...quotationData,
                id: quotRef.id
            } as CaseQuotation;

            try {
                const pdfUrl = await generateQuotationPDF(quotWithId, { ...caseData, id: selectedTask.caseId });
                if (pdfUrl) await updateDoc(quotRef, { pdfUrl });
                console.log('[Quotation] ✅ PDF generated:', pdfUrl);
            } catch (pdfErr) {
                console.error('[Quotation] PDF generation failed:', pdfErr);
                alert('Quotation saved successfully, but PDF generation failed. You can retry from quotation history.');
            }

            // 3. Update case status (use CaseStatus enum)
            await updateDoc(caseRef, {
                status: CaseStatus.QUOTATION,
                updatedAt: serverTimestamp()
            });

            // 4. Create PROCUREMENT_AUDIT task
            const procurementTeamId = (caseData as any).assignedProcurement || currentUser!.id;

            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, selectedTask.caseId, FIRESTORE_COLLECTIONS.TASKS),
                {
                    caseId: selectedTask.caseId,
                    type: TaskType.PROCUREMENT_AUDIT,
                    assignedTo: procurementTeamId,
                    assignedBy: currentUser!.id,
                    status: TaskStatus.PENDING,
                    startedAt: null,
                    completedAt: null,
                    notes: 'Audit quotation before admin approval',
                    createdAt: serverTimestamp()
                }
            );

            // 5. Complete quotation task
            const taskRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, selectedTask.caseId, FIRESTORE_COLLECTIONS.TASKS, selectedTask.id);
            await updateDoc(taskRef, {
                status: TaskStatus.COMPLETED,
                completedAt: serverTimestamp()
            });

            // 6. Log activity
            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, selectedTask.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId: selectedTask.caseId,
                    action: `Quotation submitted to audit (₹${grandTotal.toLocaleString('en-IN')})`,
                    by: currentUser!.id,
                    timestamp: serverTimestamp()
                }
            );

            alert('✅ Quotation submitted to procurement audit successfully!');
            setSelectedTask(null);
            setQuotationItems([]);
            setPrCode('');
            setNotes('');
        } catch (error) {
            console.error('[Quotation] Error:', error);
            alert('Failed to submit quotation. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Task List View
    if (!selectedTask) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Quotation Work Queue</h1>
                    <p className="text-gray-600 mt-2">Select a task to create quotation</p>
                </div>

                <div className="grid gap-4">
                    {tasks.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500">No quotation tasks assigned</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div
                                key={task.id}
                                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900">{task.projectName}</h3>
                                        <p className="text-gray-600 mt-1">Client: {task.clientName}</p>
                                        <div className="flex items-center gap-4 mt-3">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                task.status === TaskStatus.PENDING
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {task.status === TaskStatus.PENDING ? (
                                                    <><ClockIcon className="w-4 h-4 inline mr-1" />Pending</>
                                                ) : (
                                                    <><PlayIcon className="w-4 h-4 inline mr-1" />Started</>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (task.status === TaskStatus.PENDING) {
                                                handleStartTask(task);
                                            } else {
                                                setSelectedTask(task);
                                            }
                                        }}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium"
                                    >
                                        {task.status === TaskStatus.PENDING ? 'Start Task' : 'Continue'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // Quotation Builder View
    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-md p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{selectedTask.projectName}</h1>
                        <p className="text-gray-600">Client: {selectedTask.clientName}</p>
                    </div>
                    <button
                        onClick={() => setSelectedTask(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        ← Back to Queue
                    </button>
                </div>
            </div>

            {/* Main Content - Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: BOQ Viewer */}
                <div className="w-1/2 border-r border-gray-300 overflow-y-auto p-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                            <DocumentTextIcon className="w-6 h-6" />
                            Bill of Quantities
                        </h2>

                        {!latestBOQ ? (
                            <div className="text-center py-8 text-gray-500">
                                No BOQ found for this project
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-sm text-gray-600">
                                    <p>BOQ ID: {latestBOQ.id.slice(-8).toUpperCase()}</p>
                                    <p>Created: {new Date(latestBOQ.createdAt).toLocaleDateString('en-IN')}</p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-purple-100">
                                            <tr>
                                                <th className="p-2 text-left">#</th>
                                                <th className="p-2 text-left">Item</th>
                                                <th className="p-2 text-right">Qty</th>
                                                <th className="p-2 text-center">Unit</th>
                                                <th className="p-2 text-right">Rate</th>
                                                <th className="p-2 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {latestBOQ.items.map((item, index) => (
                                                <tr key={index} className="border-b">
                                                    <td className="p-2">{index + 1}</td>
                                                    <td className="p-2 font-medium">{item.name}</td>
                                                    <td className="p-2 text-right">{item.quantity}</td>
                                                    <td className="p-2 text-center">{item.unit}</td>
                                                    <td className="p-2 text-right">₹{item.rate.toLocaleString('en-IN')}</td>
                                                    <td className="p-2 text-right font-bold">₹{item.total.toLocaleString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-purple-50 font-bold">
                                                <td colSpan={5} className="p-2 text-right">Subtotal:</td>
                                                <td className="p-2 text-right text-purple-700">
                                                    ₹{latestBOQ.subtotal.toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Quotation History */}
                        {quotationHistory.length > 0 && (
                            <div className="mt-8 pt-6 border-t">
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Quotation History</h3>
                                <div className="space-y-2">
                                    {quotationHistory.map(quot => (
                                        <div key={quot.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                                            <div>
                                                <p className="font-medium">{new Date(quot.createdAt).toLocaleDateString('en-IN')}</p>
                                                <p className="text-gray-600">₹{quot.grandTotal.toLocaleString('en-IN')}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                quot.auditStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                quot.auditStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {quot.auditStatus.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Quotation Builder */}
                <div className="w-1/2 overflow-y-auto p-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
                            <CalculatorIcon className="w-6 h-6" />
                            Quotation Builder
                        </h2>

                        {/* Paste all from BOQ - one click to copy all BOQ items; quotation team only adds pricing */}
                        {latestBOQ && latestBOQ.items?.length > 0 && (
                            <div className="mb-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuotationItems(
                                            latestBOQ.items.map((item: any) => ({
                                                name: item.name,
                                                quantity: item.quantity ?? 0,
                                                unit: item.unit || 'pcs',
                                                rate: 0,
                                                total: 0,
                                                catalogItemId: item.catalogItemId,
                                            }))
                                        );
                                    }}
                                    className="px-4 py-2 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg hover:bg-indigo-200 font-medium text-sm"
                                >
                                    Paste all from BOQ
                                </button>
                                <p className="text-xs text-gray-500 mt-1">Adds all BOQ items with quantity; you only need to enter rate per item.</p>
                            </div>
                        )}

                        {/* Items Table */}
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-900 mb-3">Items</h3>
                            <div className="space-y-2">
                                {quotationItems.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 border rounded">
                                        <div className="col-span-5 text-sm font-medium">{item.name}</div>
                                        <div className="col-span-2 text-sm text-center">{item.quantity} {item.unit}</div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                value={item.rate}
                                                onChange={(e) => updateItemRate(index, parseFloat(e.target.value) || 0)}
                                                className="w-full px-2 py-1 border rounded text-sm"
                                                placeholder="Rate"
                                            />
                                        </div>
                                        <div className="col-span-3 text-right text-sm font-bold text-indigo-700">
                                            ₹{item.total.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="mb-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Discount (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        GST (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span className="font-medium">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span>Discount ({discount}%):</span>
                                    <span className="font-medium">-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>GST ({taxRate}%):</span>
                                    <span className="font-medium">₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t-2 text-lg font-bold text-indigo-700">
                                    <span>Grand Total:</span>
                                    <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* PR Code (Restricted Visibility) */}
                        {canSeePRCode && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Internal PR Code (Admin/Sales GM Only) 🔒
                                </label>
                                <input
                                    type="text"
                                    value={prCode}
                                    onChange={(e) => setPrCode(e.target.value)}
                                    placeholder="e.g., IS2/IS3"
                                    className="w-full px-3 py-2 border rounded-lg bg-yellow-50"
                                />
                            </div>
                        )}

                        {/* Notes */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Additional notes..."
                            />
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmitToAudit}
                            disabled={submitting || quotationItems.length === 0}
                            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-bold text-lg disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : '✓ Submit to Audit'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationWorkQueuePageNew;
