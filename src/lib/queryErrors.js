/**
 * Turns a failed request into a sentence a school admin can act on.
 * Used by QueryBoundary.
 */
export function describeQueryError(error) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'You appear to be offline. Check your internet connection and try again.';
  }
  if (error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message ?? '')) {
    return 'The server took too long to respond. Your connection may be slow — please try again.';
  }
  if (!error?.response) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  const status = error.response.status;
  if (status === 403) {
    return error.response.data?.message ?? 'You do not have permission to view this.';
  }
  if (status >= 500) {
    return 'The server had a problem. Please try again in a moment.';
  }
  return error.response.data?.message ?? 'We could not load this. Please try again.';
}
