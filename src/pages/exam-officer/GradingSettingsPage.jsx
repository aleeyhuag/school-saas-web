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

  const [weightsForm, setWeightsForm] = useState({ ca_weight: 30, assignment_weight: 10, exam_weight: 60 });
  const [weightsSuccess, setWeightsSuccess] = useState(false);

  // Sync the form once the real settings load, so we're not editing
  // against stale defaults.
  useEffect(() => {
    if (settingsQuery.data) {
      setWeightsForm({
        ca_weight: settingsQuery.data.ca_weight,
        assignment_weight: settingsQuery.data.assignment_weight,
        exam_weight: settingsQuery.data.exam_weight,
      });
    }
  }, [settingsQuery.data]);

  const weightsSum =
    Number(weightsForm.ca_weight || 0) +
    Number(weightsForm.assignment_weight || 0) +
    Number(weightsForm.exam_weight || 0);
  const weightsValid = weightsSum === 100;

  const updateWeightsMutation = useMutation({
    mutationFn: gradingApi.updateAssessmentSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-settings'] });
      setWeightsSuccess(true);
    },
    onError: () => setWeightsSuccess(false),
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
        description="Configure how CA, assignment, and exam scores combine into a result, and how totals map to grades."
      />

      <div className="p-4 md:p-8 space-y-6">
        <Card title="Assessment Weights">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setWeightsSuccess(false);
              updateWeightsMutation.mutate({
                ca_weight: Number(weightsForm.ca_weight),
                assignment_weight: Number(weightsForm.assignment_weight),
                exam_weight: Number(weightsForm.exam_weight),
              });
            }}
          >
            {weightsSuccess && (
              <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2 mb-4">
                Weights updated — every result computes with these from now on.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
              <Field label="Continuous Assessment (%)">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={weightsForm.ca_weight}
                  onChange={(e) => setWeightsForm({ ...weightsForm, ca_weight: e.target.value })}
                />
              </Field>
              <Field label="Assignment (%)">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={weightsForm.assignment_weight}
                  onChange={(e) => setWeightsForm({ ...weightsForm, assignment_weight: e.target.value })}
                />
              </Field>
              <Field label="Exam (%)">
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
            <p className={`text-sm mb-4 ${weightsValid ? 'text-success' : 'text-danger'}`}>
              Total: {weightsSum}% {weightsValid ? '✓' : '— must equal 100%'}
            </p>
            <Button type="submit" disabled={!weightsValid || updateWeightsMutation.isPending}>
              {updateWeightsMutation.isPending ? 'Saving…' : 'Save weights'}
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
