/**
 * Section 4: Daily Execution Log — today only.
 * Mandatory per working day; missing updates visible (planned days with no log).
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useDailyUpdates } from '../../../hooks/useDailyUpdates';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { isCaseCompleted } from '../../../services/executionStatusService';

interface Props {
  caseId: string;
  planDays?: Array<{ date: Date }>;
  isCompleted?: boolean;  // Added to receive completed status
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const ExecutionDailyLogSection: React.FC<Props> = ({ caseId, planDays = [], isCompleted = false }) => {
  const { currentUser } = useAuth();
  const { updates, loading, addUpdate } = useDailyUpdates(caseId);
  const [workDescription, setWorkDescription] = useState('');
  const [manpowerCount, setManpowerCount] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const today = todayStr();
  const todayUpdate = useMemo(() => updates.find((u) => (typeof u.date === 'string' ? u.date.slice(0, 10) : new Date(u.date).toISOString().slice(0, 10)) === today), [updates, today]);

  const plannedDates = useMemo(() => {
    const set = new Set<string>();
    planDays.forEach((d) => set.add(new Date(d.date).toISOString().slice(0, 10)));
    return Array.from(set).sort();
  }, [planDays]);

  const updateDates = useMemo(() => new Set(updates.map((u) => (typeof u.date === 'string' ? u.date.slice(0, 10) : new Date(u.date).toISOString().slice(0, 10)))), [updates]);

  const missingDates = useMemo(() => {
    const now = today;
    return plannedDates.filter((d) => d < now && !updateDates.has(d));
  }, [plannedDates, updateDates, today]);

  const addPhoto = () => {
    if (photoUrl.trim()) {
      setPhotos((p) => [...p, photoUrl.trim()]);
      setPhotoUrl('');
    }
  };

  const removePhoto = (index: number) => setPhotos((p) => p.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    try {
      await addUpdate({
        caseId,
        date: new Date(today),
        workDescription: workDescription.trim(),
        manpowerCount,
        photos,
        createdBy: currentUser.id,
      });
      setWorkDescription('');
      setManpowerCount(0);
      setPhotos([]);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">4. Daily Execution Log</h2>
        <p className="text-sm text-text-secondary">Loading…</p>
      </section>
    );
  }

  // Show read-only mode for completed projects
  if (isCompleted) {
    return (
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">4. Daily Execution Log</h2>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <LockClosedIcon className="w-5 h-5 text-gray-500" />
          <div>
            <p className="font-medium text-gray-700">Daily Log Locked</p>
            <p className="text-sm text-gray-600">Cannot add daily updates to completed projects.</p>
          </div>
        </div>
        
        {/* Show existing updates in read-only mode */}
        {updates.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-text-primary mb-2">Daily Logs History</p>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {updates.map((u) => (
                <li key={u.id} className="text-sm text-text-secondary border-b border-border pb-2">
                  {typeof u.date === 'string' ? u.date.slice(0, 10) : new Date(u.date).toISOString().slice(0, 10)} — {u.workDescription}
                  {u.manpowerCount ? ` (${u.manpowerCount} workers)` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="bg-surface border border-border rounded-xl p-6">
      <h2 className="text-lg font-bold text-text-primary mb-4">4. Daily Execution Log</h2>

      {missingDates.length > 0 && (
        <div className="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Missing updates (planned days with no log)</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{missingDates.join(', ')}</p>
        </div>
      )}

      {todayUpdate ? (
        <div className="p-4 rounded-lg border border-border bg-background/50">
          <p className="text-sm font-medium text-text-primary">Today&apos;s log submitted</p>
          <p className="text-sm text-text-secondary mt-1">{todayUpdate.workDescription}</p>
          <p className="text-xs text-text-tertiary mt-2">Workers: {todayUpdate.manpowerCount}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" value={today} readOnly />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Work done today *</label>
            <textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              rows={3}
              required
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
              placeholder="Describe work completed today"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Number of workers present *</label>
            <input
              type="number"
              min={0}
              value={manpowerCount}
              onChange={(e) => setManpowerCount(parseInt(e.target.value, 10) || 0)}
              className="w-full max-w-[120px] px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Photos (optional)</label>
            <div className="flex gap-2 flex-wrap">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Photo URL"
                className="flex-1 min-w-[180px] px-3 py-2 border border-border rounded-lg bg-background text-text-primary text-sm"
              />
              <button type="button" onClick={addPhoto} className="px-3 py-2 border border-border rounded-lg text-sm">
                Add
              </button>
            </div>
            {photos.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {photos.map((url, i) => (
                  <li key={i} className="flex items-center gap-1 text-xs">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary truncate max-w-[120px]">
                      Photo
                    </a>
                    <button type="button" onClick={() => removePhoto(i)} className="text-error">
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Saving…' : 'Save daily log'}
          </button>
        </form>
      )}

      {updates.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-text-primary mb-2">Recent logs</p>
          <ul className="space-y-2">
            {updates.slice(0, 5).map((u) => (
              <li key={u.id} className="text-sm text-text-secondary border-b border-border pb-2">
                {typeof u.date === 'string' ? u.date.slice(0, 10) : new Date(u.date).toISOString().slice(0, 10)} — {u.workDescription}
                {u.manpowerCount ? ` (${u.manpowerCount} workers)` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ExecutionDailyLogSection;
