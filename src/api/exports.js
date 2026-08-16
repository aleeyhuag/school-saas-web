import api from './client';

// Stage 54 — queued exports (full school backups, class report-card
// bundles). These run in the background instead of inside one HTTP
// request; the frontend requests one, then polls its status until it's
// completed/failed, then opens the signed download_url.

export const requestSchoolBackup = () =>
  api.post('/exports/school-backup').then((r) => r.data);

export const requestReportCardBulk = (schoolClassId, termId) =>
  api.post(`/classes/${schoolClassId}/report-cards/export-async`, null, { params: { term_id: termId } }).then((r) => r.data);

export const getExport = (exportId) =>
  api.get(`/exports/${exportId}`).then((r) => r.data);

export const listMyExports = () =>
  api.get('/exports').then((r) => r.data);
