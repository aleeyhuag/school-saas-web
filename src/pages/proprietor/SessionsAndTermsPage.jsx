import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as sessionsApi from '../../api/sessions';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { Field, Input, Select } from '../../components/ui/FormFields';

const EMPTY_SESSION_FORM = { name: '', start_date: '', end_date: '', is_current: false };
const EMPTY_TERM_FORM = { name: 'First', start_date: '', end_date: '', is_current: false };

export default function SessionsAndTermsPage() {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({ queryKey: ['sessions'], queryFn: sessionsApi.getSessions });

  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [termModalOpen, setTermModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingTerm, setEditingTerm] = useState(null);
  const [sessionForm, setSessionForm] = useState(EMPTY_SESSION_FORM);
  const [termForm, setTermForm] = useState(EMPTY_TERM_FORM);
  const [error, setError] = useState(null);

  // Auto-select the current session (or the first one) once loaded.
  useEffect(() => {
    if (!selectedSessionId && sessionsQuery.data?.length) {
      const current = sessionsQuery.data.find((s) => s.is_current);
      setSelectedSessionId((current ?? sessionsQuery.data[0]).id);
    }
  }, [sessionsQuery.data, selectedSessionId]);

  const selectedSession = sessionsQuery.data?.find((s) => s.id === selectedSessionId);

  const saveSessionMutation = useMutation({
    mutationFn: (payload) =>
      editingSession
        ? sessionsApi.updateSession(editingSession.id, payload)
        : sessionsApi.createSession(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      if (!editingSession) setSelectedSessionId(data.id);
      closeSessionModal();
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not save session.'),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: sessionsApi.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setSelectedSessionId(null); // let the auto-select effect pick a new one
    },
  });

  const saveTermMutation = useMutation({
    mutationFn: (payload) =>
      editingTerm ? sessionsApi.updateTerm(editingTerm.id, payload) : sessionsApi.createTerm(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      closeTermModal();
    },
    onError: (err) =>
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not save term.'
      ),
  });

  const deleteTermMutation = useMutation({
    mutationFn: sessionsApi.deleteTerm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  function openCreateSessionModal() {
    setEditingSession(null);
    setSessionForm(EMPTY_SESSION_FORM);
    setError(null);
    setSessionModalOpen(true);
  }

  function openEditSessionModal(session) {
    setEditingSession(session);
    setSessionForm({
      name: session.name,
      start_date: session.start_date?.slice(0, 10) ?? '',
      end_date: session.end_date?.slice(0, 10) ?? '',
      is_current: session.is_current,
    });
    setError(null);
    setSessionModalOpen(true);
  }

  function closeSessionModal() {
    setSessionModalOpen(false);
    setEditingSession(null);
  }

  function handleDeleteSession(session) {
    if (
      window.confirm(
        `Delete "${session.name}"? This removes all its terms too, and cannot be undone.`
      )
    ) {
      deleteSessionMutation.mutate(session.id);
    }
  }

  function openCreateTermModal() {
    setEditingTerm(null);
    setTermForm(EMPTY_TERM_FORM);
    setError(null);
    setTermModalOpen(true);
  }

  function openEditTermModal(term) {
    setEditingTerm(term);
    setTermForm({
      name: term.name,
      start_date: term.start_date?.slice(0, 10) ?? '',
      end_date: term.end_date?.slice(0, 10) ?? '',
      is_current: term.is_current,
    });
    setError(null);
    setTermModalOpen(true);
  }

  function closeTermModal() {
    setTermModalOpen(false);
    setEditingTerm(null);
  }

  function handleDeleteTerm(term) {
    if (window.confirm(`Delete the "${term.name}" term? This cannot be undone.`)) {
      deleteTermMutation.mutate(term.id);
    }
  }

  const sessionColumns = [
    {
      key: 'name',
      label: 'Session',
      render: (row) => (
        <button
          onClick={() => setSelectedSessionId(row.id)}
          className={`font-medium hover:underline ${
            row.id === selectedSessionId ? 'text-primary' : 'text-ink'
          }`}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: 'dates',
      label: 'Dates',
      render: (row) => `${row.start_date?.slice(0, 10)} → ${row.end_date?.slice(0, 10)}`,
    },
    {
      key: 'current',
      label: '',
      render: (row) => (row.is_current ? <Badge tone="success">Current</Badge> : null),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEditSessionModal(row)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDeleteSession(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const termColumns = [
    { key: 'name', label: 'Term' },
    {
      key: 'dates',
      label: 'Dates',
      render: (row) => `${row.start_date?.slice(0, 10)} → ${row.end_date?.slice(0, 10)}`,
    },
    {
      key: 'current',
      label: '',
      render: (row) => (row.is_current ? <Badge tone="success">Current</Badge> : null),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEditTermModal(row)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDeleteTerm(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Sessions & Terms"
        description="Set up your academic calendar — one active session and term drive every other screen."
      />

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Academic Sessions"
          action={
            <Button size="sm" onClick={openCreateSessionModal}>
              + Add session
            </Button>
          }
        >
          <DataTable
            columns={sessionColumns}
            rows={sessionsQuery.data}
            emptyMessage={sessionsQuery.isLoading ? 'Loading…' : 'No sessions yet — add your first one.'}
          />
        </Card>

        <Card
          title={selectedSession ? `Terms in ${selectedSession.name}` : 'Terms'}
          action={
            selectedSession && (
              <Button size="sm" onClick={openCreateTermModal}>
                + Add term
              </Button>
            )
          }
        >
          {selectedSession ? (
            <DataTable
              columns={termColumns}
              rows={selectedSession.terms}
              emptyMessage="No terms yet for this session."
            />
          ) : (
            <p className="text-sm text-muted py-8 text-center">Select a session to view its terms.</p>
          )}
        </Card>
      </div>

      {/* Add/edit session */}
      <Modal open={sessionModalOpen} onClose={closeSessionModal} title={editingSession ? 'Edit session' : 'Add an academic session'}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveSessionMutation.mutate(sessionForm);
          }}
        >
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <Field label="Session name" hint='e.g. "2026/2027"'>
            <Input
              required
              value={sessionForm.name}
              onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <Input
                type="date"
                required
                value={sessionForm.start_date}
                onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })}
              />
            </Field>
            <Field label="End date">
              <Input
                type="date"
                required
                value={sessionForm.end_date}
                onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink mb-4">
            <input
              type="checkbox"
              checked={sessionForm.is_current}
              onChange={(e) => setSessionForm({ ...sessionForm, is_current: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary/40"
            />
            Make this the current session
          </label>
          <Button type="submit" className="w-full" disabled={saveSessionMutation.isPending}>
            {saveSessionMutation.isPending ? 'Saving…' : editingSession ? 'Save changes' : 'Save session'}
          </Button>
        </form>
      </Modal>

      {/* Add/edit term */}
      <Modal open={termModalOpen} onClose={closeTermModal} title={editingTerm ? `Edit term in ${selectedSession?.name ?? ''}` : `Add a term in ${selectedSession?.name ?? ''}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveTermMutation.mutate({ ...termForm, academic_session_id: selectedSessionId });
          }}
        >
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <Field label="Term">
            <Select
              required
              value={termForm.name}
              onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
            >
              <option value="First">First</option>
              <option value="Second">Second</option>
              <option value="Third">Third</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <Input
                type="date"
                required
                value={termForm.start_date}
                onChange={(e) => setTermForm({ ...termForm, start_date: e.target.value })}
              />
            </Field>
            <Field label="End date">
              <Input
                type="date"
                required
                value={termForm.end_date}
                onChange={(e) => setTermForm({ ...termForm, end_date: e.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink mb-4">
            <input
              type="checkbox"
              checked={termForm.is_current}
              onChange={(e) => setTermForm({ ...termForm, is_current: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary/40"
            />
            Make this the current term
          </label>
          <Button type="submit" className="w-full" disabled={saveTermMutation.isPending}>
            {saveTermMutation.isPending ? 'Saving…' : editingTerm ? 'Save changes' : 'Save term'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
