import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as exportsApi from '../api/exports';

/**
 * Drives the "request a queued export, then poll it until it's ready"
 * flow shared by the full school backup and the class report-card
 * bundle. `requestFn` is whichever exports.js function actually kicks
 * the export off (its arguments are passed straight through via
 * `request(...)`).
 *
 * Polls every 4 seconds — frequent enough to feel responsive once the
 * cron-driven queue worker picks the job up (see the Stage 54 README
 * for why that's a few-minutes wait, not instant), without hammering
 * the API while it's still queued.
 */
export function useExportPolling(requestFn) {
  const [exportId, setExportId] = useState(null);

  const requestMutation = useMutation({
    mutationFn: requestFn,
    onSuccess: (data) => setExportId(data.id),
  });

  const statusQuery = useQuery({
    queryKey: ['export-status', exportId],
    queryFn: () => exportsApi.getExport(exportId),
    enabled: !!exportId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 4000;
    },
  });

  const status = statusQuery.data?.status ?? (requestMutation.isPending ? 'requesting' : null);

  function reset() {
    setExportId(null);
    requestMutation.reset();
  }

  function openDownload() {
    if (statusQuery.data?.download_url) {
      window.location.href = statusQuery.data.download_url;
    }
  }

  return {
    request: requestMutation.mutate,
    status, // null | 'requesting' | 'queued' | 'processing' | 'completed' | 'failed'
    isBusy: status === 'requesting' || status === 'queued' || status === 'processing',
    errorMessage: requestMutation.error?.response?.data?.message
      ?? Object.values(requestMutation.error?.response?.data?.errors ?? {}).flat()[0]
      ?? statusQuery.data?.error_message,
    export: statusQuery.data,
    openDownload,
    reset,
  };
}
