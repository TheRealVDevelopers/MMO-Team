import React from 'react';
import { XMarkIcon, UserIcon, PhoneIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Lead, LeadPipelineStatus } from '../../../types';
import { formatCurrencyINR, formatDate } from '../../../constants';

interface PipelineDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    stage: string;
    leads: Lead[];
    onLeadClick: (lead: Lead) => void;
}

const PipelineDetailModal: React.FC<PipelineDetailModalProps> = ({ isOpen, onClose, stage, leads, onLeadClick }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 z-[1000] transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>

                <div className="inline-block align-middle bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl w-full relative z-[1010] p-6">
                    <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
                        <div>
                            <h3 className="text-2xl font-serif font-bold text-text-primary">
                                Stage: {stage}
                            </h3>
                            <p className="text-text-secondary mt-1">{leads.length} active leads in this stage.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-subtle-background transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6 text-text-tertiary" />
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {leads.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary italic bg-subtle-background rounded-xl border border-dashed border-border">
                                No active leads found in this stage.
                            </div>
                        ) : (
                            leads.map(lead => (
                                <div
                                    key={lead.id}
                                    onClick={() => onLeadClick(lead)}
                                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-surface border border-border rounded-xl hover:border-primary/50 transition-colors group cursor-pointer"
                                >
                                    <div className="flex-1 min-w-0 mb-3 md:mb-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-lg text-text-primary truncate">{lead.clientName}</h4>
                                            {lead.projectName && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary/10 text-secondary border border-secondary/20">
                                                    {lead.projectName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-xs text-text-tertiary mt-2">
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon className="w-3 h-3" />
                                                Inquiry: {formatDate(lead.inquiryDate)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <UserIcon className="w-3 h-3" />
                                                Source: {lead.source}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs text-text-tertiary uppercase font-black tracking-widest mb-0.5">Potential Value</p>
                                            <p className="text-lg font-serif font-black text-primary">{formatCurrencyINR(lead.value)}</p>
                                        </div>

                                        <div className="p-2 rounded-lg bg-surface group-hover:bg-primary group-hover:text-white transition-colors border border-border group-hover:border-primary group-hover:translate-x-1 transition-all">
                                            <ChevronRightIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PipelineDetailModal;
