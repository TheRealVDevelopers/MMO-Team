
import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../../shared/Modal';
import { SiteVisit, SiteMeasurement, ExpenseItem, SiteReport, ExpenseClaimStatus, ExpenseClaim, SiteVisitStatus, UserRole } from '../../../types';
import { CameraIcon, PlusIcon, MapPinIcon, UserCircleIcon, ClockIcon, PencilSquareIcon, BanknotesIcon } from '../../icons/IconComponents';
import { formatCurrencyINR, formatDateTime, USERS } from '../../../constants';

interface VisitDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    visit: SiteVisit;
    onUpdate: (visit: SiteVisit) => void;
    onSubmit: (report: SiteReport, expenseClaim?: Omit<ExpenseClaim, 'id'>) => void;
}

const checklists = {
    Office: ['Measure total carpet area', 'Check electrical points', 'Assess plumbing requirements', 'Verify ceiling height', 'Document window locations'],
    Apartment: ['Room-wise measurements (LxBxH)', 'Check electrical switchboard', 'Plumbing inlet/outlet points', 'Door & window conditions', 'Wall surface quality'],
    Other: ['General area assessment', 'Note key features', 'Identify potential issues']
};

const TabButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 ${isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
        {icon}
        <span>{label}</span>
    </button>
);

