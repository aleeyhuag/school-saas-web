import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * Keeps a copy of the most-used lists on the device, so a returning user sees
 * their classes, subjects, class roster etc. instantly (even on a weak network)
 * while the app refreshes them in the background.
 *
 * Only the lists named below are kept — never fees, results, scores or the
 * admin student list (which carries guardian contact details). The copy is
 * wiped on logout / forced sign-out, and expires after 24 hours.
 */
export const QUERY_CACHE_KEY = 'skulag-query-cache-v1';

export const PERSISTED_QUERY_ROOTS = [
  'classes',
  'subjects',
  'current-term',
  'my-assignments',
  'students-roster',
];

export const queryPersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: QUERY_CACHE_KEY,
  throttleTime: 1000,
});

export function clearPersistedQueryCache() {
  try {
    window.localStorage.removeItem(QUERY_CACHE_KEY);
  } catch {
    // Storage unavailable (private mode) — nothing to clear.
  }
}
