import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as timetableApi from '../../api/timetable';
import * as academicApi from '../../api/academic';
import * as sessionsApi from '../../api/sessions';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { Field, Input, Select } from '../../components/ui/FormFields';

const EMPTY_FORM = {
  subject_id: '',
  school_class_ids: [],
  exam_date: '',
  start_time: '',
  end_time: '',
  venue: '',
  notes: '',
};

export default function ExamTimetablePage({ readOnly = false }) {
  const queryClient = useQueryClient();

  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: academicApi.getClasses });

  const sessionsQuery = useQuery({ queryKey: ['sessions'], queryFn: sessionsApi.getSessions });
  const allTerms = useMemo(
    () => (sessionsQuery.data ?? []).flatMap((s) =>
      (s.terms ?? []).map((t) => ({ ...t, sessionName: s.name }))
    ),
    [sessionsQuery.data]
  );
  const [termId, setTermId] = useState('');
  useEffect(() => {
    if (!termId && allTerms.length) {
      setTermId(String((allTerms.find((t) => t.is_current) ?? allTerms[0]).id));
    }
  }, [allTerms, termId]);

  const [filterClassId, setFilterClassId] = useState('');

  const examQuery = useQuery({
    queryKey: ['exam-timetable', termId, filterClassId],
    queryFn: () => timetableApi.getExamTimetable({
      term_id: termId,
      school_class_id: filterClassId || undefined,
    }),
    enabled: !!termId,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  function openCreate() {
    setEditingEntry(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(entry) {
    setEditingEntry(entry);
    setForm({
      subject_id: entry.subject_id,
      school_class_ids: entry.school_classes?.map((c) => c.id) ?? [],
      exam_date: entry.exam_date?.slice(0, 10) ?? '',
      start_time: entry.start_time ?? '',
      end_time: entry.end_time ?? '',
      venue: entry.venue ?? '',
      notes: entry.notes ?? '',
    });
    setError(null);
    setModalOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editingEntry
        ? timetableApi.updateExamEntry(editingEntry.id, payload)
        : timetableApi.createExamEntry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-timetable'] });
      setModalOpen(false);
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not save this exam entry.'),
  });

  const deleteMutation = useMutation({
    mutationFn: timetableApi.deleteExamEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exam-timetable'] }),
  });

  function toggleClass(id) {
    setForm((prev) => ({
      ...prev,
      school_class_ids: prev.school_class_ids.includes(id)
        ? prev.school_class_ids.filter((c) => c !== id)
        : [...prev.school_class_ids, id],
    }));
  }

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (row) => (
        <span className="font-medium text-ink">{row.exam_date?.slice(0, 10)}</span>
      ),
    },
    {
      key: 'time',
      label: 'Time',
      render: (row) => `${row.start_time} – ${row.end_time}`,
    },
    { key: 'subject', label: 'Subject', render: (row) => row.subject?.name },
    {
      key: 'classes',
      label: 'Classes',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.school_classes?.map((c) => (
            <Badge key={c.id} tone="primary">{c.name} {c.arm}</Badge>
          ))}
        </div>
      ),
    },
    { key: 'venue', label: 'Venue', render: (row) => row.venue || '—' },
    ...(!readOnly
      ? [{
          key: 'actions',
          label: '',
          render: (row) => (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>Edit</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => window.confirm('Remove this exam entry?') && deleteMutation.mutate(row.id)}
              >
                Remove
              </Button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Exam Timetable"
        description={readOnly ? 'Scheduled examinations for this term.' : 'Schedule exams by subject, date, and time. Assign which classes sit each exam.'}
        action={!readOnly && <Button onClick={openCreate}>+ Add exam</Button>}
      />

      <div className="p-4 md:p-8">
        <div className="flex flex-wrap gap-3 mb-4">
          <Select className="w-64" value={termId} onChange={(e) => setTermId(e.target.value)}>
            {allTerms.map((t) => (
              <option key={t.id} value={t.id}>{t.sessionName} — {t.name} Term</option>
            ))}
          </Select>
          <Select className="w-48" value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)}>
            <option value="">All classes</option>
            {classesQuery.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
            ))}
          </Select>
        </div>

        <Card>
          <DataTable
            columns={columns}
            rows={examQuery.data}
            emptyMessage={examQuery.isLoading ? 'Loading…' : 'No exams scheduled for this term yet.'}
          />
        </Card>
      </div>

      {!readOnly && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingEntry ? 'Edit exam entry' : 'Schedule an exam'}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate({
                ...form,
                term_id: Number(termId),
                subject_id: Number(form.subject_id),
              });
            }}
          >
            {error && <p className="text-sm text-danger mb-4">{error}</p>}

            <Field label="Subject">
              <Select required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                <option value="" disabled>Select a subject…</option>
                {/* Use a flat list of all subjects across all classes */}
                {[...new Map(
                  classesQuery.data?.flatMap((c) => c.subjects ?? []).map((s) => [s.id, s])
                ).values()].map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Classes sitting this exam">
              <div className="space-y-1 max-h-40 overflow-y-auto border border-border rounded-lg p-2">
                {classesQuery.data?.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={form.school_class_ids.includes(c.id)}
                      onChange={() => toggleClass(c.id)}
                      className="rounded border-border text-primary"
                    />
                    {c.name} {c.arm}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Date">
              <Input
                type="date"
                required
                value={form.exam_date}
                onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start time">
                <Input
                  type="time"
                  required
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </Field>
              <Field label="End time">
                <Input
                  type="time"
                  required
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Venue (optional)">
              <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            </Field>

            <Field label="Notes (optional)">
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>

            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editingEntry ? 'Save changes' : 'Schedule exam'}
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