const VisitDetailModal: React.FC<VisitDetailModalProps> = ({ isOpen, onClose, visit, onUpdate, onSubmit }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [checklist, setChecklist] = useState<Record<string, boolean>>({});
    const [measurements, setMeasurements] = useState<SiteMeasurement[]>([{ roomName: 'Main Room', length: 0, width: 0, height: 0 }]);
    const [expenses, setExpenses] = useState<Omit<ExpenseItem, 'id'>[]>([]);
    const [notes, setNotes] = useState('');
    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedPhotos(Array.from(e.target.files));
        }
    };

    useEffect(() => {
        const travelDistance = Math.floor(Math.random() * 50) + 10;
        const travelCost = travelDistance * 15;
        setExpenses([{ type: 'Travel', description: `Fuel for ${travelDistance}km`, amount: travelCost }]);
    }, [visit.id]);

    const totalArea = useMemo(() => measurements.reduce((sum, m) => sum + (Number(m.length) * Number(m.width)), 0), [measurements]);
    const totalExpense = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
    const currentChecklist = checklists[visit.siteType || 'Other'];
    const requester = USERS.find(u => u.id === visit.requesterId);

    const handleStatusUpdate = (newStatus: SiteVisitStatus) => {
        let updatedVisit = { ...visit, status: newStatus };
        if (newStatus === SiteVisitStatus.TRAVELING) updatedVisit.travelStartTime = new Date();
        if (newStatus === SiteVisitStatus.ON_SITE) updatedVisit.onSiteTime = new Date();
        if (newStatus === SiteVisitStatus.COMPLETED) updatedVisit.completionTime = new Date();
        onUpdate(updatedVisit);
    };

    const handleMeasurementChange = (index: number, field: keyof SiteMeasurement, value: string) => {
        const newMeasurements = [...measurements];
        (newMeasurements[index] as any)[field] = value;
        setMeasurements(newMeasurements);
    };
    const addRoom = () => setMeasurements([...measurements, { roomName: `Room ${measurements.length + 1}`, length: 0, width: 0, height: 0 }]);

    const handleExpenseChange = (index: number, field: keyof Omit<ExpenseItem, 'id'>, value: string | number) => {
        const newExpenses = [...expenses];
        (newExpenses[index] as any)[field] = value;
        setExpenses(newExpenses);
    }
    const addExpense = () => setExpenses([...expenses, { type: 'Other', description: '', amount: 0 }]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Process photos to Base64
            const photos = await Promise.all(selectedPhotos.map(async (file) => {
                const base64 = await fileToBase64(file);
                return {
                    url: base64,
                    caption: file.name
                };
            }));

            const report: SiteReport = {
                id: `rep-${visit.id}`,
                visitId: visit.id,
                checklistItems: Object.entries(checklist).map(([text, checked]) => ({ text, checked: !!checked })),
                measurements,
                photos, // Storing objects with Base64 in URL
                notes,
            };

            let expenseClaim: Omit<ExpenseClaim, 'id'> | undefined;
            if (totalExpense > 0) {
                expenseClaim = {
                    visitId: visit.id, engineerId: visit.assigneeId, submissionDate: new Date(),
                    totalAmount: totalExpense, status: ExpenseClaimStatus.SUBMITTED,
                    items: expenses.map((e, i) => ({ ...e, id: `ei-${Date.now()}-${i}` })),
                };
            }
            onSubmit(report, expenseClaim);
            onUpdate({ ...visit, status: SiteVisitStatus.REPORT_SUBMITTED });
        } catch (error) {
            console.error("Error submitting site report:", error);
            alert("Failed to submit report.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Site Visit Hub" size="4xl">
            <div className="space-y-4">
                {/* Header */}
                <div>
                    <h3 className="text-xl font-bold text-text-primary">{visit.projectName}</h3>
                    <p className="text-sm text-text-secondary">{visit.clientName}</p>
                </div>

                {/* Status Tracker */}
                <div className="p-4 bg-subtle-background rounded-lg space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button onClick={() => handleStatusUpdate(SiteVisitStatus.TRAVELING)} disabled={!!visit.travelStartTime} className="p-2 text-sm font-semibold rounded-md disabled:opacity-50 text-white bg-primary disabled:bg-primary/50">Start Travel</button>
                        <button onClick={() => handleStatusUpdate(SiteVisitStatus.ON_SITE)} disabled={!visit.travelStartTime || !!visit.onSiteTime} className="p-2 text-sm font-semibold rounded-md disabled:opacity-50 text-white bg-primary disabled:bg-primary/50">Arrived at Site</button>
                        <button onClick={() => handleStatusUpdate(SiteVisitStatus.COMPLETED)} disabled={!visit.onSiteTime || !!visit.completionTime || isSubmitting} className="p-2 text-sm font-semibold rounded-md disabled:opacity-50 text-white bg-secondary disabled:bg-secondary/50">Mark as Complete</button>
                        <button onClick={handleSubmit} disabled={!visit.completionTime || visit.status === SiteVisitStatus.REPORT_SUBMITTED || isSubmitting} className="p-2 text-sm font-semibold rounded-md disabled:opacity-50 text-white bg-secondary disabled:bg-secondary/50">
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                    <div className="flex flex-wrap justify-around text-xs text-text-secondary border-t border-border pt-2">
                        {visit.travelStartTime && <span><strong>Travel Started:</strong> {formatDateTime(visit.travelStartTime)}</span>}
                        {visit.onSiteTime && <span><strong>On Site:</strong> {formatDateTime(visit.onSiteTime)}</span>}
                        {visit.completionTime && <span><strong>Completed:</strong> {formatDateTime(visit.completionTime)}</span>}
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-4">
                        <TabButton label="Details & Instructions" icon={<PencilSquareIcon className="w-5 h-5" />} isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
                        <TabButton label="Report & Measurements" icon={<PencilSquareIcon className="w-5 h-5" />} isActive={activeTab === 'report'} onClick={() => setActiveTab('report')} />
                        <TabButton label="Expenses" icon={<BanknotesIcon className="w-5 h-5" />} isActive={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} />
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="pt-4 min-h-[30vh]">
                    {activeTab === 'details' && (
                        <div className="space-y-4 text-sm">
                            <p><strong>Initiated By:</strong> {requester?.name || 'N/A'}</p>
                            <p><strong>Scheduled Time:</strong> {formatDateTime(visit.date)}</p>
                            <p><strong>Site Address:</strong> {visit.siteAddress}</p>
                            <h4 className="font-bold pt-2">Instructions from Sales:</h4>
                            <ul className="list-disc pl-5 space-y-1 text-text-secondary">
                                {visit.notes?.keyPoints && <li><strong>Key Points:</strong> {visit.notes.keyPoints}</li>}
                                {visit.notes?.measurements && <li><strong>Measurements:</strong> {visit.notes.measurements}</li>}
                                {visit.notes?.clientPreferences && <li><strong>Preferences:</strong> {visit.notes.clientPreferences}</li>}
                                {visit.notes?.potentialChallenges && <li><strong>Challenges:</strong> {visit.notes.potentialChallenges}</li>}
                                {visit.notes?.photosRequired && <li><strong>Photos are required.</strong></li>}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'report' && (
                        <div className="space-y-4">
                            <h3 className="font-bold">Checklist</h3>
                            <div className="space-y-2">
                                {currentChecklist.map(item => (
                                    <div key={item} className="flex items-center"><input id={item} type="checkbox" checked={!!checklist[item]} onChange={e => setChecklist(prev => ({ ...prev, [item]: e.target.checked }))} className="h-4 w-4 text-primary rounded" /><label htmlFor={item} className="ml-2 text-sm">{item}</label></div>
                                ))}
                            </div>
                            <h3 className="font-bold pt-2">Measurements <span className="text-xs font-normal text-text-secondary">(Total Area: {totalArea.toFixed(2)} sq ft)</span></h3>
                            {measurements.map((m, i) => (
                                <div key={i} className="grid grid-cols-4 gap-2 items-end p-2 bg-subtle-background rounded-md">
                                    <input value={m.roomName} onChange={e => handleMeasurementChange(i, 'roomName', e.target.value)} placeholder="Room Name" className="p-1 border-border bg-surface text-sm rounded-md" />
                                    <input type="number" value={m.length} onChange={e => handleMeasurementChange(i, 'length', e.target.value)} placeholder="Length (ft)" className="p-1 border-border bg-surface text-sm rounded-md" />
                                    <input type="number" value={m.width} onChange={e => handleMeasurementChange(i, 'width', e.target.value)} placeholder="Width (ft)" className="p-1 border-border bg-surface text-sm rounded-md" />
                                    <input type="number" value={m.height} onChange={e => handleMeasurementChange(i, 'height', e.target.value)} placeholder="Height (ft)" className="p-1 border-border bg-surface text-sm rounded-md" />
                                </div>
                            ))}
                            <button onClick={addRoom} className="text-sm font-medium text-primary hover:underline">+ Add room</button>
                            <h3 className="font-bold pt-2 text-sm">Photos</h3>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2 px-4 py-2 bg-subtle-background border border-border rounded-lg cursor-pointer hover:bg-border transition-colors">
                                    <CameraIcon className="w-5 h-5 text-text-secondary" />
                                    <span className="text-sm font-medium text-text-primary">Add Photos</span>
                                    <input type="file" className="hidden" multiple accept="image/*" onChange={handlePhotoChange} />
                                </label>
                                {selectedPhotos.length > 0 && (
                                    <span className="text-xs text-primary font-bold">{selectedPhotos.length} selected</span>
                                ) || <span className="text-xs text-text-secondary italic">No photos selected</span>}
                            </div>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add final notes or summary..." className="mt-2 w-full p-2 border-border bg-surface text-sm rounded-md" />
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold">Expense Tracking</h3><p>Total Claim: <span className="font-bold text-primary">{formatCurrencyINR(totalExpense)}</span></p>
                            </div>
                            {expenses.map((exp, i) => (
                                <div key={i} className="grid grid-cols-4 gap-2 p-2 bg-subtle-background rounded-md">
                                    <select value={exp.type} onChange={e => handleExpenseChange(i, 'type', e.target.value)} className="p-1 text-sm border-border bg-surface rounded-md"><option>Travel</option><option>Parking</option><option>Materials</option><option>Other</option></select>
                                    <input value={exp.description} onChange={e => handleExpenseChange(i, 'description', e.target.value)} placeholder="Description" className="col-span-2 p-1 text-sm border-border bg-surface rounded-md" />
                                    <input type="number" value={exp.amount} onChange={e => handleExpenseChange(i, 'amount', Number(e.target.value))} placeholder="Amount (INR)" className="p-1 text-sm border-border bg-surface rounded-md" />
                                </div>
                            ))}
                            <button onClick={addExpense} className="text-sm font-medium text-primary hover:underline">+ Add expense item</button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default VisitDetailModal;