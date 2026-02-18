/**
 * HelpBot – Feedback & error reporting via WhatsApp.
 * No Firestore/Storage; opens WhatsApp with pre-filled message. Screenshot compulsory.
 */

import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChatBubbleLeftRightIcon, XMarkIcon, BugAntIcon, MicrophoneIcon, StopIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const HELPBOT_PAGE_LABELS: Record<string, string> = {
  '/projects': 'Projects List',
  '/project-reference': 'Project Reference',
  '/error-rectification': 'Error Rectification',
};

const WHATSAPP_NUMBER = '918123908319'; // 91 (India) + 8123908319

function getPageLabel(pathname: string): string {
  if (HELPBOT_PAGE_LABELS[pathname]) return HELPBOT_PAGE_LABELS[pathname];
  const match = pathname.match(/^\/projects\/([^/]+)/);
  if (match) return `Project: ${match[1].slice(0, 8)}`;
  return pathname || 'App';
}

function buildWhatsAppMessage(params: {
  page: string;
  description: string;
  severity: string;
  userName: string;
}): string {
  const lines = [
    '*HelpBot – Application feedback*',
    '',
    `*Page:* ${params.page}`,
    `*Severity:* ${params.severity}`,
    `*Reported by:* ${params.userName}`,
    '',
    '*Description:*',
    params.description || '(No text – see voice note / screenshot in next messages)',
    '',
    '---',
    'Please send your *screenshot* (and voice note if recorded) in the next messages in this chat.',
  ];
  return lines.join('\n');
}

function openWhatsApp(text: string): void {
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

const HelpBotWidget: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<string>('medium');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isStaff = currentUser && !('vendorId' in currentUser);
  if (!isStaff) return null;

  const pageLabel = page || getPageLabel(location.pathname);
  const userName = currentUser?.name || currentUser?.email || 'Unknown';

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
        setVoiceBlob(new Blob(chunksRef.current, { type: mime }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = description.trim().length > 0;
    const hasVoice = voiceBlob != null && voiceBlob.size > 0;
    if (!screenshotFile) return; // compulsory
    if (!hasText && !hasVoice) return;

    const message = buildWhatsAppMessage({
      page: pageLabel,
      description: description.trim() || '(Voice note recorded – please send it in WhatsApp after this message.)',
      severity,
      userName,
    });

    openWhatsApp(message);
    setOpen(false);
    setDescription('');
    setScreenshotFile(null);
    setVoiceBlob(null);
  };

  const hasDescription = description.trim().length > 0 || (voiceBlob != null && voiceBlob.size > 0);
  const canSubmit = !!screenshotFile && hasDescription;

  return (
    <>
      {/* Banner note above the button */}
      <div className="fixed bottom-20 right-6 z-[9998] max-w-[220px] rounded-xl border border-primary/30 bg-white px-3 py-2 shadow-lg text-sm text-slate-700">
        <p className="font-medium text-slate-800">For any changes in the application, please let us know here.</p>
      </div>

      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Report feedback (HelpBot)"
      >
        <ChatBubbleLeftRightIcon className="w-7 h-7" />
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
              {/* How to report – instructions */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
                <p className="font-semibold text-amber-900 flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4" />
                  How to report
                </p>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li>Describe the error <strong>clearly</strong> in the text box below, <strong>or</strong> record a voice note.</li>
                  <li>Include what you were doing, what went wrong, and what you expected.</li>
                  <li><strong>Screenshot is compulsory</strong> – please attach a screenshot of the issue.</li>
                </ul>
              </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Error description * (text or voice)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Describe what went wrong clearly. You can also record a voice note below."
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
                    <span className="text-xs text-gray-500">Voice note ready ({Math.round(voiceBlob.size / 1024)} KB) – send it in WhatsApp after opening the chat.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Screenshot * (compulsory)</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">You must attach a screenshot. After clicking &quot;Send to WhatsApp&quot;, send this image in the same WhatsApp chat.</p>
                {screenshotFile && (
                  <p className="text-xs text-green-600 mt-1 font-medium">{screenshotFile.name} selected</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="minor">Minor</option>
                  <option value="medium">Medium</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
                <strong>What happens next:</strong> Clicking &quot;Send to WhatsApp&quot; will open WhatsApp with your message. Please then send your <strong>screenshot</strong> (and voice note if you recorded one) in that same chat.
              </div>

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
                  disabled={!canSubmit}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Send to WhatsApp
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
