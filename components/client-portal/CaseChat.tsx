/**
 * Project Chat – Slack-style: bubbles, role badges, attachment preview, typing placeholder, pinned area.
 */

import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon, PaperClipIcon, PhotoIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import { useCaseMessages, sendCaseMessage, type CaseMessage } from '../../hooks/useCaseMessages';
import { formatDateTime } from '../../constants';

const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  sales: 'Sales',
  admin: 'Admin',
  sgm: 'SGM',
  'super admin': 'Super Admin',
  'project head': 'Project Head',
  team: 'Team',
};

const ROLE_STYLES: Record<string, string> = {
  client: 'bg-primary/20 text-primary',
  sales: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  admin: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  'project head': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  sgm: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  'super admin': 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
  team: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
};

interface CaseChatProps {
  caseId: string;
  clientUserId: string;
  clientUserName: string;
  isReadOnly?: boolean;
  isDark?: boolean;
  pinnedMessage?: CaseMessage | null;
}

const CaseChat: React.FC<CaseChatProps> = ({ caseId, clientUserId, clientUserName, isReadOnly, isDark, pinnedMessage }) => {
  const { messages, loading, error } = useCaseMessages(caseId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showTypingPlaceholder, setShowTypingPlaceholder] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || isReadOnly || !caseId) return;
    setSending(true);
    setShowTypingPlaceholder(false);
    try {
      await sendCaseMessage(caseId, {
        senderId: clientUserId,
        senderName: clientUserName,
        senderRole: 'client',
        content: text,
        type: 'text',
      });
      setInput('');
    } catch (e) {
      console.error('Send message error:', e);
    } finally {
      setSending(false);
    }
  };

  const textPrimary = isDark ? 'text-white' : 'text-[#111111]';
  const textMuted = isDark ? 'text-slate-400' : 'text-[#111111]';

  return (
    <div className={`flex flex-col rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-slate-50/50 border-slate-200'}`}>
      <div className={`flex items-center gap-2 p-3 border-b ${isDark ? 'border-amber-500/20' : 'border-slate-200'}`}>
        <ChatBubbleLeftRightIcon className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-[#111111]'}`} />
        <span className={`text-sm font-bold ${textPrimary}`}>Project Chat</span>
      </div>

      {/* Pinned message area */}
      {pinnedMessage && (
        <div className={`mx-3 mt-2 p-2 rounded-lg border-l-2 ${isDark ? 'bg-amber-500/10 border-amber-500/50' : 'bg-amber-50 border-amber-300'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Pinned</p>
          <p className={`text-xs ${textPrimary} line-clamp-2`}>{pinnedMessage.content}</p>
          <p className={`text-[10px] ${textMuted} mt-0.5`}>{pinnedMessage.senderName} · {formatDateTime(pinnedMessage.timestamp)}</p>
        </div>
      )}

      <div className="min-h-[200px] max-h-[320px] overflow-y-auto p-3 space-y-4">
        {loading && <p className={`text-xs ${textMuted}`}>Loading...</p>}
        {error && <p className="text-xs text-red-600 dark:text-red-400">Could not load messages.</p>}
        {!loading && !error && messages.length === 0 && (
          <p className={`text-sm ${textMuted}`}>No messages yet. Start the conversation.</p>
        )}
        {messages.map((msg) => {
          const isClient = msg.senderRole === 'client';
          const roleLabel = ROLE_LABELS[msg.senderRole?.toLowerCase() ?? ''] ?? msg.senderRole ?? 'Team';
          const roleStyle = ROLE_STYLES[msg.senderRole?.toLowerCase() ?? ''] ?? ROLE_STYLES.team;
          return (
            <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                  isClient
                    ? 'rounded-br-md bg-primary text-white'
                    : isDark
                      ? 'rounded-bl-md bg-slate-700/90 text-slate-100 border border-slate-600/50'
                      : 'rounded-bl-md bg-white border border-slate-200 text-[#111111]'
                }`}
              >
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className={`text-xs font-semibold ${isClient ? 'text-white' : textPrimary}`}>{msg.senderName}</span>
                  {msg.senderRole && msg.senderRole !== 'client' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${roleStyle}`}>{roleLabel}</span>
                  )}
                </div>
                <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                {msg.attachmentUrl && (
                  <a
                    href={msg.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 mt-2 text-xs ${isClient ? 'text-white/90 hover:text-white' : 'text-primary hover:underline'}`}
                  >
                    <PaperClipIcon className="w-3.5 h-3.5" />
                    Attachment
                  </a>
                )}
                <p className={`text-[10px] mt-1.5 ${isClient ? 'text-white/70' : textMuted}`}>{formatDateTime(msg.timestamp)}</p>
              </div>
            </div>
          );
        })}
        {showTypingPlaceholder && !sending && (
          <div className="flex justify-start">
            <div className={`rounded-2xl rounded-bl-md px-4 py-2 ${isDark ? 'bg-slate-700/70' : 'bg-slate-200'}`}>
              <span className="text-xs text-slate-500 dark:text-slate-400">Someone is typing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {!isReadOnly && (
        <div className={`p-3 border-t flex gap-2 ${isDark ? 'border-amber-500/20' : 'border-slate-200'}`}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setShowTypingPlaceholder(true)}
            onBlur={() => setShowTypingPlaceholder(false)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm transition-shadow focus:ring-2 focus:ring-primary/30 focus:border-primary ${
              isDark ? 'bg-slate-800 border-amber-500/30 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-[#111111] placeholder-slate-500'
            }`}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-2.5 rounded-xl bg-primary text-white disabled:opacity-50 hover:bg-secondary transition-all shadow-sm"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CaseChat;
