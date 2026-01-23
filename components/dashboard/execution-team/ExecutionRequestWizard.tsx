import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    CalendarIcon,
    UserIcon,
    MapPinIcon,
    BriefcaseIcon,
    PlusIcon,
    TrashIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { ApprovalRequest, ExecutionStage, Project, UserRole } from '../../../types';
import { PrimaryButton, SecondaryButton, ContentCard, cn } from '../shared/DashboardUI';
import Modal from '../../shared/Modal';
import SmartDateTimePicker from '../../shared/SmartDateTimePicker';
import { formatDateTime } from '../../../constants';

interface ExecutionRequestWizardProps {
    isOpen: boolean;
    onClose: () => void;
    request: ApprovalRequest;
    onAccept: (stages: ExecutionStage[], notes: string) => void;
    onNegotiate: (stages: ExecutionStage[], notes: string) => void;
}

const ExecutionRequestWizard: React.FC<ExecutionRequestWizardProps> = ({
    isOpen,
    onClose,
    request,
    onAccept,
    onNegotiate
}) => {
    const [editedStages, setEditedStages] = useState<ExecutionStage[]>([]);
    const [notes, setNotes] = useState('');
    const [hasModifications, setHasModifications] = useState(false);

    useEffect(() => {
        if (request && request.stages) {
            setEditedStages([...request.stages]);
        }
    }, [request]);

    useEffect(() => {
        // Simple check to see if stages changed compared to original
        const isModified = JSON.stringify(editedStages) !== JSON.stringify(request.stages) || notes.length > 0;
        setHasModifications(isModified);
    }, [editedStages, notes, request.stages]);

    const handleAddStage = () => {
        const newStage: ExecutionStage = {
            id: Date.now().toString(),
            name: `New Stage ${editedStages.length + 1}`,
            deadline: new Date(Date.now() + 86400000 * 7), // Default 1 week out
            status: 'Pending'
        };
        setEditedStages([...editedStages, newStage]);
    };

    const handleRemoveStage = (id: string) => {
        setEditedStages(editedStages.filter(s => s.id !== id));
    };

    const handleUpdateStage = (id: string, updates: Partial<ExecutionStage>) => {
        setEditedStages(editedStages.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    if (!isOpen) return null;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={request.title}
                size="6xl"
            >
                <div className="flex-1 p-2">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Project Info */}
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-sm font-black uppercase tracking-widest text-text-tertiary mb-4 flex items-center gap-2">
                                    <BriefcaseIcon className="w-4 h-4" />
                                    Project Context
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-subtle-background border border-border/40">
                                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">Client Name</p>
                                        <p className="text-md font-black text-text-primary capitalize">{request.requesterName}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-subtle-background border border-border/40">
                                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">Project Identifier</p>
                                        <p className="text-md font-black text-text-primary">{request.title}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <MapPinIcon className="w-3 h-3" />
                                            Site Address
                                        </p>
                                        <p className="text-sm font-medium text-text-secondary leading-relaxed">
                                            123 Business Avenue, Tech Hub North, <br />
                                            Bangalore - 560001
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-black uppercase tracking-widest text-text-tertiary mb-4 flex items-center gap-2">
                                    <ExclamationCircleIcon className="w-4 h-4" />
                                    Requester Notes
                                </h3>
                                <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm italic text-text-secondary text-sm leading-loose">
                                    "{request.description}"
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-black uppercase tracking-widest text-text-tertiary mb-2">Internal Remarks</h3>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add your negotiation notes or acceptance remarks..."
                                    className="w-full h-32 p-4 rounded-2xl bg-subtle-background border-border text-sm focus:ring-4 focus:ring-primary/10 transition-all"
                                />
                            </section>
                        </div>

                        {/* Middle & Right Column: Timeline Builder */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex justify-between items-center bg-surface p-6 rounded-[2rem] border border-border/60 shadow-sm sticky top-0 z-10">
                                <h3 className="text-xl font-serif font-bold text-text-primary tracking-tight">Execution Timeline Builder</h3>
                                <button
                                    onClick={handleAddStage}
                                    className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add Milestone
                                </button>
                            </div>

                            <div className="space-y-4">
                                {editedStages.map((stage, idx) => (
                                    <motion.div
                                        key={stage.id}
                                        layout
                                        className="group relative bg-surface p-6 rounded-[2rem] border border-border/60 hover:border-primary/30 transition-all shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex flex-col md:flex-row gap-6 items-start">
                                            <div className="w-12 h-12 rounded-2xl bg-subtle-background border border-border flex items-center justify-center font-black text-primary text-xl shadow-inner uppercase">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-text-tertiary mb-2 block">Milestone Name</label>
                                                    <input
                                                        type="text"
                                                        value={stage.name}
                                                        onChange={(e) => handleUpdateStage(stage.id, { name: e.target.value })}
                                                        placeholder="e.g. Electrical Conduit Installation"
                                                        className="w-full bg-subtle-background border-border rounded-xl text-sm font-bold p-3 focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-text-tertiary mb-2 block">Completion Deadline</label>
                                                    <div className="relative">
                                                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                                        <input
                                                            type="date"
                                                            value={stage.deadline ? new Date(stage.deadline).toISOString().split('T')[0] : ''}
                                                            onChange={(e) => handleUpdateStage(stage.id, { deadline: new Date(e.target.value) })}
                                                            className="w-full bg-subtle-background border-border rounded-xl text-sm font-bold pl-11 pr-4 py-3 focus:ring-2 focus:ring-primary/20"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-text-tertiary mb-2 block">Scope / Detail</label>
                                                    <input
                                                        type="text"
                                                        value={stage.description || ''}
                                                        onChange={(e) => handleUpdateStage(stage.id, { description: e.target.value })}
                                                        placeholder="Describe specific deliverables for this stage..."
                                                        className="w-full bg-subtle-background border-border rounded-xl text-xs p-3"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveStage(stage.id)}
                                                className="opacity-0 group-hover:opacity-100 p-3 rounded-2xl bg-error/5 text-error hover:bg-error hover:text-white transition-all border border-error/10"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}

                                {editedStages.length === 0 && (
                                    <div className="text-center py-20 border-2 border-dashed border-border/40 rounded-[3rem] bg-subtle-background/30">
                                        <CalendarIcon className="w-16 h-16 mx-auto text-text-tertiary opacity-20 mb-4" />
                                        <p className="text-text-secondary font-serif italic italic text-lg tracking-widest uppercase opacity-40">"Timeline sequence is empty"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="py-8 border-t border-border/60 bg-surface flex flex-col md:flex-row justify-between items-center gap-6 mt-8">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.1em]",
                                hasModifications ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : "bg-secondary/10 text-secondary border border-secondary/20"
                            )}>
                                {hasModifications ? (
                                    <>
                                        <ArrowPathIcon className="w-4 h-4 animate-spin-slow" />
                                        Modifications Pending
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="w-4 h-4" />
                                        Registry Synchronized
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <SecondaryButton
                                onClick={onClose}
                                className="px-8 whitespace-nowrap"
                            >
                                Discard Changes
                            </SecondaryButton>

                            {hasModifications ? (
                                <PrimaryButton
                                    onClick={() => onNegotiate(editedStages, notes)}
                                    className="px-8 whitespace-nowrap bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                                    icon={<ArrowPathIcon className="w-5 h-5" />}
                                >
                                    Propose Adjustments
                                </PrimaryButton>
                            ) : (
                                <PrimaryButton
                                    onClick={() => onAccept(editedStages, notes)}
                                    className="px-12 whitespace-nowrap"
                                    icon={<CheckCircleIcon className="w-5 h-5" />}
                                >
                                    Accept Protocol
                                </PrimaryButton>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </>
    );
};

export default ExecutionRequestWizard;
