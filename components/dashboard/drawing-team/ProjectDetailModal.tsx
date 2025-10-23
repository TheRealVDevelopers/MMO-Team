import React from 'react';
import Modal from '../../shared/Modal';
import { Project } from '../../../types';
import { ClockIcon, FireIcon, PaperClipIcon, PlusIcon } from '../../icons/IconComponents';

const ProjectDetailModal: React.FC<{ project: Project; isOpen: boolean; onClose: () => void }> = ({ project, isOpen, onClose }) => {
  const checklistItems = [
    "Site measurements & photos received",
    "Initial sketch / floor plan",
    "3D rendering created",
    "Material specifications listed",
    "Final design package compiled",
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project.projectName}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
            {/* Project Header */}
            <div>
                 <h3 className="text-lg font-bold text-text-primary">{project.clientName}</h3>
                 <div className="flex items-center space-x-4 text-sm text-text-secondary mt-1">
                    {project.priority === 'High' && <div className="flex items-center text-error"><FireIcon className="w-4 h-4 mr-1"/> High Priority</div>}
                    <div className="flex items-center"><ClockIcon className="w-4 h-4 mr-1"/> Deadline: {project.deadline}</div>
                    <div>Budget: ${project.budget.toLocaleString()}</div>
                 </div>
            </div>

            {/* Design Checklist */}
            <div className="border-t border-border pt-3">
                <h4 className="font-bold mb-2">Design Checklist</h4>
                <ul className="space-y-2 text-sm">
                    {checklistItems.map((item, index) => (
                         <li key={item} className="flex items-center p-2 bg-subtle-background rounded-md">
                            <input id={`check-${index}`} type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-border bg-transparent rounded" defaultChecked={index < 2} /> 
                            <label htmlFor={`check-${index}`} className="ml-3 text-text-primary">{item}</label>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        <div className="md:col-span-1 space-y-4">
            {/* Attached Files */}
            <div>
                <h4 className="font-bold mb-2 flex items-center"><PaperClipIcon className="w-4 h-4 mr-1.5" /> Attached Files</h4>
                <ul className="space-y-1.5 text-sm">
                    <li><a href="#" className="text-primary hover:underline">site_measurements.pdf</a></li>
                    <li><a href="#" className="text-primary hover:underline">client_brief_v2.docx</a></li>
                    <li><a href="#" className="text-primary hover:underline">reference_images.zip</a></li>
                </ul>
            </div>
            {/* Quick Actions */}
            <div className="border-t border-border pt-3 space-y-2">
                <h4 className="font-bold mb-2">Actions</h4>
                <button className="w-full flex items-center justify-center px-3 py-2 border border-border text-sm font-medium rounded-md shadow-sm hover:bg-subtle-background">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Upload Design Files
                </button>
                <button className="w-full flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:opacity-90">
                    Mark Design Complete
                </button>
            </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProjectDetailModal;
