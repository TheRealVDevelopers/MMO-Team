import React, { useState, useMemo } from 'react';
import Modal from '../../shared/Modal';
import { Project, ProjectStatus, Item, RFQ, Bid, ApprovalRequestType, UserRole } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useApprovals } from '../../../hooks/useApprovalSystem';
import { formatCurrencyINR, VENDORS } from '../../../constants';
import { CalculatorIcon, DocumentCheckIcon, XCircleIcon, PlusIcon, ClockIcon } from '../../icons/IconComponents';

const QuotationDetailModal: React.FC<{
    project: Project;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (project: Project) => void;
    rfqs: RFQ[];
    bids: Bid[];
}> = ({ project, isOpen, onClose, onUpdate, rfqs, bids }) => {
    const { currentUser } = useAuth();
    const [step, setStep] = useState(1);
    const [selectedItems, setSelectedItems] = useState<(Item & { remarks?: string })[]>(project.items || []);

    // Approval Hook
    const { submitRequest } = useApprovals();

    // Derived State
    const projectRFQ = useMemo(() => rfqs.find(r => r.projectId === project.id || r.id === project.id || r.id === `rfq-${project.id}`), [rfqs, project.id]);
    const projectBids = useMemo(() => {
        const filtered = bids.filter(b => projectRFQ && b.rfqId === projectRFQ.id);
        return filtered.sort((a, b) => new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime());
    }, [bids, projectRFQ]);

    const l1Bid = useMemo(() => {
        if (projectBids.length === 0) return null;
        // Group by vendor and get latest for each
        const vendorLatestBids = Array.from(
            projectBids.reduce((acc, b) => acc.set(b.vendorId, b), new Map<string, Bid>()).values()
        ) as Bid[];
        // Find the one with minimum totalAmount
        return vendorLatestBids.sort((a, b) => a.totalAmount - b.totalAmount)[0];
    }, [projectBids]);

    const [laborCost, setLaborCost] = useState(project.budget * 0.25);
    const [margin, setMargin] = useState(20);
    const [ratio, setRatio] = useState(project.quotationRatio || ''); // Initialize from project (String)
    const [counterOfferAmount, setCounterOfferAmount] = useState('');
    const [counterOfferNotes, setCounterOfferNotes] = useState('');

    const materialCost = useMemo(() => selectedItems.reduce((sum, item) => sum + item.price, 0), [selectedItems]);
    const calculatedQuote = useMemo(() => {
        const base = (materialCost + laborCost) / (1 - (margin / 100));
        return base; // Removed ratio multiplier
    }, [materialCost, laborCost, margin]); // Removed ratio dependency

    const handleStatusChange = (newStatus: ProjectStatus) => {
        onUpdate({ ...project, status: newStatus, budget: calculatedQuote, items: selectedItems, quotationRatio: ratio });
        onClose();
    };

    const handleRequestApproval = async () => {
        if (!currentUser) return;

        // Use L1 bid if available, otherwise fallback to calculated quote or project budget
        const approvalAmount = l1Bid ? l1Bid.totalAmount : (calculatedQuote || project.budget);
        const approvalNotes = l1Bid
            ? `Based on L1 Bid from ${l1Bid.vendorName}`
            : `Based on internal calculation (${margin}% margin)`;

        // 1. Submit to Approval System (Firebase)
        await submitRequest({
            requestType: ApprovalRequestType.QUOTATION_APPROVAL,
            requesterId: currentUser.id,
            requesterName: currentUser.name,
            requesterRole: currentUser.role,
            title: `Quotation Approval for ${project.projectName}`,
            description: `Total Value: ${formatCurrencyINR(approvalAmount)}. ${approvalNotes}.`,
            contextId: project.id,
            priority: 'High',
            targetRole: 'Admin' as any
        });

        // 2. Update Local State & Project Status
        const updatedProject: Project = {
            ...project,
            status: ProjectStatus.APPROVAL_REQUESTED,
            budget: approvalAmount, // Update project budget to approved amount
            history: [
                ...(project.history || []),
                {
                    action: 'Approval Requested',
                    user: currentUser.name,
                    timestamp: new Date(),
                    notes: `Submitted for Admin Approval. Amount: ${formatCurrencyINR(approvalAmount)} (${approvalNotes})`
                }
            ]
        };
        onUpdate(updatedProject);
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
                </div>

                <div className="flex-grow grid grid-cols-12 overflow-hidden">
                    {/* Main Content Area: Document View */}
                    <div className="col-span-8 overflow-y-auto p-8 bg-subtle-background/30 border-r border-border">
                        <div className="bg-white rounded-xl shadow-xl border border-border p-10 max-w-4xl mx-auto space-y-10 min-h-full">
                            {project.boqSubmission && project.boqSubmission.items.length > 0 && (
                                <div className="bg-subtle-background/60 border border-border rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">BOQ Submission</p>
                                            <p className="text-sm font-bold text-text-primary">Submitted items from Drawing Team</p>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                                            {new Date(project.boqSubmission.submittedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {project.boqSubmission.items.map((item, index) => (
                                            <div key={item.id || `${item.description}-${index}`} className="flex items-start justify-between gap-4 bg-white rounded-lg border border-border/60 p-3">
                                                <div>
                                                    <p className="text-sm font-bold text-text-primary">{item.description}</p>
                                                    {item.specifications && (
                                                        <p className="text-[11px] text-text-secondary mt-1">{item.specifications}</p>
                                                    )}
                                                </div>
                                                <div className="text-right text-xs font-semibold text-text-secondary">
                                                    {item.quantity} {item.unit}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                        </div>
                    </div>

                    {/* Right Side: Negotiation Control & Tools */}
                    <div className="col-span-4 flex flex-col h-full bg-white border-l border-border">
                        <div className="flex border-b border-border">
                            <button
                                onClick={() => setStep(1)}
                                className={`flex-1 py-4 text-xs font-bold transition-all ${step === 1 ? 'border-b-2 border-primary text-primary' : 'text-text-secondary'}`}
                            >
                                Negotiation
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                className={`flex-1 py-4 text-xs font-bold transition-all ${step === 3 ? 'border-b-2 border-secondary text-secondary' : 'text-text-secondary'}`}
                            >
                                Vendor Bids ({projectBids.length})
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                className={`flex-1 py-4 text-xs font-bold transition-all ${step === 2 ? 'border-b-2 border-primary text-primary' : 'text-text-secondary'}`}
                            >
                                Edit
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
                            ) : step === 3 ? (
                                <div className="p-6 flex flex-col h-full bg-subtle-background/20">
                                    <div className="flex-grow space-y-4 overflow-y-auto pr-1">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Live Vendor Bidding</p>
                                                <p className="text-[10px] text-text-tertiary mt-1">RFQ ID: {projectRFQ?.rfqNumber || 'N/A'}</p>
                                            </div>
                                            {projectBids.length > 0 && (
                                                <span className="text-[10px] bg-secondary text-white px-3 py-1 rounded-full font-black uppercase shadow-lg shadow-secondary/20">
                                                    Current L1: {formatCurrencyINR(Math.min(...Array.from(
                                                        projectBids.reduce((acc, b) => acc.set(b.vendorId, b.totalAmount), new Map()).values()
                                                    ) as number[]))}
                                                </span>
                                            )}
                                        </div>

                                        {projectBids.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-border text-text-tertiary">
                                                    <CalculatorIcon className="w-8 h-8" />
                                                </div>
                                                <p className="text-xs font-bold text-text-secondary">No vendors have bid yet</p>
                                                <p className="text-[10px] text-text-tertiary mt-1">Bidding is still open</p>
                                            </div>
                                        ) : (
                                            (() => {
                                                // Group bids by vendor
                                                const vendorGroups: Record<string, Bid[]> = {};
                                                projectBids.forEach(bid => {
                                                    if (!vendorGroups[bid.vendorId]) vendorGroups[bid.vendorId] = [];
                                                    vendorGroups[bid.vendorId].push(bid);
                                                });

                                                // Sort vendors by their LATEST bid amount
                                                const sortedVendors = Object.entries(vendorGroups).sort((a, b) => {
                                                    const latestA = a[1][a[1].length - 1].totalAmount;
                                                    const latestB = b[1][b[1].length - 1].totalAmount;
                                                    return latestA - latestB;
                                                });

                                                const l1Amount = sortedVendors[0][1][sortedVendors[0][1].length - 1].totalAmount;

                                                return sortedVendors.map(([vendorId, history], idx) => {
                                                    const latestBid = history[history.length - 1];
                                                    const vendorInfo = VENDORS.find(v => v.id === vendorId);
                                                    const isL1 = latestBid.totalAmount === l1Amount;

                                                    return (
                                                        <div key={vendorId} className={`p-6 rounded-3xl border transition-all ${isL1 ? 'bg-secondary/5 border-secondary/40 ring-1 ring-secondary/10 shadow-lg' : 'bg-white border-border shadow-sm'}`}>
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className="flex gap-4">
                                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${isL1 ? 'bg-secondary text-white' : 'bg-primary/10 text-primary'}`}>
                                                                        {latestBid.vendorName.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h5 className="font-black text-text-primary text-base">{latestBid.vendorName}</h5>
                                                                            {isL1 && <span className="text-[8px] bg-secondary text-white px-2 py-0.5 rounded-full uppercase font-black tracking-widest shadow-sm">Current L1</span>}
                                                                        </div>
                                                                        <div className="flex items-center gap-3 text-[10px] text-text-tertiary font-bold">
                                                                            <span className="flex items-center gap-1">
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                                                {vendorInfo?.phone || '+91 9XXXX XXXXX'}
                                                                            </span>
                                                                            <span className="w-1 h-1 rounded-full bg-border" />
                                                                            <span className="flex items-center gap-1">
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 01-2 2v10a2 2 0 002 2z" /></svg>
                                                                                {vendorInfo?.email || 'contact@vendor.com'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={`text-2xl font-serif font-black ${isL1 ? 'text-secondary' : 'text-text-primary'}`}>{formatCurrencyINR(latestBid.totalAmount)}</p>
                                                                    <p className="text-[10px] text-text-tertiary mt-1 font-bold">Latest Bid: {new Date(latestBid.submittedDate).toLocaleTimeString()}</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-3 mb-4">
                                                                <div className="bg-subtle-background/50 p-3 rounded-xl border border-border/30">
                                                                    <p className="text-[8px] font-black uppercase text-text-tertiary mb-1">Timeline</p>
                                                                    <p className="text-[10px] font-bold text-text-secondary">{latestBid.deliveryTimeline}</p>
                                                                </div>
                                                                <div className="bg-subtle-background/50 p-3 rounded-xl border border-border/30">
                                                                    <p className="text-[8px] font-black uppercase text-text-tertiary mb-1">Terms</p>
                                                                    <p className="text-[10px] font-bold text-text-secondary">{latestBid.paymentTerms}</p>
                                                                </div>
                                                                <div className="bg-subtle-background/50 p-3 rounded-xl border border-border/30">
                                                                    <p className="text-[8px] font-black uppercase text-text-tertiary mb-1">Submissions</p>
                                                                    <p className="text-[10px] font-bold text-text-secondary">{history.length} Version{history.length > 1 ? 's' : ''}</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <details className="group">
                                                                    <summary className="text-[10px] font-black uppercase text-primary cursor-pointer list-none flex items-center group-open:mb-4 bg-primary/5 p-2 rounded-lg hover:bg-primary/10 transition-colors">
                                                                        <PlusIcon className="w-4 h-4 mr-2 group-open:rotate-45 transition-transform" />
                                                                        Latest Itemized Quote
                                                                    </summary>
                                                                    {latestBid.items.length > 0 ? (
                                                                        <div className="overflow-x-auto">
                                                                            <table className="w-full text-left text-[10px]">
                                                                                <thead>
                                                                                    <tr className="border-b border-border">
                                                                                        <th className="pb-2 font-black text-text-tertiary">ITEM</th>
                                                                                        <th className="pb-2 font-black text-text-tertiary text-right">UNIT PRICE</th>
                                                                                        <th className="pb-2 font-black text-text-tertiary text-right">TOTAL</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-border/30">
                                                                                    {latestBid.items.map((bi: any) => (
                                                                                        <tr key={bi.rfqItemId}>
                                                                                            <td className="py-2 text-text-secondary font-medium">
                                                                                                {projectRFQ?.items.find(ri => ri.id === bi.rfqItemId)?.name || 'Unknown'}
                                                                                                {bi.remarks && <p className="text-[8px] text-text-tertiary italic">{bi.remarks}</p>}
                                                                                            </td>
                                                                                            <td className="py-2 text-right font-medium text-text-tertiary">{formatCurrencyINR(bi.unitPrice)}</td>
                                                                                            <td className="py-2 text-right font-black text-text-primary">{formatCurrencyINR(bi.totalPrice)}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-[10px] text-text-tertiary italic p-2 bg-subtle-background rounded-lg">Lumpsum bidding used. No item breakdown available.</p>
                                                                    )}
                                                                </details>

                                                                {history.length > 1 && (
                                                                    <details className="group">
                                                                        <summary className="text-[10px] font-black uppercase text-orange-600 cursor-pointer list-none flex items-center group-open:mb-4 bg-orange-50 p-2 rounded-lg hover:bg-orange-100 transition-colors">
                                                                            <ClockIcon className="w-4 h-4 mr-2" />
                                                                            Full Submission History ({history.length})
                                                                        </summary>
                                                                        <div className="space-y-3 pl-4 border-l-2 border-orange-200 ml-2">
                                                                            {history.slice().reverse().map((h, hIdx) => (
                                                                                <div key={h.id} className="relative py-1">
                                                                                    <div className="flex justify-between items-center text-[10px]">
                                                                                        <span className="font-bold text-text-secondary">
                                                                                            {hIdx === 0 ? 'Current Version' : `Version ${history.length - hIdx}`}
                                                                                        </span>
                                                                                        <span className="text-text-tertiary font-mono">{new Date(h.submittedDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between items-baseline mt-1">
                                                                                        <span className={`text-lg font-serif font-black ${hIdx === 0 ? 'text-text-primary' : 'text-text-tertiary'}`}>{formatCurrencyINR(h.totalAmount)}</span>
                                                                                        <span className="text-[9px] text-text-tertiary italic">Timeline: {h.deliveryTimeline}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </details>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()
                                        )}
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

                                    {currentUser && [UserRole.SUPER_ADMIN, UserRole.SALES_GENERAL_MANAGER, UserRole.MANAGER, UserRole.QUOTATION_TEAM].includes(currentUser.role) && (
                                        <div className="space-y-4 bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                                            <label className="block text-[10px] font-black uppercase text-secondary mb-1">Internal Ratio (Note)</label>
                                            <input
                                                type="text"
                                                placeholder="Enter Ratio (e.g. 1:2)"
                                                value={ratio}
                                                onChange={e => setRatio(e.target.value)}
                                                className="w-full p-2 bg-white border border-yellow-200 rounded-lg text-sm font-bold text-secondary focus:border-secondary outline-none"
                                            />
                                            <p className="text-[8px] text-text-tertiary">Visible only to Admin & Quotation Team</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Final Actions */}
                        <div className="p-6 bg-white border-t border-border flex gap-3">
                            {project.status === ProjectStatus.APPROVAL_REQUESTED ? (
                                <button
                                    disabled
                                    className="flex-1 py-4 bg-gray-100 text-gray-400 text-xs font-black uppercase tracking-widest rounded-xl border border-gray-200 cursor-not-allowed"
                                >
                                    Waiting for Admin Approval
                                </button>
                            ) : project.status === ProjectStatus.QUOTATION_SENT ? (
                                <>
                                    <button
                                        onClick={() => handleStatusChange(ProjectStatus.APPROVED)}
                                        className="flex-1 py-4 bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-green-600/30 hover:bg-green-700 transition-all hover:-translate-y-0.5"
                                    >
                                        Mark as Won
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(ProjectStatus.REJECTED)}
                                        className="flex-1 py-4 bg-red-50 text-red-600 border-2 border-red-100 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all"
                                    >
                                        Mark as Lost
                                    </button>
                                </>
                            ) : (
                                <div className="flex-1 space-y-2">
                                    {l1Bid && (
                                        <p className="text-[10px] text-secondary font-black text-center uppercase tracking-widest bg-secondary/5 py-2 rounded-lg border border-secondary/10">
                                            Auto-Selected L1: {formatCurrencyINR(l1Bid.totalAmount)} ({l1Bid.vendorName})
                                        </p>
                                    )}
                                    <button
                                        onClick={handleRequestApproval}
                                        className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/30 hover:bg-secondary transition-all hover:-translate-y-0.5"
                                    >
                                        Submit for Approval
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default QuotationDetailModal;