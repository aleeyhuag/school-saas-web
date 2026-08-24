import api from './client';

/** Browser-rendered ID card data. No PDF download is used anymore. */
export const getStudentIdCardPreview = (studentId) =>
  api.get(`/id-cards/${studentId}/preview`).then((r) => r.data);
