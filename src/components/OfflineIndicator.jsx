import { useRef, useState, useEffect } from 'react';
import { useSyncQueue } from '../hooks/useSyncQueue';

const TYPE_LABELS = {
  attendance_mark: 'Attendance',
  score_save: 'Score entry',
};

/**
 * Stage 52 — lives in DashboardLayout's topbar (every role sees it),
 * mirroring NotificationBell's pattern: a small badge that opens a
 * dropdown. Shows connectivity, anything still waiting to sync, and
 * lets the person resolve a conflict right here rather than having to
 * go back to the page where they originally made the edit.
 */
export default function OfflineIndicator() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const {
    isOnline, isSyncing, pendingCount, conflictCount, failedCount,
    conflicts, failed, syncNow, resolveConflict, retryItem, discardItem,
  } = useSyncQueue();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const needsAttention = conflictCount + failedCount;
  const waitingTotal = pendingCount + conflictCount + failedCount;

  // Nothing queued, ever, and we're online — no point showing chrome
  // for a feature that isn't doing anything right now.
  if (waitingTotal === 0 && isOnline) return null;

  const dotColor = !isOnline ? 'bg-muted' : needsAttention > 0 ? 'bg-danger' : pendingCount > 0 ? 'bg-warning' : 'bg-success';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-muted hover:bg-bg hover:text-ink transition-colors text-xs font-medium"
        aria-label="Offline sync status"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
        <span className="hidden sm:inline">{isOnline ? (waitingTotal > 0 ? 'Syncing' : 'Online') : 'Offline'}</span>
        {waitingTotal > 0 && (
          <span className="min-w-[16px] h-4 px-1 rounded-full bg-ink/80 text-white text-[10px] font-semibold flex items-center justify-center">
            {waitingTotal > 9 ? '9+' : waitingTotal}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-ink">{isOnline ? 'Online' : 'Offline'}</p>
              <p className="text-xs text-muted mt-0.5">
                {isOnline
                  ? waitingTotal > 0 ? `${waitingTotal} item${waitingTotal === 1 ? '' : 's'} to sync` : 'Everything is synced.'
                  : 'Your work is being saved on this device and will sync once you\'re back online.'}
              </p>
            </div>
            {isOnline && pendingCount > 0 && (
              <button
                type="button"
                onClick={syncNow}
                disabled={isSyncing}
                className="text-xs text-primary hover:underline shrink-0"
              >
                {isSyncing ? 'Syncing…' : 'Sync now'}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {waitingTotal === 0 && (
              <p className="text-sm text-muted text-center py-8">Nothing waiting to sync.</p>
            )}

            {conflicts.map((item) => (
              <div key={item.client_uuid} className="px-4 py-3 border-b border-border last:border-0">
                <p className="text-sm font-medium text-ink">{TYPE_LABELS[item.type] ?? item.type} — needs your review</p>
                <p className="text-xs text-muted mt-0.5">
                  This was also changed elsewhere while you were offline. Choose which version to keep.
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => resolveConflict(item, 'keep_local')}
                    className="text-xs px-2.5 py-1 rounded-lg bg-primary-soft text-primary hover:bg-primary-soft/70"
                  >
                    Keep my version
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveConflict(item, 'keep_server')}
                    className="text-xs px-2.5 py-1 rounded-lg bg-bg text-muted hover:bg-black/5"
                  >
                    Keep the other version
                  </button>
                </div>
              </div>
            ))}

            {failed.map((item) => (
              <div key={item.client_uuid} className="px-4 py-3 border-b border-border last:border-0">
                <p className="text-sm font-medium text-ink">{TYPE_LABELS[item.type] ?? item.type} — couldn't sync</p>
                <p className="text-xs text-danger mt-0.5">{item.error_message ?? 'This kept failing to save.'}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => retryItem(item.client_uuid)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-primary-soft text-primary hover:bg-primary-soft/70"
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={() => discardItem(item.client_uuid)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-bg text-muted hover:bg-black/5"
                  >
                    Discard
                  </button>
                </div>
              </div>
            ))}

            {pendingCount > 0 && (
              <p className="text-xs text-muted text-center py-3">
                {pendingCount} item{pendingCount === 1 ? '' : 's'} waiting{!isOnline ? ' for a connection' : ''}…
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
