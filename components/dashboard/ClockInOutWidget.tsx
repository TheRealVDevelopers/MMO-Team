import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useCurrentTimeStatus, clockIn, clockOut, startBreak, endBreak } from '../../hooks/useTimeTracking';
import { TimeTrackingStatus } from '../../types';

interface ClockInOutWidgetProps {
  userId: string;
  userName: string;
}

const ClockInOutWidget: React.FC<ClockInOutWidgetProps> = ({ userId, userName }) => {
  const { status, loading } = useCurrentTimeStatus(userId);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [duration, setDuration] = useState('00:00:00');
  const [breakDuration, setBreakDuration] = useState('00:00');
  const [actionLoading, setActionLoading] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate duration since clock in
  useEffect(() => {
    if (status.clockInTime && status.status !== TimeTrackingStatus.CLOCKED_OUT) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - status.clockInTime!.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setDuration('00:00:00');
    }
  }, [status.clockInTime, status.status]);

  // Calculate break duration
  useEffect(() => {
    if (status.currentBreakStartTime && status.status === TimeTrackingStatus.ON_BREAK) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - status.currentBreakStartTime!.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setBreakDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setBreakDuration('00:00');
    }
  }, [status.currentBreakStartTime, status.status]);

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      await clockIn(userId, userName);
    } catch (error: any) {
      alert(error.message || 'Failed to clock in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!status.currentEntryId) return;
    
    const confirmed = window.confirm('Are you sure you want to clock out for the day?');
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await clockOut(status.currentEntryId);
    } catch (error: any) {
      alert(error.message || 'Failed to clock out');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartBreak = async () => {
    if (!status.currentEntryId) return;
    
    setActionLoading(true);
    try {
      await startBreak(status.currentEntryId);
    } catch (error: any) {
      alert(error.message || 'Failed to start break');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!status.currentEntryId) return;
    
    setActionLoading(true);
    try {
      await endBreak(status.currentEntryId);
    } catch (error: any) {
      alert(error.message || 'Failed to end break');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-kurchi-espresso-800 rounded-xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-kurchi-espresso-700 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-kurchi-espresso-700 rounded"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status.status) {
      case TimeTrackingStatus.CLOCKED_IN:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case TimeTrackingStatus.ON_BREAK:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case TimeTrackingStatus.CLOCKED_OUT:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-kurchi-espresso-800 rounded-xl shadow-md p-6 border-2 border-transparent hover:border-kurchi-gold-500 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-kurchi-gold-500/10 dark:bg-kurchi-gold-500/20 rounded-full p-3">
            <ClockIcon className="w-6 h-6 text-kurchi-gold-600 dark:text-kurchi-gold-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-kurchi-espresso-900 dark:text-white">Time Tracking</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor()}`}>
          {status.status}
        </div>
      </div>

      {/* Time Display */}
      {status.status !== TimeTrackingStatus.CLOCKED_OUT && (
        <div className="mb-6 bg-gradient-to-br from-kurchi-gold-50 to-kurchi-gold-100 dark:from-kurchi-espresso-700 dark:to-kurchi-espresso-600 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {status.status === TimeTrackingStatus.ON_BREAK ? 'Break Duration' : 'Work Duration'}
            </p>
            <p className="text-3xl font-bold text-kurchi-espresso-900 dark:text-white font-mono">
              {status.status === TimeTrackingStatus.ON_BREAK ? breakDuration : duration}
            </p>
            {status.clockInTime && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Clocked in at {status.clockInTime.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {status.status === TimeTrackingStatus.CLOCKED_OUT && (
          <button
            onClick={handleClockIn}
            disabled={actionLoading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayIcon className="w-6 h-6" />
            <span>{actionLoading ? 'Clocking In...' : 'Clock In'}</span>
          </button>
        )}

        {status.status === TimeTrackingStatus.CLOCKED_IN && (
          <>
            <button
              onClick={handleStartBreak}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-4 rounded-lg font-bold hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PauseIcon className="w-6 h-6" />
              <span>{actionLoading ? 'Starting Break...' : 'Start Break'}</span>
            </button>
            <button
              onClick={handleClockOut}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <StopIcon className="w-6 h-6" />
              <span>{actionLoading ? 'Clocking Out...' : 'Clock Out'}</span>
            </button>
          </>
        )}

        {status.status === TimeTrackingStatus.ON_BREAK && (
          <button
            onClick={handleEndBreak}
            disabled={actionLoading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleIcon className="w-6 h-6" />
            <span>{actionLoading ? 'Ending Break...' : 'End Break'}</span>
          </button>
        )}
      </div>

      {/* Info Message */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
          {status.status === TimeTrackingStatus.CLOCKED_OUT && 'Click "Clock In" when you start your work day'}
          {status.status === TimeTrackingStatus.CLOCKED_IN && 'Take a break when needed or clock out when done'}
          {status.status === TimeTrackingStatus.ON_BREAK && 'Click "End Break" when you\'re ready to resume work'}
        </p>
      </div>
    </div>
  );
};

export default ClockInOutWidget;
