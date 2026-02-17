import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { useCatalog } from '../../../hooks/useCatalog';
import {
    collectionGroup,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp,
    Timestamp,
    getDoc,
    getDocs
} from 'firebase/firestore';
import {
    CaseTask,
    TaskType,
    TaskStatus,
    Case,
    UserRole
} from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../constants';
import {
    ClockIcon,
    CheckCircleIcon,
    PlayIcon,
    CalculatorIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface TaskWithCase extends CaseTask {
    projectName?: string;
    clientName?: string;
    boqItems?: any[];
}

interface QuotationItem {
    id: string;
    itemName: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
}

const QuotationWorkQueuePage: React.FC = () => {
    const { currentUser } = useAuth();
    const [quotationTasks, setQuotationTasks] = useState<TaskWithCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
    const [selectedTask, setSelectedTask] = useState<TaskWithCase | null>(null);
    const [showQuotationModal, setShowQuotationModal] = useState(false);

    // Fetch quotation tasks
    useEffect(() => {
        if (!db || !currentUser) {
            setLoading(false);
            return;
        }

        console.log('[Quotation Queue] Setting up listener for user:', currentUser.id);

        const quotationQuery = query(
            collectionGroup(db, FIRESTORE_COLLECTIONS.TASKS),
            where('assignedTo', '==', currentUser.id),
            where('type', '==', TaskType.QUOTATION_TASK)
        );

        const unsubscribe = onSnapshot(quotationQuery, async (snapshot) => {
            console.log('[Quotation Queue] Received', snapshot.docs.length, 'quotation tasks');

            const tasksData: TaskWithCase[] = [];

            for (const taskDoc of snapshot.docs) {
                const taskData = taskDoc.data() as CaseTask;

                let projectName = 'Unknown Project';
                let clientName = 'N/A';
                let boqItems: any[] = [];

                try {
                    // Get case data
                    const caseDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.CASES, taskData.caseId));
                    if (caseDoc.exists()) {
                        const caseData = caseDoc.data() as Case;
                        projectName = caseData.title || projectName;
                        clientName = caseData.clientName || clientName;
                    }

                    // Get BOQ from documents
                    const docsSnapshot = await getDocs(
                        collection(db, FIRESTORE_COLLECTIONS.CASES, taskData.caseId, 'documents')
                    );

                    docsSnapshot.docs.forEach(docSnapshot => {
                        const docData = docSnapshot.data();
                        if (docData.type === 'DRAWING' && docData.boq) {
                            boqItems = docData.boq;
                        }
                    });
                } catch (err) {
                    console.error('[Quotation Queue] Error fetching case/BOQ:', err);
                }

                const task: TaskWithCase = {
                    ...taskData,
                    id: taskDoc.id,
                    projectName,
                    clientName,
                    boqItems,
                    createdAt: taskData.createdAt instanceof Timestamp
                        ? taskData.createdAt.toDate()
                        : new Date(taskData.createdAt),
                    deadline: taskData.deadline instanceof Timestamp
                        ? taskData.deadline.toDate()
                        : taskData.deadline ? new Date(taskData.deadline) : undefined,
                    startedAt: taskData.startedAt instanceof Timestamp
                        ? taskData.startedAt.toDate()
                        : taskData.startedAt ? new Date(taskData.startedAt) : undefined,
                    completedAt: taskData.completedAt instanceof Timestamp
                        ? taskData.completedAt.toDate()
                        : taskData.completedAt ? new Date(taskData.completedAt) : undefined
                };

                tasksData.push(task);
            }

            setQuotationTasks(tasksData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const filteredTasks = useMemo(() => {
        let filtered = [...quotationTasks];

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.projectName?.toLowerCase().includes(query) ||
                t.clientName?.toLowerCase().includes(query)
            );
        }

        return filtered.sort((a, b) => {
            const statusOrder = {
                [TaskStatus.STARTED]: 1,
                [TaskStatus.PENDING]: 2,
                [TaskStatus.COMPLETED]: 3
            };
            return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
        });
    }, [quotationTasks, statusFilter, searchQuery]);

    const taskSummary = useMemo(() => ({
        pending: quotationTasks.filter(t => t.status === TaskStatus.PENDING).length,
        inProgress: quotationTasks.filter(t => t.status === TaskStatus.STARTED).length,
        completed: quotationTasks.filter(t => t.status === TaskStatus.COMPLETED).length
    }), [quotationTasks]);

    const handleStartTask = async (task: TaskWithCase) => {
        try {
            const taskRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS, task.id);

            await updateDoc(taskRef, {
                status: TaskStatus.STARTED,
                startedAt: serverTimestamp()
            });

            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId: task.caseId,
                    action: `Quotation task started by ${currentUser!.name || currentUser!.email}`,
                    by: currentUser!.id,
                    timestamp: serverTimestamp()
                }
            );

            console.log('[Quotation Queue] ✅ Task started');
        } catch (error) {
            console.error('[Quotation Queue] Error starting task:', error);
            alert('Failed to start task. Please try again.');
        }
    };

    const handleOpenQuotationBuilder = (task: TaskWithCase) => {
        setSelectedTask(task);
        setShowQuotationModal(true);
    };

    const handleEndTask = async (task: TaskWithCase) => {
        if (!db || !currentUser) return;
        try {
            const taskRef = doc(db, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS, task.id);
            await updateDoc(taskRef, {
                status: TaskStatus.COMPLETED,
                completedAt: serverTimestamp()
            });
            await addDoc(
                collection(db, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId: task.caseId,
                    action: `Quotation task completed by ${currentUser.name || currentUser.email}`,
                    by: currentUser.id,
                    timestamp: serverTimestamp()
                }
            );
        } catch (error) {
            console.error('[Quotation Queue] Error ending task:', error);
            alert('Failed to end task. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading quotation tasks...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotation Work Queue</h1>
                <p className="text-gray-600">Create quotations from approved BOQs</p>
            </div>

            {/* Filters */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value={TaskStatus.PENDING}>Pending</option>
                            <option value={TaskStatus.STARTED}>In Progress</option>
                            <option value={TaskStatus.COMPLETED}>Completed</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                placeholder="Search by project or client..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <ClockIcon className="w-8 h-8 text-yellow-600" />
                        <div>
                            <p className="text-3xl font-bold text-yellow-900">{taskSummary.pending}</p>
                            <p className="text-sm font-medium text-yellow-700 uppercase">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <PlayIcon className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-3xl font-bold text-green-900">{taskSummary.inProgress}</p>
                            <p className="text-sm font-medium text-green-700 uppercase">In Progress</p>
                        </div>
                    </div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <CheckCircleIcon className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-3xl font-bold text-blue-900">{taskSummary.completed}</p>
                            <p className="text-sm font-medium text-blue-700 uppercase">Completed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
                        <p className="text-gray-500">No quotation tasks</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <QuotationTaskCard
                            key={task.id}
                            task={task}
                            onStart={handleStartTask}
                            onEndTask={handleEndTask}
                            onOpenBuilder={handleOpenQuotationBuilder}
                        />
                    ))
                )}
            </div>

            {/* Quotation Builder Modal */}
            {selectedTask && showQuotationModal && (
                <QuotationBuilderModal
                    isOpen={showQuotationModal}
                    onClose={() => {
                        setShowQuotationModal(false);
                        setSelectedTask(null);
                    }}
                    task={selectedTask}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

// Quotation Task Card Component
const QuotationTaskCard: React.FC<{
    task: TaskWithCase;
    onStart: (task: TaskWithCase) => void;
    onEndTask: (task: TaskWithCase) => void;
    onOpenBuilder: (task: TaskWithCase) => void;
}> = ({ task, onStart, onEndTask, onOpenBuilder }) => {
    const statusConfig = {
        [TaskStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'PENDING' },
        [TaskStatus.STARTED]: { color: 'bg-green-100 text-green-800 border-green-300', label: 'IN PROGRESS' },
        [TaskStatus.COMPLETED]: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'COMPLETED' }
    };

    const config = statusConfig[task.status];

    return (
        <div className="border-2 border-gray-200 rounded-xl p-6 bg-white hover:border-green-400 transition-all">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{task.projectName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                            {config.label}
                        </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Client:</span> {task.clientName}</p>
                        <p><span className="font-medium">BOQ Items:</span> {task.boqItems?.length || 0}</p>
                        {task.createdAt && (
                            <p><span className="font-medium">Created:</span> {task.createdAt.toLocaleDateString()}</p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    {task.status === TaskStatus.PENDING && (
                        <button
                            onClick={() => onStart(task)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                        >
                            <PlayIcon className="w-5 h-5" />
                            Start Task
                        </button>
                    )}

                    {task.status === TaskStatus.STARTED && (
                        <button
                            onClick={() => onEndTask(task)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                            End Task
                        </button>
                    )}

                    {task.status === TaskStatus.COMPLETED && (
                        <div className="px-6 py-3 bg-blue-100 text-blue-800 rounded-lg flex items-center gap-2 font-medium">
                            <CheckCircleIcon className="w-5 h-5" />
                            Completed
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Quotation Builder Modal Component
const QuotationBuilderModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    task: TaskWithCase;
    currentUser: any;
}> = ({ isOpen, onClose, task, currentUser }) => {
    const { items: catalogItems } = useCatalog();
    const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
    const [showCatalogModal, setShowCatalogModal] = useState(false);
    const [taxRate, setTaxRate] = useState<number>(18); // Default GST 18%
    const [discount, setDiscount] = useState<number>(0);
    const [pr1, setPr1] = useState<number>(0);
    const [pr2, setPr2] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    // PR visible only to Super Admin, Sales Manager, Quotation Team (not Client, Procurement, Execution, etc.)
    const canSeePR = [
        UserRole.SUPER_ADMIN,
        UserRole.SALES_GENERAL_MANAGER,
        UserRole.QUOTATION_TEAM
    ].includes(currentUser?.role);

    useEffect(() => {
        if (isOpen && task.boqItems && task.boqItems.length > 0) {
            // Initialize quotation items from BOQ
            const items = task.boqItems.map((boqItem, index) => ({
                id: (index + 1).toString(),
                itemName: boqItem.itemName || '',
                quantity: boqItem.quantity || 0,
                unit: boqItem.unit || 'pcs',
                rate: 0,
                amount: 0
            }));
            setQuotationItems(items);
        }
    }, [isOpen, task]);

    const updateItem = (id: string, field: keyof QuotationItem, value: any) => {
        setQuotationItems(items => items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'rate' || field === 'quantity') {
                    updated.amount = updated.rate * updated.quantity;
                }
                return updated;
            }
            return item;
        }));
    };

    const addItemsFromCatalog = (selectedItems: any[]) => {
        const newItems = selectedItems.map((catItem, index) => ({
            id: Date.now().toString() + index,
            itemName: catItem.name,
            quantity: 1,
            unit: catItem.unit || 'pcs',
            rate: catItem.price || 0,
            amount: catItem.price || 0
        }));
        setQuotationItems([...quotationItems, ...newItems]);
        setShowCatalogModal(false);
    };

    const removeItem = (id: string) => {
        setQuotationItems(items => items.filter(item => item.id !== id));
    };

    const subtotal = quotationItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const totalAmount = taxableAmount + taxAmount;

    const handleSubmit = async () => {
        if (quotationItems.length === 0) {
            alert('❌ Please add at least one item');
            return;
        }

        if (quotationItems.some(item => item.rate <= 0)) {
            alert('❌ Please set rates for all items');
            return;
        }

        setSubmitting(true);

        try {
            const taskRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS, task.id);
            const caseRef = doc(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId);

            // 1) Write to quotations subcollection FIRST so Procurement Audit page can list it (auditStatus='pending')
            const quotationForAudit: Record<string, unknown> = {
                caseId: task.caseId,
                boqId: '',
                items: quotationItems.map((item) => ({
                    itemName: String(item.itemName ?? ''),
                    quantity: Number(item.quantity) || 0,
                    unit: String(item.unit ?? 'pcs'),
                    rate: Number(item.rate) || 0,
                    total: Number(item.amount ?? item.quantity * item.rate) || 0,
                })),
                subtotal: Number(subtotal) || 0,
                taxRate: Number(taxRate) || 0,
                taxAmount: Number(taxAmount) || 0,
                discount: Number(discount) || 0,
                discountAmount: Number(discountAmount) || 0,
                grandTotal: Number(totalAmount) || 0,
                notes: String(notes ?? ''),
                createdBy: currentUser.id,
                createdAt: serverTimestamp(),
                auditStatus: 'pending',
                pdfUrl: '',
                ...(canSeePR && (pr1 > 0 || pr2 > 0)
                    ? {
                          prRatio: `PR1: ₹${Number(pr1).toLocaleString('en-IN', { minimumFractionDigits: 2 })} | PR2: ₹${Number(pr2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                          pr1: Number(pr1),
                          pr2: Number(pr2),
                      }
                    : {}),
            };
            const quotRef = await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.QUOTATIONS),
                quotationForAudit
            );
            console.log('[Quotation] Written to cases/' + task.caseId + '/quotations/' + quotRef.id + ' (auditStatus=pending) – should appear in Procurement Audit');

            // 2) Update case status to QUOTATION_SUBMITTED
            await updateDoc(caseRef, {
                status: 'QUOTATION_SUBMITTED',
                updatedAt: serverTimestamp()
            });

            // 3) Save quotation as DRAFT document (without PR) - not visible to client until approved
            const quotationDoc = {
                type: 'QUOTATION_DRAFT',
                caseId: task.caseId,
                taskId: task.id,
                createdBy: currentUser.id,
                createdAt: serverTimestamp(),
                visibleToClient: false,
                items: quotationItems,
                subtotal,
                discount,
                discountAmount,
                taxRate,
                taxAmount,
                totalAmount,
                notes: notes ?? '',
                status: 'PENDING_AUDIT'
            };

            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, 'documents'),
                quotationDoc
            );

            // Save internal pricing separately
            if (canSeePR && (pr1 > 0 || pr2 > 0)) {
                await updateDoc(caseRef, {
                    internalPricing: {
                        pr1,
                        pr2,
                        updatedBy: currentUser.id,
                        updatedAt: serverTimestamp()
                    }
                });
            }

            // Create PROCUREMENT_AUDIT task for procurement team
            const caseDoc = await getDoc(caseRef);
            if (caseDoc.exists()) {
                const caseData = caseDoc.data() as Case;
                const procurementTeamId = (caseData as any).assignedProcurement || currentUser.id;

                await addDoc(
                    collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.TASKS),
                    {
                        caseId: task.caseId,
                        type: TaskType.PROCUREMENT_AUDIT,
                        assignedTo: procurementTeamId,
                        assignedBy: currentUser.id,
                        status: TaskStatus.PENDING,
                        startedAt: null,
                        completedAt: null,
                        notes: 'Audit quotation before admin approval',
                        createdAt: serverTimestamp()
                    }
                );
            }

            // Complete quotation task (quotation team's work is done)
            await updateDoc(taskRef, {
                status: TaskStatus.COMPLETED,
                completedAt: serverTimestamp()
            });

            // Log activity
            await addDoc(
                collection(db!, FIRESTORE_COLLECTIONS.CASES, task.caseId, FIRESTORE_COLLECTIONS.ACTIVITIES),
                {
                    caseId: task.caseId,
                    action: `Quotation submitted to audit (₹${totalAmount.toLocaleString('en-IN')}) by ${currentUser.name || currentUser.email}`,
                    by: currentUser.id,
                    timestamp: serverTimestamp()
                }
            );

            console.log('[Quotation] ✅ Submitted to Audit → PROCUREMENT_AUDIT task created');

            onClose();
        } catch (error) {
            console.error('[Quotation] Error:', error);
            alert('Failed to submit quotation. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Quotation Builder</h2>
                            <p className="text-green-100 text-sm mt-1">{task.projectName} - {task.clientName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Items Table */}
                    <div className="bg-gray-50 rounded-xl p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900">Items & Pricing</h3>
                            <button
                                onClick={() => setShowCatalogModal(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                            >
                                + Add Item from Catalog
                            </button>
                        </div>
                        {quotationItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No items added yet. Click "Add Item from Catalog" to start.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-600 px-3">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-3">Item</div>
                                    <div className="col-span-2">Qty</div>
                                    <div className="col-span-2">Rate (₹)</div>
                                    <div className="col-span-3">Amount (₹)</div>
                                    <div className="col-span-1"></div>
                                </div>
                                {quotationItems.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded-lg border">
                                        <div className="col-span-1 font-bold text-gray-500">{index + 1}</div>
                                        <div className="col-span-3 text-sm">{item.itemName}</div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.quantity || ''}
                                                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.rate || ''}
                                                onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="col-span-3 font-bold text-green-700 text-sm">
                                            ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Summary & PR Section */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left: Summary */}
                        <div className="bg-blue-50 rounded-xl p-5 space-y-3">
                            <h3 className="font-bold text-gray-900 mb-4">Summary</h3>
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="font-bold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Discount (%):</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    className="w-24 px-3 py-1 border rounded-lg text-right"
                                />
                            </div>
                            <div className="flex justify-between text-red-600">
                                <span>Discount Amount:</span>
                                <span>-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>GST (%):</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                    className="w-24 px-3 py-1 border rounded-lg text-right"
                                />
                            </div>
                            <div className="flex justify-between">
                                <span>Tax Amount:</span>
                                <span>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="border-t-2 border-blue-300 pt-3 mt-3 flex justify-between text-xl font-bold text-blue-900">
                                <span>Total:</span>
                                <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        {/* Right: PR Section (Role-based visibility) */}
                        {canSeePR && (
                            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-5 space-y-3">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    🔒 Internal Pricing (Confidential)
                                </h3>
                                <p className="text-xs text-gray-600 mb-4">
                                    Visible only to Quotation Team, Sales GM, and Admin
                                </p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PR1 (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={pr1 || ''}
                                        onChange={(e) => setPr1(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-yellow-400 rounded-lg"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PR2 (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={pr2 || ''}
                                        onChange={(e) => setPr2(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-yellow-400 rounded-lg"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes / Terms</label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Add any additional notes or terms..."
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || quotationItems.length === 0 || quotationItems.some(item => item.rate <= 0)}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit to Audit'}
                        </button>
                    </div>
                </div>

                {/* Catalog Selection Modal */}
                {showCatalogModal && (
                    <CatalogSelectionModal
                        catalogItems={catalogItems}
                        onSelect={addItemsFromCatalog}
                        onClose={() => setShowCatalogModal(false)}
                    />
                )}
            </div>
        </div>
    );
};

// Catalog Selection Modal Component
const CatalogSelectionModal: React.FC<{
    catalogItems: any[];
    onSelect: (items: any[]) => void;
    onClose: () => void;
}> = ({ catalogItems, onSelect, onClose }) => {
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    const toggleItem = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const filteredCatalog = catalogItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = () => {
        const selected = catalogItems.filter(item => selectedItems.has(item.id));
        onSelect(selected);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-5">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">Select Items from Catalog</h3>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="mt-3">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg text-gray-900"
                        />
                    </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-5">
                    {filteredCatalog.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No items found in catalog
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredCatalog.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItem(item.id)}
                                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                        selectedItems.has(item.id)
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-green-300'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(item.id)}
                                            onChange={() => toggleItem(item.id)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900">{item.name}</h4>
                                            <p className="text-xs text-gray-500">{item.category}</p>
                                            <p className="text-sm font-medium text-green-700 mt-1">
                                                ₹{item.price?.toLocaleString('en-IN') || 0} / {item.unit || 'pcs'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-5 flex justify-between items-center bg-gray-50">
                    <p className="text-sm text-gray-600">
                        {selectedItems.size} item(s) selected
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={selectedItems.size === 0}
                            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add Selected Items
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationWorkQueuePage;
