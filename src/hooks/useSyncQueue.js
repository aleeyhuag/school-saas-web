import { useCallback, useEffect, useState } from 'react';
import * as syncEngine from '../offline/syncEngine';
import * as db from '../offline/db';
import api from '../api/client';
import { useOnlineStatus } from './useOnlineStatus';

const POLL_INTERVAL_MS = 20_000;

/**
 * The single source of truth the offline UI (indicator badge,
 * conflicts panel) reads from. Auto-drains the queue whenever the
 * browser comes back online, and on a periodic timer while online (in
 * case something was queued moments ago and the 'online' event already
 * fired before it existed, or a previous drain stopped partway through
 * a longer queue).
 */
export function useSyncQueue() {
  const isOnline = useOnlineStatus();
  const [queue, setQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setQueue(await syncEngine.getQueue());
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      await syncEngine.drainQueue();
    } finally {
      setIsSyncing(false);
      await refresh();
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    window.addEventListener('skulag:sync-queue-changed', refresh);
    return () => window.removeEventListener('skulag:sync-queue-changed', refresh);
  }, [refresh]);

  useEffect(() => {
    if (isOnline) syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline) return undefined;
    const id = setInterval(syncNow, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isOnline, syncNow]);

  const pending = queue.filter((i) => i.status === 'pending');
  const conflicts = queue.filter((i) => i.status === 'conflict');
  const failed = queue.filter((i) => i.status === 'failed');

  /**
   * Sends the person's choice to the server (which holds both the
   * local and server values, so it can act on 'keep_local' without
   * the client re-sending the payload), then drops the item from the
   * local queue either way — it's no longer pending.
   */
  const resolveConflict = useCallback(async (item, resolution) => {
    const operationId = item.server_operation_id;
    if (operationId) {
      await api.post(`/sync/operations/${operationId}/resolve`, { resolution });
    }
    await db.remove(item.client_uuid);
    await refresh();
  }, [refresh]);

  return {
    isOnline,
    isSyncing,
    queue,
    pendingCount: pending.length,
    conflictCount: conflicts.length,
    failedCount: failed.length,
    conflicts,
    failed,
    syncNow,
    refresh,
    resolveConflict,
    retryItem: syncEngine.retryItem,
    discardItem: syncEngine.discardItem,
  };
}
