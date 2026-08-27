import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as cbtApi from '../../api/cbt';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

function formatTime(seconds) {
  const s = Math.max(0, seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function StudentCbtPage() {
  const qc = useQueryClient();
  const available = useQuery({ queryKey: ['student-cbt-available'], queryFn: cbtApi.getAvailableCbtExams, refetchInterval: 60_000 });
  const results = useQuery({ queryKey: ['student-cbt-results'], queryFn: cbtApi.getCbtResults });
  const [attempt, setAttempt] = useState(null);
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [message, setMessage] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const autoSubmitting = useRef(false);

  const start = useMutation({ mutationFn: cbtApi.startCbtExam, onSuccess: (data) => { setAttempt(data); setCurrent(0); setMessage(''); qc.invalidateQueries({ queryKey: ['student-cbt-available'] }); }, onError: (e) => setMessage(e.response?.data?.message ?? 'Could not start the exam.') });
  const submit = useMutation({ mutationFn: cbtApi.submitCbtAttempt, onSuccess: (data) => { setAttempt(data); setConfirmSubmit(false); qc.invalidateQueries({ queryKey: ['student-cbt-available'] }); qc.invalidateQueries({ queryKey: ['student-cbt-results'] }); }, onError: (e) => setMessage(e.response?.data?.message ?? 'Could not submit the exam.') });

  useEffect(() => {
    if (!attempt?.expires_at || attempt.status !== 'in_progress') return undefined;
    const tick = () => {
      const seconds = Math.max(0, Math.floor((new Date(attempt.expires_at).getTime() - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0 && !autoSubmitting.current) {
        autoSubmitting.current = true;
        cbtApi.submitCbtAttempt(attempt.id)
          .then((data) => {
            setAttempt(data);
            qc.invalidateQueries({ queryKey: ['student-cbt-available'] });
            qc.invalidateQueries({ queryKey: ['student-cbt-results'] });
          })
          .catch((e) => { autoSubmitting.current = false; setMessage(e.response?.data?.message ?? 'The exam could not be submitted automatically.'); });
      }
    };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [attempt?.expires_at, attempt?.status, attempt?.id, qc]);

  const question = attempt?.questions?.[current];
  const answered = useMemo(() => new Set((attempt?.questions ?? []).filter((q) => q.selected_option_id).map((q) => q.id)), [attempt]);

  async function choose(optionId) {
    if (!attempt || !question || attempt.status !== 'in_progress') return;
    setAttempt((a) => ({ ...a, questions: a.questions.map((q) => q.id === question.id ? { ...q, selected_option_id: optionId } : q) }));
    try { await cbtApi.saveCbtAnswer(attempt.id, question.id, optionId); } catch (e) { setMessage(e.response?.data?.message ?? 'Answer could not be saved.'); }
  }

  if (attempt?.status === 'in_progress') {
    return (
      <>
        <PageHeader title={attempt.exam.title} description={`${attempt.exam.subject?.name ?? 'CBT'} · ${attempt.exam.duration_minutes} minutes`} action={<div className={`font-mono text-lg font-bold ${remaining <= 60 ? 'text-danger' : 'text-primary'}`}>{formatTime(remaining)}</div>} />
        <div className="p-4 md:p-8 grid lg:grid-cols-[1fr_260px] gap-5">
          <Card><div className="p-5"><div className="flex justify-between text-sm text-muted mb-5"><span>Question {current + 1} of {attempt.questions.length}</span><span>{question?.marks} mark{Number(question?.marks) === 1 ? '' : 's'}</span></div><h2 className="text-lg md:text-xl font-semibold text-ink leading-relaxed">{question?.question_text}</h2><div className="mt-6 space-y-3">{question?.options?.map((o, i) => <button type="button" key={o.id} onClick={() => choose(o.id)} className={`w-full text-left rounded-lg border p-4 transition-colors ${question.selected_option_id === o.id ? 'border-primary bg-primary-soft text-ink' : 'border-border hover:bg-bg'}`}><span className="font-semibold mr-3">{String.fromCharCode(65 + i)}.</span>{o.option_text}</button>)}</div><div className="flex justify-between mt-7"><Button variant="secondary" disabled={current === 0} onClick={() => setCurrent((x) => x - 1)}>Previous</Button>{current < attempt.questions.length - 1 ? <Button onClick={() => setCurrent((x) => x + 1)}>Next</Button> : <Button onClick={() => setConfirmSubmit(true)}>Submit Exam</Button>}</div></div></Card>
          <Card><div className="p-4"><h3 className="font-semibold text-ink mb-3">Questions</h3><div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-2">{attempt.questions.map((q, i) => <button key={q.id} type="button" onClick={() => setCurrent(i)} className={`h-9 rounded-md text-sm border ${i === current ? 'border-primary bg-primary text-white' : q.selected_option_id ? 'border-success bg-success/10' : 'border-border'}`}>{i + 1}</button>)}</div><p className="text-xs text-muted mt-4">{answered.size} answered · {attempt.questions.length - answered.size} unanswered</p>{message && <p className="text-sm text-danger mt-3">{message}</p>}</div></Card>
        </div>
        <Modal open={confirmSubmit} onClose={() => setConfirmSubmit(false)} title="Submit examination?"><p className="text-sm text-muted mb-5">You have answered {answered.size} of {attempt.questions.length} questions. Once submitted, you cannot change your answers.</p><div className="flex gap-2"><Button variant="secondary" onClick={() => setConfirmSubmit(false)}>Continue exam</Button><Button onClick={() => submit.mutate(attempt.id)} disabled={submit.isPending}>{submit.isPending ? 'Submitting…' : 'Submit now'}</Button></div></Modal>
      </>
    );
  }

  if (attempt?.status === 'submitted') {
    return <div><PageHeader title="CBT Result" description={attempt.exam.title} /><div className="p-4 md:p-8"><Card><div className="p-8 text-center"><Badge tone={attempt.passed ? 'success' : 'danger'}>{attempt.passed ? 'PASSED' : 'NOT PASSED'}</Badge><div className="text-5xl font-bold text-ink mt-4">{attempt.percentage}%</div><p className="text-muted mt-2">Score: {attempt.score} · {attempt.attempted_count} attempted · {attempt.unanswered_count} unanswered</p><Button className="mt-6" onClick={() => { setAttempt(null); available.refetch(); results.refetch(); }}>Back to CBT</Button></div></Card></div></div>;
  }

  return (
    <><PageHeader title="CBT Examinations" description="Your upcoming and active computer-based examinations, plus completed results." /><div className="p-4 md:p-8 space-y-5">{message && <div className="rounded-lg border border-danger/30 bg-danger/5 text-danger px-4 py-3 text-sm">{message}</div>}<Card><div className="p-4 border-b border-border"><h2 className="font-semibold text-ink">My CBT Exams</h2><p className="text-sm text-muted mt-1">Published exams assigned to your class are shown here even before they start.</p></div><div className="divide-y divide-border">{(available.data ?? []).map((exam) => <div key={exam.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-semibold text-ink">{exam.title}</h3><Badge tone={exam.availability_status === 'upcoming' ? 'warning' : exam.attempt_status === 'submitted' ? 'success' : 'primary'}>{exam.availability_status === 'upcoming' ? 'Upcoming' : exam.attempt_status === 'submitted' ? 'Completed' : 'Available'}</Badge></div><p className="text-sm text-muted">{exam.subject?.name} · {exam.question_count} questions · {exam.duration_minutes} minutes</p><p className="text-xs text-muted mt-1">{exam.availability_status === 'upcoming' ? 'Starts: ' : 'Ends: '}{new Date(exam.availability_status === 'upcoming' ? exam.starts_at : exam.ends_at).toLocaleString()} · Pass mark: {exam.pass_mark}%</p></div><Button onClick={() => start.mutate(exam.id)} disabled={start.isPending || exam.availability_status === 'upcoming' || exam.attempt_status === 'submitted'}>{start.isPending ? 'Opening…' : exam.attempt_status === 'submitted' ? 'Completed' : exam.attempt_status === 'in_progress' ? 'Resume Exam' : exam.availability_status === 'upcoming' ? 'Not started' : 'Start Exam'}</Button></div>)}{!available.isLoading && !(available.data ?? []).length && <div className="p-8 text-center text-sm text-muted">There are no published CBT examinations assigned to your class yet.</div>}</div></Card><Card><div className="p-4 border-b border-border"><h2 className="font-semibold text-ink">My CBT Results</h2></div><div className="divide-y divide-border">{(results.data ?? []).map((r) => <div key={r.id} className="p-4 flex justify-between gap-3"><div><p className="font-medium text-ink">{r.exam?.title}</p><p className="text-sm text-muted">{r.exam?.subject?.name} · {new Date(r.submitted_at).toLocaleString()}</p></div><div className="text-right"><p className="font-semibold text-ink">{r.percentage}%</p><Badge tone={r.passed ? 'success' : 'danger'}>{r.passed ? 'Passed' : 'Not passed'}</Badge></div></div>)}{!results.isLoading && !(results.data ?? []).length && <div className="p-8 text-center text-sm text-muted">No completed CBT results yet.</div>}</div></Card></div></>
  );
}
