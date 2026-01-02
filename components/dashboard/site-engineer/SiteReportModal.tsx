import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../../shared/Modal';
// Fix: Add missing 'ExpenseClaim' type import.
import { SiteVisit, SiteMeasurement, ExpenseItem, SiteReport, ExpenseClaimStatus, ExpenseClaim } from '../../../types';
import { CameraIcon, PlusIcon } from '../../icons/IconComponents';
import { formatCurrencyINR } from '../../../constants';

interface SiteReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: SiteVisit;
  onSubmit: (report: SiteReport, expenseClaim?: Omit<ExpenseClaim, 'id'>) => void;
}

const checklists = {
    Office: ['Measure total carpet area', 'Check electrical points', 'Assess plumbing requirements', 'Verify ceiling height', 'Document window locations'],
    Apartment: ['Room-wise measurements (LxBxH)', 'Check electrical switchboard', 'Plumbing inlet/outlet points', 'Door & window conditions', 'Wall surface quality'],
    Other: ['General area assessment', 'Note key features', 'Identify potential issues']
};

const SiteReportModal: React.FC<SiteReportModalProps> = ({ isOpen, onClose, visit, onSubmit }) => {
    const [step, setStep] = useState(1);
    const [checklist, setChecklist] = useState<Record<string, boolean>>({});
    const [measurements, setMeasurements] = useState<SiteMeasurement[]>([{ roomName: 'Main Room', length: 0, width: 0, height: 0 }]);
    const [expenses, setExpenses] = useState<Omit<ExpenseItem, 'id'>[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        // Mock automatic travel expense calculation
        const travelDistance = Math.floor(Math.random() * 50) + 10; // Random distance between 10-60km
        const travelCost = travelDistance * 15; // Mock rate
        setExpenses([{ type: 'Travel', description: `Fuel for ${travelDistance}km`, amount: travelCost }]);
    }, [visit]);


    const totalArea = useMemo(() => measurements.reduce((sum, m) => sum + (m.length * m.width), 0), [measurements]);
    const totalExpense = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
    const currentChecklist = checklists[visit.siteType || 'Other'];

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

    const handleSubmit = () => {
        const report: SiteReport = {
            id: `rep-${visit.id}`,
            visitId: visit.id,
            // Fix: Coerce 'checked' value to boolean to satisfy the type.
            checklistItems: Object.entries(checklist).map(([text, checked]) => ({ text, checked: !!checked })),
            measurements,
            photos: [], // Placeholder
            notes,
        };
        
        let expenseClaim: Omit<ExpenseClaim, 'id'> | undefined;
        if (totalExpense > 0) {
            expenseClaim = {
                visitId: visit.id,
                engineerId: visit.assigneeId,
                submissionDate: new Date(),
                totalAmount: totalExpense,
                status: ExpenseClaimStatus.SUBMITTED,
                items: expenses.map((e, i) => ({ ...e, id: `ei-${Date.now()}-${i}` })),
            };
            report.expenseClaimId = 'temp'; // Link them
        }
        
        onSubmit(report, expenseClaim);
    };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Guided Site Assessment: ${visit.projectName}`} size="4xl">
      <div className="flex space-x-4 mb-6 pb-4 border-b border-border">
          {['Checklist', 'Measurements', 'Expenses', 'Submit'].map((title, index) => (
             <React.Fragment key={title}>
                <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index + 1 <= step ? 'bg-primary text-white' : 'bg-border text-text-secondary'}`}>
                        {index + 1 < step ? '✔' : index + 1}
                    </div>
                    <div className={`ml-3 font-medium ${index + 1 <= step ? 'text-primary' : 'text-text-secondary'}`}>{title}</div>
                </div>
                {index < 3 && <div className="flex-1 border-t border-border self-center"></div>}
             </React.Fragment>
          ))}
      </div>

      {step === 1 && (
        <div>
            <h3 className="font-bold mb-4">{visit.siteType} Site Checklist</h3>
            <div className="space-y-3">
                {currentChecklist.map(item => (
                    <div key={item} className="flex items-center p-2 bg-subtle-background rounded-md">
                        <input id={item} type="checkbox" checked={!!checklist[item]} onChange={e => setChecklist(prev => ({ ...prev, [item]: e.target.checked }))} className="h-4 w-4 text-primary focus:ring-primary border-border rounded" />
                        <label htmlFor={item} className="ml-3 text-sm text-text-primary">{item}</label>
                    </div>
                ))}
            </div>
        </div>
      )}

      {step === 2 && (
         <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold">Measurements</h3>
                <p>Total Area: <span className="font-bold text-primary">{totalArea.toFixed(2)} sq ft</span></p>
            </div>
             {measurements.map((m, i) => (
                 <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end p-2 bg-subtle-background rounded-md">
                     <input value={m.roomName} onChange={e => handleMeasurementChange(i, 'roomName', e.target.value)} placeholder="Room Name" className="p-2 border-border bg-surface text-text-primary rounded-md" />
                     <input type="number" value={m.length} onChange={e => handleMeasurementChange(i, 'length', e.target.value)} placeholder="Length (ft)" className="p-2 border-border bg-surface text-text-primary rounded-md" />
                     <input type="number" value={m.width} onChange={e => handleMeasurementChange(i, 'width', e.target.value)} placeholder="Width (ft)" className="p-2 border-border bg-surface text-text-primary rounded-md" />
                     <input type="number" value={m.height} onChange={e => handleMeasurementChange(i, 'height', e.target.value)} placeholder="Height (ft)" className="p-2 border-border bg-surface text-text-primary rounded-md" />
                 </div>
             ))}
             <button onClick={addRoom} className="text-sm font-medium text-primary hover:underline">+ Add another room</button>
         </div>
      )}

      {step === 3 && (
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">Expense Tracking</h3>
                <p>Total Claim: <span className="font-bold text-primary">{formatCurrencyINR(totalExpense)}</span></p>
            </div>
            {expenses.map((exp, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-subtle-background rounded-md">
                    <select value={exp.type} onChange={e => handleExpenseChange(i, 'type', e.target.value)} className="p-2 border-border bg-surface rounded-md">
                        <option>Travel</option><option>Parking</option><option>Materials</option><option>Other</option>
                    </select>
                     <input value={exp.description} onChange={e => handleExpenseChange(i, 'description', e.target.value)} placeholder="Description" className="p-2 border-border bg-surface rounded-md" />
                     <input type="number" value={exp.amount} onChange={e => handleExpenseChange(i, 'amount', Number(e.target.value))} placeholder="Amount (INR)" className="p-2 border-border bg-surface rounded-md" />
                </div>
            ))}
             <button onClick={addExpense} className="text-sm font-medium text-primary hover:underline">+ Add expense item</button>
          </div>
      )}
      
      {step === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <h3 className="font-bold mb-2">Review & Submit</h3>
                 <div className="space-y-2 text-sm p-3 bg-subtle-background rounded-md">
                    <p><strong>Checklist:</strong> {Object.values(checklist).filter(Boolean).length} / {currentChecklist.length} items completed.</p>
                    <p><strong>Total Area Measured:</strong> {totalArea.toFixed(2)} sq ft.</p>
                    <p><strong>Total Expenses:</strong> {formatCurrencyINR(totalExpense)}</p>
                 </div>
                 <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add final notes or summary..." className="mt-4 w-full p-2 border-border bg-surface rounded-md" />
              </div>
               <div>
                  <h3 className="font-bold mb-2">Photo Upload</h3>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                          <CameraIcon className="mx-auto h-12 w-12 text-text-secondary" />
                          <div className="flex text-sm text-text-secondary">
                              <label htmlFor="file-upload" className="relative cursor-pointer bg-surface rounded-md font-medium text-primary hover:text-secondary">
                                  <span>Upload photos</span>
                                  <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple/>
                              </label>
                              <p className="pl-1">or drag and drop</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}


      <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
          <button onClick={() => setStep(s => Math.max(1, s-1))} disabled={step === 1} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background disabled:opacity-50">Back</button>
           {step < 4 ? (
               <button onClick={() => setStep(s => Math.min(4, s+1))} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-secondary">Next</button>
           ) : (
                <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:opacity-90">Submit Report</button>
           )}
      </div>

    </Modal>
  );
};

export default SiteReportModal;