import api from './client';

export const getEnrollmentInfo = (slug) => api.get(`/enroll/${slug}`).then((r) => r.data);

export const submitEnrollmentApplication = (slug, fields, proofFile) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') formData.append(key, value);
  });
  formData.append('payment_proof', proofFile);
  return api.post(`/enroll/${slug}`, formData).then((r) => r.data);
};
