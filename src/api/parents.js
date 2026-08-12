import api from './client';

/**
 * The dedicated Parents page — proprietor/principal/bursar.
 */
export const getParents = (params) => api.get('/parents', { params }).then((r) => r.data);

export const sendFeeReminder = (parentId, termId) =>
  api.post(`/parents/${parentId}/send-reminder`, { term_id: termId }).then((r) => r.data);
