import React, { useState, useEffect, useRef } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, Timestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Case, CaseStatus, TaskType, TaskStatus } from '../../types';
import { formatCurrencyINR, safeDate, FIRESTORE_COLLECTIONS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useCases } from '../../hooks/useCases';
import { useCaseTasks } from '../../hooks/useCaseTasks';
import { useCaseDocuments } from '../../hooks/useCaseDocuments';

interface CaseManagementPageProps {
  caseId: string;
  organizationId: string;
  onClose: () => void;
}

const PROJECT_STAGES = [
  { id: 1, name: 'Initial Consultation', icon: '📋' },
  { id: 2, name: 'Site Visit', icon: '🏗️' },
  { id: 3, name: 'Design & Planning', icon: '✏️' },
  { id: 4, name: 'Quotation', icon: '💰' },
  { id: 5, name: 'Approval', icon: '✅' },
  { id: 6, name: 'Procurement', icon: '📦' },
  { id: 7, name: 'Execution', icon: '🔨' },
  { id: 8, name: 'Completion', icon: '🎉' },
];

const CaseManagementPage: React.FC<CaseManagementPageProps> = ({ caseId, organizationId, onClose }) => {
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use Case hooks with correct parameters
  const { cases, updateCase, loading: casesLoading } = useCases({ organizationId });
  const { tasks, createTask, loading: tasksLoading } = useCaseTasks({ caseId, organizationId });
  const { documents, uploadDocument, loading: docsLoading } = useCaseDocuments({ caseId, organizationId });

  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'files' | 'milestones'>('overview');

  // Milestone management
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [milestoneNotes, setMilestoneNotes] = useState('');
  const [milestoneDeadline, setMilestoneDeadline] = useState('');
  const [milestoneStatus, setMilestoneStatus] = useState<'pending' | 'in-progress' | 'completed'>('pending');
  const [updatingMilestone, setUpdatingMilestone] = useState(false);

  // Load case data
  useEffect(() => {
    if (cases.length > 0 && caseId) {
      const foundCase = cases.find(c => c.id === caseId);
      if (foundCase) {
        setCurrentCase(foundCase);
        setLoading(false);
      }
    }
  }, [cases, caseId]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (loading || casesLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-center text-text-secondary">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <p className="text-center text-error">Case not found</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // BUTTON FORENSICS: Document all button actions
  const handleAssignLead = async (assigneeId: string) => {
    // Page: CaseManagementPage
    // Handler: handleAssignLead
    // Firestore write: updateCase with assignedSales
    // Navigation target: None (in-place update)
    // Workflow trigger: None
    
    try {
      await updateCase(caseId, {
        assignedSales: assigneeId,
        status: CaseStatus.SITE_VISIT, // Using existing status
        updatedAt: new Date(),
        createdBy: currentUser?.id || 'system'
      });
      
      // Log activity
      await logActivity(caseId, `Assigned to ${assigneeId}`, currentUser?.id || 'system');
      
    } catch (error) {
      console.error('Error assigning case:', error);
      alert('Failed to assign case');
    }
  };

  const handleInitiateSiteVisit = async () => {
    // Page: CaseManagementPage
    // Handler: handleInitiateSiteVisit
    // Firestore write: updateCase status + create CaseTask + create ApprovalRequest
    // Navigation target: None (in-place update)
    // Workflow trigger: None (manual for now)
    
    try {
      // Update case status
      await updateCase(caseId, {
        status: CaseStatus.SITE_VISIT,
        updatedAt: new Date(),
        createdBy: currentUser?.id || 'system'
      });

      // Create site visit task
      await createTask({
        caseId: caseId,
        type: TaskType.SITE_VISIT,
        assignedTo: currentCase.assignedSales || '',
        assignedBy: currentUser?.id || 'system',
        status: TaskStatus.PENDING,
        notes: `Site visit for ${currentCase.clientName}`
      });

      // Create approval request
      await createApprovalRequest(caseId, 'SITE_VISIT', currentUser?.id || 'system');

      // Log activity
      await logActivity(caseId, 'Site visit initiated', currentUser?.id || 'system');
      
    } catch (error) {
      console.error('Error initiating site visit:', error);
      alert('Failed to initiate site visit');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      // For now, we'll store messages in a simple array on the case
      // In a real implementation, this would be a separate subcollection
      const message = {
        id: Date.now().toString(),
        message: newMessage,
        senderId: currentUser?.id || '',
        senderName: currentUser?.name || 'Unknown',
        timestamp: new Date(),
        read: false
      };

      await updateCase(caseId, {
        updatedAt: new Date(),
        createdBy: currentUser?.id || 'system'
      });

      setNewMessage('');
      await logActivity(caseId, 'Message sent', currentUser?.id || 'system');
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Mock upload for now - in real implementation this would use uploadDocument
        console.log('Would upload file:', file.name);
      }
      
      await logActivity(caseId, `${files.length} file(s) uploaded`, currentUser?.id || 'system');
      
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCreateMilestone = async () => {
    if (!milestoneDeadline || updatingMilestone) return;

    setUpdatingMilestone(true);
    try {
      const milestone = {
        id: Date.now().toString(),
        stage: selectedStage,
        stageName: PROJECT_STAGES.find(s => s.id === selectedStage)?.name || '',
        notes: milestoneNotes,
        deadline: new Date(milestoneDeadline),
        status: milestoneStatus,
        createdAt: new Date()
      };

      await updateCase(caseId, {
        updatedAt: new Date(),
        createdBy: currentUser?.id || 'system'
      });

      // Reset form
      setMilestoneNotes('');
      setMilestoneDeadline('');
      setMilestoneStatus('pending');
      await logActivity(caseId, `Milestone created: ${milestone.stageName}`, currentUser?.id || 'system');
      
    } catch (error) {
      console.error('Error creating milestone:', error);
      alert('Failed to create milestone');
    } finally {
      setUpdatingMilestone(false);
    }
  };

  const logActivity = async (caseId: string, action: string, userId: string) => {
    if (!db) return;
    
    try {
      const activitiesRef = collection(
        db,
        FIRESTORE_COLLECTIONS.ORGANIZATIONS,
        organizationId,
        FIRESTORE_COLLECTIONS.CASES,
        caseId,
        FIRESTORE_COLLECTIONS.ACTIVITIES
      );

      await addDoc(activitiesRef, {
        action,
        by: userId,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  const createApprovalRequest = async (caseId: string, requestType: string, requesterId: string) => {
    if (!db) return;
    
    try {
      const approvalsRef = collection(
        db,
        FIRESTORE_COLLECTIONS.ORGANIZATIONS,
        organizationId,
        'approvals'
      );

      await addDoc(approvalsRef, {
        caseId,
        requestType,
        requesterId,
        status: 'PENDING',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error creating approval request:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-text-primary">{currentCase.clientName}</h2>
            <p className="text-sm text-text-secondary">
              {currentCase.isProject ? 'Project' : 'Lead'} • {currentCase.status}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-subtle-background transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-text-secondary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['overview', 'chat', 'files', 'milestones'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status and Assignment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-subtle-background p-4 rounded-xl">
                  <h3 className="font-bold text-text-primary mb-3">Status</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      currentCase.status === CaseStatus.LEAD ? 'bg-blue-100 text-blue-800' :
                      currentCase.status === CaseStatus.SITE_VISIT ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {currentCase.status}
                    </span>
                  </div>
                  
                  {!currentCase.assignedSales && (
                    <button
                      onClick={() => handleAssignLead(currentUser?.id || '')}
                      className="mt-3 w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      Assign to Me
                    </button>
                  )}
                </div>

                <div className="bg-subtle-background p-4 rounded-xl">
                  <h3 className="font-bold text-text-primary mb-3">Actions</h3>
                  {currentCase.status === CaseStatus.LEAD && (
                    <button
                      onClick={handleInitiateSiteVisit}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
                    >
                      <MapPinIcon className="w-5 h-5" />
                      Initiate Site Visit
                    </button>
                  )}
                </div>
              </div>

              {/* Case Details */}
              <div className="bg-subtle-background p-4 rounded-xl">
                <h3 className="font-bold text-text-primary mb-3">Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-tertiary">Client Name:</span>
                    <p className="font-medium">{currentCase.clientName}</p>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Project Name:</span>
                    <p className="font-medium">{currentCase.title}</p>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Site Address:</span>
                    <p className="font-medium">{currentCase.siteAddress}</p>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Created:</span>
                    <p className="font-medium">{safeDate(currentCase.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="h-96 overflow-y-auto space-y-3 pr-2">
                <div className="text-center text-text-secondary py-8">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chat functionality coming soon</p>
                </div>
                <div ref={messagesEndRef} />
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-text-primary">Documents</h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <PaperClipIcon className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-border rounded-lg p-3 hover:bg-subtle-background transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <DocumentIcon className="w-5 h-5 text-primary" />
                      <span className="font-medium truncate">{doc.fileName}</span>
                    </div>
                    <p className="text-xs text-text-secondary">
                      Uploaded {safeDate(doc.uploadedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="space-y-6">
              <div className="text-center text-text-secondary py-8">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Milestone functionality coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseManagementPage;