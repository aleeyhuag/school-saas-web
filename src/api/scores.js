import api from './client';

/**
 * Thin wrappers around Stage 7's SubjectScoreController — entering
 * and viewing raw CA/assignment/exam scores. Used by Subject Teacher
 * (entry) and Class Teacher (cross-subject review, read-only).
 */

export const getSubjectScores = (params) => api.get('/subject-scores', { params }).then((r) => r.data);
// "Save all": one request for a whole class's scores in a subject (all-or-nothing).
export const saveSubjectScoresBulk = (payload) =>
  api.post('/subject-scores/bulk', payload, { timeout: 60_000 }).then((r) => r.data);
export const saveSubjectScore = (payload) => api.post('/subject-scores', payload).then((r) => r.data);

export const getClassMarksheet = (schoolClassId, termId) =>
  api.get(`/classes/${schoolClassId}/marksheet`, { params: { term_id: termId } }).then((r) => r.data);
