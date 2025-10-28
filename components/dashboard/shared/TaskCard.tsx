
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../../../types';
import { FireIcon, PlayIcon, PauseIcon, CheckCircleIcon, ClockIcon } from '../../icons/IconComponents';

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
    
    const priorityColor = task.priority === 'High' ? 'border-l-error' : task.priority === 'Medium' ? 'border-l-accent' : 'border-l-border';

  return (
    <div className={`bg-surface p-3 rounded-md border ${priorityColor} border-l-4 shadow-sm space-y-3`}>
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-text-primary">{task.title}</p>
        {task.priority === 'High' && <FireIcon className="w-5 h-5 text-error flex-shrink-0" />}
      </div>
      
      {task.status === TaskStatus.PENDING && (
          <button onClick={() => onUpdateStatus(task.id, TaskStatus.IN_PROGRESS)} className="w-full flex items-center justify-center space-x-2 py-2 bg-secondary text-white rounded-md text-sm font-semibold hover:bg-green-700 transition-colors">
              <PlayIcon className="w-4 h-4"/>
              <span>Start Task</span>
          </button>
      )}

      {task.status === TaskStatus.IN_PROGRESS && (
          <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-sm bg-accent/10 text-accent p-2 rounded-md">
                <ClockIcon className="w-4 h-4" />
                <span className="font-mono font-semibold">{formatTime(elapsedTime)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => onUpdateStatus(task.id, TaskStatus.COMPLETED)} className="flex items-center justify-center space-x-2 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-blue-700">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Complete</span>
                  </button>
              </div>
          </div>
      )}

      {task.status === TaskStatus.COMPLETED && (
           <div className="flex items-center justify-center space-x-2 text-sm bg-slate-subtle-background text-slate-subtle-text p-2 rounded-md font-semibold">
              <CheckCircleIcon className="w-4 h-4" />
              <span>Completed in {formatTime(task.timeSpent)}</span>
            </div>
      )}
    </div>
  );
};

export default TaskCard;