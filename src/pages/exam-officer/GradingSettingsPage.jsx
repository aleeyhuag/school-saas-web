import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as gradingApi from '../../api/grading';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { Field, Input } from '../../components/ui/FormFields';

const EMPTY_BOUNDARY_FORM = { grade: '', remark: '', min_score: '', max_score: '' };

export default function GradingSettingsPage() {
  const queryClient = useQueryClient();

  // --- Assessment weights ---
  const settingsQuery = useQuery({
    queryKey: ['assessment-settings'],
    queryFn: gradingApi.getAssessmentSettings,
  });

  const [weightsForm, setWeightsForm] = useState({
    ca_count: 1,
    ca_weight: 30,
    ca2_weight: 0,
    ca3_weight: 0,
    assignment_weight: 10,
    exam_weight: 60,
  });
  const [weightsSuccess, setWeightsSuccess] = useState(false);
  const [weightsError, setWeightsError] = useState(null);

  // Sync the form once the real settings load, so we're not editing
  // against stale defaults.
  useEffect(() => {
    if (settingsQuery.data) {
      setWeightsForm({
        ca_count: settingsQuery.data.ca_count ?? 1,
        ca_weight: settingsQuery.data.ca_weight,
        ca2_weight: settingsQuery.data.ca2_weight ?? 0,
        ca3_weight: settingsQuery.data.ca3_weight ?? 0,
        assignment_weight: settingsQuery.data.assignment_weight,
        exam_weight: settingsQuery.data.exam_weight,
      });
    }
  }, [settingsQuery.data]);

  const caCount = Number(weightsForm.ca_count);
  const caLabel = (n) => (caCount > 1 ? `CA ${n}` : 'CA');

  // Only the CAs this school actually runs count towards the 100.
  const weightsSum =
    Number(weightsForm.ca_weight || 0) +
    (caCount >= 2 ? Number(weightsForm.ca2_weight || 0) : 0) +
    (caCount >= 3 ? Number(weightsForm.ca3_weight || 0) : 0) +
    Number(weightsForm.assignment_weight || 0) +
    Number(weightsForm.exam_weight || 0);
  const weightsValid = weightsSum === 100 && Number(weightsForm.exam_weight || 0) > 0;

  // What teachers will see when entering scores.
  const previewParts = [
    ...[weightsForm.ca_weight, weightsForm.ca2_weight, weightsForm.ca3_weight]
      .slice(0, caCount)
      .map((w, i) => `${caLabel(i + 1)} /${Number(w || 0)}`),
    ...(Number(weightsForm.assignment_weight || 0) > 0 ? [`Assignment /${Number(weightsForm.assignment_weight)}`] : []),
    `Exam /${Number(weightsForm.exam_weight || 0)}`,
  ];

  const updateWeightsMutation = useMutation({
    mutationFn: gradingApi.updateAssessmentSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-settings'] });
      setWeightsError(null);
      setWeightsSuccess(true);
    },
    onError: (err) => {
      setWeightsSuccess(false);
      setWeightsError(
        err.response?.data?.errors?.ca_weight?.[0] ??
          err.response?.data?.message ??
          'Could not save the assessment setup. Please try again.'
      );
    },
  });

  // --- Grade boundaries ---
  const boundariesQuery = useQuery({
    queryKey: ['grade-boundaries'],
    queryFn: gradingApi.getGradeBoundaries,
  });

  const [boundaryModalOpen, setBoundaryModalOpen] = useState(false);
  const [editingBoundary, setEditingBoundary] = useState(null);
  const [boundaryForm, setBoundaryForm] = useState(EMPTY_BOUNDARY_FORM);
  const [boundaryError, setBoundaryError] = useState(null);

  const saveBoundaryMutation = useMutation({
    mutationFn: (payload) =>
      editingBoundary
        ? gradingApi.updateGradeBoundary(editingBoundary.id, payload)
        : gradingApi.createGradeBoundary(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-boundaries'] });
      closeBoundaryModal();
    },
    onError: (err) =>
      setBoundaryError(err.response?.data?.message ?? 'Could not save this grade boundary.'),
  });

  const deleteBoundaryMutation = useMutation({
    mutationFn: gradingApi.deleteGradeBoundary,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grade-boundaries'] }),
  });

  function openCreateBoundaryModal() {
    setEditingBoundary(null);
    setBoundaryForm(EMPTY_BOUNDARY_FORM);
    setBoundaryError(null);
    setBoundaryModalOpen(true);
  }

  function openEditBoundaryModal(boundary) {
    setEditingBoundary(boundary);
    setBoundaryForm({
      grade: boundary.grade,
      remark: boundary.remark ?? '',
      min_score: boundary.min_score,
      max_score: boundary.max_score,
    });
    setBoundaryError(null);
    setBoundaryModalOpen(true);
  }

  function closeBoundaryModal() {
    setBoundaryModalOpen(false);
    setEditingBoundary(null);
  }

  function handleDeleteBoundary(boundary) {
    if (window.confirm(`Delete the "${boundary.grade}" grade boundary?`)) {
      deleteBoundaryMutation.mutate(boundary.id);
    }
  }

  const boundaryColumns = [
    { key: 'grade', label: 'Grade', render: (row) => <Badge tone="primary">{row.grade}</Badge> },
    { key: 'remark', label: 'Remark', render: (row) => row.remark || <span className="text-muted">—</span> },
    { key: 'range', label: 'Score range', render: (row) => `${row.min_score} – ${row.max_score}` },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEditBoundaryModal(row)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDeleteBoundary(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Grading Settings"
        description="Set how many CAs your school has, what each score carries, and how totals map to grades."
      />

      <div className="p-4 md:p-8 space-y-6">
        <Card title="Assessment Setup">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setWeightsSuccess(false);
              setWeightsError(null);
              updateWeightsMutation.mutate({
                ca_count: caCount,
                ca_weight: Number(weightsForm.ca_weight || 0),
                ca2_weight: caCount >= 2 ? Number(weightsForm.ca2_weight || 0) : 0,
                ca3_weight: caCount >= 3 ? Number(weightsForm.ca3_weight || 0) : 0,
                assignment_weight: Number(weightsForm.assignment_weight || 0),
                exam_weight: Number(weightsForm.exam_weight || 0),
              });
            }}
          >
            <p className="text-xs text-muted mb-4">
              Teachers enter each score directly out of its weight — a CA weighted 10 is marked out of 10, an exam
              weighted 60 out of 60. There is no separate &ldquo;max score&rdquo; for them to fill in. Set the assignment
              to 0 if your school has none.
            </p>
            {weightsSuccess && (
              <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2 mb-4">
                Saved — score entry, marksheets and report cards now use this setup.
              </p>
            )}
            {weightsError && (
              <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2 mb-4">{weightsError}</p>
            )}

            <Field label="How many CAs (continuous assessments) does your school have each term?">
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    size="sm"
                    variant={caCount === n ? 'primary' : 'secondary'}
                    onClick={() => setWeightsForm({ ...weightsForm, ca_count: n })}
                  >
                    {n} {n === 1 ? 'CA' : 'CAs'}
                  </Button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-2 mt-4">
              <Field label={`${caLabel(1)} weight`}>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={weightsForm.ca_weight}
                  onChange={(e) => setWeightsForm({ ...weightsForm, ca_weight: e.target.value })}
                />
              </Field>
              {caCount >= 2 && (
                <Field label="CA 2 weight">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={weightsForm.ca2_weight}
                    onChange={(e) => setWeightsForm({ ...weightsForm, ca2_weight: e.target.value })}
                  />
                </Field>
              )}
              {caCount >= 3 && (
                <Field label="CA 3 weight">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={weightsForm.ca3_weight}
                    onChange={(e) => setWeightsForm({ ...weightsForm, ca3_weight: e.target.value })}
                  />
                </Field>
              )}
              <Field label="Assignment weight">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={weightsForm.assignment_weight}
                  onChange={(e) => setWeightsForm({ ...weightsForm, assignment_weight: e.target.value })}
                />
              </Field>
              <Field label="Exam weight">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={weightsForm.exam_weight}
                  onChange={(e) => setWeightsForm({ ...weightsForm, exam_weight: e.target.value })}
                />
              </Field>
            </div>
            <p className={`text-sm mb-2 ${weightsValid ? 'text-success' : 'text-danger'}`}>
              Total: {weightsSum} {weightsValid ? '✓' : '— must equal 100'}
            </p>
            <p className="text-xs text-muted mb-4">
              Teachers will enter: <span className="font-medium text-ink">{previewParts.join(' · ')}</span>
            </p>
            <Button type="submit" disabled={!weightsValid || updateWeightsMutation.isPending}>
              {updateWeightsMutation.isPending ? 'Saving…' : 'Save assessment setup'}
            </Button>
          </form>
        </Card>

        <Card
          title="Grade Boundaries"
          action={
            <Button size="sm" onClick={openCreateBoundaryModal}>
              + Add grade
            </Button>
          }
        >
          <DataTable
            columns={boundaryColumns}
            rows={boundariesQuery.data}
            emptyMessage={boundariesQuery.isLoading ? 'Loading…' : 'No grade boundaries set up yet.'}
          />
        </Card>
      </div>

      <Modal
        open={boundaryModalOpen}
        onClose={closeBoundaryModal}
        title={editingBoundary ? 'Edit grade boundary' : 'Add a grade boundary'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveBoundaryMutation.mutate({
              ...boundaryForm,
              min_score: Number(boundaryForm.min_score),
              max_score: Number(boundaryForm.max_score),
            });
          }}
        >
          {boundaryError && <p className="text-sm text-danger mb-4">{boundaryError}</p>}
          <Field label="Grade" hint='e.g. "A", "B", "C1"'>
            <Input
              required
              maxLength={5}
              value={boundaryForm.grade}
              onChange={(e) => setBoundaryForm({ ...boundaryForm, grade: e.target.value })}
            />
          </Field>
          <Field label="Remark (optional)" hint='e.g. "Excellent", "Very Good"'>
            <Input
              value={boundaryForm.remark}
              onChange={(e) => setBoundaryForm({ ...boundaryForm, remark: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min score">
              <Input
                type="number"
                min="0"
                max="100"
                required
                value={boundaryForm.min_score}
                onChange={(e) => setBoundaryForm({ ...boundaryForm, min_score: e.target.value })}
              />
            </Field>
            <Field label="Max score">
              <Input
                type="number"
                min="0"
                max="100"
                required
                value={boundaryForm.max_score}
                onChange={(e) => setBoundaryForm({ ...boundaryForm, max_score: e.target.value })}
              />
            </Field>
          </div>
          <Button type="submit" className="w-full" disabled={saveBoundaryMutation.isPending}>
            {saveBoundaryMutation.isPending ? 'Saving…' : editingBoundary ? 'Save changes' : 'Save boundary'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
