import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { FIRESTORE_COLLECTIONS } from '../../../constants';

interface Props {
  caseId: string | null;
}

interface DailyUpdate {
  id: string;
  caseId: string;
  date: any;
  workDescription: string;
  completionPercent: number;
  manpowerCount: number;
  weather: string;
  photos: string[];
  createdBy: string;
  createdAt: any;
  blocker?: string;
}

const ExecutionDailyUpdates: React.FC<Props> = ({ caseId }) => {
  const { currentUser } = useAuth();
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [workDescription, setWorkDescription] = useState('');
  const [completionPercent, setCompletionPercent] = useState(0);
  const [manpowerCount, setManpowerCount] = useState(0);
  const [weather, setWeather] = useState('Sunny');
  const [blocker, setBlocker] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    const updatesRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.DAILY_UPDATES);
    const q = query(updatesRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUpdates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyUpdate[];
      setUpdates(fetchedUpdates);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching daily updates:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [caseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !currentUser) return;

    setSaving(true);
    try {
      const updatesRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.DAILY_UPDATES);
      await addDoc(updatesRef, {
        caseId,
        date: new Date(date),
        workDescription,
        completionPercent,
        manpowerCount,
        weather,
        blocker: blocker || null,
        photos: [],
        createdBy: currentUser.id,
        createdAt: serverTimestamp()
      });

      setDate(new Date().toISOString().split('T')[0]);
      setWorkDescription('');
      setCompletionPercent(0);
      setManpowerCount(0);
      setWeather('Sunny');
      setBlocker('');
      setShowForm(false);
      
      alert('Daily update added successfully!');
    } catch (error) {
      console.error('Error adding daily update:', error);
      alert('Failed to add daily update.');
    } finally {
      setSaving(false);
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Daily Updates</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          {showForm ? 'Cancel' : '+ Add Update'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Daily Update</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Weather</label>
                <select
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                >
                  <option value="Sunny">Sunny</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Rainy">Rainy</option>
                  <option value="Windy">Windy</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Work Description *</label>
              <textarea
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                rows={4}
                placeholder="Describe the work completed today..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Completion % (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={completionPercent}
                  onChange={(e) => setCompletionPercent(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={completionPercent}
                  onChange={(e) => setCompletionPercent(parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Manpower Count</label>
                <input
                  type="number"
                  min="0"
                  value={manpowerCount}
                  onChange={(e) => setManpowerCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Blocker (optional)</label>
              <textarea
                value={blocker}
                onChange={(e) => setBlocker(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                rows={2}
                placeholder="Any issues or blockers..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Submit Update'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><p>Loading updates...</p></div>
      ) : updates.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary">No daily updates yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <div key={update.id} className="bg-surface border border-border rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-text-secondary">
                    {update.date?.toDate?.().toLocaleDateString() || 'N/A'} • {update.weather}
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    Progress: {update.completionPercent}% | Workers: {update.manpowerCount}
                  </p>
                </div>
              </div>
              
              <p className="text-text-secondary mb-3">{update.workDescription}</p>
              
              {update.blocker && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">⚠️ Blocker:</p>
                  <p className="text-sm text-red-700">{update.blocker}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExecutionDailyUpdates;
