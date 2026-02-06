import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSiteVisitInitiation } from '../../../hooks/useSiteVisitInitiation';
import Modal from '../../shared/Modal';
import { MapPinIcon, CalendarDaysIcon, UserIcon } from '../../icons/IconComponents';
import SmartDateTimePicker from '../../shared/SmartDateTimePicker';

interface InitiateSiteVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  clientName: string;
  organizationId: string;
  onSuccess?: () => void;
}

const InitiateSiteVisitModal: React.FC<InitiateSiteVisitModalProps> = ({
  isOpen,
  onClose,
  caseId,
  clientName,
  organizationId,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const { initiateSiteVisit, loading, error } = useSiteVisitInitiation();
  
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !preferredDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await initiateSiteVisit({
        organizationId,
        caseId,
        requesterId: currentUser.id,
        requesterName: currentUser.name
      });

      // Add notes as activity if provided
      if (notes.trim()) {
        // TODO: Add activity logging here
        console.log('Site visit notes:', notes);
      }

      alert('✅ Site visit request initiated successfully!');
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form and close
      setPreferredDate('');
      setNotes('');
      onClose();
      
    } catch (err: any) {
      console.error('Failed to initiate site visit:', err);
      alert(`Failed to initiate site visit: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setPreferredDate('');
      setNotes('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Initiate Site Visit"
      size="lg"
    >
      <div className="space-y-6">
        {/* Client Info Header */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPinIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">{clientName}</h3>
              <p className="text-sm text-text-secondary">Case ID: {caseId}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-3">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-text-secondary mb-2 flex items-center gap-2">
              <CalendarDaysIcon className="w-4 h-4" />
              Preferred Visit Date
            </label>
            <SmartDateTimePicker
              value={preferredDate}
              onChange={setPreferredDate}
              placeholder="Select preferred date and time"
              variant="compact"
              required
            />
            <p className="text-xs text-text-tertiary mt-1">
              This will be used for scheduling but can be adjusted later
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-text-secondary mb-2 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions, site access details, or client preferences..."
              className="w-full rounded-xl border-border bg-subtle-background focus:ring-primary focus:border-primary text-sm py-3 px-4 min-h-[100px]"
              rows={3}
            />
          </div>

          {/* What happens next */}
          <div className="bg-subtle-background/50 border border-border/50 rounded-xl p-4">
            <h4 className="font-bold text-text-secondary text-sm mb-2">What happens after submission:</h4>
            <ul className="text-xs text-text-tertiary space-y-1">
              <li>• Case status will update to "SITE_VISIT"</li>
              <li>• Site visit task will be created for Site Engineer</li>
              <li>• Request will appear in Admin/Manager inbox</li>
              <li>• Site Engineer will be notified</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-border rounded-xl text-text-secondary hover:bg-subtle-background transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !preferredDate}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Initiating...
                </>
              ) : (
                <>
                  <MapPinIcon className="w-4 h-4" />
                  Initiate Site Visit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default InitiateSiteVisitModal;