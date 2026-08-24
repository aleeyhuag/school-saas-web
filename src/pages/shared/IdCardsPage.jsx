import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as academicApi from '../../api/academic';
import * as schoolApi from '../../api/school';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/FormFields';

export default function IdCardsPage() {
  const navigate = useNavigate();
  const [scope, setScope] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: academicApi.getClasses });
  const studentsQuery = useQuery({
    queryKey: ['id-card-students', scope, search],
    queryFn: () => academicApi.getStudents({ school_class_id: scope || undefined, search: search || undefined }),
  });
  const schoolQuery = useQuery({ queryKey: ['school-profile'], queryFn: schoolApi.getSchoolProfile });

  const students = studentsQuery.data ?? [];
  const activeStudents = students.filter((student) => student.status === 'active');
  const studentName = (student) => [student.first_name, student.last_name].filter(Boolean).join(' ').trim() || 'Unnamed student';

  const allShownSelected = activeStudents.length > 0 && activeStudents.every((s) => selectedIds.includes(s.id));

  function toggleOne(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAllShown() {
    if (allShownSelected) {
      const shownIds = new Set(activeStudents.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !shownIds.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...activeStudents.map((s) => s.id)])));
    }
  }

  function printSelected() {
    if (selectedIds.length === 0) return;
    navigate(`bulk-print?ids=${selectedIds.join(',')}`);
  }

  return (
    <>
      <PageHeader title="ID Cards" description="Preview and print student ID cards directly from the browser — no PDF generator involved." />
      <div className="p-4 md:p-8 max-w-5xl space-y-5">
        <Card title="Print a student ID card">
          <div className="space-y-4">
            <p className="text-sm text-muted">Choose a class or search for a student, then open the browser preview. The front and back are rendered as normal HTML/CSS and printed with your browser's print dialog.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Class</label>
                <Select value={scope} onChange={(e) => setScope(e.target.value)}>
                  <option value="">Whole school</option>
                  {(classesQuery.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name} {c.arm}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Search</label>
                <input className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or admission number" />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Students">
          {studentsQuery.isLoading ? <p className="text-sm text-muted">Loading students…</p> : null}
          {studentsQuery.isError ? <p className="text-sm text-danger">Could not load students.</p> : null}
          {!studentsQuery.isLoading && activeStudents.length === 0 ? <p className="text-sm text-muted">No students found.</p> : null}
          {activeStudents.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-border mb-1">
                <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input type="checkbox" checked={allShownSelected} onChange={toggleAllShown} />
                  Select all shown ({activeStudents.length})
                </label>
                <Button type="button" size="sm" disabled={selectedIds.length === 0} onClick={printSelected}>
                  Print Selected ({selectedIds.length})
                </Button>
              </div>
              <div className="divide-y divide-border">
                {activeStudents.map((student) => (
                  <div key={student.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleOne(student.id)}
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{studentName(student)}</div>
                        <div className="text-xs text-muted">{student.admission_number} · {student.schoolClass?.full_name ?? '—'}{student.photo_url ? ' · Photo ✓' : ' · No photo'}</div>
                      </div>
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={() => navigate(`preview/${student.id}`)}>Preview & Print</Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card title="Bulk printing">
          <p className="text-sm text-muted">Select a class from the dropdown above to filter the list to one class, use <strong>Select all shown</strong>, then <strong>Print Selected</strong> to print the whole class's ID cards (front and back) in a single browser print job — no need to open each student individually.</p>
        </Card>

        <Card title="Printing">
          <p className="text-sm text-muted">The print view hides all controls and prints the front and back as two clean pages. For a CR80 card printer, choose the printer's card-size/media setting and print at 100% / actual size. For regular paper, use your browser's A4 settings and cut the cards out.</p>
        </Card>

        <Card title="Principal's signature">
          <p className="text-sm text-muted mb-3">This signature is displayed on the browser-rendered card.</p>
          {schoolQuery.data?.principal_signature_url ? <img src={schoolQuery.data.principal_signature_url} alt="Principal signature" className="max-w-xs max-h-16 object-contain" /> : <p className="text-xs text-muted">No signature uploaded yet.</p>}
        </Card>
      </div>
    </>
  );
}
