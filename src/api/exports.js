import api from './client';

// Stage 54 — queued exports (full school backups, class report-card
// bundles). Since the hotfix, these actually run SYNCHRONOUSLY inside
// the request by default (EXPORT_SYNC_MODE=true on the backend — see
// its own README) rather than truly in the background, so these two
// specific calls override the client's normal 15s timeout with a much
// longer one. Without this override they'd inherit the global timeout
// and the request would abort client-side while the server keeps
// building the export — a real export can legitimately take longer
// than 15s. The frontend still polls afterward the same way either
// way, so nothing else about the flow changes.
const EXPORT_REQUEST_TIMEOUT_MS = 10 * 60_000; // matches ProcessExportJob's own $timeout / set_time_limit(600)

export const requestSchoolBackup = () =>
  api.post('/exports/school-backup', null, { timeout: EXPORT_REQUEST_TIMEOUT_MS }).then((r) => r.data);

export const requestReportCardBulk = (schoolClassId, termId) =>
  api.post(`/classes/${schoolClassId}/report-cards/export-async`, null, {
    params: { term_id: termId },
    timeout: EXPORT_REQUEST_TIMEOUT_MS,
  }).then((r) => r.data);

export const requestIdCards = (format, schoolClassId = null) =>
  api.post('/exports/id-cards', {
    format, // 'zip' | 'print_sheet'
    school_class_id: schoolClassId, // null = whole school
  }, { timeout: EXPORT_REQUEST_TIMEOUT_MS }).then((r) => r.data);

export const getExport = (exportId) =>
  api.get(`/exports/${exportId}`).then((r) => r.data);

export const listMyExports = () =>
  api.get('/exports').then((r) => r.data);

