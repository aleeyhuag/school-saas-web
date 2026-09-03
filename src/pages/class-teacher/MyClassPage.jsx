import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as myClassApi from '../../api/myClass';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/FormFields';

export default function MyClassPage() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['my-class-students'], queryFn: myClassApi.getMyClassStudents });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [photoStudent, setPhotoStudent] = useState(null);
  const photoMutation = useMutation({
    mutationFn: ({ id, file }) => myClassApi.uploadMyClassStudentPhoto(id, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-class-students'] }); setPhotoStudent(null); },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not upload student photo.'),
  });
  const rows = (Array.isArray(query.data) ? query.data : []).filter((s) => `${s.first_name} ${s.last_name} ${s.admission_number}`.toLowerCase().includes(search.toLowerCase()));
  const classNames = [...new Set((Array.isArray(query.data) ? query.data : []).map((s) => `${s.school_class?.name ?? ''} ${s.school_class?.arm ?? ''}`.trim()))];

  return <>
    <PageHeader title="My Class" description={classNames.length ? classNames.join(', ') : 'Your assigned class roster'} />
    <div className="p-4 md:p-8"><Card>
      <div className="flex flex-col sm:flex-row gap-3 mb-5"><Input className="flex-1" placeholder="Search student…" value={search} onChange={(e)=>setSearch(e.target.value)} /><span className="text-sm text-muted self-center">{rows.length} students</span></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted uppercase"><th className="py-2 pr-4">Student</th><th className="py-2 pr-4">Admission</th><th className="py-2 pr-4">Class</th><th className="py-2 pr-4">Guardian</th><th></th></tr></thead><tbody>
        {rows.map((s)=><tr key={s.id} className="border-b border-border"><td className="py-3 pr-4 font-medium text-ink">{s.first_name} {s.last_name}</td><td className="py-3 pr-4 text-muted">{s.admission_number}</td><td className="py-3 pr-4">{s.school_class?.name} {s.school_class?.arm}</td><td className="py-3 pr-4 text-muted">{s.guardian_name || '—'}<span className="block text-xs">{s.guardian_phone || ''}</span></td><td className="py-3 text-right"><Button size="sm" variant="ghost" onClick={()=>{setError('');setPhotoStudent(s);}}>Photo</Button></td></tr>)}
      </tbody></table></div>
      {query.isLoading && <p className="text-sm text-muted text-center py-10">Loading your class…</p>}
      {query.isError && <p className="text-sm text-danger text-center py-10">{query.error?.response?.data?.message ?? 'Unable to load your class. Please try again.'}</p>}
      {!query.isLoading && !query.isError && !rows.length && <p className="text-sm text-muted text-center py-10">Your assigned class has no students yet.</p>}
      <p className="text-xs text-muted mt-4">Student details, class, and admission number are managed by school administration. As class teacher, you can update each student's photo here.</p>
    </Card></div>
    <Modal open={!!photoStudent} onClose={()=>setPhotoStudent(null)} title="Student photo">
      {photoStudent && <div><p className="text-sm text-muted mb-4">Upload or replace the photo for <strong>{photoStudent.first_name} {photoStudent.last_name}</strong>. Use a clear JPEG, PNG or WebP image up to 2 MB.</p>{photoStudent.photo_url && <img src={photoStudent.photo_url} alt="Current student" className="w-24 h-24 rounded-lg object-cover border border-border mb-4" />}<Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e)=>{const file=e.target.files?.[0]; if(file) photoMutation.mutate({id:photoStudent.id,file});}} disabled={photoMutation.isPending} />{photoMutation.isPending && <p className="text-xs text-muted mt-2">Uploading photo…</p>}{error && <p className="mt-3 text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>}<div className="flex justify-end mt-5"><Button variant="secondary" onClick={()=>setPhotoStudent(null)} disabled={photoMutation.isPending}>Close</Button></div></div>}
    </Modal>
  </>;
}
