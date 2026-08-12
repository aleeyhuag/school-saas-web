import api from './client';

/**
 * Thin wrappers around Stage 7/9's Results endpoints — report cards,
 * class standings, and the approval workflow that makes results
 * visible to parents/students.
 */

export const getClassTermResult = (schoolClassId, termId) =>
  api.get(`/classes/${schoolClassId}/term-result`, { params: { term_id: termId } }).then((r) => r.data);

export const getStudentTermResult = (studentId, termId) =>
  api.get(`/students/${studentId}/term-result`, { params: { term_id: termId } }).then((r) => r.data);

export const getApprovalStatus = (schoolClassId, termId) =>
  api.get(`/classes/${schoolClassId}/term-result/approval-status`, { params: { term_id: termId } }).then((r) => r.data);

export const approveClassResults = (schoolClassId, termId) =>
  api.post(`/classes/${schoolClassId}/term-result/approve`, { term_id: termId }).then((r) => r.data);

export const revokeClassResults = (schoolClassId, termId) =>
  api.post(`/classes/${schoolClassId}/term-result/revoke`, { term_id: termId }).then((r) => r.data);

export const publishPermanently = (schoolClassId, termId) =>
  api.post(`/classes/${schoolClassId}/term-result/publish-permanently`, { term_id: termId }).then((r) => r.data);
