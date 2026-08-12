import api from '../api/client';

/**
 * Downloads a binary file (PDF/ZIP/XLSX) from an authenticated API
 * endpoint. A plain `<a href="...">` won't work here since auth is a
 * Bearer token, not a cookie — the browser wouldn't attach it. So we
 * fetch via the same Axios instance everything else uses (token
 * already attached by its interceptor), then hand the blob to a
 * throwaway <a download> to trigger the browser's save dialog.
 *
 * Throws on failure — including on a JSON error response (e.g. a 422
 * validation error), which arrives as a blob too since we asked for
 * one; callers should catch and read `err.response.data` after
 * converting it back to text/JSON if they want the server's message.
 */
export async function downloadFile(url, { params, filename } = {}) {
  const response = await api.get(url, { params, responseType: 'blob' });

  const contentDisposition = response.headers['content-disposition'];
  const serverFilename = contentDisposition?.match(/filename="?([^"]+)"?/)?.[1];

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename ?? serverFilename ?? 'download';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * A blob-typed error response (from downloadFile above) can't be read
 * directly as JSON — this converts it back to text so the server's
 * validation message can actually be shown to the user.
 */
export async function readBlobError(err) {
  const data = err.response?.data;
  if (!(data instanceof Blob)) {
    return err.response?.data?.message ?? 'Something went wrong.';
  }
  try {
    const text = await data.text();
    const parsed = JSON.parse(text);
    return parsed.message ?? Object.values(parsed.errors ?? {}).flat()[0] ?? 'Something went wrong.';
  } catch {
    return 'Something went wrong.';
  }
}
