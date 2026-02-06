import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardDocumentCheckIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { useCaseTasks } from '../../../hooks/useCaseTasks';
import { TaskStatus, TaskType } from '../../../types';
import { ContentCard, staggerContainer, SectionHeader, cn, StatCard } from './DashboardUI';
import { formatDateTime } from '../../../constants';

const TasksPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { tasks, loading, startTask, completeTask } = useCaseTasks({
    organizationId: 'org-test',
  });
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING);
  const ongoingTasks = tasks.filter(t => t.status === TaskStatus.STARTED);
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
  const assignedTasks = pendingTasks; // Alias for UI compatibility

  const handleStart = async (taskId: string, caseId: string) => {
    if (!currentUser?.organizationId) return;
    setProcessingId(taskId);
    try {
      await startTask(taskId, caseId);
    } catch (error) {
      console.error(error);
      alert('Failed to start task.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (taskId: string, caseId: string, kmTravelled?: number) => {
    if (!currentUser?.organizationId) return;
    if (!confirm('Are you sure you want to mark this task as completed?')) return;

    setProcessingId(taskId);
    try {
      await completeTask(taskId, caseId, kmTravelled);
    } catch (error) {
      console.error(error);
      alert('Failed to complete task.');
    } finally {
      setProcessingId(null);
    }
  };

  const getTaskTypeIcon = (type: TaskType) => {
    switch (type) {
      case TaskType.SITE_VISIT: return <BoltIcon className="w-5 h-5" />;
      case TaskType.DRAWING: return <SparklesIcon className="w-5 h-5" />;
      case TaskType.BOQ: return <ClipboardDocumentCheckIcon className="w-5 h-5" />;
      case TaskType.QUOTATION: return <DocumentTextIcon className="w-5 h-5" />;
      case TaskType.EXECUTION: return <HammerIcon className="w-5 h-5" />;
      default: return <CalendarDaysIcon className="w-5 h-5" />;
    }
  };

  const getTaskTypeColor = (type: TaskType) => {
    switch (type) {
      case TaskType.SITE_VISIT: return 'bg-orange-100 text-orange-800';
      case TaskType.DRAWING: return 'bg-blue-100 text-blue-800';
      case TaskType.BOQ: return 'bg-purple-100 text-purple-800';
      case TaskType.QUOTATION: return 'bg-green-100 text-green-800';
      case TaskType.EXECUTION: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.STARTED: return 'bg-blue-100 text-blue-800';
      case TaskStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case TaskStatus.ACKNOWLEDGED: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-text-secondary">Loading tasks...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <SectionHeader 
        title="All Tasks" 
        subtitle="Manage and track all tasks across cases"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={tasks.length.toString()}
          icon={<CalendarDaysIcon className="w-6 h-6" />}
          trend={{ value: "+5", positive: true }}
        />
        <StatCard
          title="Pending"
          value={pendingTasks.length.toString()}
          icon={<ClockIcon className="w-6 h-6" />}
          trend={{ value: "0", positive: true }}
        />
        <StatCard
          title="In Progress"
          value={ongoingTasks.length.toString()}
          icon={<PlayIcon className="w-6 h-6" />}
          trend={{ value: "+2", positive: true }}
        />
        <StatCard
          title="Completed"
          value={completedTasks.length.toString()}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          trend={{ value: "+3", positive: true }}
        />
      </div>

      {/* Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        <ContentCard className="p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-yellow-500" />
            Pending Tasks ({pendingTasks.length})
          </h3>
          
          {pendingTasks.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-50" />
              <p className="text-text-secondary">No pending tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {pendingTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border border-border rounded-lg p-4 hover:bg-subtle-background transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTaskTypeIcon(task.type)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskTypeColor(task.type)}`}>
                            {task.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="font-medium text-text-primary mb-1">
                          {task.notes || 'Untitled Task'}
                        </p>
                        {task.assignedTo && (
                          <p className="text-sm text-text-secondary">
                            Assigned to: {task.assignedTo}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleStart(task.id, task.caseId)}
                        disabled={processingId === task.id}
                        className="px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center gap-1 text-sm"
                      >
                        {processingId === task.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <PlayIcon className="w-4 h-4" />
                        )}
                        Start
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ContentCard>

        {/* Ongoing Tasks */}
        <ContentCard className="p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <PlayIcon className="w-5 h-5 text-blue-500" />
            In Progress ({ongoingTasks.length})
          </h3>
          
          {ongoingTasks.length === 0 ? (
            <div className="text-center py-8">
              <PlayIcon className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-50" />
              <p className="text-text-secondary">No tasks in progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {ongoingTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border border-border rounded-lg p-4 hover:bg-subtle-background transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTaskTypeIcon(task.type)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskTypeColor(task.type)}`}>
                            {task.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="font-medium text-text-primary mb-1">
                          {task.notes || 'Untitled Task'}
                        </p>
                        {task.startedAt && (
                          <p className="text-sm text-text-secondary">
                            Started: {task.startedAt.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const kmInput = prompt('Enter kilometers travelled (optional):');
                          const kmTravelled = kmInput ? parseFloat(kmInput) : undefined;
                          handleComplete(task.id, task.caseId, kmTravelled);
                        }}
                        disabled={processingId === task.id}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-1 text-sm"
                      >
                        {processingId === task.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <CheckCircleIcon className="w-4 h-4" />
                        )}
                        Complete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ContentCard>

        {/* Completed Tasks */}
        <ContentCard className="p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            Completed ({completedTasks.length})
          </h3>
          
          {completedTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-50" />
              <p className="text-text-secondary">No completed tasks yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {completedTasks.slice(0, 10).map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border border-border rounded-lg p-4 bg-green-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTaskTypeIcon(task.type)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskTypeColor(task.type)}`}>
                            {task.type}
                          </span>
                        </div>
                        <p className="font-medium text-text-primary mb-1">
                          {task.notes || 'Untitled Task'}
                        </p>
                        {task.completedAt && (
                          <p className="text-sm text-text-secondary">
                            Completed: {task.completedAt.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {completedTasks.length > 10 && (
                <p className="text-center text-sm text-text-secondary mt-3">
                  +{completedTasks.length - 10} more completed tasks
                </p>
              )}
            </div>
          )}
        </ContentCard>
      </div>
    </motion.div>
  );
};

// Icons that weren't imported
const BoltIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const HammerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

export default TasksPage;