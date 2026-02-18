/**
 * Error Rectification – Internal admin-only page.
 * Route: /error-rectification (no sidebar link; direct access only).
 * SUPER_ADMIN only; real-time list, mark in progress / resolved, optional note, delete.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useErrorReportsList, useUpdateErrorReport } from '../hooks/useErrorReports';
import type { ErrorReport, ErrorReportStatus } from '../hooks/useErrorReports';
import { UserRole } from '../types';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  PlayIcon,
  CheckCircleIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';

const severityColors: Record<string, string> = {
  minor: 'bg-gray-100 text-gray-700',
  medium: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
};

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
};

const ErrorRectificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { reports, loading, isAdmin } = useErrorReportsList();
  const { updateStatus, deleteReport } = useUpdateErrorReport();
  const [noteModal, setNoteModal] = useState<{ report: ErrorReport; field: 'in_progress' | 'resolved' } | null>(null);
  const [internalNote, setInternalNote] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (currentUser?.role !== UserRole.SUPER_ADMIN) {
    navigate('/', { replace: true });
    return null;
  }

  const handleStatus = async (reportId: string, status: ErrorReportStatus, note?: string) => {
    await updateStatus(reportId, status, note);
    setNoteModal(null);
    setInternalNote('');
  };

  const handleDelete = async (reportId: string) => {
    if (!window.confirm('Delete this report?')) return;
    await deleteReport(reportId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DocumentTextIcon className="w-8 h-8 text-primary" />
              Error Rectification
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Submitted By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Page</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Screenshot</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Voice note</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                        No error reports yet.
                      </td>
                    </tr>
                  ) : (
                    reports.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.userName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{r.userRole}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{r.page}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${severityColors[r.severity] ?? severityColors.medium}`}>
                            {r.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={r.description}>
                          {r.description}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {r.screenshotUrl ? (
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => setLightboxUrl(r.screenshotUrl!)}
                                className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
                              >
                                <PhotoIcon className="w-4 h-4" />
                                View
                              </button>
                              <a
                                href={r.screenshotUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-500 hover:text-primary"
                              >
                                Open in new tab
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {r.voiceNoteUrl ? (
                            <div className="flex flex-col gap-2 min-w-[220px]">
                              <div className="flex items-center gap-2">
                                <SpeakerWaveIcon className="w-5 h-5 text-primary flex-shrink-0" aria-hidden />
                                <audio
                                  key={`${r.id}-${r.voiceNoteUrl}`}
                                  src={r.voiceNoteUrl}
                                  controls
                                  controlsList="play pause volume"
                                  className="h-9 min-w-[200px] max-w-[280px]"
                                  preload="metadata"
                                  title="Play voice note"
                                >
                                  Your browser does not support audio playback.
                                </audio>
                              </div>
                              <a
                                href={r.voiceNoteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-500 hover:text-primary"
                              >
                                Open in new tab
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {r.createdAt.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[r.status] ?? statusColors.open}`}>
                            {r.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {r.status === 'open' && (
                              <button
                                type="button"
                                onClick={() => setNoteModal({ report: r, field: 'in_progress' })}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="Mark In Progress"
                              >
                                <PlayIcon className="w-4 h-4" />
                              </button>
                            )}
                            {(r.status === 'open' || r.status === 'in_progress') && (
                              <button
                                type="button"
                                onClick={() => setNoteModal({ report: r, field: 'resolved' })}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Mark Resolved"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(r.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {noteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setNoteModal(null)}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-gray-900 mb-2">
                {noteModal.field === 'in_progress' ? 'Mark In Progress' : 'Mark Resolved'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">Optional internal note:</p>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4"
                placeholder="Add a note..."
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setNoteModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleStatus(noteModal.report.id, noteModal.field, internalNote || undefined)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {lightboxUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setLightboxUrl(null)}>
            <img src={lightboxUrl} alt="Screenshot" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-800"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorRectificationPage;
