import React from 'react';
import { useDailyUpdates, type DailyUpdateRecord } from '../../hooks/useDailyUpdates';
import type { ClientPlanDay } from './types';
import { formatDate } from '../../constants';

interface ClientDailyUpdatesReadOnlyProps {
  caseId: string;
  planDays?: ClientPlanDay[];
}

function toDateKey(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

const ClientDailyUpdatesReadOnly: React.FC<ClientDailyUpdatesReadOnlyProps> = ({ caseId, planDays = [] }) => {
  const { updates, loading, error } = useDailyUpdates(caseId);

  const loggedDates = new Set(updates.map((u) => toDateKey(u.date)));
  const plannedDates = planDays.map((p) => toDateKey(p.date));
  const missingDates = plannedDates.filter((d) => !loggedDates.has(d));
  const todayKey = new Date().toISOString().slice(0, 10);
  const missingPast = missingDates.filter((d) => d < todayKey);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Daily updates</h3>
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Daily updates</h3>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Daily updates</h3>

      {missingPast.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">No log for some past planned days:</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            {missingPast.slice(0, 5).map((d) => formatDate(d)).join(', ')}
            {missingPast.length > 5 && ` (+${missingPast.length - 5} more)`}
          </p>
        </div>
      )}

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {updates.length === 0 ? (
          <p className="text-sm text-gray-500">No daily updates yet.</p>
        ) : (
          updates.slice(0, 20).map((u: DailyUpdateRecord) => (
            <div key={u.id} className="text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {formatDate(u.date)}
              </span>
              <p className="text-gray-600 dark:text-gray-400 mt-0.5">{u.workDescription || '—'}</p>
              {u.manpowerCount > 0 && (
                <p className="text-xs text-gray-500">Workers: {u.manpowerCount}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientDailyUpdatesReadOnly;
