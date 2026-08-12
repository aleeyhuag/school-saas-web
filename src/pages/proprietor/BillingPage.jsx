import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as billingApi from '../../api/billing';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Field, Input } from '../../components/ui/FormFields';

function formatNaira(kobo) {
  return `₦${(kobo / 100).toLocaleString()}`;
}

function formatDate(dateString) {
  return dateString ? new Date(dateString).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

const STATUS_BADGE = {
  pending_review: { tone: 'accent', label: 'Under review' },
  success: { tone: 'success', label: 'Confirmed' },
  rejected: { tone: 'danger', label: 'Rejected' },
};

export default function BillingPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['billing-status'], queryFn: billingApi.getBillingStatus });
  const { data: plans } = useQuery({ queryKey: ['billing-plans'], queryFn: billingApi.getBillingPlans });

  // Prevents duplicate payments: block new submissions once the
  // subscription is already active, or while an earlier submission
  // is still waiting on Super Admin review.
  const hasPendingPayment = data?.recent_payments?.some((p) => p.status === 'pending_review');
  const paymentsLocked = data?.status === 'active' || hasPendingPayment;

  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [error, setError] = useState(null);

  const submitMutation = useMutation({
    mutationFn: () => billingApi.submitBankTransferPayment(selectedPlanId, proofFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-status'] });
      setSelectedPlanId(null);
      setProofFile(null);
      setError(null);
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not submit this payment.'),
  });

  const paystackMutation = useMutation({
    mutationFn: (planId) => billingApi.initiatePaystack(planId),
    onSuccess: (result) => {
      window.location.href = result.authorization_url;
    },
  });

  if (isLoading) {
    return (
      <>
        <PageHeader title="Billing" />
        <div className="p-4 md:p-8"><p className="text-sm text-muted">Loading…</p></div>
      </>
    );
  }

  const statusBanner = {
    trialing: {
      tone: 'accent',
      text: `Free trial — ends ${formatDate(data.trial_ends_at)}.`,
    },
    active: {
      tone: 'success',
      text: `Active — ${data.plan?.name ?? ''} plan, renews ${formatDate(data.current_period_ends_at)}.`,
    },
    past_due: {
      tone: 'danger',
      text: `Payment overdue — renew by ${formatDate(data.grace_ends_at)} to avoid losing access.`,
    },
    expired: {
      tone: 'danger',
      text: 'Access is currently locked — subscribe below to reactivate immediately once confirmed.',
    },
  }[data.status] ?? null;

  return (
    <>
      <PageHeader title="Billing" description="Manage your subscription and payments." />

      <div className="p-4 md:p-8 max-w-3xl space-y-6">
        {statusBanner && (
          <div
            className={`text-sm rounded-lg px-4 py-3 border ${
              statusBanner.tone === 'success'
                ? 'text-success bg-success-soft border-success/20'
                : statusBanner.tone === 'danger'
                ? 'text-danger bg-danger-soft border-danger/20'
                : 'text-accent bg-accent/10 border-accent/20'
            }`}
          >
            {statusBanner.text}
          </div>
        )}

        <Card title="Choose a plan">
          {paymentsLocked && (
            <p className="text-xs text-muted bg-bg border border-border rounded-lg px-3 py-2 mb-4">
              {hasPendingPayment
                ? "You already have a payment awaiting review — no need to submit another. We'll confirm it shortly."
                : "You're already on an active plan. Payment options reopen closer to your renewal date."}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans?.map((plan) => (
              <div key={plan.id} className="border border-border rounded-xl p-5">
                <p className="font-display font-semibold text-ink">{plan.name}</p>
                <p className="text-2xl font-bold text-ink mt-1">{formatNaira(plan.amount_kobo)}</p>
                <p className="text-xs text-muted mb-4">
                  every {plan.duration_months === 1 ? 'month' : `${plan.duration_months} months`}
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => { setSelectedPlanId(plan.id); setError(null); }}
                    disabled={paymentsLocked}
                  >
                    Pay by bank transfer
                  </Button>
                  {data.paystack_enabled && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => paystackMutation.mutate(plan.id)}
                      disabled={paymentsLocked || paystackMutation.isPending}
                    >
                      Pay with card
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {selectedPlanId && (
          <Card title="Bank Transfer Details">
            <div className="text-sm space-y-1 mb-4">
              <p><span className="text-muted">Bank:</span> {data.bank_details.bank_name || '—'}</p>
              <p><span className="text-muted">Account name:</span> {data.bank_details.account_name || '—'}</p>
              <p><span className="text-muted">Account number:</span> {data.bank_details.account_number || '—'}</p>
              <p className="pt-2">
                <span className="text-muted">Reference (put this in the transfer narration):</span>{' '}
                <strong className="text-primary">{data.payment_reference_code}</strong>
              </p>
            </div>
            <p className="text-xs text-muted mb-4">
              After transferring, upload a screenshot/photo of the receipt — this is required so we can
              confirm your payment quickly.
            </p>
            {error && <p className="text-sm text-danger mb-3">{error}</p>}
            <Field label="Proof of payment">
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </Field>
            <div className="flex gap-2 mt-2">
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={!proofFile || submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Submitting…' : 'Submit for review'}
              </Button>
              <Button variant="ghost" onClick={() => setSelectedPlanId(null)}>Cancel</Button>
            </div>
          </Card>
        )}

        <Card title="Payment History">
          {data.recent_payments.length === 0 ? (
            <p className="text-sm text-muted py-4">No payments submitted yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {data.recent_payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="text-ink font-medium">{formatNaira(p.amount_kobo)}</p>
                    <p className="text-xs text-muted">{formatDate(p.created_at)} · {p.method === 'bank_transfer' ? 'Bank transfer' : 'Card'}</p>
                    {p.status === 'rejected' && p.rejection_reason && (
                      <p className="text-xs text-danger mt-1">{p.rejection_reason}</p>
                    )}
                  </div>
                  <Badge tone={STATUS_BADGE[p.status]?.tone ?? 'primary'}>
                    {STATUS_BADGE[p.status]?.label ?? p.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
