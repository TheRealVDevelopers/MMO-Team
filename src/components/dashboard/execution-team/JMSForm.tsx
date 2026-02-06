import React, { useState } from 'react';
import {
    CheckCircleIcon,
    PencilSquareIcon,
    CalculatorIcon,
    DocumentCheckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { Item, JMS } from '../../../types';
import { formatCurrencyINR } from '../../../constants';

// Extended item type for JMS usage (fixing property access issues)
interface JMSInputItem extends Item {
    quantity: number; // Ensuring quantity exists for logic
    deliveredQuantity: number;
    remarks: string;
}

interface JMSFormProps {
    projectItems: any[]; // Using any[] to accept both Quotation Items and Catalog Items 
    onSave: (jmsData: any) => void;
    onClose: () => void;
}

const JMSForm: React.FC<JMSFormProps> = ({ projectItems, onSave, onClose }) => {
    // Initialize state with proper mapping
    const [items, setItems] = useState<JMSInputItem[]>(projectItems.map(item => ({
        ...item,
        quantity: item.quantity || 0,
        deliveredQuantity: item.quantity || 0, // Default to quoted quantity
        remarks: ''
    })));
    const [pmSignature, setPmSignature] = useState('');
    const [clientSignature, setClientSignature] = useState('');
    const [step, setStep] = useState(1); // 1: Measure, 2: Sign

    const handleQuantityChange = (id: string, qty: number) => {
        setItems(items.map(i => i.id === id ? { ...i, deliveredQuantity: qty } : i));
    };

    const handleRemarksChange = (id: string, text: string) => {
        setItems(items.map(i => i.id === id ? { ...i, remarks: text } : i));
    };

    const calculateTotalVariance = () => {
        return items.reduce((acc, item) => {
            const variance = (item.deliveredQuantity - item.quantity) * item.price;
            return acc + variance;
        }, 0);
    };

    const renderMeasurementStep = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <CalculatorIcon className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                    <h4 className="font-bold text-blue-900">Measurement Verification</h4>
                    <p className="text-sm text-blue-700">Please verify actual delivered quantities on site. This will be used for the final invoice.</p>
                </div>
            </div>

            <div className="overflow-hidden border border-gray-200 rounded-xl">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Item Description</th>
                            <th className="px-4 py-3 text-center">Unit</th>
                            <th className="px-4 py-3 text-right">Quoted Qty</th>
                            <th className="px-4 py-3 text-right w-32">Actual Qty</th>
                            <th className="px-4 py-3">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                                <td className="px-4 py-3 text-center text-gray-500">{item.unit}</td>
                                <td className="px-4 py-3 text-right text-gray-500">{item.quantity}</td>
                                <td className="px-4 py-3 text-right">
                                    <input
                                        type="number"
                                        value={item.deliveredQuantity}
                                        onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                                        className={`w-full p-2 border rounded-lg text-right font-bold focus:ring-2 focus:outline-none ${item.deliveredQuantity !== item.quantity
                                                ? 'border-orange-300 bg-orange-50 text-orange-800 focus:ring-orange-200'
                                                : 'border-gray-200 focus:ring-primary/20'
                                            }`}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="text"
                                        placeholder="Add notes..."
                                        value={item.remarks}
                                        onChange={(e) => handleRemarksChange(item.id, e.target.value)}
                                        className="w-full p-2 border border-transparent hover:border-gray-200 rounded-lg text-sm focus:border-primary focus:outline-none"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <div>
                    <span className="text-gray-500 text-sm font-medium">Total Variance Value:</span>
                    <span className={`ml-3 text-lg font-bold ${calculateTotalVariance() > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                        {calculateTotalVariance() > 0 ? '+' : ''}{formatCurrencyINR(calculateTotalVariance())}
                    </span>
                </div>
                <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition-colors"
                >
                    Proceed to Signatures
                </button>
            </div>
        </div>
    );

    const renderSignatureStep = () => (
        <div className="space-y-8 text-center max-w-lg mx-auto">
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 mb-8">
                <DocumentCheckIcon className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-emerald-900">Final Verification</h3>
                <p className="text-emerald-700">By signing below, both parties agree to the final measured quantities.</p>
            </div>

            <div className="space-y-6">
                <div className="text-left">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Project Manager Signature</label>
                    <input
                        type="text"
                        placeholder="Type full name to sign"
                        value={pmSignature}
                        onChange={(e) => setPmSignature(e.target.value)}
                        className="w-full p-4 border border-gray-200 rounded-xl font-script text-2xl text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>

                <div className="text-left">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Client Representative Signature</label>
                    <input
                        type="text"
                        placeholder="Type full name to sign"
                        value={clientSignature}
                        onChange={(e) => setClientSignature(e.target.value)}
                        className="w-full p-4 border border-gray-200 rounded-xl font-script text-2xl text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={() => onSave({ items, pmSignature, clientSignature })}
                    disabled={!pmSignature || !clientSignature}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Complete JMS
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Joint Measurement Sheet (JMS)</h2>
                        <p className="text-sm text-gray-500">Project Completion Verification</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {step === 1 ? renderMeasurementStep() : renderSignatureStep()}
                </div>
            </div>
        </div>
    );
};

export default JMSForm;
