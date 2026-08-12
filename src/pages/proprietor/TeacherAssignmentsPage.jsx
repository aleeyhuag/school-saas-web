import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as academicApi from '../../api/academic';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { Field, Select } from '../../components/ui/FormFields';

const EMPTY_FORM = { user_id: '', school_class_id: '', subject_id: '', is_class_teacher: false };

export default function TeacherAssignmentsPage() {
  const queryClient = useQueryClient();

  const [classFilter, setClassFilter] = useState('');
  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: academicApi.getClasses });
  const subjectsQuery = useQuery({ queryKey: ['subjects'], queryFn: academicApi.getSubjects });
  const staffQuery = useQuery({ queryKey: ['staff'], queryFn: () => academicApi.getStaff() });

  const assignmentsQuery = useQuery({
    queryKey: ['teacher-assignments', classFilter],
    queryFn: () =>
      academicApi.getTeacherAssignments(classFilter ? { school_class_id: classFilter } : {}),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  // Only people actually invited as teachers show up as options here.
  const teacherOptions = (staffQuery.data ?? []).filter((s) => s.roles.includes('teacher'));

  const createMutation = useMutation({
    mutationFn: academicApi.createTeacherAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      setModalOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) =>
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not create this assignment.'
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: academicApi.deleteTeacherAssignment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] }),
  });

  function openModal() {
    setForm({ ...EMPTY_FORM, school_class_id: classFilter || '' });
    setError(null);
    setModalOpen(true);
  }

  function handleRemove(assignment) {
    if (window.confirm(`Remove ${assignment.teacher.name} from this assignment?`)) {
      deleteMutation.mutate(assignment.id);
    }
  }

  const columns = [
    { key: 'teacher', label: 'Teacher', render: (row) => row.teacher.name },
    {
      key: 'class',
      label: 'Class',
      render: (row) => (
        <Badge tone="primary">
          {row.school_class.name} {row.school_class.arm}
        </Badge>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) =>
        row.is_class_teacher ? (
          <Badge tone="accent">Class Teacher</Badge>
        ) : (
          <Badge tone="success">{row.subject?.name ?? '—'}</Badge>
        ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button variant="danger" size="sm" onClick={() => handleRemove(row)}>
          Remove
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Teacher Assignments"
        description="Assign teachers to the classes and subjects they teach."
        action={<Button onClick={openModal}>+ Add assignment</Button>}
      />

      <div className="p-4 md:p-8">
        <Card
          action={
            <Select className="w-48" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="">All classes</option>
              {classesQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.arm}
                </option>
              ))}
            </Select>
          }
        >
          <DataTable
            columns={columns}
            rows={assignmentsQuery.data}
            emptyMessage={
              assignmentsQuery.isLoading
                ? 'Loading…'
                : 'No assignments yet — invite teachers under Staff first, then assign them here.'
            }
          />
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add a teacher assignment">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              user_id: Number(form.user_id),
              school_class_id: Number(form.school_class_id),
              subject_id: form.is_class_teacher ? null : Number(form.subject_id),
              is_class_teacher: form.is_class_teacher,
            });
          }}
        >
          {error && <p className="text-sm text-danger mb-4">{error}</p>}

          <Field label="Teacher">
            <Select
              required
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            >
              <option value="" disabled>
                Select a teacher
              </option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            {!teacherOptions.length && (
              <span className="block text-xs text-muted mt-1">
                No teachers invited yet — add one under Staff first.
              </span>
            )}
          </Field>

          <Field label="Class">
            <Select
              required
              value={form.school_class_id}
              onChange={(e) => setForm({ ...form, school_class_id: e.target.value })}
            >
              <option value="" disabled>
                Select a class
              </option>
              {classesQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.arm}
                </option>
              ))}
            </Select>
          </Field>

          <label className="flex items-center gap-2 text-sm text-ink mb-4">
            <input
              type="checkbox"
              checked={form.is_class_teacher}
              onChange={(e) => setForm({ ...form, is_class_teacher: e.target.checked, subject_id: '' })}
              className="rounded border-border text-primary focus:ring-primary/40"
            />
            This person is the Class Teacher for this class (oversight, whole-day attendance,
            result approval — not subject-specific)
          </label>

          {!form.is_class_teacher && (
            <Field label="Subject">
              <Select
                required
                value={form.subject_id}
                onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
              >
                <option value="" disabled>
                  Select a subject
                </option>
                {subjectsQuery.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Saving…' : 'Save assignment'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
