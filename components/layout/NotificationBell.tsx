'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { EXPLORER_BASE_URL } from '@/lib/constants';
import { FiBell, FiX, FiExternalLink, FiCheckCircle } from 'react-icons/fi';

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, loading, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleOpen() {
    setOpen((v) => !v);
    if (!open) markAllRead();
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors"
      >
        <FiBell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <span className="text-sm font-semibold text-white">Notifications</span>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-zinc-500">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <FiCheckCircle className="h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">You&apos;re all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="group border-b border-zinc-900 px-4 py-3 hover:bg-zinc-900/60 transition-colors last:border-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{n.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-400 truncate">{n.description}</p>
                      <p className="mt-1 text-xs text-zinc-600">{timeAgo(n.createdAt)}</p>
                    </div>
                    <a
                      href={`${EXPLORER_BASE_URL}/tx/${n.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-zinc-600 hover:text-white transition-colors mt-0.5"
                      title="View transaction"
                    >
                      <FiExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-zinc-800 px-4 py-2 text-center">
              <span className="text-xs text-zinc-600">
                Showing last {notifications.length} events
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
