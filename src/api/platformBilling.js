import api from './client';

export const getPlatformPlans = () => api.get('/platform/billing/plans').then((r) => r.data);

export const updatePlatformPlan = (planId, payload) =>
  api.put(`/platform/billing/plans/${planId}`, payload).then((r) => r.data);

export const getBillingOverview = () => api.get('/platform/billing/overview').then((r) => r.data);

export const getPendingPayments = () => api.get('/platform/billing/payments/pending').then((r) => r.data);

export const confirmPayment = (paymentId) =>
  api.post(`/platform/billing/payments/${paymentId}/confirm`).then((r) => r.data);

export const rejectPayment = (paymentId, reason) =>
  api.post(`/platform/billing/payments/${paymentId}/reject`, { reason }).then((r) => r.data);
