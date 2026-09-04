import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as platformBillingApi from '../../api/platformBilling';
import * as referralsApi from '../../api/referrals';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Field, Input, Textarea } from '../../components/ui/FormFields';

function formatNaira(kobo) {
  return `₦${(kobo / 100).toLocaleString()}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PlatformBillingPage() {
  const queryClient = useQueryClient();
  const { data: overview } = useQuery({ queryKey: ['billing-overview'], queryFn: platformBillingApi.getBillingOverview });
  const { data: plans } = useQuery({ queryKey: ['platform-plans'], queryFn: platformBillingApi.getPlatformPlans });
  const { data: pending, isLoading } = useQuery({ queryKey: ['pending-payments'], queryFn: platformBillingApi.getPendingPayments });
  const { data: referralSettings } = useQuery({ queryKey: ['referral-settings'], queryFn: referralsApi.getReferralSettings });

  const [editingPlan, setEditingPlan] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [durationInput, setDurationInput] = useState('');
  const [rejectingPayment, setRejectingPayment] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [editingReferralRates, setEditingReferralRates] = useState(false);
  const [yearOneInput, setYearOneInput] = useState('');
  const [yearTwoInput, setYearTwoInput] = useState('');

  const updateReferralSettingsMutation = useMutation({
    mutationFn: (payload) => referralsApi.updateReferralSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-settings'] });
      setEditingReferralRates(false);
    },
  });

  function startEditingReferralRates() {
    setYearOneInput(String(referralSettings?.year_one_percentage ?? 15));
    setYearTwoInput(String(referralSettings?.year_two_percentage ?? 5));
    setEditingReferralRates(true);
  }

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, amount_kobo, duration_months }) =>
      platformBillingApi.updatePlatformPlan(id, { amount_kobo, duration_months }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-plans'] });
      setEditingPlan(null);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: platformBillingApi.confirmPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['billing-overview'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => platformBillingApi.rejectPayment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      setRejectingPayment(null);
      setRejectReason('');
    },
  });

  const lifecycleMutation = useMutation({
    mutationFn: platformBillingApi.runBillingLifecycleNow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-overview'] });
    },
  });

  return (
    <>
      <PageHeader title="Billing" description="Subscription plans and payment review." />

      <div className="p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(overview?.by_status ?? {}).map(([status, count]) => (
            <Card key={status}>
              <p className="text-xs text-muted uppercase tracking-wide font-medium capitalize">{status.replace('_', ' ')}</p>
              <p className="text-2xl font-bold font-display text-ink mt-1">{count}</p>
            </Card>
          ))}
        </div>

        <Card title="Trial & renewal notifications">
          <p className="text-xs text-muted mb-3">
            Trial-ending reminders (2 days left, and on the final day), trial expiry lockouts, and
            renewal grace-period handling normally run automatically every day at 6am. Use this to
            re-run them right now instead of waiting — useful right after a fix, or to catch up
            following any downtime.
          </p>
          <Button
            size="sm"
            disabled={lifecycleMutation.isPending}
            onClick={() => lifecycleMutation.mutate()}
          >
            {lifecycleMutation.isPending ? 'Running…' : 'Run now'}
          </Button>
          {lifecycleMutation.data && (
            <div className="mt-3 text-xs text-ink bg-bg rounded-lg border border-border p-3 space-y-1">
              <p>Trial reminders sent: <strong>{lifecycleMutation.data.trial_reminders_sent}</strong></p>
              <p>Trials expired (locked out): <strong>{lifecycleMutation.data.trials_expired}</strong></p>
              <p>Renewals entered grace period: <strong>{lifecycleMutation.data.renewals_entered_grace}</strong></p>
              <p>Renewals locked (grace period ended): <strong>{lifecycleMutation.data.renewals_locked}</strong></p>
              <p className="text-muted">Ran at {formatDate(lifecycleMutation.data.ran_at)}</p>
            </div>
          )}
        </Card>

        <Card title="Referral commission rates">
          <p className="text-xs text-muted mb-3">
            Paid on every payment (monthly or termly) a referred school makes — 15% for their
            first 12 months as a paying customer, then 5% for the next 12, then nothing. Changing
            this only affects future payments; commissions already earned keep the rate they were
            created at.
          </p>
          {editingReferralRates ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Year 1 rate (%)">
                  <Input type="number" step="0.01" min="0" max="100" value={yearOneInput} onChange={(e) => setYearOneInput(e.target.value)} />
                </Field>
                <Field label="Year 2 rate (%)">
                  <Input type="number" step="0.01" min="0" max="100" value={yearTwoInput} onChange={(e) => setYearTwoInput(e.target.value)} />
                </Field>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={updateReferralSettingsMutation.isPending}
                  onClick={() => updateReferralSettingsMutation.mutate({
                    year_one_percentage: Number(yearOneInput),
                    year_two_percentage: Number(yearTwoInput),
                    enabled: referralSettings?.enabled ?? true,
                  })}
                >
                  {updateReferralSettingsMutation.isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingReferralRates(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink">
                <strong>{referralSettings?.year_one_percentage ?? '—'}%</strong> year one,{' '}
                <strong>{referralSettings?.year_two_percentage ?? '—'}%</strong> year two
              </p>
              <Button size="sm" variant="secondary" onClick={startEditingReferralRates}>Edit</Button>
            </div>
          )}
        </Card>

        <Card title="Plans">
          <div className="divide-y divide-border">
            {plans?.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{plan.name}</p>
                  <p className="text-xs text-muted">every {plan.duration_months === 1 ? 'month' : `${plan.duration_months} months`}</p>
                </div>
                {editingPlan === plan.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted">₦</span>
                    <Input
                      className="w-28"
                      type="number"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                    />
                    <span className="text-sm text-muted">every</span>
                    <Input
                      className="w-16"
                      type="number"
                      min="1"
                      value={durationInput}
                      onChange={(e) => setDurationInput(e.target.value)}
                    />
                    <span className="text-sm text-muted">month(s)</span>
                    <Button
                      size="sm"
                      onClick={() => updatePlanMutation.mutate({
                        id: plan.id,
                        amount_kobo: Math.round(Number(priceInput) * 100),
                        duration_months: Number(durationInput),
                      })}
                      disabled={updatePlanMutation.isPending}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingPlan(null)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-ink">{formatNaira(plan.amount_kobo)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingPlan(plan.id);
                        setPriceInput(String(plan.amount_kobo / 100));
                        setDurationInput(String(plan.duration_months));
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Pending Review">
          {isLoading ? (
            <p className="text-sm text-muted py-4">Loading…</p>
          ) : pending?.length === 0 ? (
            <p className="text-sm text-muted py-4">Nothing waiting for review.</p>
          ) : (
            <div className="divide-y divide-border">
              {pending?.map((payment) => (
                <div key={payment.id} className="py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{payment.school.name}</p>
                    <p className="text-xs text-muted">
                      {formatNaira(payment.amount_kobo)} · {payment.plan.name} · Ref: <strong>{payment.reference_code}</strong> · {formatDate(payment.created_at)}
                    </p>
                  </div>
                  {payment.proof_url && (
                    <a href={payment.proof_url} target="_blank" rel="noreferrer">
                      <img src={payment.proof_url} alt="Payment proof" className="w-16 h-16 object-cover rounded-lg border border-border" />
                    </a>
                  )}
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => confirmMutation.mutate(payment.id)}
                      disabled={confirmMutation.isPending}
                    >
                      Confirm
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setRejectingPayment(payment)}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal open={!!rejectingPayment} onClose={() => setRejectingPayment(null)} title="Reject Payment">
        <p className="text-xs text-muted mb-3">
          The Proprietor will see this reason and can submit a corrected payment.
        </p>
        <Field label="Reason">
          <Textarea
            rows={3}
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Amount doesn't match the selected plan"
          />
        </Field>
        <Button
          variant="danger"
          className="w-full"
          disabled={!rejectReason || rejectMutation.isPending}
          onClick={() => rejectMutation.mutate({ id: rejectingPayment.id, reason: rejectReason })}
        >
          {rejectMutation.isPending ? 'Rejecting…' : 'Reject Payment'}
        </Button>
      </Modal>
    </>
  );
}
