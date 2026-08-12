import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as promotionsApi from '../../api/promotions';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Input, Select, Textarea } from '../../components/ui/FormFields';

const ACTIONS = [
  { value: 'promoted', label: 'Promote' },
  { value: 'repeated', label: 'Repeat current class' },
  { value: 'skipped', label: 'Skip a class' },
  { value: 'transferred', label: 'Transferred out' },
  { value: 'withdrawn', label: 'Left / withdrawn' },
];

export default function PromotionPage() {
  const queryClient = useQueryClient();
  const optionsQuery = useQuery({ queryKey: ['promotion-options'], queryFn: promotionsApi.getPromotionOptions });
  const sessions = optionsQuery.data?.sessions ?? [];
  const classes = optionsQuery.data?.classes ?? [];
  const currentSession = sessions.find((s) => s.is_current);
  const [fromSession, setFromSession] = useState('');
  const [toSession, setToSession] = useState('');
  const [sourceClass, setSourceClass] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [action, setAction] = useState('promoted');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const effectiveFrom = fromSession || currentSession?.id || '';
  const studentsQuery = useQuery({
    queryKey: ['promotion-students', sourceClass, search],
    queryFn: () => promotionsApi.getPromotionStudents({ school_class_id: sourceClass, search: search || undefined }),
    enabled: !!sourceClass,
  });
  const students = studentsQuery.data ?? [];

  const targetOptions = useMemo(() => classes.filter((c) => String(c.id) !== String(sourceClass)), [classes, sourceClass]);

  const mutation = useMutation({
    mutationFn: promotionsApi.executePromotions,
    onSuccess: () => {
      setSelected([]); setNote(''); setError('');
      queryClient.invalidateQueries({ queryKey: ['promotion-students'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-options'] });
    },
    onError: (err) => setError(err.response?.data?.message ?? Object.values(err.response?.data?.errors ?? {}).flat().join(' ') ?? 'Could not save promotion decisions.'),
  });

  function toggle(id) { setSelected((old) => old.includes(id) ? old.filter((x) => x !== id) : [...old, id]); }
  function selectAll() { setSelected(selected.length === students.length ? [] : students.map((s) => s.id)); }

  function submit() {
    setError('');
    if (!effectiveFrom || !toSession || !sourceClass || !selected.length) return setError('Choose both sessions, a source class, and at least one student.');
    if (['promoted','skipped'].includes(action) && !targetClass) return setError('Choose the destination class.');
    mutation.mutate({
      from_academic_session_id: Number(effectiveFrom),
      to_academic_session_id: Number(toSession),
      changes: [{
        student_ids: selected,
        from_school_class_id: Number(sourceClass),
        to_school_class_id: ['transferred','withdrawn'].includes(action) ? null : Number(targetClass),
        action,
        note: note || null,
      }],
    });
  }

  return <>
    <PageHeader title="Promotion & Progression" description="Move students in bulk while keeping a permanent decision history." />
    <div className="p-4 md:p-8 space-y-5">
      <Card title="1. Choose the academic sessions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={effectiveFrom} onChange={(e) => setFromSession(e.target.value)}>
            <option value="">Source session…</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_current ? ' — Current' : ''}</option>)}
          </Select>
          <Select value={toSession} onChange={(e) => setToSession(e.target.value)}>
            <option value="">Target session…</option>
            {sessions.filter((s) => String(s.id) !== String(effectiveFrom)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
      </Card>

      <Card title="2. Select the class and students">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select value={sourceClass} onChange={(e) => { setSourceClass(e.target.value); setSelected([]); }}>
            <option value="">Source class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.arm ?? ''}</option>)}
          </Select>
          <Input placeholder="Search this class…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {sourceClass && <div className="flex items-center justify-between bg-bg border border-border rounded-lg px-3 py-2 mb-3">
          <span className="text-sm text-muted">{selected.length} of {students.length} selected</span>
          <Button variant="secondary" size="sm" onClick={selectAll}>{selected.length === students.length ? 'Clear all' : 'Select all'}</Button>
        </div>}
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {students.map((s) => <label key={s.id} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-bg cursor-pointer">
            <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
            <span className="flex-1"><span className="font-medium text-ink">{s.first_name} {s.last_name}</span><span className="block text-xs text-muted">{s.admission_number}</span></span>
            <Badge tone="primary">{s.school_class?.name} {s.school_class?.arm}</Badge>
          </label>)}
          {!studentsQuery.isLoading && sourceClass && !students.length && <p className="text-sm text-muted py-6 text-center">No active students found.</p>}
        </div>
      </Card>

      <Card title="3. Decide what happens to the selected students">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={action} onChange={(e) => setAction(e.target.value)}>
            {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </Select>
          {!['transferred','withdrawn'].includes(action) ? <Select value={targetClass} onChange={(e) => setTargetClass(e.target.value)}>
            <option value="">Destination class…</option>
            {targetOptions.map((c) => <option key={c.id} value={c.id}>{c.name} {c.arm ?? ''}</option>)}
          </Select> : <div className="text-sm text-muted bg-bg rounded-lg p-3">No destination class — the student's status will be recorded as {action}.</div>}
        </div>
        <Textarea className="mt-4" placeholder="Optional note for the promotion history…" value={note} onChange={(e) => setNote(e.target.value)} />
        {error && <p className="mt-3 text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>}
        {mutation.isSuccess && <p className="mt-3 text-sm text-success bg-success-soft rounded-lg px-3 py-2">{mutation.data?.message}</p>}
        <div className="mt-4 flex justify-end"><Button onClick={submit} disabled={mutation.isPending || !selected.length}>{mutation.isPending ? 'Saving…' : `Apply to ${selected.length} student${selected.length === 1 ? '' : 's'}`}</Button></div>
      </Card>

      <Card title="What this protects">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted">
          <div><strong className="text-ink">Historical results</strong><p>Existing scores remain attached to their original term and class.</p></div>
          <div><strong className="text-ink">Individual decisions</strong><p>Repeat, skip, transfer or withdraw selected students without touching everyone else.</p></div>
          <div><strong className="text-ink">Audit trail</strong><p>Every decision records who performed it, the source/target class and academic sessions.</p></div>
        </div>
      </Card>
    </div>
  </>;
}
