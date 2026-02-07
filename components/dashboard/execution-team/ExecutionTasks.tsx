import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CaseTaskType, TaskStatus } from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../constants';

interface Props {
  caseId: string | null;
}

interface Task {
  id: string;
  caseId: string;
  type: string;
  assignedTo: string;
  assignedBy: string;
  status: TaskStatus;
  createdAt: any;
  deadline?: any;
  notes?: string;
}

const ExecutionTasks: React.FC<Props> = ({ caseId }) => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskNotes, setNewTaskNotes] = useState('');

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    const tasksRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.TASKS);
    const q = query(tasksRef, where('type', '==', CaseTaskType.EXECUTION));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(fetchedTasks);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [caseId]);

  const handleAddTask = async () => {
    if (!caseId || !currentUser || !newTaskNotes.trim()) return;

    try {
      const tasksRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.TASKS);
      await addDoc(tasksRef, {
        caseId,
        type: CaseTaskType.EXECUTION,
        assignedTo: currentUser.id,
        assignedBy: currentUser.id,
        status: TaskStatus.PENDING,
        createdAt: serverTimestamp(),
        notes: newTaskNotes
      });

      setNewTaskNotes('');
      setShowAddModal(false);
      alert('Task added successfully!');
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task.');
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!caseId) return;

    try {
      const taskRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.TASKS, taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        ...(newStatus === TaskStatus.STARTED && { startedAt: serverTimestamp() }),
        ...(newStatus === TaskStatus.COMPLETED && { completedAt: serverTimestamp() })
      });
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task status.');
    }
  };

  if (!caseId) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary text-lg">No project selected.</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: TaskStatus) => {
    const config = {
      [TaskStatus.PENDING]: { label: 'Pending', color: 'bg-yellow-500' },
      [TaskStatus.STARTED]: { label: 'Started', color: 'bg-blue-500' },
      [TaskStatus.COMPLETED]: { label: 'Completed', color: 'bg-green-500' },
      [TaskStatus.ACKNOWLEDGED]: { label: 'Acknowledged', color: 'bg-gray-500' },
      [TaskStatus.ASSIGNED]: { label: 'Assigned', color: 'bg-purple-500' },
    };

    const cfg = config[status] || { label: status, color: 'bg-gray-500' };
    return <span className={`px-2 py-1 rounded text-white text-xs ${cfg.color}`}>{cfg.label}</span>;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Execution Tasks</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          + Add Task
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary text-lg">No execution tasks yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-medium">{task.notes || 'Execution Task'}</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Created: {task.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                  </p>
                </div>
                {getStatusBadge(task.status)}
              </div>

              <div className="flex gap-2 mt-3">
                {task.status === TaskStatus.PENDING && (
                  <button
                    onClick={() => handleUpdateStatus(task.id, TaskStatus.STARTED)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Start Task
                  </button>
                )}
                {task.status === TaskStatus.STARTED && (
                  <button
                    onClick={() => handleUpdateStatus(task.id, TaskStatus.COMPLETED)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Complete Task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Execution Task</h2>
            
            <textarea
              value={newTaskNotes}
              onChange={(e) => setNewTaskNotes(e.target.value)}
              placeholder="Task description..."
              className="w-full px-3 py-2 border border-border rounded-lg mb-4"
              rows={4}
            />

            <div className="flex gap-3">
              <button
                onClick={handleAddTask}
                disabled={!newTaskNotes.trim()}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                Add Task
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTaskNotes('');
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionTasks;
