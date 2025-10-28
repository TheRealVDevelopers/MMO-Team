import React, { useState } from 'react';
import Card from '../shared/Card';
import { ArrowLeftIcon } from '../icons/IconComponents';
// Fix: Import `USERS` constant from `constants.ts` instead of `types.ts`.
import { ComplaintType, ComplaintPriority, UserRole } from '../../types';
import { PROJECTS, USERS } from '../../constants';

const EscalateIssuePage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [complaintType, setComplaintType] = useState<ComplaintType>(ComplaintType.COMMUNICATION_BREAKDOWN);
    const [priority, setPriority] = useState<ComplaintPriority>(ComplaintPriority.MEDIUM);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 text-center">
                <Card>
                    <h2 className="text-2xl font-bold text-secondary">Complaint Submitted</h2>
                    <p className="mt-2 text-text-secondary">Your escalation has been received and will be reviewed by management. You will be notified of any status updates.</p>
                    <button 
                        onClick={() => setCurrentPage('my-day')} 
                        className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Return to Dashboard
                    </button>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentPage('my-day')}
                    className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <h2 className="text-2xl font-bold text-text-primary">Escalate an Issue</h2>
            </div>
            <Card>
                <div className="prose prose-sm max-w-none text-text-secondary">
                    <h3 className="font-bold text-text-primary">Pre-Complaint Requirements</h3>
                    <p>Before submitting a formal complaint, please ensure you have met the following criteria to encourage professional resolution first:</p>
                    <ul>
                        <li>You must have attempted to resolve the issue through normal channels (chat, tasks, etc.).</li>
                        <li>A minimum of <strong>2 follow-ups</strong> must have been made.</li>
                        <li>You must be prepared to provide documented evidence (chat logs, emails).</li>
                        <li>A <strong>24-hour waiting period</strong> must have passed since your last follow-up attempt.</li>
                    </ul>
                </div>
            </Card>
            <Card>
                <h3 className="text-lg font-bold">Formal Complaint Escalation Form</h3>
                <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-text-primary">Complaint Type</label>
                        <select value={complaintType} onChange={(e) => setComplaintType(e.target.value as ComplaintType)} className="mt-1 block w-full p-2 border-border bg-subtle-background rounded-md shadow-sm focus:ring-primary focus:border-primary">
                            {Object.values(ComplaintType).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-primary">Priority Level</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value as ComplaintPriority)} className="mt-1 block w-full p-2 border-border bg-subtle-background rounded-md shadow-sm focus:ring-primary focus:border-primary">
                            {Object.values(ComplaintPriority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-primary">Against (Team Member/Department)</label>
                         <select className="mt-1 block w-full p-2 border-border bg-subtle-background rounded-md shadow-sm focus:ring-primary focus:border-primary">
                            <optgroup label="Departments">
                                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                            </optgroup>
                            <optgroup label="Team Members">
                                {USERS.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                            </optgroup>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-primary">Project/Context</label>
                        <select className="mt-1 block w-full p-2 border-border bg-subtle-background rounded-md shadow-sm focus:ring-primary focus:border-primary">
                             {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                        </select>
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-primary">Issue Description</label>
                        <textarea rows={4} placeholder="What is the specific problem? How is it impacting work?" className="mt-1 block w-full p-2 border-border bg-subtle-background rounded-md shadow-sm focus:ring-primary focus:border-primary"/>
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-primary">Previous Resolution Attempts</label>
                        <textarea rows={3} placeholder="Date and method of first contact, follow-ups, and response received (if any)." className="mt-1 block w-full p-2 border-border bg-subtle-background rounded-md shadow-sm focus:ring-primary focus:border-primary"/>
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-primary">Evidence Attachments (Notes)</label>
                        <textarea rows={2} placeholder="Briefly describe the evidence you have (e.g., 'Chat logs from 2 days ago'). You will be asked to provide it later." className="mt-1 block w-full p-2 border-border bg-subtle-background rounded-md shadow-sm focus:ring-primary focus:border-primary"/>
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-primary">Desired Resolution</label>
                        <textarea rows={2} placeholder="e.g., Immediate action required, Process improvement needed, Management intervention" className="mt-1 block w-full p-2 border-border bg-subtle-background rounded-md shadow-sm focus:ring-primary focus:border-primary"/>
                    </div>
                    <div className="md:col-span-2 text-right">
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700">Submit Complaint</button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EscalateIssuePage;