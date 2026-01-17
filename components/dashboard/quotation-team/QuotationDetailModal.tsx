import React, { useState, useMemo } from 'react';
import Modal from '../../shared/Modal';
import { Project, ProjectStatus, Item } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { CalculatorIcon, CheckCircleIcon, DocumentCheckIcon, XCircleIcon, PlusIcon } from '../../icons/IconComponents';
import { formatCurrencyINR } from '../../../constants';
import { ITEMS } from '../../../constants';

const Step: React.FC<{ title: string; stepNumber: number; activeStep: number; }> = ({ title, stepNumber, activeStep }) => (
    <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${stepNumber <= activeStep ? 'bg-primary text-white' : 'bg-border text-text-secondary'}`}>
            {stepNumber < activeStep ? '✔' : stepNumber}
        </div>
        <div className={`ml-3 font-medium ${stepNumber <= activeStep ? 'text-primary' : 'text-text-secondary'}`}>{title}</div>
    </div>
);


const QuotationDetailModal: React.FC<{
    project: Project;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (project: Project) => void;
}> = ({ project, isOpen, onClose, onUpdate }) => {
    const { currentUser } = useAuth();
    const [step, setStep] = useState(1);
    const [selectedItems, setSelectedItems] = useState<(Item & { remarks?: string })[]>(project.items || []);
    const [laborCost, setLaborCost] = useState(project.budget * 0.25);
    const [margin, setMargin] = useState(20);
    const [counterOfferAmount, setCounterOfferAmount] = useState('');
    const [counterOfferNotes, setCounterOfferNotes] = useState('');

    const materialCost = useMemo(() => selectedItems.reduce((sum, item) => sum + item.price, 0), [selectedItems]);
    const calculatedQuote = useMemo(() => (materialCost + laborCost) / (1 - (margin / 100)), [materialCost, laborCost, margin]);

    const handleStatusChange = (newStatus: ProjectStatus) => {
        onUpdate({ ...project, status: newStatus, budget: calculatedQuote, items: selectedItems });
        onClose();
    };

    const handleAddCounterOffer = () => {
        if (!currentUser || !counterOfferAmount) return;

        const newOffer = {
            id: Date.now().toString(),
            userId: currentUser.id,
            userName: currentUser.name,
            amount: Number(counterOfferAmount),
            timestamp: new Date(),
            notes: counterOfferNotes
        };

        const updatedProject = {
            ...project,
            counterOffers: [...(project.counterOffers || []), newOffer]
        };

        onUpdate(updatedProject);
        setCounterOfferAmount('');
        setCounterOfferNotes('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Commercial Proposal: ${project.projectName}`} size="6xl">
            <div className="flex flex-col h-[80vh] bg-white">
                {/* Proposal Status Bar */}
                <div className="flex items-center justify-between px-6 py-4 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-text-secondary tracking-widest">Document Type</span>
                            <span className="text-sm font-bold text-primary">Commercial Quotation v1.0</span>
                        </div>
                        <div className="h-8 w-px bg-border mx-2" />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-text-secondary tracking-widest">Status</span>
                            <span className="text-sm font-bold flex items-center gap-1.5 capitalize text-secondary">
                                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                {project.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 text-text-secondary hover:text-primary transition-colors">
                            <DocumentCheckIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-grow grid grid-cols-12 overflow-hidden">
                    {/* Main Content Area: Document View */}
                    <div className="col-span-8 overflow-y-auto p-8 bg-subtle-background/30 border-r border-border">
                        <div className="bg-white rounded-xl shadow-xl border border-border p-10 max-w-4xl mx-auto space-y-10 min-h-full">
                            {/* Document Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-black text-text-primary tracking-tighter mb-2">COMMERCIAL PROPOSAL</h1>
                                    <p className="text-sm text-text-secondary font-medium">Proposal ID: PRJ-{project.id.slice(-4).toUpperCase()}</p>
                                    <p className="text-sm text-text-secondary font-medium">Date: {new Date().toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-lg font-black text-primary">MMO DESIGN HUB</h3>
                                    <p className="text-xs text-text-secondary max-w-[200px]">123 Creative Plaza, Design District, Bangalore - 560001</p>
                                </div>
                            </div>

                            <div className="h-px bg-border w-full" />

                            {/* Client & Project Info */}
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest mb-3">Prepared For</p>
                                    <h4 className="text-base font-bold text-text-primary mb-1">{project.clientName}</h4>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        Project: {project.projectName}<br />
                                        Expected Delivery: {project.deadline || '14 Days'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest mb-3">Quotation Summary</p>
                                    <p className="text-2xl font-black text-primary leading-none mb-1">{formatCurrencyINR(calculatedQuote)}</p>
                                    <p className="text-xs text-text-secondary italic">Inclusive of all standard material costs</p>
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Itemized Breakdown</h4>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-border">
                                            <th className="py-3 px-2 text-xs font-black text-text-primary">SI.</th>
                                            <th className="py-3 px-2 text-xs font-black text-text-primary">Line Item & Description</th>
                                            <th className="py-3 px-2 text-xs font-black text-text-primary">Category</th>
                                            <th className="py-3 px-2 text-xs font-black text-text-primary text-right">Price (INR)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {selectedItems.map((item, idx) => (
                                            <tr key={`${item.id}-${idx}`} className="group hover:bg-subtle-background/50 transition-colors">
                                                <td className="py-4 px-2 text-xs font-medium text-text-secondary">{idx + 1}</td>
                                                <td className="py-4 px-2">
                                                    <p className="text-xs font-bold text-text-primary">{item.name}</p>
                                                    {item.remarks && <p className="text-[10px] text-text-secondary mt-0.5 italic">{item.remarks}</p>}
                                                </td>
                                                <td className="py-4 px-2 text-xs text-text-secondary font-medium">{item.category}</td>
                                                <td className="py-4 px-2 text-xs font-bold text-text-primary text-right">{formatCurrencyINR(item.price)}</td>
                                            </tr>
                                        ))}
                                        {selectedItems.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-12 text-center text-xs text-text-tertiary italic">No items added to this quotation yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-border">
                                            <td colSpan={3} className="py-4 px-2 text-xs font-black text-text-secondary text-right">Material Subtotal</td>
                                            <td className="py-4 px-2 text-sm font-bold text-text-primary text-right">{formatCurrencyINR(materialCost)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={3} className="py-2 px-2 text-xs font-medium text-text-secondary text-right">Labor & Handling</td>
                                            <td className="py-2 px-2 text-sm font-medium text-text-primary text-right">{formatCurrencyINR(laborCost)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={3} className="py-4 px-2 text-xs font-black text-primary text-right uppercase tracking-[0.2em]">Grand Total</td>
                                            <td className="py-4 px-2 text-xl font-black text-primary text-right">{formatCurrencyINR(calculatedQuote)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="h-px bg-border w-full" />

                            {/* Terms */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-text-secondary tracking-widest">General Terms & Conditions</h4>
                                <ul className="text-[10px] text-text-tertiary list-disc pl-4 space-y-1 leading-relaxed">
                                    <li>Validity of this quotation is 7 days from the date of issue.</li>
                                    <li>A 50% advance payment is required upon confirmation.</li>
                                    <li>Final delivery timeline depends on material availability at the time of order booking.</li>
                                    <li>Taxes are applicable as per government norms at the time of final invoicing.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Negotiation Control & Tools */}
                    <div className="col-span-4 flex flex-col h-full bg-white border-l border-border">
                        <div className="flex border-b border-border">
                            <button
                                onClick={() => setStep(1)}
                                className={`flex-1 py-4 text-xs font-bold transition-all ${step === 1 ? 'border-b-2 border-primary text-primary' : 'text-text-secondary'}`}
                            >
                                Negotiation Log
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                className={`flex-1 py-4 text-xs font-bold transition-all ${step === 2 ? 'border-b-2 border-primary text-primary' : 'text-text-secondary'}`}
                            >
                                Edit Terms
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto">
                            {step === 1 ? (
                                <div className="p-6 flex flex-col h-full">
                                    <div className="flex-grow space-y-4 pr-1">
                                        <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest mb-4">Counter Offer History</p>
                                        {(!project.counterOffers || project.counterOffers.length === 0) ? (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-50 grayscale scale-90">
                                                <CalculatorIcon className="w-12 h-12 mb-3 text-text-tertiary" />
                                                <p className="text-xs font-medium text-text-tertiary">No active negotiations</p>
                                            </div>
                                        ) : (
                                            project.counterOffers.map((offer) => (
                                                <div key={offer.id} className="relative pl-6 pb-6 border-l-2 border-primary/20 last:pb-0">
                                                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary" />
                                                    <div className="bg-subtle-background p-4 rounded-xl border border-border/50 group hover:border-primary transition-all">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-[10px] font-black uppercase text-primary">{offer.userName}</p>
                                                            <p className="text-[10px] text-text-tertiary">{new Date(offer.timestamp).toLocaleTimeString()}</p>
                                                        </div>
                                                        <p className="text-lg font-black text-text-primary mb-1">{formatCurrencyINR(offer.amount)}</p>
                                                        {offer.notes && <p className="text-[10px] italic text-text-secondary leading-normal">"{offer.notes}"</p>}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="mt-8 bg-primary/5 p-5 rounded-2xl border border-primary/10 space-y-4">
                                        <p className="text-xs font-black text-text-primary">Post New Counter-Offer</p>
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-text-tertiary text-sm font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="Enter best price..."
                                                    value={counterOfferAmount}
                                                    onChange={(e) => setCounterOfferAmount(e.target.value)}
                                                    className="w-full pl-8 p-3 bg-white border border-border rounded-xl text-sm font-black focus:border-primary outline-none transition-all"
                                                />
                                            </div>
                                            <textarea
                                                placeholder="Remarks on this negotiation..."
                                                value={counterOfferNotes}
                                                onChange={(e) => setCounterOfferNotes(e.target.value)}
                                                className="w-full p-3 bg-white border border-border rounded-xl text-[10px] h-20 outline-none focus:border-primary resize-none"
                                            />
                                            <button
                                                onClick={handleAddCounterOffer}
                                                disabled={!counterOfferAmount}
                                                className="w-full py-4 bg-secondary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-secondary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                                            >
                                                Submit Counter
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Line Item Editor</h4>
                                        <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {selectedItems.map((item, index) => (
                                                <div key={`${item.id}-${index}`} className="p-3 bg-subtle-background border border-border rounded-xl">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold text-text-primary">{item.name}</span>
                                                        <button
                                                            onClick={() => setSelectedItems(prev => prev.filter((_, i) => i !== index))}
                                                            className="text-text-tertiary hover:text-error transition-colors"
                                                        >
                                                            <XCircleIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Add remark..."
                                                        value={item.remarks || ''}
                                                        onChange={(e) => {
                                                            const newItems = [...selectedItems];
                                                            newItems[index].remarks = e.target.value;
                                                            setSelectedItems(newItems);
                                                        }}
                                                        className="w-full text-[10px] p-2 bg-white border border-border rounded-lg outline-none focus:border-primary"
                                                    />
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setStep(1)} // Or open item selector
                                                className="w-full py-3 border-2 border-dashed border-border rounded-xl text-[10px] font-black text-text-tertiary hover:bg-subtle-background hover:text-primary transition-all"
                                            >
                                                + ADD MORE ITEMS
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6 bg-subtle-background/50 p-6 rounded-2xl border border-border/50">
                                        <h4 className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Pricing Logic</h4>
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-text-tertiary mb-2 text-right">Labor Costs (INR)</label>
                                                <input
                                                    type="number"
                                                    value={laborCost}
                                                    onChange={e => setLaborCost(Number(e.target.value))}
                                                    className="w-full p-3 bg-white border border-border rounded-xl text-right font-black text-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-text-tertiary mb-2 flex justify-between">
                                                    Target Margin
                                                    <span className="text-primary font-black">{margin}%</span>
                                                </label>
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="60"
                                                    value={margin}
                                                    onChange={e => setMargin(Number(e.target.value))}
                                                    className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Final Actions */}
                        <div className="p-6 bg-white border-t border-border flex gap-3">
                            <button
                                onClick={() => handleStatusChange(ProjectStatus.QUOTATION_SENT)}
                                className="flex-1 py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/30 hover:-translate-y-0.5 transition-all"
                            >
                                Send to Client
                            </button>
                            <button
                                onClick={() => handleStatusChange(ProjectStatus.APPROVED)}
                                className="flex-1 py-4 bg-secondary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-secondary/30 hover:-translate-y-0.5 transition-all"
                            >
                                Win Project
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default QuotationDetailModal;