import api from '../api/client';
import * as db from './db';

// Exponential backoff for retrying a failed (non-conflict, non-validation)
// sync attempt — starts at 5s, doubles each failure, caps at 5 minutes.
// Keeps a flaky connection from being hammered with retries while still
// eventually catching up once things stabilize.
const BASE_DELAY_MS = 5_000;
const MAX_DELAY_MS = 5 * 60_000;

const ENDPOINTS = {
  attendance_mark: '/sync/attendance',
  score_save: '/sync/scores',
};

function newUuid() {
  // crypto.randomUUID() is available in every browser this app targets
  // (all evergreen browsers, iOS 15.4+/Android since ~2021).
  return crypto.randomUUID();
}

/**
 * Called by a page's save action. Tries the direct sync request first
 * — most of the time the person is online and this just works, no
 * queueing involved. Only falls back to IndexedDB if the request
 * itself couldn't be made (offline, DNS failure, timeout) — NOT if the
 * server responded with a real error (validation, auth, conflict),
 * since those need to surface to the person immediately rather than
 * silently retry a request that will just fail the same way again.
 *
 * Returns `{ queued: false, data, clientUuid }` on an immediate
 * success, or `{ queued: true, clientUuid }` if it was queued for
 * later — `clientUuid` is returned either way so a caller that wants
 * to track "did this specific save actually reach the server yet" can
 * match it against the live queue (see useSyncQueue).
 */
export async function submitOrQueue(type, payload) {
  const clientUuid = newUuid();
  const recordedAt = new Date().toISOString();
  const endpoint = ENDPOINTS[type];
  const body = { ...payload, client_uuid: clientUuid, recorded_at: recordedAt };

  if (!navigator.onLine) {
    await enqueue({ clientUuid, type, endpoint, payload: body, recordedAt });
    return { queued: true, clientUuid };
  }

  try {
    const { data } = await api.post(endpoint, body);
    return { queued: false, data, clientUuid };
  } catch (error) {
    if (isNetworkError(error)) {
      await enqueue({ clientUuid, type, endpoint, payload: body, recordedAt });
      return { queued: true, clientUuid };
    }
    // A real server response (validation, 403, etc) — don't queue,
    // let the caller's normal error handling show it.
    throw error;
  }
}

function isNetworkError(error) {
  // Axios sets `error.response` only when the server actually
  // responded. No response at all means the request never reached
  // it — offline, DNS failure, timeout, CORS preflight failure, etc.
  return !error.response;
}

async function enqueue({ clientUuid, type, endpoint, payload, recordedAt }) {
  await db.put({
    client_uuid: clientUuid,
    type,
    endpoint,
    payload,
    recorded_at: recordedAt,
    status: 'pending',
    attempts: 0,
    next_attempt_at: null,
    error_message: null,
    conflict_data: null,
    created_at: Date.now(),
  });
  notifyQueueChanged();
}

/** Lets useSyncQueue (mounted once, in DashboardLayout) react to a
 * page enqueuing/resolving an item directly through this module,
 * without needing full shared state/context for something this small. */
function notifyQueueChanged() {
  window.dispatchEvent(new Event('skulag:sync-queue-changed'));
}

/**
 * Drains every due item in the queue, in the order they were created.
 * Stops as soon as it hits a network error (still offline — no point
 * trying the rest right now). Conflicts and hard failures are left in
 * the queue with an updated status rather than retried automatically.
 *
 * Safe to call repeatedly/concurrently — each item is fetched fresh
 * from IndexedDB and only advanced past `pending`/`syncing` once, so
 * an overlapping call (e.g. the 'online' event and the periodic timer
 * firing close together) just does redundant no-op passes.
 */
export async function drainQueue() {
  const all = await db.getAll();
  const due = all
    .filter((item) => item.status === 'pending')
    .filter((item) => !item.next_attempt_at || item.next_attempt_at <= Date.now())
    .sort((a, b) => a.created_at - b.created_at);

  for (const item of due) {
    const stillOnline = await processOne(item);
    if (!stillOnline) break;
  }
}

/** Returns false if this attempt revealed we're offline (caller should stop draining). */
async function processOne(item) {
  try {
    const { data } = await api.post(item.endpoint, item.payload);

    if (data.status === 'applied') {
      await db.remove(item.client_uuid);
    } else if (data.status === 'conflict' || data.status === 'partial') {
      await db.put({ ...item, status: 'conflict', conflict_data: data.conflict_data ?? null, server_operation_id: data.id });
    } else {
      // Unexpected status — treat conservatively as needing a look.
      await db.put({ ...item, status: 'conflict', conflict_data: data });
    }

    notifyQueueChanged();
    return true;
  } catch (error) {
    if (isNetworkError(error)) {
      return false; // still offline — stop draining, leave item pending
    }

    const attempts = (item.attempts ?? 0) + 1;
    const delay = Math.min(BASE_DELAY_MS * 2 ** (attempts - 1), MAX_DELAY_MS);
    const message = error.response?.data?.message
      ?? Object.values(error.response?.data?.errors ?? {}).flat()[0]
      ?? 'This item could not be synced.';

    await db.put({
      ...item,
      status: attempts >= 5 ? 'failed' : 'pending',
      attempts,
      next_attempt_at: Date.now() + delay,
      error_message: message,
    });

    notifyQueueChanged();
    return true; // this was a real server error, not offline — keep draining the rest
  }
}

export async function retryItem(clientUuid) {
  const all = await db.getAll();
  const item = all.find((i) => i.client_uuid === clientUuid);
  if (!item) return;
  await db.put({ ...item, status: 'pending', next_attempt_at: null });
  notifyQueueChanged();
  await drainQueue();
}

export async function discardItem(clientUuid) {
  await db.remove(clientUuid);
  notifyQueueChanged();
}

export { getAll as getQueue } from './db';
