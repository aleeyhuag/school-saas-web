import { useEffect, useState } from 'react';
import LoadingState from './LoadingState';
import { ErrorState } from './StateMessage';
import Button from './Button';
import { describeQueryError } from '../../lib/queryErrors';

/**
 * One place that decides what a data list shows while its request is running,
 * after it fails, and while it quietly refreshes — so a failed request can never
 * look like an empty school.
 *
 *   <QueryBoundary query={studentsQuery} loadingLabel="Loading students…">
 *     <DataTable ... />          // shown once there is data (an empty list is NOT an error)
 *   </QueryBoundary>
 *
 *  - first load        -> the Skulag loader (+ a "slow connection" note after 8s)
 *  - offline           -> says so, loads by itself when the connection returns
 *  - failed            -> a clear reason + "Try again" button
 *  - failed to refresh -> keeps showing the last data with a small "Try again" note
 *  - refreshing / next page -> data stays on screen, slightly dimmed, with "Updating…"
 */
function SlowConnectionHint() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, []);
  if (!slow) return null;
  return (
    <p className="text-center text-xs text-muted pb-6 -mt-4">
      Still working — your connection looks slow. Please keep this page open.
    </p>
  );
}

function RetryButton({ query, children = 'Try again' }) {
  return (
    <Button size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
      {query.isFetching ? 'Retrying…' : children}
    </Button>
  );
}

export default function QueryBoundary({
  query,
  loadingLabel = 'Loading…',
  errorTitle = 'Could not load this list',
  children,
}) {
  const hasData = query.data !== undefined;

  // Nothing to show yet.
  if (!hasData) {
    if (query.isError) {
      return (
        <ErrorState
          title={errorTitle}
          description={describeQueryError(query.error)}
          action={<RetryButton query={query} />}
        />
      );
    }
    if (query.fetchStatus === 'paused') {
      // The browser is offline: the request is waiting, not running.
      return (
        <ErrorState
          title="You are offline"
          description="Check your internet connection. This will load automatically when you are back online."
          action={<RetryButton query={query} />}
        />
      );
    }
    if (query.fetchStatus === 'fetching') {
      return (
        <>
          <LoadingState label={loadingLabel} />
          <SlowConnectionHint />
        </>
      );
    }
    // Query is switched off (waiting for a filter, etc.): nothing to say.
    return children;
  }

  const refreshFailed = query.isError;
  const updating = query.isFetching && !refreshFailed;

  return (
    <div>
      {refreshFailed && (
        <div
          role="alert"
          className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-ink"
        >
          <span>Could not refresh — showing the last information loaded. {describeQueryError(query.error)}</span>
          <RetryButton query={query} />
        </div>
      )}
      {updating && (
        <p className="mb-2 text-right text-[11px] text-muted" role="status">
          {query.isPlaceholderData ? 'Loading…' : 'Updating…'}
        </p>
      )}
      <div className={query.isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        {children}
      </div>
    </div>
  );
}
