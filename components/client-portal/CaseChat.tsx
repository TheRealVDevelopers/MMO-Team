/**
 * Group chat under cases/{caseId}/messages.
 * Lead: Client, Sales, SGM, Super Admin. Project: + Project Head.
 */

import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useCaseMessages, sendCaseMessage } from '../../hooks/useCaseMessages';
import { formatDateTime } from '../../constants';

interface CaseChatProps {
  caseId: string;
  clientUserId: string;
  clientUserName: string;
  isReadOnly?: boolean;
  isDark?: boolean;
}

const CaseChat: React.FC<CaseChatProps> = ({ caseId, clientUserId, clientUserName, isReadOnly, isDark }) => {
  const { messages, loading, error } = useCaseMessages(caseId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || isReadOnly || !caseId) return;
    setSending(true);
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

  return (
    <div className={`flex flex-col rounded-xl border ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-slate-50/50 border-slate-200'} overflow-hidden`}>
      <div className="flex items-center gap-2 p-3 border-b border-slate-200 dark:border-amber-500/20">
        <ChatBubbleLeftRightIcon className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Project Chat</span>
      </div>
      <div className="min-h-[200px] max-h-[320px] overflow-y-auto p-3 space-y-3">
        {loading && <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Loading...</p>}
        {error && <p className="text-xs text-red-600 dark:text-red-400">Could not load messages.</p>}
        {!loading && !error && messages.length === 0 && (
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No messages yet. Start the conversation.</p>
        )}
        {messages.map((msg) => {
          const isClient = msg.senderRole === 'client';
          return (
            <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  isClient ? 'bg-primary text-white' : isDark ? 'bg-slate-700 text-slate-100' : 'bg-white border border-slate-200 text-slate-900'
                }`}
              >
                <p className="text-xs font-medium opacity-90">
                  {msg.senderName}
                  {msg.senderRole && msg.senderRole !== 'client' && (
                    <span className="ml-1 opacity-75">({msg.senderRole})</span>
                  )}
                </p>
                <p className="text-sm mt-0.5 break-words">{msg.content}</p>
                <p className="text-[10px] opacity-70 mt-1">{formatDateTime(msg.timestamp)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {!isReadOnly && (
        <div className="p-3 border-t border-slate-200 dark:border-amber-500/20 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
              isDark ? 'bg-slate-800 border-amber-500/30 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500'
            }`}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-2 rounded-lg bg-primary text-white disabled:opacity-50 hover:bg-secondary transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CaseChat;
