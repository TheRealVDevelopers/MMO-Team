import React, { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import { Lead, UserRole } from '../../../types';
import { USERS } from '../../../constants';
import { CheckCircleIcon } from '../../icons/IconComponents';

interface TaskAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  taskType: UserRole | null;
  onUpdateLead: (updatedLead: Lead) => void;
}

const TaskAssignmentModal: React.FC<TaskAssignmentModalProps> = ({ isOpen, onClose, lead, taskType, onUpdateLead }) => {
    const [assigneeId, setAssigneeId] = useState('');
    const [notes, setNotes] = useState('');
    const [deadline, setDeadline] = useState('');

    const team = USERS.filter(u => u.role === taskType);

    useEffect(() => {
        if(team.length > 0) {
            setAssigneeId(team[0].id);
        }
    }, [taskType]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assigneeId) return;

        const history = {
            action: `Task assigned to ${taskType}`,
            user: USERS.find(u => u.id === lead.assignedTo)?.name || 'Sales',
            timestamp: new Date(),
            notes: `Assigned to ${USERS.find(u => u.id === assigneeId)?.name}. Notes: ${notes}`
        };

        // This is a mock implementation. In a real app, you'd send this to a backend.
        console.log(`Creating task for ${taskType} for lead ${lead.id}`);

        onUpdateLead({ ...lead, history: [...lead.history, history] });
        handleClose();
    };
    
    const handleClose = () => {
        setAssigneeId(team[0]?.id || '');
        setNotes('');
        setDeadline('');
        onClose();
    };

    if (!taskType) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Assign Task to ${taskType}`} size="2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">1. Assign to Team Member</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {team.map(user => (
                            <button key={user.id} type="button" onClick={() => setAssigneeId(user.id)} className={`relative text-left p-2 rounded-lg border-2 ${assigneeId === user.id ? 'border-primary bg-primary-subtle-background' : 'border-border bg-surface hover:bg-subtle-background'}`}>
                                <div className="flex items-center space-x-2">
                                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                    <div><p className="text-xs font-bold text-text-primary">{user.name}</p></div>
                                </div>
                                {assigneeId === user.id && <CheckCircleIcon className="w-5 h-5 text-primary absolute top-1 right-1" />}
                            </button>
                        ))}
                    </div>
                </div>

                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-text-primary">2. Instructions / Notes</label>
                    <textarea id="notes" rows={4} value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-surface" placeholder={`Provide specific details for the ${taskType}...`} />
                </div>

                <div>
                    <label htmlFor="deadline" className="block text-sm font-medium text-text-primary">3. Set a Deadline (Optional)</label>
                    <input type="date" id="deadline" value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border bg-surface focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"/>
                </div>

                <div className="pt-4 flex justify-end space-x-2">
                    <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700" disabled={!assigneeId}>Assign Task</button>
                </div>

            </form>
        </Modal>
    );
};

export default TaskAssignmentModal;
