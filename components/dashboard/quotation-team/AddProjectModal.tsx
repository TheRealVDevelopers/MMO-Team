import React, { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import { ProjectStatus, Project, UserRole, ApprovalStatus, Item, RFQ, RFQStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import SmartDateTimePicker from '../../shared/SmartDateTimePicker';
import { formatCurrencyINR, VENDORS } from '../../../constants';

interface AddProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (project: Omit<Project, 'id'>, rfq?: RFQ) => void;
    items: Item[];
    projects: Project[];
    initialData?: Partial<Project>;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onSubmit, items, projects, initialData }) => {
    const { currentUser } = useAuth();
    const [step, setStep] = useState(1);
    const [projectName, setProjectName] = useState(initialData?.projectName || '');
    const [clientName, setClientName] = useState(initialData?.clientName || '');
    const [budget, setBudget] = useState<string>(initialData?.budget?.toString() || '');
    const [deadline, setDeadline] = useState<string>(initialData?.deadline || '');
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>(initialData?.priority || 'Medium');
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>(initialData?.items?.map(i => i.id) || []);
    const [biddingDeadline, setBiddingDeadline] = useState<string>('');
    // Default to adding all vendors to ensure visibility during testing
    const [invitedVendorIds, setInvitedVendorIds] = useState<string[]>(VENDORS.map(v => v.id));
    const [isSuccess, setIsSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (initialData) {
            setProjectName(initialData.projectName || '');
            setClientName(initialData.clientName || '');
            setBudget(initialData.budget?.toString() || '');
            setDeadline(initialData.deadline || '');
            setPriority(initialData.priority || 'Medium');
            setSelectedItemIds(initialData.items?.map(i => i.id) || []);
        }
    }, [initialData]);

    const handleExistingProjectSelect = (proj: Project) => {
        setProjectName(proj.projectName);
        setClientName(proj.clientName);
        setBudget(proj.budget.toString());
        setDeadline(proj.deadline || '');
        setPriority(proj.priority);
        setSearchTerm('');
    };

    const handleToggleItem = (itemId: string) => {
        setSelectedItemIds(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Handle step transitions
        if (step < 3) {
            setStep(step + 1);
            return;
        }

        if (!currentUser) return;

        const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
        const totalMaterialCost = selectedItems.reduce((sum, item) => sum + item.price, 0);

        console.log('Submitting Project & RFQ:', {
            projectName,
            clientName,
            itemCount: selectedItems.length,
            vendorCount: invitedVendorIds.length
        });

        const projectTempId = `proj-${Date.now()}`;
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
                { name: 'Bidding Initiated', completed: true }
            ],
            history: [
                {
                    action: 'Quotation Started',
                    user: currentUser.name,
                    timestamp: new Date(),
                    notes: `Bidding initiated with ${selectedItems.length} items. Deadline: ${biddingDeadline}`
                }
            ],
            communication: [],
            items: selectedItems,
            counterOffers: []
        };

        // Create RFQ if vendors are invited
        let rfq: RFQ | undefined = undefined;
        if (invitedVendorIds.length > 0) {
            const rfqId = `rfq-${Date.now()}`;
            rfq = {
                id: rfqId,
                rfqNumber: `RFQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                projectId: projectTempId,
                projectName,
                items: selectedItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.category,
                    quantity: 1,
                    unit: 'nos',
                    targetPrice: item.price
                })),
                createdDate: new Date(),
                deadline: biddingDeadline ? new Date(biddingDeadline) : new Date(new Date().setDate(new Date().getDate() + 7)),
                status: RFQStatus.OPEN,
                invitedVendorIds,
                createdBy: currentUser.id
            };
        }

        onSubmit(newProject, rfq);
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
        setBiddingDeadline('');
        setInvitedVendorIds([]);
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
                <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(step + 1); }} className="space-y-6">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-text-primary mb-1">Quick Select (Existing Project)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full p-2 pl-9 border border-border rounded-md bg-subtle-background text-text-primary placeholder:text-text-tertiary focus:bg-surface transition-all outline-none focus:border-primary/50"
                                        placeholder="Search by client or project name..."
                                    />
                                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                {searchTerm && (
                                    <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                        {projects.filter(p =>
                                            p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.clientName.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).length > 0 ? (
                                            projects.filter(p =>
                                                p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                p.clientName.toLowerCase().includes(searchTerm.toLowerCase())
                                            ).map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => handleExistingProjectSelect(p)}
                                                    className="p-3 hover:bg-primary/5 cursor-pointer border-b border-border last:border-0"
                                                >
                                                    <p className="text-sm font-bold text-text-primary">{p.projectName}</p>
                                                    <p className="text-[10px] text-text-secondary">{p.clientName}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-xs text-text-tertiary">No matching projects found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                    ) : step === 2 ? (
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
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                <SmartDateTimePicker
                                    label="Bidding Deadline"
                                    value={biddingDeadline}
                                    onChange={setBiddingDeadline}
                                    required
                                />
                                <p className="text-[10px] text-text-secondary mt-2 italic">Vendors must submit their final quotes before this time.</p>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary">Invite Vendors</label>
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {VENDORS.map((v: any) => (
                                        <div
                                            key={v.id}
                                            onClick={() => setInvitedVendorIds(prev =>
                                                prev.includes(v.id) ? prev.filter(id => id !== v.id) : [...prev, v.id]
                                            )}
                                            className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${invitedVendorIds.includes(v.id) ? 'bg-secondary/10 border-secondary' : 'bg-surface border-border'}`}
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-text-primary">{v.name}</p>
                                                <p className="text-[10px] text-text-secondary">{v.category}</p>
                                            </div>
                                            {invitedVendorIds.includes(v.id) && (
                                                <div className="w-5 h-5 bg-secondary text-white rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={step > 1 ? () => setStep(step - 1) : onClose}
                            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            {step > 1 ? 'Go Back' : 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-primary text-white text-sm font-black rounded-xl hover:bg-secondary transition-all shadow-xl shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {step < 3 ? 'Next →' : 'Launch Bidding'}
                        </button>
                    </div>
                </form>
            )}

        </Modal>
    );
};

export default AddProjectModal;
