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
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white text-sm font-bold">4</span>
          <h2 className="text-lg font-bold text-slate-800">Daily Execution Log</h2>
        </div>
        <p className="text-sm text-slate-600">Loading…</p>
      </section>
    );
  }

  if (isCompleted) {
    return (
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white text-sm font-bold">4</span>
          <h2 className="text-lg font-bold text-slate-800">Daily Execution Log</h2>
        </div>
        <div className="flex items-center gap-4 p-5 rounded-xl bg-slate-50 border border-slate-100">
          <LockClosedIcon className="w-5 h-5 text-slate-500" />
          <div>
            <p className="font-semibold text-slate-700">Daily Log Locked</p>
            <p className="text-sm text-slate-600 mt-0.5">Cannot add daily updates to completed projects.</p>
          </div>
        </div>
        {updates.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-800 mb-2">Daily Logs History</p>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {updates.map((u) => (
                <li key={u.id} className="text-sm text-slate-600 border-b border-slate-100 pb-2">
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
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white text-sm font-bold">4</span>
        <h2 className="text-lg font-bold text-slate-800">Daily Execution Log</h2>
      </div>

      {missingDates.length > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm font-medium text-amber-800">Missing updates (planned days with no log)</p>
          <p className="text-xs text-amber-700 mt-1">{missingDates.join(', ')}</p>
        </div>
      )}

      {todayUpdate ? (
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80">
          <p className="text-sm font-semibold text-slate-800">Today&apos;s log submitted</p>
          <p className="text-sm text-slate-600 mt-1">{todayUpdate.workDescription}</p>
          <p className="text-xs text-slate-500 mt-2">Workers: {todayUpdate.manpowerCount}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" value={today} readOnly />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Work done today *</label>
            <textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              rows={3}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Describe work completed today"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Number of workers present *</label>
            <input
              type="number"
              min={0}
              value={manpowerCount}
              onChange={(e) => setManpowerCount(parseInt(e.target.value, 10) || 0)}
              className="w-full max-w-[120px] px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Photos (optional)</label>
            <div className="flex gap-2 flex-wrap">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Photo URL"
                className="flex-1 min-w-[180px] px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm"
              />
              <button type="button" onClick={addPhoto} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">
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
                    <button type="button" onClick={() => removePhoto(i)} className="text-red-600 hover:text-red-700">×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" disabled={saving} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">
            {saving ? 'Saving…' : 'Save daily log'}
          </button>
        </form>
      )}

      {updates.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-sm font-semibold text-slate-800 mb-2">Recent logs</p>
          <ul className="space-y-2">
            {updates.slice(0, 5).map((u) => (
              <li key={u.id} className="text-sm text-slate-600 border-b border-slate-100 pb-2">
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
