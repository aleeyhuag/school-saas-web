import { downloadFile } from '../utils/download';
import api from './client';

// ---- Report Card PDFs ----

export async function downloadReportCard(studentId, termId) {
  const { data } = await api.get(`/report-cards/${studentId}/download-url`, {
    params: { term_id: termId },
  });

  // Deliberately use normal browser navigation instead of an authenticated
  // blob fetch. This is the same reliable pattern already used for ID cards
  // and queued exports, and avoids the production failure mode of the old
  // responseType: 'blob' implementation.
  window.location.href = data.download_url;
}


export const downloadClassReportCards = (schoolClassId, termId, filename = 'class-report-cards.zip') =>
  downloadFile(`/classes/${schoolClassId}/report-cards/export`, { params: { term_id: termId }, filename });

// ---- Admin Results Export (xlsx) ----

export const downloadResultsExport = ({ scope, schoolClassId, termId }, filename = 'results-export.xlsx') =>
  downloadFile('/results/export', {
    params: { scope, school_class_id: schoolClassId, term_id: termId },
    filename,
  });
