import api from './client';

/** Browser-rendered ID card data. No PDF download is used anymore. */
export const getStudentIdCardPreview = (studentId) =>
  api.get(`/id-cards/${studentId}/preview`).then((r) => r.data);

/**
 * Bulk variant — used to print a whole class (or any multi-select) as
 * one browser print job. The API caps a single request at 100 student
 * ids as a sanity guard, so a genuinely large selection (e.g. "whole
 * school") is chunked here rather than that cap forcing staff to do it
 * manually or the request failing outright.
 */
const BULK_CHUNK_SIZE = 80;

export async function getBulkIdCardPreviews(studentIds) {
  const chunks = [];
  for (let i = 0; i < studentIds.length; i += BULK_CHUNK_SIZE) {
    chunks.push(studentIds.slice(i, i + BULK_CHUNK_SIZE));
  }

  const results = await Promise.all(
    chunks.map((chunk) => api.post('/id-cards/bulk-preview', { student_ids: chunk }).then((r) => r.data.cards))
  );

  return results.flat();
}
