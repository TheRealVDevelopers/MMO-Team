import React, { useState, useMemo } from 'react';
import Modal from '../../shared/Modal';
import { Project, ProjectStatus } from '../../../types';
import { CalculatorIcon, CheckCircleIcon, DocumentCheckIcon, XCircleIcon } from '../../icons/IconComponents';

const QuotationDetailModal: React.FC<{ 
    project: Project; 
    isOpen: boolean; 
    onClose: () => void;
    onUpdate: (project: Project) => void;
}> = ({ project, isOpen, onClose, onUpdate }) => {
    
    const [materialCost, setMaterialCost] = useState(project.budget * 0.5);
    const [laborCost, setLaborCost] = useState(project.budget * 0.25);
    const [margin, setMargin] = useState(20); // in percent

    const calculatedQuote = useMemo(() => {
        const totalCost = materialCost + laborCost;
        return totalCost / (1 - (margin / 100));
    }, [materialCost, laborCost, margin]);
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

    const handleStatusChange = (newStatus: ProjectStatus) => {
        onUpdate({ ...project, status: newStatus });
        onClose();
    };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Quotation for: ${project.projectName}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-text-primary">Quotation Builder</h3>
            <div className="p-4 border border-border rounded-md bg-subtle-background space-y-4">
                {/* Material Cost */}
                <div>
                    <label htmlFor="material-cost" className="block text-sm font-medium text-text-primary">Material Cost</label>
                    <input type="number" id="material-cost" value={materialCost} onChange={e => setMaterialCost(Number(e.target.value))} className="mt-1 block w-full p-2 border-border bg-surface text-text-primary rounded-md shadow-sm"/>
                </div>
                {/* Labor Cost */}
                 <div>
                    <label htmlFor="labor-cost" className="block text-sm font-medium text-text-primary">Labor Cost</label>
                    <input type="number" id="labor-cost" value={laborCost} onChange={e => setLaborCost(Number(e.target.value))} className="mt-1 block w-full p-2 border-border bg-surface text-text-primary rounded-md shadow-sm"/>
                </div>
                {/* Profit Margin */}
                <div>
                    <label htmlFor="margin" className="block text-sm font-medium text-text-primary">Profit Margin ({margin}%)</label>
                    <input type="range" id="margin" min="10" max="50" value={margin} onChange={e => setMargin(Number(e.target.value))} className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer"/>
                </div>
                {/* Final Quote */}
                <div className="text-center border-t border-border pt-4">
                    <p className="text-sm text-text-secondary">Calculated Quotation Price</p>
                    <p className="text-3xl font-bold text-secondary">{formatCurrency(calculatedQuote)}</p>
                </div>
            </div>
             <button onClick={() => onUpdate({...project, status: ProjectStatus.QUOTATION_SENT})} className="w-full flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:opacity-90">
                <DocumentCheckIcon className="w-5 h-5 mr-2" />
                Send Quote to Client
            </button>
        </div>

        <div className="md:col-span-1 space-y-4">
            <div className="p-4 border border-border rounded-md">
                <h4 className="font-bold mb-2 flex items-center text-text-primary">Project Details</h4>
                <div className="text-sm space-y-1">
                    <p><span className="font-semibold text-text-secondary">Client:</span> {project.clientName}</p>
                    <p><span className="font-semibold text-text-secondary">Est. Budget:</span> {formatCurrency(project.budget)}</p>
                    <p><span className="font-semibold text-text-secondary">Priority:</span> {project.priority}</p>
                    <p><span className="font-semibold text-text-secondary">Status:</span> {project.status}</p>
                </div>
            </div>
            <div className="p-4 border border-border rounded-md">
                 <h4 className="font-bold mb-2 text-text-primary">Final Decision</h4>
                 <div className="mt-4 grid grid-cols-2 gap-2">
                     <button onClick={() => handleStatusChange(ProjectStatus.APPROVED)} className="w-full flex items-center justify-center py-2 bg-secondary text-white text-xs rounded-md hover:opacity-90">
                        <CheckCircleIcon className="w-4 h-4 mr-1"/> Won
                    </button>
                     <button onClick={() => handleStatusChange(ProjectStatus.REJECTED)} className="w-full flex items-center justify-center py-2 bg-error text-white text-xs rounded-md hover:opacity-90">
                        <XCircleIcon className="w-4 h-4 mr-1"/> Lost
                    </button>
                 </div>
            </div>
        </div>
      </div>
    </Modal>
  );
};

export default QuotationDetailModal;