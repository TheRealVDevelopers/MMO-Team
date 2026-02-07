import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';

interface Props {
  caseId: string | null;
}

interface Issue {
  id: string;
  caseId: string;
  type: string;
  action: string;
  by: string;
  timestamp: any;
  metadata?: {
    resolved?: boolean;
    priority?: 'low' | 'medium' | 'high';
    description?: string;
  };
}

const ExecutionIssues: React.FC<Props> = ({ caseId }) => {
  const { currentUser } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    const activitiesRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.ACTIVITIES);
    const q = query(activitiesRef, where('type', '==', 'ISSUE'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedIssues = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Issue[];
      setIssues(fetchedIssues);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching issues:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [caseId]);

  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !currentUser) return;

    setSaving(true);
    try {
      const activitiesRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.ACTIVITIES);
      await addDoc(activitiesRef, {
        caseId,
        type: 'ISSUE',
        action: `Issue reported: ${description.substring(0, 50)}...`,
        by: currentUser.id,
        timestamp: serverTimestamp(),
        metadata: {
          resolved: false,
          priority,
          description
        }
      });

      setDescription('');
      setPriority('medium');
      setShowAddForm(false);
      
      alert('Issue reported successfully!');
    } catch (error) {
      console.error('Error adding issue:', error);
      alert('Failed to report issue.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleResolved = async (issueId: string, currentResolved: boolean) => {
    if (!caseId) return;

    try {
      const issueRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.ACTIVITIES, issueId);
      await updateDoc(issueRef, {
        'metadata.resolved': !currentResolved,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Failed to update issue status.');
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

  const getPriorityBadge = (priority?: string) => {
    const config: any = {
      low: { label: 'Low', color: 'bg-blue-500' },
      medium: { label: 'Medium', color: 'bg-yellow-500' },
      high: { label: 'High', color: 'bg-red-500' }
    };
    const cfg = config[priority || 'medium'];
    return <span className={`px-2 py-1 rounded text-white text-xs ${cfg.color}`}>{cfg.label}</span>;
  };

  const openIssues = issues.filter(i => !i.metadata?.resolved);
  const resolvedIssues = issues.filter(i => i.metadata?.resolved);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Issues & Risks</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          {showAddForm ? 'Cancel' : '+ Report Issue'}
        </button>
      </div>

      {/* Add Issue Form */}
      {showAddForm && (
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Report New Issue</h2>
          
          <form onSubmit={handleAddIssue} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Issue Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                rows={4}
                placeholder="Describe the issue or risk..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Reporting...' : 'Report Issue'}
            </button>
          </form>
        </div>
      )}

      {/* Open Issues */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Open Issues ({openIssues.length})</h2>
        
        {loading ? (
          <div className="text-center py-12"><p>Loading issues...</p></div>
        ) : openIssues.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-xl border border-border">
            <p className="text-text-secondary">No open issues. Great!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {openIssues.map((issue) => (
              <div key={issue.id} className="bg-surface border border-border rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getPriorityBadge(issue.metadata?.priority)}
                      <span className="text-xs text-text-secondary">
                        Reported: {issue.timestamp?.toDate?.().toLocaleDateString() || 'N/A'}
                      </span>
                    </div>
                    <p className="text-text-secondary">{issue.metadata?.description || issue.action}</p>
                  </div>
                  
                  <button
                    onClick={() => handleToggleResolved(issue.id, false)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Issues */}
      {resolvedIssues.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Resolved Issues ({resolvedIssues.length})</h2>
          <div className="space-y-4">
            {resolvedIssues.map((issue) => (
              <div key={issue.id} className="bg-surface border border-border rounded-xl p-6 opacity-60">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getPriorityBadge(issue.metadata?.priority)}
                      <span className="text-xs text-green-600 font-semibold">✓ Resolved</span>
                      <span className="text-xs text-text-secondary">
                        {issue.timestamp?.toDate?.().toLocaleDateString() || 'N/A'}
                      </span>
                    </div>
                    <p className="text-text-secondary line-through">{issue.metadata?.description || issue.action}</p>
                  </div>
                  
                  <button
                    onClick={() => handleToggleResolved(issue.id, true)}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-background"
                  >
                    Reopen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionIssues;
