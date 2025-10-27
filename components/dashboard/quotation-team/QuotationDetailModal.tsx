import React, { useState, useMemo } from 'react';
import Modal from '../../shared/Modal';
import { Project, ProjectStatus, Item } from '../../../types';
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
    
    const [step, setStep] = useState(1);
    const [selectedItems, setSelectedItems] = useState<Item[]>([]);
    const [laborCost, setLaborCost] = useState(project.budget * 0.25);
    const [margin, setMargin] = useState(20);

    const materialCost = useMemo(() => selectedItems.reduce((sum, item) => sum + item.price, 0), [selectedItems]);
    const calculatedQuote = useMemo(() => (materialCost + laborCost) / (1 - (margin / 100)), [materialCost, laborCost, margin]);
    
    const handleStatusChange = (newStatus: ProjectStatus) => {
        onUpdate({ ...project, status: newStatus, budget: calculatedQuote });
        onClose();
    };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Quotation Builder: ${project.projectName}`} size="4xl">
      <div className="flex space-x-4 mb-6 pb-4 border-b border-border">
          <Step title="Select Items" stepNumber={1} activeStep={step} />
          <div className="flex-1 border-t border-border self-center"></div>
          <Step title="Price & Margin" stepNumber={2} activeStep={step} />
          <div className="flex-1 border-t border-border self-center"></div>
          <Step title="Generate Quote" stepNumber={3} activeStep={step} />
      </div>

      {step === 1 && (
        <div className="grid grid-cols-3 gap-4 h-[50vh]">
            <div className="col-span-1 border-r border-border pr-4">
                <h4 className="font-bold text-sm mb-2">Item Categories</h4>
                <ul className="text-sm space-y-1">
                    {['Workstations', 'Chairs', 'Storage', 'Lighting'].map(cat => <li key={cat}><a href="#" className="block p-1 rounded hover:bg-subtle-background">{cat}</a></li>)}
                </ul>
            </div>
            <div className="col-span-2 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-2">
                    {ITEMS.map(item => (
                        <div key={item.id} className="border border-border rounded-md p-2 flex flex-col">
                            <img src={item.imageUrl} alt={item.name} className="h-20 w-full object-cover rounded-sm" />
                            <p className="text-xs font-bold mt-2">{item.name}</p>
                            <p className="text-xs text-text-secondary">{item.category}</p>
                            <div className="flex justify-between items-center mt-auto pt-2">
                                <p className="text-sm font-bold">{formatCurrencyINR(item.price)}</p>
                                <button onClick={() => setSelectedItems(prev => [...prev, item])} className="p-1 bg-primary-subtle-background rounded-full text-primary hover:bg-primary/30"><PlusIcon className="w-3 h-3"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {step === 2 && (
          <div className="grid grid-cols-2 gap-6">
              <div className="border-r border-border pr-6">
                 <h4 className="font-bold text-sm mb-2">Selected Items</h4>
                 <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {selectedItems.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="flex justify-between items-center bg-subtle-background p-2 rounded-md text-sm">
                            <span>{item.name}</span>
                            <span className="font-medium">{formatCurrencyINR(item.price)}</span>
                        </div>
                    ))}
                 </div>
              </div>
              <div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="material-cost" className="block text-sm font-medium text-text-primary">Material Cost</label>
                        <input type="text" id="material-cost" value={formatCurrencyINR(materialCost)} readOnly className="mt-1 block w-full p-2 border-border bg-border text-text-primary rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="labor-cost" className="block text-sm font-medium text-text-primary">Labor Cost</label>
                        <input type="number" id="labor-cost" value={laborCost} onChange={e => setLaborCost(Number(e.target.value))} className="mt-1 block w-full p-2 border-border bg-surface text-text-primary rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="margin" className="block text-sm font-medium text-text-primary">Profit Margin ({margin}%)</label>
                        <input type="range" id="margin" min="10" max="50" value={margin} onChange={e => setMargin(Number(e.target.value))} className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer"/>
                    </div>
                </div>
              </div>
          </div>
      )}

      {step === 3 && (
          <div className="text-center">
              <p className="text-lg text-text-secondary">Final Quotation Price</p>
              <p className="text-5xl font-bold text-secondary my-4">{formatCurrencyINR(calculatedQuote)}</p>
               <div className="mt-8 grid grid-cols-2 gap-2">
                 <button onClick={() => handleStatusChange(ProjectStatus.QUOTATION_SENT)} className="w-full flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:opacity-90">
                    <DocumentCheckIcon className="w-5 h-5 mr-2" />
                    Send to Client
                </button>
                 <button onClick={() => handleStatusChange(ProjectStatus.APPROVED)} className="w-full flex items-center justify-center py-2 bg-secondary text-white text-sm rounded-md hover:opacity-90">
                    <CheckCircleIcon className="w-5 h-5 mr-2"/> Mark as Won
                </button>
             </div>
          </div>
      )}

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
          <button onClick={() => setStep(s => Math.max(1, s-1))} disabled={step === 1} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background disabled:opacity-50">Back</button>
           <button onClick={() => setStep(s => Math.min(3, s+1))} disabled={step === 3} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700 disabled:opacity-50">Next</button>
      </div>

    </Modal>
  );
};

export default QuotationDetailModal;