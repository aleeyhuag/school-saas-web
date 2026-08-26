import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as cbtApi from '../../api/cbt';
import * as academicApi from '../../api/academic';
import * as sessionsApi from '../../api/sessions';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Field, Input, Select, Textarea } from '../../components/ui/FormFields';

const emptyExam = {
  term_id: '', subject_id: '', title: '', instructions: '', duration_minutes: 60,
  starts_at: '', ends_at: '', pass_mark: 50, randomize_questions: false,
  randomize_options: false, school_class_ids: [],
};
const emptyQuestion = {
  question_text: '', topic: '', marks: 1,
  options: [{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }],
};

function localDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CbtManagementPage() {
  const qc = useQueryClient();
  const [examModal, setExamModal] = useState(false);
  const [questionModal, setQuestionModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [examForm, setExamForm] = useState(emptyExam);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [error, setError] = useState('');

  const exams = useQuery({ queryKey: ['cbt-exams'], queryFn: cbtApi.getCbtExams });
  const selectedExam = useMemo(() => (exams.data ?? []).find((exam) => exam.id === selectedExamId) ?? null, [exams.data, selectedExamId]);
  const classes = useQuery({ queryKey: ['classes'], queryFn: academicApi.getClasses });
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: academicApi.getSubjects });
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: sessionsApi.getSessions });
  const terms = useMemo(() => (sessions.data ?? []).flatMap((s) => (s.terms ?? []).map((t) => ({ ...t, sessionName: s.name }))), [sessions.data]);

  const createExam = useMutation({
    mutationFn: cbtApi.createCbtExam,
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ['cbt-exams'] }); setSelectedExamId(data.id); setExamModal(false); },
    onError: (e) => setError(e.response?.data?.message ?? 'Could not create the exam.'),
  });
  const publish = useMutation({ mutationFn: cbtApi.publishCbtExam, onSuccess: () => qc.invalidateQueries({ queryKey: ['cbt-exams'] }), onError: (e) => setError(e.response?.data?.message ?? 'Could not change publication status.') });
  const removeExam = useMutation({ mutationFn: cbtApi.deleteCbtExam, onSuccess: () => { qc.invalidateQueries({ queryKey: ['cbt-exams'] }); setSelectedExamId(null); }, onError: (e) => setError(e.response?.data?.message ?? 'Could not delete the exam.') });
  const addQuestion = useMutation({ mutationFn: ({ id, payload }) => cbtApi.addCbtQuestion(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ['cbt-exams'] }); setQuestionModal(false); setQuestionForm(emptyQuestion); }, onError: (e) => setError(e.response?.data?.message ?? 'Could not add the question.') });
  const removeQuestion = useMutation({ mutationFn: cbtApi.deleteCbtQuestion, onSuccess: () => qc.invalidateQueries({ queryKey: ['cbt-exams'] }), onError: (e) => setError(e.response?.data?.message ?? 'Could not delete the question.') });

  function openCreate() {
    const start = new Date(Date.now() + 10 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setError('');
    setExamForm({ ...emptyExam, term_id: String(terms.find((t) => t.is_current)?.id ?? terms[0]?.id ?? ''), starts_at: localDateTime(start), ends_at: localDateTime(end) });
    setExamModal(true);
  }

  function toggleClass(id) {
    setExamForm((f) => ({ ...f, school_class_ids: f.school_class_ids.includes(id) ? f.school_class_ids.filter((x) => x !== id) : [...f.school_class_ids, id] }));
  }

  function submitExam(e) { e.preventDefault(); setError(''); createExam.mutate({ ...examForm, term_id: Number(examForm.term_id), subject_id: Number(examForm.subject_id), duration_minutes: Number(examForm.duration_minutes), pass_mark: Number(examForm.pass_mark), school_class_ids: examForm.school_class_ids.map(Number) }); }
  function submitQuestion(e) { e.preventDefault(); setError(''); addQuestion.mutate({ id: selectedExam.id, payload: { ...questionForm, marks: Number(questionForm.marks) } }); }

  return (
    <>
      <PageHeader title="CBT Examination" description="Create secure computer-based examinations, build the question bank, publish exams and monitor attempts." action={<Button onClick={openCreate}>+ Create CBT Exam</Button>} />
      <div className="p-4 md:p-8 space-y-5">
        {error && <div className="rounded-lg border border-danger/30 bg-danger/5 text-danger px-4 py-3 text-sm">{error}</div>}
        <Card>
          <div className="p-4 border-b border-border"><h2 className="font-semibold text-ink">Examinations</h2><p className="text-sm text-muted mt-1">Only published exams inside their scheduled window are visible to students.</p></div>
          <div className="divide-y divide-border">
            {(exams.data ?? []).map((exam) => (
              <button key={exam.id} type="button" onClick={() => setSelectedExamId(exam.id)} className={`w-full text-left p-4 hover:bg-bg transition-colors ${selectedExam?.id === exam.id ? 'bg-primary-soft/40' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div><div className="font-semibold text-ink">{exam.title}</div><div className="text-sm text-muted">{exam.subject?.name} · {exam.term?.name} · {exam.questions?.length ?? 0} questions</div></div>
                  <div className="flex gap-2 items-center"><Badge tone={exam.published ? 'success' : 'warning'}>{exam.published ? 'Published' : 'Draft'}</Badge><span className="text-xs text-muted">{exam.duration_minutes} min</span></div>
                </div>
              </button>
            ))}
            {!exams.isLoading && !(exams.data ?? []).length && <div className="p-8 text-center text-sm text-muted">No CBT examinations yet.</div>}
          </div>
        </Card>

        {selectedExam && (
          <Card>
            <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div><h2 className="font-semibold text-ink">{selectedExam.title}</h2><p className="text-sm text-muted">{selectedExam.instructions || 'No instructions provided.'}</p><p className="text-xs text-muted mt-2">{new Date(selectedExam.starts_at).toLocaleString()} → {new Date(selectedExam.ends_at).toLocaleString()}</p></div>
              <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => { setError(''); setQuestionForm(emptyQuestion); setQuestionModal(true); }} disabled={selectedExam.published}>+ Question</Button><Button size="sm" variant="secondary" onClick={() => publish.mutate(selectedExam.id)}>{selectedExam.published ? 'Unpublish' : 'Publish'}</Button>{!selectedExam.attempts?.length && <Button size="sm" variant="danger" onClick={() => window.confirm('Delete this CBT exam?') && removeExam.mutate(selectedExam.id)}>Delete</Button>}</div>
            </div>
            <div className="p-4 space-y-4">
              {(selectedExam.questions ?? []).map((q, i) => (
                <div key={q.id} className="rounded-lg border border-border p-4">
                  <div className="flex justify-between gap-3"><div><span className="text-xs text-muted">Question {i + 1} · {q.marks} mark{Number(q.marks) === 1 ? '' : 's'}</span><p className="font-medium text-ink mt-1">{q.question_text}</p></div><Button size="sm" variant="danger" onClick={() => window.confirm('Delete this question?') && removeQuestion.mutate(q.id)} disabled={selectedExam.published}>Remove</Button></div>
                  <div className="grid sm:grid-cols-2 gap-2 mt-3">{(q.options ?? []).map((o) => <div key={o.id} className={`rounded-md border px-3 py-2 text-sm ${o.is_correct ? 'border-success bg-success/5' : 'border-border'}`}>{o.option_text}{o.is_correct && <span className="text-success text-xs ml-2">✓ Correct</span>}</div>)}</div>
                </div>
              ))}
              {!(selectedExam.questions ?? []).length && <p className="text-sm text-muted">Add questions before publishing.</p>}
            </div>
          </Card>
        )}
      </div>

      <Modal open={examModal} onClose={() => setExamModal(false)} title="Create CBT Examination">
        <form onSubmit={submitExam} className="space-y-1">
          <Field label="Title"><Input required value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} placeholder="e.g. First Term Mathematics CBT" /></Field>
          <div className="grid sm:grid-cols-2 gap-3"><Field label="Term"><Select required value={examForm.term_id} onChange={(e) => setExamForm({ ...examForm, term_id: e.target.value })}><option value="">Select term</option>{terms.map((t) => <option key={t.id} value={t.id}>{t.sessionName} — {t.name}</option>)}</Select></Field><Field label="Subject"><Select required value={examForm.subject_id} onChange={(e) => setExamForm({ ...examForm, subject_id: e.target.value })}><option value="">Select subject</option>{(subjects.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field></div>
          <Field label="Instructions"><Textarea rows={3} value={examForm.instructions} onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })} placeholder="Tell students what they should know before starting." /></Field>
          <div className="grid sm:grid-cols-2 gap-3"><Field label="Start"><Input required type="datetime-local" value={examForm.starts_at} onChange={(e) => setExamForm({ ...examForm, starts_at: e.target.value })} /></Field><Field label="End"><Input required type="datetime-local" value={examForm.ends_at} onChange={(e) => setExamForm({ ...examForm, ends_at: e.target.value })} /></Field></div>
          <div className="grid sm:grid-cols-2 gap-3"><Field label="Duration (minutes)"><Input required type="number" min="1" max="480" value={examForm.duration_minutes} onChange={(e) => setExamForm({ ...examForm, duration_minutes: e.target.value })} /></Field><Field label="Pass mark (%)"><Input required type="number" min="0" max="100" value={examForm.pass_mark} onChange={(e) => setExamForm({ ...examForm, pass_mark: e.target.value })} /></Field></div>
          <Field label="Classes"><div className="grid sm:grid-cols-2 gap-2">{(classes.data ?? []).map((c) => <label key={c.id} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm"><input type="checkbox" checked={examForm.school_class_ids.includes(c.id)} onChange={() => toggleClass(c.id)} />{c.name} {c.arm}</label>)}</div></Field>
          <div className="flex flex-wrap gap-4 py-2"><label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={examForm.randomize_questions} onChange={(e) => setExamForm({ ...examForm, randomize_questions: e.target.checked })} />Randomize questions</label><label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={examForm.randomize_options} onChange={(e) => setExamForm({ ...examForm, randomize_options: e.target.checked })} />Randomize options</label></div>
          {error && <p className="text-sm text-danger">{error}</p>}<Button type="submit" disabled={createExam.isPending}>{createExam.isPending ? 'Creating…' : 'Create exam'}</Button>
        </form>
      </Modal>

      <Modal open={questionModal} onClose={() => setQuestionModal(false)} title="Add Question">
        <form onSubmit={submitQuestion} className="space-y-1">
          <Field label="Question"><Textarea required rows={4} value={questionForm.question_text} onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-3"><Field label="Topic"><Input value={questionForm.topic} onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })} /></Field><Field label="Marks"><Input required type="number" min="0.01" step="0.01" value={questionForm.marks} onChange={(e) => setQuestionForm({ ...questionForm, marks: e.target.value })} /></Field></div>
          <Field label="Options"><div className="space-y-2">{questionForm.options.map((o, i) => <div key={i} className="flex gap-2 items-center"><input type="radio" name="correct" checked={o.is_correct} onChange={() => setQuestionForm({ ...questionForm, options: questionForm.options.map((x, j) => ({ ...x, is_correct: i === j })) })} /><Input required value={o.option_text} placeholder={`Option ${String.fromCharCode(65 + i)}`} onChange={(e) => setQuestionForm({ ...questionForm, options: questionForm.options.map((x, j) => j === i ? { ...x, option_text: e.target.value } : x) })} /></div>)}</div></Field>
          <p className="text-xs text-muted mb-3">Select the radio button beside the correct answer.</p><Button type="submit" disabled={addQuestion.isPending}>{addQuestion.isPending ? 'Saving…' : 'Add question'}</Button>
        </form>
      </Modal>
    </>
  );
}
