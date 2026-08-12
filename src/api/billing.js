import api from './client';

export const getBillingStatus = () => api.get('/billing/status').then((r) => r.data);

export const getBillingPlans = () => api.get('/billing/plans').then((r) => r.data);

export const submitBankTransferPayment = (planId, proofFile) => {
  const form = new FormData();
  form.append('plan_id', planId);
  form.append('proof', proofFile);
  return api.post('/billing/submit-payment', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const initiatePaystack = (planId) =>
  api.post('/billing/paystack/initiate', { plan_id: planId }).then((r) => r.data);
