import api from './client';

/**
 * Thin wrappers around Stage 8's Fees & Payments endpoints.
 */

// Fee structures (what's owed)
export const getFeeStructures = (params) => api.get('/fee-structures', { params }).then((r) => r.data);
export const createFeeStructure = (payload) => api.post('/fee-structures', payload).then((r) => r.data);
export const updateFeeStructure = (id, payload) =>
  api.put(`/fee-structures/${id}`, payload).then((r) => r.data);
export const deleteFeeStructure = (id) => api.delete(`/fee-structures/${id}`).then((r) => r.data);

// Payments (what's been paid)
export const recordFeePayment = (payload) => api.post('/fee-payments', payload).then((r) => r.data);
export const getStudentPayments = (studentId) =>
  api.get(`/students/${studentId}/fee-payments`).then((r) => r.data);
export const getStudentFeeStatus = (studentId, termId) =>
  api.get(`/students/${studentId}/fee-status`, { params: { term_id: termId } }).then((r) => r.data);
export const getClassDefaulters = (schoolClassId, termId) =>
  api.get(`/classes/${schoolClassId}/fee-defaulters`, { params: { term_id: termId } }).then((r) => r.data);
