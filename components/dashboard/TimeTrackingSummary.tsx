import React, { useState, useMemo } from 'react';
import { ClockIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useTimeEntries, getTimeTrackingSummary, formatDuration } from '../../hooks/useTimeTracking';
import { TimeEntry } from '../../types';

interface TimeTrackingSummaryProps {
  userId: string;
}

const TimeTrackingSummary: React.FC<TimeTrackingSummaryProps> = ({ userId }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const { entries, loading } = useTimeEntries(userId);

  const filteredEntries = useMemo(() => {
    if (!entries.length) return [];

    const now = new Date();
    let startDate = new Date();

    if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setDate(now.getDate() - 30);
    } else {
      return entries;
    }

    return entries.filter(entry => new Date(entry.date) >= startDate);
  }, [entries, timeRange]);

  const summary = useMemo(() => {
    return getTimeTrackingSummary(filteredEntries);
  }, [filteredEntries]);

  const todayEntry = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return entries.find(e => e.date === today);
  }, [entries]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-background/90 rounded-xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-surface/90 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-surface/90 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-surface/90 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-surface/90 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-background/90 rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 dark:bg-primary/20 rounded-full p-3">
            <ChartBarIcon className="w-6 h-6 text-primary-hover dark:text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary/90 dark:text-white">Time Summary</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your work hours overview</p>
          </div>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setTimeRange('week')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${timeRange === 'week'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-surface/90 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface/80'
            }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setTimeRange('month')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${timeRange === 'month'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-surface/90 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface/80'
            }`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => setTimeRange('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${timeRange === 'all'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-surface/90 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface/80'
            }`}
        >
          All Time
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-2">
            <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Total Hours</p>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{summary.totalWorkHours.toFixed(1)}h</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
          <div className="flex items-center space-x-2 mb-2">
            <CalendarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Days Worked</p>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-200">{summary.totalDays}</p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
          <div className="flex items-center space-x-2 mb-2">
            <ChartBarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Avg/Day</p>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">{summary.averageHoursPerDay.toFixed(1)}h</p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-100 dark:border-orange-800">
          <div className="flex items-center space-x-2 mb-2">
            <ClockIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">Break Time</p>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-200">{formatDuration(summary.totalBreakMinutes)}</p>
        </div>
      </div>

      {/* Today's Details */}
      {todayEntry && (
        <div className="bg-gradient-to-br from-primary-subtle-background/50 to-primary-subtle-background/80 dark:from-surface/80 dark:to-surface/70 rounded-lg p-4 border border-primary/20 dark:border-primary/30">
          <h4 className="text-sm font-bold text-text-primary/90 dark:text-white mb-3 flex items-center">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Today's Activity
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Clock In:</span>
              <span className="font-semibold text-text-primary/90 dark:text-white">
                {todayEntry.clockIn.toLocaleTimeString()}
              </span>
            </div>
            {todayEntry.clockOut && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Clock Out:</span>
                <span className="font-semibold text-text-primary/90 dark:text-white">
                  {todayEntry.clockOut.toLocaleTimeString()}
                </span>
              </div>
            )}
            {todayEntry.breaks.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Breaks Taken:</span>
                <span className="font-semibold text-text-primary/90 dark:text-white">
                  {todayEntry.breaks.length}
                </span>
              </div>
            )}
            {todayEntry.totalWorkHours && (
              <div className="flex justify-between pt-2 border-t border-primary/20 dark:border-primary/30">
                <span className="text-gray-600 dark:text-gray-300 font-semibold">Total Work:</span>
                <span className="font-bold text-primary-hover dark:text-primary">
                  {todayEntry.totalWorkHours.toFixed(2)} hours
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-8">
          <ClockIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No time entries found for this period</p>
        </div>
      )}
    </div>
  );
};

export default TimeTrackingSummary;
