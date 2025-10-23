import React from 'react';
import Modal from '../../shared/Modal';
import { SiteVisit } from '../../../types';
import { CameraIcon } from '../../icons/IconComponents';

interface SiteReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: SiteVisit;
}

const SiteReportModal: React.FC<SiteReportModalProps> = ({ isOpen, onClose, visit }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Site Report for ${visit.projectName}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold">Site Visit Form</h3>
          <form className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="length" className="block text-sm font-medium text-text-primary">Room Length (ft)</label>
                    <input type="number" id="length" className="mt-1 block w-full p-2 border-border bg-surface text-text-primary rounded-md shadow-sm"/>
                </div>
                 <div>
                    <label htmlFor="width" className="block text-sm font-medium text-text-primary">Room Width (ft)</label>
                    <input type="number" id="width" className="mt-1 block w-full p-2 border-border bg-surface text-text-primary rounded-md shadow-sm"/>
                </div>
            </div>
            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-text-primary">Site Notes</label>
                <textarea id="notes" rows={4} className="mt-1 block w-full p-2 border-border bg-surface text-text-primary rounded-md shadow-sm" placeholder="e.g., existing power outlets, window placements..."></textarea>
            </div>
             <div>
                <label htmlFor="expenses" className="block text-sm font-medium text-text-primary">Travel Expenses ($)</label>
                <input type="number" id="expenses" className="mt-1 block w-full p-2 border-border bg-surface text-text-primary rounded-md shadow-sm" placeholder="e.g., petrol, parking"/>
            </div>
            <button type="submit" onClick={onClose} className="w-full bg-primary text-white py-2 rounded-md hover:opacity-90">Submit Report</button>
          </form>
        </div>
        <div>
          <h3 className="text-lg font-bold">Photo Upload</h3>
          <div className="mt-4">
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <CameraIcon className="mx-auto h-12 w-12 text-text-secondary" />
                    <div className="flex text-sm text-text-secondary">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-surface rounded-md font-medium text-primary hover:text-blue-700 focus-within:outline-none">
                            <span>Upload photos</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple/>
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-text-secondary">PNG, JPG up to 10MB</p>
                </div>
            </div>
            <div className="mt-4">
                <p className="text-sm font-medium">Uploaded Files:</p>
                <p className="text-sm text-text-secondary mt-2">No files uploaded yet.</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SiteReportModal;