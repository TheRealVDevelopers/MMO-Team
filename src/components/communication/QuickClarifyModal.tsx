import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { QuickClarifyQuestion, QuestionCategory, QuestionUrgency } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface QuickClarifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskQuestion: (question: Omit<QuickClarifyQuestion, 'id' | 'channelId' | 'senderId' | 'timestamp'>) => void;
}

const QuickClarifyModal: React.FC<QuickClarifyModalProps> = ({ isOpen, onClose, onAskQuestion }) => {
    const { currentUser } = useAuth();
    const [category, setCategory] = useState<QuestionCategory>(QuestionCategory.DESIGN);
    const [urgency, setUrgency] = useState<QuestionUrgency>(QuestionUrgency.MEDIUM);
    const [regarding, setRegarding] = useState('');
    const [question, setQuestion] = useState('');
    const [deadline, setDeadline] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !question.trim()) return;

        onAskQuestion({
            category,
            urgency,
            regarding,
            question,
            deadline: deadline ? new Date(deadline) : undefined,
        });
        
        // Reset form and close
        setCategory(QuestionCategory.DESIGN);
        setUrgency(QuestionUrgency.MEDIUM);
        setRegarding('');
        setQuestion('');
        setDeadline('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ask a Structured Question" size="2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-primary">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value as QuestionCategory)} className="mt-1 block w-full p-2 border-border bg-subtle-background rounded-md">
                        {Object.values(QuestionCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-primary">Urgency</label>
                    <select value={urgency} onChange={(e) => setUrgency(e.target.value as QuestionUrgency)} className="mt-1 block w-full p-2 border-border bg-subtle-background rounded-md">
                        {Object.values(QuestionUrgency).map(urg => <option key={urg} value={urg}>{urg}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="regarding" className="block text-sm font-medium text-text-primary">Regarding (Project/Client)</label>
                    <input type="text" id="regarding" value={regarding} onChange={e => setRegarding(e.target.value)} className="mt-1 block w-full p-2 border-border bg-subtle-background rounded-md" />
                </div>
                <div>
                    <label htmlFor="question" className="block text-sm font-medium text-text-primary">Question</label>
                    <textarea id="question" value={question} onChange={e => setQuestion(e.target.value)} rows={4} required className="mt-1 block w-full p-2 border-border bg-subtle-background rounded-md" />
                </div>
                 <div>
                    <label htmlFor="deadline" className="block text-sm font-medium text-text-primary">Expected Response By (Optional)</label>
                    <input type="date" id="deadline" value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-1 block w-full p-2 border-border bg-subtle-background rounded-md" />
                </div>
                <div className="pt-4 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-secondary">Submit Question</button>
                </div>
            </form>
        </Modal>
    );
};

export default QuickClarifyModal;
