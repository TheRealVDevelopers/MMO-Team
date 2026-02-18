/**
 * HelpBot – Floating widget for internal error reporting.
 * Visible to all authenticated internal staff; no sidebar link.
 */

import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubmitErrorReport, useErrorReportsList } from '../hooks/useErrorReports';
import type { ErrorReportSeverity } from '../hooks/useErrorReports';
import { ChatBubbleLeftRightIcon, XMarkIcon, BugAntIcon, MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';

const HELPBOT_PAGE_LABELS: Record<string, string> = {
  '/projects': 'Projects List',
  '/project-reference': 'Project Reference',
  '/error-rectification': 'Error Rectification',
};

function getPageLabel(pathname: string): string {
  if (HELPBOT_PAGE_LABELS[pathname]) return HELPBOT_PAGE_LABELS[pathname];
  const match = pathname.match(/^\/projects\/([^/]+)/);
  if (match) return `Project: ${match[1].slice(0, 8)}`;
  return pathname || 'App';
}

const HelpBotWidget: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<ErrorReportSeverity>('medium');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { submit, submitting, error } = useSubmitErrorReport();
  const { unresolvedCount, isAdmin } = useErrorReportsList();

  // Only show for authenticated staff (no vendor/client)
  const isStaff = currentUser && !('vendorId' in currentUser);
  if (!isStaff) return null;

  const pageLabel = page || getPageLabel(location.pathname);

  const handleOpen = () => {
    setPage(getPageLabel(location.pathname));
    setDescription('');
    setSeverity('medium');
    setScreenshotFile(null);
    setVoiceBlob(null);
    setIsRecording(false);
    setOpen(true);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        setVoiceBlob(blob);
      };
      recorder.start(200);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access failed:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = description.trim().length > 0;
    const hasVoice = voiceBlob != null;
    if (!hasText && !hasVoice) return;
    const id = await submit({
      page: pageLabel,
      description: description.trim() || '(Voice note only)',
      severity,
      screenshotFile: screenshotFile || null,
      voiceBlob: voiceBlob || null,
    });
    if (id) {
      setOpen(false);
      setDescription('');
      setScreenshotFile(null);
      setVoiceBlob(null);
    }
  };

  const canSubmit = description.trim().length > 0 || (voiceBlob != null && voiceBlob.size > 0);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Report error (HelpBot)"
      >
        <ChatBubbleLeftRightIcon className="w-7 h-7" />
        {isAdmin && unresolvedCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {unresolvedCount > 99 ? '99+' : unresolvedCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between">
              <span className="font-bold flex items-center gap-2">
                <BugAntIcon className="w-5 h-5" />
                HelpBot
              </span>
              <button type="button" onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page</label>
                <input
                  type="text"
                  value={pageLabel}
                  onChange={(e) => setPage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Where did the error occur?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Error description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Describe what went wrong, or use the mic to send a voice note..."
                />
                <div className="mt-2 flex items-center gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium"
                    >
                      <MicrophoneIcon className="w-4 h-4" />
                      Record voice note
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium"
                    >
                      <StopIcon className="w-4 h-4" />
                      Stop recording
                    </button>
                  )}
                  {voiceBlob && voiceBlob.size > 0 && (
                    <span className="text-xs text-gray-500">
                      Voice note ready ({Math.round(voiceBlob.size / 1024)} KB)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as ErrorReportSeverity)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="minor">Minor</option>
                  <option value="medium">Medium</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Screenshot (optional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white"
                />
                {screenshotFile && (
                  <p className="text-xs text-gray-500 mt-1">{screenshotFile.name}</p>
                )}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Sending…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpBotWidget;
