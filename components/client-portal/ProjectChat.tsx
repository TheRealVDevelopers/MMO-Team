/**
 * Project Chat — messages from projectChats (projectId = caseId). Text, timestamp, sender role.
 */

import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useProjectChat, addChatMessage } from '../../hooks/useClientProjects';
import { formatDateTime } from '../../constants';

interface ProjectChatProps {
  projectId: string;
  clientUserId: string;
  clientUserName: string;
  isReadOnly?: boolean;
  isDark?: boolean;
}

const ProjectChat: React.FC<ProjectChatProps> = ({
  projectId,
  clientUserId,
  clientUserName,
  isReadOnly,
  isDark,
}) => {
  const { messages, loading, error } = useProjectChat(projectId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || isReadOnly) return;
    setSending(true);
    try {
      await addChatMessage({
        projectId,
        sender: 'client',
        senderName: clientUserName,
        content: text,
        read: false,
      });
      setInput('');
    } catch (e) {
      console.error('Send message error:', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`flex flex-col rounded-xl border ${isDark ? 'bg-white/5 border-amber-500/20' : 'bg-slate-50/50 border-slate-200'}`}>
      <div className="flex items-center gap-2 p-3 border-b border-slate-200 dark:border-amber-500/20">
        <ChatBubbleLeftRightIcon className="w-5 h-5 text-slate-500" />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Project Chat</span>
      </div>
      <div className="flex-1 min-h-[200px] max-h-[320px] overflow-y-auto p-3 space-y-3">
        {loading && <p className="text-xs text-slate-500">Loading...</p>}
        {error && <p className="text-xs text-red-500">Could not load messages.</p>}
        {!loading && !error && messages.length === 0 && (
          <p className="text-xs text-slate-500">No messages yet. Start the conversation.</p>
        )}
        {messages.map((msg) => {
          const isClient = msg.sender === 'client';
          return (
            <div
              key={msg.id}
              className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  isClient
                    ? 'bg-primary text-white'
                    : isDark
                      ? 'bg-slate-700 text-slate-100'
                      : 'bg-white border border-slate-200 text-slate-900'
                }`}
              >
                <p className="text-xs font-medium opacity-90">{msg.senderName}</p>
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
              isDark ? 'bg-slate-800 border-amber-500/30 text-white placeholder-slate-400' : 'bg-white border-slate-200'
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

export default ProjectChat;
