
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus } from '../../../types';
import { FireIcon, PlayIcon, PauseIcon, CheckCircleIcon, ClockIcon } from '../../icons/IconComponents';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { cn } from './DashboardUI';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
}

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdateStatus }) => {
  const [elapsedTime, setElapsedTime] = useState(task.timeSpent);

  useEffect(() => {
    let interval: number | undefined;
    if (task.status === TaskStatus.IN_PROGRESS && !task.isPaused) {
      const start = task.startTime || Date.now();
      interval = window.setInterval(() => {
        const secondsSinceStart = Math.floor((Date.now() - start) / 1000);
        setElapsedTime(task.timeSpent + secondsSinceStart);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [task.status, task.isPaused, task.startTime, task.timeSpent]);

  // Check if task is overdue
  const isOverdue = useMemo(() => {
    if (!task.deadline) return false;
    if (task.status === TaskStatus.COMPLETED) return false;
    return new Date() > new Date(task.deadline);
  }, [task.deadline, task.status]);

  // Deadline display
  const deadlineDisplay = useMemo(() => {
    if (!task.deadline) return null;
    const deadline = new Date(task.deadline);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) {
      return { text: 'OVERDUE', color: 'text-error bg-error/10' };
    } else if (diffHours < 1) {
      return { text: `${diffMins}m left`, color: 'text-error bg-error/10' };
    } else if (diffHours < 4) {
      return { text: `${diffHours}h ${diffMins}m`, color: 'text-accent bg-accent/10' };
    } else {
      return { text: deadline.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), color: 'text-text-secondary bg-subtle-background' };
    }
  }, [task.deadline]);

  const priorityColor = task.priority === 'High' ? 'border-l-error' : task.priority === 'Medium' ? 'border-l-accent' : 'border-l-border';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "bg-surface p-5 rounded-2xl border shadow-sm transition-all",
        priorityColor,
        "border-l-4",
        isOverdue && "ring-2 ring-error/50 bg-error/5"
      )}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Priority Order Badge */}
          {task.priorityOrder && (
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
              {task.priorityOrder}
            </div>
          )}
          <div className="flex-1">
            <p className={cn(
              "text-sm font-bold",
              task.status === TaskStatus.COMPLETED ? "text-text-tertiary line-through" : "text-text-primary"
            )}>
              {task.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {/* Priority Badge */}
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg",
                task.priority === 'High' ? 'text-error bg-error/10' :
                  task.priority === 'Medium' ? 'text-accent bg-accent/10' :
                    'text-text-secondary bg-subtle-background'
              )}>
                {task.priority}
              </span>
              {/* Deadline Badge */}
              {deadlineDisplay && (
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1", deadlineDisplay.color)}>
                  <ClockIcon className="w-3 h-3" />
                  {deadlineDisplay.text}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Overdue Flag */}
        {isOverdue && (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-error text-white rounded-xl text-[10px] font-black uppercase animate-pulse">
            <ExclamationTriangleIcon className="w-4 h-4" />
            RED FLAG
          </div>
        )}
        {task.priority === 'High' && !isOverdue && (
          <FireIcon className="w-5 h-5 text-error flex-shrink-0" />
        )}
      </div>

      <div className="mt-4">
        {task.status === TaskStatus.PENDING && (
          <button
            onClick={() => onUpdateStatus(task.id, TaskStatus.IN_PROGRESS)}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20"
          >
            <PlayIcon className="w-4 h-4" />
            <span>Start Task</span>
          </button>
        )}

        {task.status === TaskStatus.IN_PROGRESS && (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2 text-lg bg-primary/10 text-primary p-3 rounded-xl font-mono font-bold">
              <ClockIcon className="w-5 h-5 animate-pulse" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <button
              onClick={() => onUpdateStatus(task.id, TaskStatus.COMPLETED)}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-secondary text-white rounded-xl text-sm font-bold hover:bg-primary transition-all shadow-lg shadow-secondary/20"
            >
              <CheckCircleIcon className="w-5 h-5" />
              <span>Mark Complete</span>
            </button>
          </div>
        )}

        {task.status === TaskStatus.COMPLETED && (
          <div className="flex items-center justify-center space-x-2 text-sm bg-secondary/10 text-secondary p-3 rounded-xl font-bold">
            <CheckCircleIcon className="w-5 h-5" />
            <span>Completed in {formatTime(task.timeSpent)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TaskCard;