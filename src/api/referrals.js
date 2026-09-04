import api from './client';

export const getReferralPartners = () => api.get('/platform/referral-partners').then((r) => r.data);

export const getReferralPartner = (id) => api.get(`/platform/referral-partners/${id}`).then((r) => r.data);

export const createReferralPartner = (payload) =>
  api.post('/platform/referral-partners', payload).then((r) => r.data);

export const updateReferralPartner = (id, payload) =>
  api.put(`/platform/referral-partners/${id}`, payload).then((r) => r.data);

export const markCommissionPaid = (commissionId) =>
  api.post(`/platform/referral-commissions/${commissionId}/mark-paid`).then((r) => r.data);

export const getReferralSettings = () => api.get('/platform/referral-settings').then((r) => r.data);

export const updateReferralSettings = (payload) =>
  api.put('/platform/referral-settings', payload).then((r) => r.data);
