import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as myClassApi from '../../api/myClass';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/FormFields';

export default function MyClassPage() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['my-class-students'], queryFn: myClassApi.getMyClassStudents });
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: ({ id, payload }) => myClassApi.updateMyClassStudent(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-class-students'] }); setEditing(null); },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not update student.'),
  });
  const rows = (Array.isArray(query.data) ? query.data : []).filter((s) => `${s.first_name} ${s.last_name} ${s.admission_number}`.toLowerCase().includes(search.toLowerCase()));
  const classNames = [...new Set((Array.isArray(query.data) ? query.data : []).map((s) => `${s.school_class?.name ?? ''} ${s.school_class?.arm ?? ''}`.trim()))];
  function open(student) { setError(''); setEditing(student); setForm({ first_name: student.first_name ?? '', last_name: student.last_name ?? '', date_of_birth: student.date_of_birth?.slice(0,10) ?? '', gender: student.gender ?? '', guardian_name: student.guardian_name ?? '', guardian_phone: student.guardian_phone ?? '' }); }
  function save() { mutation.mutate({ id: editing.id, payload: form }); }
  return <>
    <PageHeader title="My Class" description={classNames.length ? classNames.join(', ') : 'Your assigned class roster'} />
    <div className="p-4 md:p-8"><Card>
      <div className="flex flex-col sm:flex-row gap-3 mb-5"><Input className="flex-1" placeholder="Search student…" value={search} onChange={(e)=>setSearch(e.target.value)} /><span className="text-sm text-muted self-center">{rows.length} students</span></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted uppercase"><th className="py-2 pr-4">Student</th><th className="py-2 pr-4">Admission</th><th className="py-2 pr-4">Class</th><th className="py-2 pr-4">Guardian</th><th></th></tr></thead><tbody>
        {rows.map((s)=><tr key={s.id} className="border-b border-border"><td className="py-3 pr-4 font-medium text-ink">{s.first_name} {s.last_name}</td><td className="py-3 pr-4 text-muted">{s.admission_number}</td><td className="py-3 pr-4">{s.school_class?.name} {s.school_class?.arm}</td><td className="py-3 pr-4 text-muted">{s.guardian_name || '—'}<span className="block text-xs">{s.guardian_phone || ''}</span></td><td className="py-3 text-right"><Button size="sm" variant="secondary" onClick={()=>open(s)}>Edit details</Button></td></tr>)}
      </tbody></table></div>
      {query.isLoading && <p className="text-sm text-muted text-center py-10">Loading your class…</p>}
      {query.isError && <p className="text-sm text-danger text-center py-10">{query.error?.response?.data?.message ?? 'Unable to load your class. Please try again.'}</p>}
      {!query.isLoading && !query.isError && !rows.length && <p className="text-sm text-muted text-center py-10">Your assigned class has no students yet.</p>}
    </Card></div>
    <Modal open={!!editing} onClose={()=>setEditing(null)} title="Edit student details">
      {editing && <div><p className="text-xs text-muted mb-4">Class teachers can update routine student/contact details. Class, admission number, login and promotion decisions remain under school management.</p><div className="grid grid-cols-2 gap-3"><Input value={form.first_name} onChange={(e)=>setForm({...form,first_name:e.target.value})} placeholder="First name" /><Input value={form.last_name} onChange={(e)=>setForm({...form,last_name:e.target.value})} placeholder="Last name" /><Input type="date" value={form.date_of_birth} onChange={(e)=>setForm({...form,date_of_birth:e.target.value})} /><Select value={form.gender} onChange={(e)=>setForm({...form,gender:e.target.value})}><option value="">Gender</option><option value="male">Male</option><option value="female">Female</option></Select><Input value={form.guardian_name} onChange={(e)=>setForm({...form,guardian_name:e.target.value})} placeholder="Guardian name" /><Input value={form.guardian_phone} onChange={(e)=>setForm({...form,guardian_phone:e.target.value})} placeholder="Guardian phone" /></div>{error && <p className="mt-3 text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>}<div className="flex justify-end gap-2 mt-5"><Button variant="secondary" onClick={()=>setEditing(null)}>Cancel</Button><Button onClick={save} disabled={mutation.isPending}>{mutation.isPending?'Saving…':'Save changes'}</Button></div></div>}
    </Modal>
  </>;
}
