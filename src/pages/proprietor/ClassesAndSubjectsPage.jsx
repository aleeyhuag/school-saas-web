import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as academicApi from '../../api/academic';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { Field, Input } from '../../components/ui/FormFields';

/**
 * Classes & Subjects management — the first real dashboard screen.
 * Two cards side by side: classes (with their attached subjects) and
 * the school's subject list. Both follow the same
 * fetch-with-react-query + modal-form-to-create pattern that every
 * later CRUD screen (students, staff, fees...) will reuse.
 */
export default function ClassesAndSubjectsPage() {
  const queryClient = useQueryClient();

  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: academicApi.getClasses });
  const subjectsQuery = useQuery({ queryKey: ['subjects'], queryFn: academicApi.getSubjects });

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [activeClass, setActiveClass] = useState(null);

  const [classForm, setClassForm] = useState({ name: '', arm: '', level: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '' });
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [error, setError] = useState(null);

  const createClassMutation = useMutation({
    mutationFn: academicApi.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setClassModalOpen(false);
      setClassForm({ name: '', arm: '', level: '' });
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not create class.'),
  });

  const createSubjectMutation = useMutation({
    mutationFn: academicApi.createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setSubjectModalOpen(false);
      setSubjectForm({ name: '', code: '' });
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not create subject.'),
  });

  const syncSubjectsMutation = useMutation({
    mutationFn: ({ classId, subjectIds }) => academicApi.syncClassSubjects(classId, subjectIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setAssignModalOpen(false);
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not update subjects.'),
  });

  function openAssignModal(schoolClass) {
    setActiveClass(schoolClass);
    setSelectedSubjectIds(schoolClass.subjects?.map((s) => s.id) ?? []);
    setError(null);
    setAssignModalOpen(true);
  }

  function toggleSubjectSelection(id) {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  const classColumns = [
    {
      key: 'name',
      label: 'Class',
      render: (row) => (
        <span className="font-medium text-ink">
          {row.name} {row.arm}
        </span>
      ),
    },
    {
      key: 'subjects',
      label: 'Subjects',
      render: (row) =>
        row.subjects?.length ? (
          <div className="flex flex-wrap gap-1">
            {row.subjects.map((s) => (
              <Badge key={s.id} tone="primary">{s.name}</Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted text-xs">No subjects yet</span>
        ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => openAssignModal(row)}>
          Manage subjects
        </Button>
      ),
    },
  ];

  const subjectColumns = [
    { key: 'name', label: 'Subject' },
    {
      key: 'code',
      label: 'Code',
      render: (row) => row.code || <span className="text-muted">—</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Classes & Subjects"
        description="Set up your school's class list and the subjects offered in each."
      />

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Classes"
          action={
            <Button size="sm" onClick={() => { setError(null); setClassModalOpen(true); }}>
              + Add class
            </Button>
          }
        >
          <DataTable
            columns={classColumns}
            rows={classesQuery.data}
            emptyMessage={classesQuery.isLoading ? 'Loading…' : 'No classes yet — add your first one.'}
          />
        </Card>

        <Card
          title="Subjects"
          action={
            <Button size="sm" onClick={() => { setError(null); setSubjectModalOpen(true); }}>
              + Add subject
            </Button>
          }
        >
          <DataTable
            columns={subjectColumns}
            rows={subjectsQuery.data}
            emptyMessage={subjectsQuery.isLoading ? 'Loading…' : 'No subjects yet — add your first one.'}
          />
        </Card>
      </div>

      {/* Create class */}
      <Modal open={classModalOpen} onClose={() => setClassModalOpen(false)} title="Add a class">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createClassMutation.mutate({
              ...classForm,
              level: classForm.level ? Number(classForm.level) : null,
            });
          }}
        >
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <Field label="Class name" hint='e.g. "JSS 1" or "Primary 5"'>
            <Input
              required
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
            />
          </Field>
          <Field label="Arm (optional)" hint='e.g. "A" or "B"'>
            <Input
              value={classForm.arm}
              onChange={(e) => setClassForm({ ...classForm, arm: e.target.value })}
            />
          </Field>
          <Field label="Level (optional)" hint="Used to order classes, e.g. 1 for Primary 1">
            <Input
              type="number"
              value={classForm.level}
              onChange={(e) => setClassForm({ ...classForm, level: e.target.value })}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={createClassMutation.isPending}>
            {createClassMutation.isPending ? 'Saving…' : 'Save class'}
          </Button>
        </form>
      </Modal>

      {/* Create subject */}
      <Modal open={subjectModalOpen} onClose={() => setSubjectModalOpen(false)} title="Add a subject">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSubjectMutation.mutate(subjectForm);
          }}
        >
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <Field label="Subject name" hint='e.g. "Mathematics"'>
            <Input
              required
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
            />
          </Field>
          <Field label="Code (optional)" hint='e.g. "MTH"'>
            <Input
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={createSubjectMutation.isPending}>
            {createSubjectMutation.isPending ? 'Saving…' : 'Save subject'}
          </Button>
        </form>
      </Modal>

      {/* Assign subjects to a class */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Subjects for ${activeClass?.name ?? ''} ${activeClass?.arm ?? ''}`}
      >
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <div className="space-y-2 mb-5 max-h-64 overflow-y-auto">
          {subjectsQuery.data?.map((subject) => (
            <label key={subject.id} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={selectedSubjectIds.includes(subject.id)}
                onChange={() => toggleSubjectSelection(subject.id)}
                className="rounded border-border text-primary focus:ring-primary/40"
              />
              {subject.name}
            </label>
          ))}
          {!subjectsQuery.data?.length && (
            <p className="text-sm text-muted">Add subjects first, then attach them to a class here.</p>
          )}
        </div>
        <Button
          className="w-full"
          disabled={syncSubjectsMutation.isPending}
          onClick={() =>
            syncSubjectsMutation.mutate({ classId: activeClass.id, subjectIds: selectedSubjectIds })
          }
        >
          {syncSubjectsMutation.isPending ? 'Saving…' : 'Save subjects'}
        </Button>
      </Modal>
    </>
  );
}
