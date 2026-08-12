import api from './client';

/**
 * Thin wrappers around Stage 7's grading-configuration endpoints.
 * Per Stage 11's permission matrix: the GET calls are usable by
 * Proprietor/Principal/Exam Officer alike (view), but the
 * PUT/POST/DELETE calls below only ever succeed for exam_officer at
 * the backend route level — Proprietor/Principal's Settings page
 * simply never calls them (see SettingsPage.jsx), while Exam
 * Officer's dashboard does (see GradingSettingsPage.jsx).
 */

export const getAssessmentSettings = () => api.get('/assessment-settings').then((r) => r.data);
export const updateAssessmentSettings = (payload) =>
  api.put('/assessment-settings', payload).then((r) => r.data);

export const getGradeBoundaries = () => api.get('/grade-boundaries').then((r) => r.data);
export const createGradeBoundary = (payload) =>
  api.post('/grade-boundaries', payload).then((r) => r.data);
export const updateGradeBoundary = (id, payload) =>
  api.put(`/grade-boundaries/${id}`, payload).then((r) => r.data);
export const deleteGradeBoundary = (id) => api.delete(`/grade-boundaries/${id}`).then((r) => r.data);
