import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  id?: string;
  title?: string;
  durationMs?: number;
}

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastApi {
  show: (type: ToastType, message: string, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION_MS = 3500;

const typeStyles: Record<ToastType, { ring: string; icon: string; title: string }> = {
  success: { ring: 'ring-emerald-400/30', icon: '✅', title: 'Success' },
  error: { ring: 'ring-red-400/30', icon: '⚠️', title: 'Error' },
  warning: { ring: 'ring-amber-400/30', icon: '⚠️', title: 'Warning' },
  info: { ring: 'ring-blue-400/30', icon: 'ℹ️', title: 'Info' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timeoutId = timeoutsRef.current[id];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete timeoutsRef.current[id];
    }
  }, []);

  const show = useCallback(
    (type: ToastType, message: string, options?: ToastOptions) => {
      const id = options?.id || `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS;
      const title = options?.title;

      setToasts((prev) => {
        // Keep last 3 toasts for sanity
        const next = [...prev.filter((t) => t.id !== id), { id, type, message, title }];
        return next.slice(-3);
      });

      timeoutsRef.current[id] = window.setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m, o) => show('success', m, o),
      error: (m, o) => show('error', m, o),
      info: (m, o) => show('info', m, o),
      warning: (m, o) => show('warning', m, o),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Viewport */}
      <div className="fixed top-4 right-4 z-[1100] flex flex-col gap-2 w-[min(420px,calc(100vw-2rem))]">
        {toasts.map((t) => {
          const conf = typeStyles[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className={`bg-surface border border-border/60 shadow-2xl rounded-2xl p-4 ring-1 ${conf.ring} backdrop-blur-sm`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-subtle-background flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">{conf.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                    {t.title || conf.title}
                  </p>
                  <p className="text-sm font-semibold text-text-primary mt-1 break-words">{t.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="px-2 py-1 text-xs font-bold text-text-tertiary hover:text-text-primary hover:bg-subtle-background rounded-lg transition-colors"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};


