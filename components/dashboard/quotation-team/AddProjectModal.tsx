import React, { useState } from 'react';
import Modal from '../../shared/Modal';
import { ProjectStatus, Project, UserRole, ApprovalStatus, Item } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import SmartDateTimePicker from '../../shared/SmartDateTimePicker';
import { formatCurrencyINR } from '../../../constants';

interface AddProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (project: Omit<Project, 'id'>) => void;
    items: Item[];
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onSubmit, items }) => {
    const { currentUser } = useAuth();
    const [step, setStep] = useState(1);
    const [projectName, setProjectName] = useState('');
    const [clientName, setClientName] = useState('');
    const [budget, setBudget] = useState<string>('');
    const [deadline, setDeadline] = useState<string>('');
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleToggleItem = (itemId: string) => {
        setSelectedItemIds(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
        const totalMaterialCost = selectedItems.reduce((sum, item) => sum + item.price, 0);

        const newProject: Omit<Project, 'id'> = {
            projectName,
            clientName,
            status: ProjectStatus.AWAITING_QUOTATION,
            startDate: new Date(),
            endDate: deadline ? new Date(deadline) : new Date(new Date().setDate(new Date().getDate() + 14)),
            deadline: deadline ? deadline.split('T')[0] : new Date().toISOString().split('T')[0],
            budget: Number(budget) || totalMaterialCost || 0,
            priority,
            assignedTeam: {
                quotation: currentUser.id,
                execution: []
            },
            advancePaid: 0,
            clientAddress: '',
            clientContact: { name: clientName, phone: '' },
            progress: 0,
            milestones: [
                { name: 'Quotation Generated', completed: false },
                { name: 'Negotiation Started', completed: true }
            ],
            history: [
                {
                    action: 'Quotation Started',
                    user: currentUser.name,
                    timestamp: new Date(),
                    notes: `Bidding initiated with ${selectedItems.length} items.`
                }
            ],
            communication: [],
            items: selectedItems,
            counterOffers: []
        };

        onSubmit(newProject);
        setIsSuccess(true);
        setTimeout(() => {
            onClose();
            resetForm();
            setIsSuccess(false);
        }, 2000);
    };

    const resetForm = () => {
        setStep(1);
        setIsSuccess(false);
        setProjectName('');
        setClientName('');
        setBudget('');
        setDeadline('');
        setPriority('Medium');
        setSelectedItemIds([]);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Start New Quotation ${step === 2 ? `- Step 2: Select Products` : ''}`} size={step === 2 ? "xl" : "lg"}>
            {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center shadow-inner">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-text-primary">Quotation Initiated!</h3>
                        <p className="text-sm text-text-secondary mt-1">Project has been added to the <b>"New / In-Prep"</b> column on your board.</p>
                    </div>
                </div>
            ) : (
                <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Project Name</label>
                                <input
                                    type="text"
                                    required
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full p-2 border border-border rounded-md bg-surface text-text-primary outline-none focus:border-primary transition-all"
                                    placeholder="e.g. Acme Corp HQ Renovation"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Client Name</label>
                                <input
                                    type="text"
                                    required
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full p-2 border border-border rounded-md bg-surface text-text-primary outline-none focus:border-primary transition-all"
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Target Budget (Optional)</label>
                                    <input
                                        type="number"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        className="w-full p-2 border border-border rounded-md bg-surface text-text-primary outline-none focus:border-primary transition-all"
                                        placeholder="Calculated from items"
                                    />
                                </div>
                                <div>
                                    <SmartDateTimePicker
                                        label="Project Deadline"
                                        value={deadline}
                                        onChange={setDeadline}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Priority Level</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                    className="w-full p-2 border border-border rounded-md bg-surface text-text-primary outline-none focus:border-primary transition-all"
                                >
                                    <option value="High">High Priority</option>
                                    <option value="Medium">Medium Priority</option>
                                    <option value="Low">Low Priority</option>
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Item Catalog</h4>
                                <span className="text-[10px] font-bold text-primary">{selectedItemIds.length} items selected</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                                {items.map(item => {
                                    const isSelected = selectedItemIds.includes(item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleToggleItem(item.id)}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-32 ${isSelected
                                                ? 'bg-primary/5 border-primary shadow-sm'
                                                : 'bg-surface border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-text-primary truncate">{item.name}</p>
                                                    <p className="text-[10px] text-text-tertiary">{item.category}</p>
                                                </div>
                                                {isSelected && (
                                                    <div className="bg-primary text-white rounded-full p-0.5">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-auto">
                                                <p className="text-xs font-black text-primary">{formatCurrencyINR(item.price)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={step === 2 ? () => setStep(1) : onClose}
                            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            {step === 2 ? 'Go Back' : 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-primary text-white text-sm font-black rounded-xl hover:bg-secondary transition-all shadow-xl shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {step === 1 ? 'Configure Products →' : 'Launch Quotation'}
                        </button>
                    </div>
                </form>
            )}

        </Modal>
    );
};

export default AddProjectModal;
