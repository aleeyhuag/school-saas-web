import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as feesApi from '../../api/fees';
import * as academicApi from '../../api/academic';
import * as sessionsApi from '../../api/sessions';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { Field, Input, Select } from '../../components/ui/FormFields';

const EMPTY_STRUCTURE_FORM = { name: '', amount: '', school_class_id: '', due_date: '' };
const EMPTY_PAYMENT_FORM = { amount_paid: '', method: 'cash', reference: '', paid_at: '' };

function formatNaira(amount) {
  return `₦${Number(amount ?? 0).toLocaleString()}`;
}

export default function FeesPage() {
  const queryClient = useQueryClient();

  // Flatten every session's terms into one list, default to whichever is current.
  const sessionsQuery = useQuery({ queryKey: ['sessions'], queryFn: sessionsApi.getSessions });
  const allTerms = useMemo(
    () =>
      (sessionsQuery.data ?? []).flatMap((s) =>
        (s.terms ?? []).map((t) => ({ ...t, sessionName: s.name }))
      ),
    [sessionsQuery.data]
  );
  const [termId, setTermId] = useState('');
  useEffect(() => {
    if (!termId && allTerms.length) {
      setTermId((allTerms.find((t) => t.is_current) ?? allTerms[0]).id);
    }
  }, [allTerms, termId]);

  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: academicApi.getClasses });

  // --- Fee structures ---
  const structuresQuery = useQuery({
    queryKey: ['fee-structures', termId],
    queryFn: () => feesApi.getFeeStructures({ term_id: termId }),
    enabled: !!termId,
  });

  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [structureForm, setStructureForm] = useState(EMPTY_STRUCTURE_FORM);
  const [error, setError] = useState(null);

  const saveStructureMutation = useMutation({
    mutationFn: (payload) =>
      editingStructure
        ? feesApi.updateFeeStructure(editingStructure.id, payload)
        : feesApi.createFeeStructure(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      closeStructureModal();
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not save fee.'),
  });

  const deleteStructureMutation = useMutation({
    mutationFn: feesApi.deleteFeeStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      queryClient.invalidateQueries({ queryKey: ['fee-status'] });
      queryClient.invalidateQueries({ queryKey: ['fee-defaulters'] });
    },
  });

  function openCreateStructureModal() {
    setEditingStructure(null);
    setStructureForm(EMPTY_STRUCTURE_FORM);
    setError(null);
    setStructureModalOpen(true);
  }

  function openEditStructureModal(fee) {
    setEditingStructure(fee);
    setStructureForm({
      name: fee.name,
      amount: fee.amount,
      school_class_id: fee.school_class?.id ?? '',
      due_date: fee.due_date?.slice(0, 10) ?? '',
    });
    setError(null);
    setStructureModalOpen(true);
  }

  function closeStructureModal() {
    setStructureModalOpen(false);
    setEditingStructure(null);
  }

  function handleDeleteStructure(fee) {
    if (window.confirm(`Delete the "${fee.name}" fee? Any recorded payments against it stay in history, but the fee itself will no longer show as owed.`)) {
      deleteStructureMutation.mutate(fee.id);
    }
  }

  // --- Student payment status ---
  const [paymentClassId, setPaymentClassId] = useState('');
  const studentsQuery = useQuery({
    queryKey: ['students', paymentClassId],
    queryFn: () => academicApi.getStudents(paymentClassId ? { school_class_id: paymentClassId } : {}),
    enabled: !!paymentClassId,
  });
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const feeStatusQuery = useQuery({
    queryKey: ['fee-status', selectedStudentId, termId],
    queryFn: () => feesApi.getStudentFeeStatus(selectedStudentId, termId),
    enabled: !!selectedStudentId && !!termId,
  });

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeFee, setActiveFee] = useState(null);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT_FORM);

  const recordPaymentMutation = useMutation({
    mutationFn: feesApi.recordFeePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-status'] });
      queryClient.invalidateQueries({ queryKey: ['fee-defaulters'] });
      setPaymentModalOpen(false);
      setPaymentForm(EMPTY_PAYMENT_FORM);
    },
    onError: (err) =>
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not record payment.'
      ),
  });

  function openPaymentModal(fee) {
    setActiveFee(fee);
    setPaymentForm({ ...EMPTY_PAYMENT_FORM, paid_at: new Date().toISOString().slice(0, 10) });
    setError(null);
    setPaymentModalOpen(true);
  }

  // --- Defaulters ---
  const [defaulterClassId, setDefaulterClassId] = useState('');
  const defaultersQuery = useQuery({
    queryKey: ['fee-defaulters', defaulterClassId, termId],
    queryFn: () => feesApi.getClassDefaulters(defaulterClassId, termId),
    enabled: !!defaulterClassId && !!termId,
  });

  const structureColumns = [
    { key: 'name', label: 'Fee' },
    {
      key: 'class',
      label: 'Applies to',
      render: (row) =>
        row.school_class ? (
          <Badge tone="primary">
            {row.school_class.name} {row.school_class.arm}
          </Badge>
        ) : (
          <Badge tone="accent">Whole school</Badge>
        ),
    },
    { key: 'amount', label: 'Amount', render: (row) => formatNaira(row.amount) },
    { key: 'due_date', label: 'Due', render: (row) => row.due_date?.slice(0, 10) ?? '—' },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEditStructureModal(row)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDeleteStructure(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const defaulterColumns = [
    { key: 'student_name', label: 'Student' },
    { key: 'total_due', label: 'Total due', render: (row) => formatNaira(row.total_due) },
    { key: 'total_paid', label: 'Paid', render: (row) => formatNaira(row.total_paid) },
    {
      key: 'total_balance',
      label: 'Balance',
      render: (row) => <span className="text-danger font-medium">{formatNaira(row.total_balance)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Fees"
        description="Set fee structures, record payments, and track who still owes."
        action={
          <Select className="w-56" value={termId} onChange={(e) => setTermId(e.target.value)}>
            {allTerms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.sessionName} — {t.name} Term
              </option>
            ))}
          </Select>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        <Card
          title="Fee Structures"
          action={
            <Button size="sm" onClick={openCreateStructureModal}>
              + Add fee
            </Button>
          }
        >
          <DataTable
            columns={structureColumns}
            rows={structuresQuery.data}
            emptyMessage={structuresQuery.isLoading ? 'Loading…' : 'No fees set up for this term yet.'}
          />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Student Payment Status">
            <div className="flex gap-2 mb-4">
              <Select
                value={paymentClassId}
                onChange={(e) => { setPaymentClassId(e.target.value); setSelectedStudentId(''); }}
              >
                <option value="">Select class…</option>
                {classesQuery.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                ))}
              </Select>
              <Select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                <option value="">Select student…</option>
                {studentsQuery.data?.map((s) => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </Select>
            </div>

            {feeStatusQuery.data ? (
              <div className="space-y-2">
                {feeStatusQuery.data.fees.map((fee) => (
                  <div
                    key={fee.fee_structure_id}
                    className="flex items-center justify-between border border-border rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{fee.name}</p>
                      <p className="text-xs text-muted">
                        {formatNaira(fee.amount_paid)} of {formatNaira(fee.amount_due)} paid
                      </p>
                    </div>
                    {fee.balance > 0 ? (
                      <Button size="sm" onClick={() => openPaymentModal(fee)}>
                        Record payment
                      </Button>
                    ) : (
                      <Badge tone="success">Paid</Badge>
                    )}
                  </div>
                ))}
                <div className="flex justify-between pt-2 text-sm font-semibold text-ink border-t border-border">
                  <span>Balance</span>
                  <span className={feeStatusQuery.data.total_balance > 0 ? 'text-danger' : 'text-success'}>
                    {formatNaira(feeStatusQuery.data.total_balance)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted py-6 text-center">
                Select a class and student to view their fee status.
              </p>
            )}
          </Card>

          <Card title="Defaulters">
            <Select
              className="w-full mb-4"
              value={defaulterClassId}
              onChange={(e) => setDefaulterClassId(e.target.value)}
            >
              <option value="">Select a class…</option>
              {classesQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
              ))}
            </Select>
            <DataTable
              columns={defaulterColumns}
              rows={defaultersQuery.data}
              emptyMessage={
                !defaulterClassId
                  ? 'Select a class to view its defaulters.'
                  : defaultersQuery.isLoading
                  ? 'Loading…'
                  : 'No outstanding balances for this class — everyone is paid up.'
              }
            />
          </Card>
        </div>
      </div>

      {/* Add/edit fee structure */}
      <Modal open={structureModalOpen} onClose={closeStructureModal} title={editingStructure ? 'Edit fee' : 'Add a fee'}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveStructureMutation.mutate({
              ...structureForm,
              term_id: termId,
              amount: Number(structureForm.amount),
              school_class_id: structureForm.school_class_id || null,
            });
          }}
        >
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <Field label="Fee name" hint='e.g. "Tuition", "PTA Levy"'>
            <Input
              required
              value={structureForm.name}
              onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
            />
          </Field>
          <Field label="Amount (₦)">
            <Input
              type="number"
              required
              min="0"
              value={structureForm.amount}
              onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
            />
          </Field>
          <Field label="Applies to" hint="Leave blank for a whole-school fee">
            <Select
              value={structureForm.school_class_id}
              onChange={(e) => setStructureForm({ ...structureForm, school_class_id: e.target.value })}
            >
              <option value="">Whole school</option>
              {classesQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
              ))}
            </Select>
          </Field>
          <Field label="Due date (optional)">
            <Input
              type="date"
              value={structureForm.due_date}
              onChange={(e) => setStructureForm({ ...structureForm, due_date: e.target.value })}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={saveStructureMutation.isPending}>
            {saveStructureMutation.isPending ? 'Saving…' : editingStructure ? 'Save changes' : 'Save fee'}
          </Button>
        </form>
      </Modal>

      {/* Record payment */}
      <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title={`Record payment — ${activeFee?.name ?? ''}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            recordPaymentMutation.mutate({
              ...paymentForm,
              amount_paid: Number(paymentForm.amount_paid),
              student_id: Number(selectedStudentId),
              fee_structure_id: activeFee.fee_structure_id,
            });
          }}
        >
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <p className="text-sm text-muted mb-4">
            Outstanding balance: <strong>{formatNaira(activeFee?.balance)}</strong>
          </p>
          <Field label="Amount paid (₦)">
            <Input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={paymentForm.amount_paid}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
            />
          </Field>
          <Field label="Method">
            <Select
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paystack">Paystack</option>
              <option value="flutterwave">Flutterwave</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Reference (optional)" hint="Teller number, transaction ID, etc.">
            <Input
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
            />
          </Field>
          <Field label="Date paid">
            <Input
              type="date"
              required
              value={paymentForm.paid_at}
              onChange={(e) => setPaymentForm({ ...paymentForm, paid_at: e.target.value })}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={recordPaymentMutation.isPending}>
            {recordPaymentMutation.isPending ? 'Saving…' : 'Record payment'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
