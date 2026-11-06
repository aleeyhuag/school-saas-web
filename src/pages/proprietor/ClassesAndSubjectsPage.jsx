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
 * Classes & Subjects management.
 * Two cards side by side: classes (with their attached subjects) and
 * the school's subject list. Both support add AND edit — the same modal
 * is reused for both, switching between create and update depending on
 * whether a row is being edited.
 */
const EMPTY_CLASS_FORM = { name: '', arm: '', level: '' };
const EMPTY_SUBJECT_FORM = { name: '', code: '' };

export default function ClassesAndSubjectsPage() {
  const queryClient = useQueryClient();

  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: academicApi.getClasses });
  const subjectsQuery = useQuery({ queryKey: ['subjects'], queryFn: academicApi.getSubjects });

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [activeClass, setActiveClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);

  const [classForm, setClassForm] = useState(EMPTY_CLASS_FORM);
  const [subjectForm, setSubjectForm] = useState(EMPTY_SUBJECT_FORM);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [error, setError] = useState(null);

  function closeClassModal() {
    setClassModalOpen(false);
    setEditingClass(null);
    setClassForm(EMPTY_CLASS_FORM);
  }

  function closeSubjectModal() {
    setSubjectModalOpen(false);
    setEditingSubject(null);
    setSubjectForm(EMPTY_SUBJECT_FORM);
  }

  const saveClassMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      id ? academicApi.updateClass(id, payload) : academicApi.createClass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      // A renamed class shows up on the student lists too.
      queryClient.invalidateQueries({ queryKey: ['students'] });
      closeClassModal();
    },
    onError: (err) =>
      setError(err.response?.data?.message ?? 'Could not save class.'),
  });

  const saveSubjectMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      id ? academicApi.updateSubject(id, payload) : academicApi.createSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      // Classes embed their subjects, so a renamed subject must refresh them too.
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      closeSubjectModal();
    },
    onError: (err) =>
      setError(err.response?.data?.message ?? 'Could not save subject.'),
  });

  const syncSubjectsMutation = useMutation({
    mutationFn: ({ classId, subjectIds }) => academicApi.syncClassSubjects(classId, subjectIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setAssignModalOpen(false);
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not update subjects.'),
  });

  function openAddClass() {
    setError(null);
    setEditingClass(null);
    setClassForm(EMPTY_CLASS_FORM);
    setClassModalOpen(true);
  }

  function openEditClass(schoolClass) {
    setError(null);
    setEditingClass(schoolClass);
    setClassForm({
      name: schoolClass.name ?? '',
      arm: schoolClass.arm ?? '',
      level: schoolClass.level ?? '',
    });
    setClassModalOpen(true);
  }

  function openAddSubject() {
    setError(null);
    setEditingSubject(null);
    setSubjectForm(EMPTY_SUBJECT_FORM);
    setSubjectModalOpen(true);
  }

  function openEditSubject(subject) {
    setError(null);
    setEditingSubject(subject);
    setSubjectForm({ name: subject.name ?? '', code: subject.code ?? '' });
    setSubjectModalOpen(true);
  }

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
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => openEditClass(row)}>
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openAssignModal(row)}>
            Manage subjects
          </Button>
        </div>
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
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => openEditSubject(row)}>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  function listMessage(query, emptyText) {
    if (query.isLoading) return 'Loading…';
    if (query.isError) return 'Could not load this list. Check your connection and refresh.';
    return emptyText;
  }

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
            <Button size="sm" onClick={openAddClass}>
              + Add class
            </Button>
          }
        >
          <DataTable
            columns={classColumns}
            rows={classesQuery.data}
            emptyMessage={listMessage(classesQuery, 'No classes yet — add your first one.')}
          />
        </Card>

        <Card
          title="Subjects"
          action={
            <Button size="sm" onClick={openAddSubject}>
              + Add subject
            </Button>
          }
        >
          <DataTable
            columns={subjectColumns}
            rows={subjectsQuery.data}
            emptyMessage={listMessage(subjectsQuery, 'No subjects yet — add your first one.')}
          />
        </Card>
      </div>

      {/* Add / edit class */}
      <Modal
        open={classModalOpen}
        onClose={closeClassModal}
        title={editingClass ? 'Edit class' : 'Add a class'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveClassMutation.mutate({
              id: editingClass?.id,
              payload: {
                ...classForm,
                level: classForm.level !== '' && classForm.level != null ? Number(classForm.level) : null,
              },
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
          <Button type="submit" className="w-full" disabled={saveClassMutation.isPending}>
            {saveClassMutation.isPending ? 'Saving…' : editingClass ? 'Save changes' : 'Save class'}
          </Button>
        </form>
      </Modal>

      {/* Add / edit subject */}
      <Modal
        open={subjectModalOpen}
        onClose={closeSubjectModal}
        title={editingSubject ? 'Edit subject' : 'Add a subject'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveSubjectMutation.mutate({ id: editingSubject?.id, payload: subjectForm });
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
          <Button type="submit" className="w-full" disabled={saveSubjectMutation.isPending}>
            {saveSubjectMutation.isPending ? 'Saving…' : editingSubject ? 'Save changes' : 'Save subject'}
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
