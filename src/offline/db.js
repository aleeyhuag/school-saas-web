const DB_NAME = 'skulag-offline';
const DB_VERSION = 1;
const STORE = 'sync_queue';

/**
 * Stage 52 — thin promise wrapper around the raw IndexedDB API. No
 * extra dependency (idb/dexie) — the actual usage here (one object
 * store, a handful of operations) doesn't need one, and every browser
 * that runs this app already supports IndexedDB natively.
 *
 * One record per queued operation, keyed by `client_uuid` (the same
 * UUID the server's sync_operations table uses for idempotency — see
 * SyncController's docblock). Shape of a record:
 *
 * {
 *   client_uuid, type: 'attendance_mark' | 'score_save',
 *   endpoint, payload, recorded_at,
 *   status: 'pending' | 'syncing' | 'conflict' | 'failed',
 *   attempts, next_attempt_at, error_message,
 *   conflict_data, created_at,
 * }
 */
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'client_uuid' });
        store.createIndex('status', 'status');
        store.createIndex('created_at', 'created_at');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const result = fn(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function put(record) {
  return withStore('readwrite', (store) => store.put(record));
}

export async function remove(clientUuid) {
  return withStore('readwrite', (store) => store.delete(clientUuid));
}

export async function getAll() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });
}
