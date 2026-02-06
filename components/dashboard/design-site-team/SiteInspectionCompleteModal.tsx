import React, { useState } from 'react';
import Modal from '../../shared/Modal';
import { PrimaryButton, cn } from '../shared/DashboardUI';
import { ClockIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface SiteInspectionCompleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: SiteInspectionData) => Promise<void>;
    projectName?: string;
}

export interface SiteInspectionData {
    startTime: string;
    endTime: string;
    totalDistance: number;
    notes?: string;
}

const SiteInspectionCompleteModal: React.FC<SiteInspectionCompleteModalProps> = ({
    isOpen,
    onClose,
    onComplete,
    projectName
}) => {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [totalDistance, setTotalDistance] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!startTime) {
            setError('Please enter the start time');
            return;
        }
        if (!endTime) {
            setError('Please enter the end time');
            return;
        }
        if (!totalDistance || parseFloat(totalDistance) < 0) {
            setError('Please enter a valid distance');
            return;
        }

        // Validate end time is after start time
        if (new Date(`2000-01-01T${endTime}`) <= new Date(`2000-01-01T${startTime}`)) {
            setError('End time must be after start time');
            return;
        }

        setProcessing(true);
        try {
            await onComplete({
                startTime,
                endTime,
                totalDistance: parseFloat(totalDistance),
                notes: notes.trim() || undefined
            });
            resetForm();
            onClose();
        } catch (err) {
            console.error('Error completing inspection:', err);
            setError('Failed to complete inspection. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const resetForm = () => {
        setStartTime('');
        setEndTime('');
        setTotalDistance('');
        setNotes('');
        setError('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Complete Site Inspection"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <MapPinIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary">{projectName || 'Site Inspection'}</h3>
                        <p className="text-sm text-text-secondary">Please fill in the inspection details</p>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-error/10 text-error rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-4">
                    <p className="text-sm text-text-secondary">
                        <span className="font-bold text-primary">Note:</span> Travel time is automatically calculated based on when you started and ended this task.
                        Please only enter the total distance traveled.
                    </p>
                </div>

                {/* Distance Field */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-tertiary mb-2">
                        <MapPinIcon className="w-4 h-4 inline mr-1" />
                        Total Distance (km) *
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={totalDistance}
                        onChange={(e) => setTotalDistance(e.target.value)}
                        placeholder="e.g., 15.5"
                        className="w-full px-4 py-3 bg-subtle-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg font-bold"
                        required
                        autoFocus
                    />
                </div>

                {/* Notes Field */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-tertiary mb-2">
                        Inspection Notes (Optional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any observations or notes from the site visit..."
                        rows={3}
                        className="w-full px-4 py-3 bg-subtle-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={() => {
                            resetForm();
                            onClose();
                        }}
                        className="px-6 py-2.5 rounded-xl text-text-secondary hover:bg-subtle-background transition-all font-medium"
                    >
                        Cancel
                    </button>
                    <PrimaryButton
                        type="submit"
                        disabled={processing}
                        icon={<CheckCircleIcon className="w-5 h-5" />}
                    >
                        {processing ? 'Processing...' : 'Complete Inspection'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
};

export default SiteInspectionCompleteModal;
