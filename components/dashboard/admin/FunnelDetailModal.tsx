import React from 'react';
import { XMarkIcon, UserIcon, PhoneIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Project, ProjectStatus } from '../../../types';
import { formatCurrencyINR, formatDate } from '../../../constants';

interface FunnelDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadStage: string;
    leads: Project[];
}

const FunnelDetailModal: React.FC<FunnelDetailModalProps> = ({ isOpen, onClose, leadStage, leads }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 z-[100] transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>

                <div className="inline-block align-middle bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl w-full relative z-[101] p-6">
                    <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
                        <div>
                            <h3 className="text-2xl font-serif font-bold text-text-primary">
                                Sales Funnel: {leadStage}
                            </h3>
                            <p className="text-text-secondary mt-1">{leads.length} active opportunities in this stage.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-subtle-background transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6 text-text-tertiary" />
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {leads.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary italic bg-subtle-background rounded-xl border border-dashed border-border">
                                No active leads found in this stage.
                            </div>
                        ) : (
                            leads.map(lead => (
                                <div key={lead.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-surface border border-border rounded-xl hover:border-primary/50 transition-colors group">
                                    <div className="flex-1 min-w-0 mb-3 md:mb-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-lg text-text-primary truncate">{lead.projectName}</h4>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-surface border border-border text-text-secondary">
                                                {lead.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary font-medium mb-2">{lead.clientName}</p>

                                        <div className="flex flex-wrap gap-4 text-xs text-text-tertiary">
                                            <span className="flex items-center gap-1">
                                                <UserIcon className="w-3 h-3" />
                                                {lead.clientAddress || 'Location unknown'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <PhoneIcon className="w-3 h-3" />
                                                Lead Source: {lead.id.substring(0, 4)}...
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs text-text-tertiary uppercase font-black tracking-widest mb-0.5">EST. Value</p>
                                            <p className="text-lg font-serif font-black text-primary">{formatCurrencyINR(lead.budget)}</p>
                                        </div>

                                        <button className="p-2 rounded-lg bg-surface hover:bg-primary hover:text-white transition-colors border border-border hover:border-primary group-hover:translate-x-1 transition-transform">
                                            <ChevronRightIcon className="w-5 h-5" />
                                        </button>
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

export default FunnelDetailModal;
