import { downloadFile } from '../utils/download';

// ---- Report Card PDFs ----

export const downloadReportCard = (studentId, termId, filename = 'report-card.pdf') =>
  downloadFile(`/report-cards/${studentId}`, { params: { term_id: termId }, filename });

export const downloadClassReportCards = (schoolClassId, termId, filename = 'class-report-cards.zip') =>
  downloadFile(`/classes/${schoolClassId}/report-cards/export`, { params: { term_id: termId }, filename });

// ---- Admin Results Export (xlsx) ----

export const downloadResultsExport = ({ scope, schoolClassId, termId }, filename = 'results-export.xlsx') =>
  downloadFile('/results/export', {
    params: { scope, school_class_id: schoolClassId, term_id: termId },
    filename,
  });
