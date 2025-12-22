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
} from '@heroicons/react/24/outline';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { Lead, LeadCommunicationMessage, LeadFile, ProjectMilestone, LeadPipelineStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface LeadManagementPageProps {
  leadId: string;
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

const LeadManagementPage: React.FC<LeadManagementPageProps> = ({ leadId, onClose }) => {
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lead, setLead] = useState<Lead | null>(null);
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

  useEffect(() => {
    if (leadId) {
      fetchLead();
    }
  }, [leadId]);

  useEffect(() => {
    scrollToBottom();
  }, [lead?.communicationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchLead = async () => {
    if (!leadId) return;

    try {
      const leadRef = doc(db, 'leads', leadId);
      const leadSnap = await getDoc(leadRef);

      if (leadSnap.exists()) {
        const data = leadSnap.data() as Lead;
        setLead({
          id: leadSnap.id,
          ...data,
          inquiryDate: (data.inquiryDate as any).toDate(),
          deadline: data.deadline ? (data.deadline as any).toDate() : undefined,
          communicationMessages: data.communicationMessages?.map(msg => ({
            ...msg,
            timestamp: (msg.timestamp as any).toDate(),
          })) || [],
          files: data.files?.map(file => ({
            ...file,
            uploadedAt: (file.uploadedAt as any).toDate(),
          })) || [],
          milestones: data.milestones?.map(milestone => ({
            ...milestone,
            deadline: milestone.deadline ? (milestone.deadline as any).toDate() : undefined,
            completedAt: milestone.completedAt ? (milestone.completedAt as any).toDate() : undefined,
            updatedAt: milestone.updatedAt ? (milestone.updatedAt as any).toDate() : undefined,
          })) || [],
        });
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !leadId || !currentUser) return;

    setSending(true);
    try {
      const message: LeadCommunicationMessage = {
        id: `msg-${Date.now()}`,
        leadId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: 'sales',
        message: newMessage,
        timestamp: new Date(),
        read: false,
      };

      const leadRef = doc(db, 'leads', leadId);
      await updateDoc(leadRef, {
        communicationMessages: arrayUnion({
          ...message,
          timestamp: serverTimestamp(),
        }),
      });

      setNewMessage('');
      await fetchLead();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !leadId || !currentUser) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i] as File;
        const fileRef = ref(storage, `leads/${leadId}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);

        const fileType = file.type.startsWith('image/') ? 'image' :
          file.type.includes('pdf') || file.type.includes('document') ? 'document' : 'other';

        const leadFile: LeadFile = {
          id: `file-${Date.now()}-${i}`,
          leadId,
          fileName: file.name,
          fileUrl,
          fileType,
          uploadedBy: currentUser.id,
          uploadedByName: currentUser.name,
          uploadedAt: new Date(),
        };

        const leadRef = doc(db, 'leads', leadId);
        await updateDoc(leadRef, {
          files: arrayUnion({
            ...leadFile,
            uploadedAt: serverTimestamp(),
          }),
        });
      }

      await fetchLead();
      alert('Files uploaded successfully!');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpdateMilestone = async () => {
    if (!leadId || !currentUser) return;

    setUpdatingMilestone(true);
    try {
      const stageName = PROJECT_STAGES.find(s => s.id === selectedStage)?.name || '';

      const milestone: ProjectMilestone = {
        id: `milestone-${Date.now()}`,
        leadId,
        stage: selectedStage,
        stageName,
        status: milestoneStatus,
        deadline: milestoneDeadline ? new Date(milestoneDeadline) : undefined,
        completedAt: milestoneStatus === 'completed' ? new Date() : undefined,
        notes: milestoneNotes,
        updatedBy: currentUser.id,
        updatedAt: new Date(),
      };

      const leadRef = doc(db, 'leads', leadId);

      // Get existing milestones
      const leadSnap = await getDoc(leadRef);
      const existingMilestones = (leadSnap.data()?.milestones || []) as ProjectMilestone[];

      // Update or add milestone
      const milestoneIndex = existingMilestones.findIndex(m => m.stage === selectedStage);
      if (milestoneIndex !== -1) {
        existingMilestones[milestoneIndex] = {
          ...milestone,
          deadline: milestone.deadline ? Timestamp.fromDate(milestone.deadline) : undefined,
          completedAt: milestone.completedAt ? Timestamp.fromDate(milestone.completedAt) : undefined,
          updatedAt: Timestamp.fromDate(milestone.updatedAt!),
        } as any;
      } else {
        existingMilestones.push({
          ...milestone,
          deadline: milestone.deadline ? Timestamp.fromDate(milestone.deadline) : undefined,
          completedAt: milestone.completedAt ? Timestamp.fromDate(milestone.completedAt) : undefined,
          updatedAt: Timestamp.fromDate(milestone.updatedAt!),
        } as any);
      }

      await updateDoc(leadRef, {
        milestones: existingMilestones,
        currentStage: selectedStage,
      });

      setMilestoneNotes('');
      setMilestoneDeadline('');
      setMilestoneStatus('pending');
      await fetchLead();
      alert('Milestone updated successfully!');
    } catch (error) {
      console.error('Error updating milestone:', error);
      alert('Failed to update milestone. Please try again.');
    } finally {
      setUpdatingMilestone(false);
    }
  };

  const handleUpdateLeadStatus = async (newStatus: LeadPipelineStatus) => {
    if (!leadId) return;

    try {
      const leadRef = doc(db, 'leads', leadId);
      await updateDoc(leadRef, {
        status: newStatus,
      });
      await fetchLead();
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-subtle-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-hover"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-subtle-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Lead Not Found</h2>
          <button
            onClick={onClose}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-hover"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-subtle-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-white dark:bg-background/90 rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-text-primary/90 dark:text-white">{lead.projectName}</h1>
            <p className="text-text-secondary mt-2">Client: {lead.clientName}</p>
            <p className="text-text-secondary text-sm">Lead ID: {lead.id}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 dark:bg-surface/90 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-surface/80"
          >
            ← Back
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mt-6 border-b border-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-semibold transition-all ${activeTab === 'overview'
              ? 'text-primary-hover border-b-2 border-primary-hover'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 font-semibold transition-all ${activeTab === 'chat'
              ? 'text-primary-hover border-b-2 border-primary-hover'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 py-2 font-semibold transition-all ${activeTab === 'files'
              ? 'text-primary-hover border-b-2 border-primary-hover'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Files
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-4 py-2 font-semibold transition-all ${activeTab === 'milestones'
              ? 'text-primary-hover border-b-2 border-primary-hover'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Milestones
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="bg-white dark:bg-background/90 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-text-primary/90 dark:text-white mb-4">Project Overview</h2>

              {/* Lead Status */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Lead Status
                </label>
                <select
                  value={lead.status}
                  onChange={(e) => handleUpdateLeadStatus(e.target.value as LeadPipelineStatus)}
                  className="w-full p-3 border border-border rounded-lg bg-surface focus:ring-2 focus:ring-primary"
                >
                  {Object.values(LeadPipelineStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-semibold text-text-primary/90 dark:text-white">{lead.clientEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Mobile</p>
                  <p className="font-semibold text-text-primary/90 dark:text-white">{lead.clientMobile || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Priority</p>
                  <p className="font-semibold text-text-primary/90 dark:text-white">{lead.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Source</p>
                  <p className="font-semibold text-text-primary/90 dark:text-white">{lead.source}</p>
                </div>
              </div>

              {/* Current Stage Progress */}
              <div className="bg-gradient-to-br from-primary/5 to-primary-subtle-background/200 dark:from-surface/90 dark:to-surface/80 rounded-lg p-4">
                <h3 className="text-sm font-bold text-text-primary/90 dark:text-white mb-3">Current Stage</h3>
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">
                    {PROJECT_STAGES.find(s => s.id === (lead.currentStage || 1))?.icon}
                  </div>
                  <div>
                    <p className="font-bold text-text-primary/90 dark:text-white">
                      Stage {lead.currentStage || 1}: {PROJECT_STAGES.find(s => s.id === (lead.currentStage || 1))?.name}
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${((lead.currentStage || 1) / 8) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Tab - CONTINUED IN NEXT PART */}
          {activeTab === 'chat' && (
            <div className="bg-white dark:bg-background/90 rounded-xl shadow-md flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <h2 className="text-xl font-bold text-text-primary/90 dark:text-white flex items-center">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2 text-primary-hover" />
                  Client Communication
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {lead.communicationMessages && lead.communicationMessages.length > 0 ? (
                  lead.communicationMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderRole === 'sales' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${msg.senderRole === 'sales'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-surface/90 text-text-primary/90 dark:text-white'
                          }`}
                      >
                        <p className="text-sm font-semibold mb-1">{msg.senderName}</p>
                        <p>{msg.message}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 p-3 border border-border rounded-lg bg-surface focus:ring-2 focus:ring-primary"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="bg-white dark:bg-background/90 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary/90 dark:text-white">Files & Documents</h2>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50 flex items-center"
                >
                  <PaperClipIcon className="w-5 h-5 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {lead.files && lead.files.length > 0 ? (
                  lead.files.map(file => (
                    <a
                      key={file.id}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-50 dark:bg-surface/90 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-surface/80 transition-all"
                    >
                      <div className="flex flex-col items-center text-center">
                        {file.fileType === 'image' ? (
                          <PhotoIcon className="w-12 h-12 text-primary-hover mb-2" />
                        ) : (
                          <DocumentIcon className="w-12 h-12 text-primary-hover mb-2" />
                        )}
                        <p className="text-sm font-semibold text-text-primary/90 dark:text-white truncate w-full">
                          {file.fileName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {file.uploadedByName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {file.uploadedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                    <DocumentIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No files uploaded yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Milestones Tab */}
          {activeTab === 'milestones' && (
            <div className="space-y-6">
              {/* Milestone Form */}
              <div className="bg-white dark:bg-background/90 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-text-primary/90 dark:text-white mb-4">Update Milestone</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Project Stage
                    </label>
                    <select
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(Number(e.target.value))}
                      className="w-full p-3 border border-border rounded-lg bg-surface focus:ring-2 focus:ring-primary"
                    >
                      {PROJECT_STAGES.map(stage => (
                        <option key={stage.id} value={stage.id}>
                          {stage.icon} Stage {stage.id}: {stage.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={milestoneStatus}
                      onChange={(e) => setMilestoneStatus(e.target.value as any)}
                      className="w-full p-3 border border-border rounded-lg bg-surface focus:ring-2 focus:ring-primary"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={milestoneDeadline}
                      onChange={(e) => setMilestoneDeadline(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg bg-surface focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={milestoneNotes}
                      onChange={(e) => setMilestoneNotes(e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-border rounded-lg bg-surface focus:ring-2 focus:ring-primary"
                      placeholder="Add notes about this milestone..."
                    />
                  </div>

                  <button
                    onClick={handleUpdateMilestone}
                    disabled={updatingMilestone}
                    className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingMilestone ? 'Updating...' : 'Update Milestone'}
                  </button>
                </div>
              </div>

              {/* Milestone Timeline */}
              <div className="bg-white dark:bg-background/90 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-text-primary/90 dark:text-white mb-6">Project Timeline</h2>

                <div className="space-y-4">
                  {PROJECT_STAGES.map(stage => {
                    const milestone = lead.milestones?.find(m => m.stage === stage.id);
                    return (
                      <div key={stage.id} className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${milestone?.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : milestone?.status === 'in-progress'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30'
                            : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                          {milestone?.status === 'completed' ? '✓' : stage.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-text-primary/90 dark:text-white">
                                {stage.name}
                              </h3>
                              {milestone && (
                                <>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {milestone.notes}
                                  </p>
                                  {milestone.deadline && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center">
                                      <ClockIcon className="w-3 h-3 mr-1" />
                                      Deadline: {milestone.deadline.toLocaleDateString()}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                            {milestone && (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${milestone.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : milestone.status === 'in-progress'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                {milestone.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white dark:bg-background/90 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary/90 dark:text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Messages</span>
                <span className="font-bold text-primary-hover">{lead.communicationMessages?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Files</span>
                <span className="font-bold text-primary-hover">{lead.files?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Milestones</span>
                <span className="font-bold text-primary-hover">
                  {lead.milestones?.filter(m => m.status === 'completed').length || 0}/8
                </span>
              </div>
            </div>
          </div>

          {/* Assigned To */}
          <div className="bg-white dark:bg-background/90 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary/90 dark:text-white mb-4">Assigned To</h3>
            <p className="text-text-primary/90 dark:text-white font-semibold">{currentUser?.name || 'Sales Team'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadManagementPage;
