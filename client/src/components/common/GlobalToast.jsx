import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, X } from 'lucide-react';

export default function GlobalToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleToastEvent = (e) => {
      const detail = e.detail;
      if (!detail) return;
      setToast({
        id: Date.now(),
        title: detail.title || 'Notification',
        body: detail.body || '',
      });
    };

    window.addEventListener('app:notification-toast', handleToastEvent);
    return () => window.removeEventListener('app:notification-toast', handleToastEvent);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 6500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <aside
      aria-label="System notification"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-[94%] max-w-md pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-top-4"
    >
      <div className="bg-slate-900/95 dark:bg-slate-900/95 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 text-white rounded-2xl p-4 shadow-2xl border border-sky-500/50 backdrop-blur-xl flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wide text-sky-400 uppercase">Alert</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-xs font-semibold text-white truncate">{toast.title}</h2>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-normal">
            {toast.body}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setToast(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
