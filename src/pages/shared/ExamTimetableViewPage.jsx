import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as timetableApi from '../../api/timetable';
import * as academicApi from '../../api/academic';
import * as sessionsApi from '../../api/sessions';
import * as familyApi from '../../api/family';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import { Select } from '../../components/ui/FormFields';

/**
 * Read-only exam timetable for Proprietor, Teacher, Student, Parent.
 * Students/parents auto-filter to their own class so they only see
 * exams that actually concern them.
 */
export default function ExamTimetableViewPage() {
  const { hasRole } = useAuth();
  const isStudent = hasRole('student');
  const isParent  = hasRole('parent');

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

  const classesQuery = useQuery({
    queryKey: ['classes'],
    queryFn: academicApi.getClasses,
    enabled: !isStudent && !isParent,
  });
  const [filterClassId, setFilterClassId] = useState('');

  // Student — auto-scope to their class
  const myRecordQuery = useQuery({
    queryKey: ['my-student-record'],
    queryFn: familyApi.getMyStudentRecord,
    enabled: isStudent,
  });
  useEffect(() => {
    if (myRecordQuery.data?.school_class_id)
      setFilterClassId(String(myRecordQuery.data.school_class_id));
  }, [myRecordQuery.data]);

  // Parent — pick a child
  const childrenQuery = useQuery({
    queryKey: ['my-children'],
    queryFn: familyApi.getMyChildren,
    enabled: isParent,
  });
  const [selectedChildId, setSelectedChildId] = useState('');
  useEffect(() => {
    if (!selectedChildId && childrenQuery.data?.length)
      setSelectedChildId(String(childrenQuery.data[0].id));
  }, [childrenQuery.data, selectedChildId]);
  const selectedChild = childrenQuery.data?.find((c) => c.id === Number(selectedChildId));
  useEffect(() => {
    if (selectedChild?.school_class_id)
      setFilterClassId(String(selectedChild.school_class_id));
  }, [selectedChild]);

  const examQuery = useQuery({
    queryKey: ['exam-timetable', termId, filterClassId],
    queryFn: () => timetableApi.getExamTimetable({
      term_id: termId,
      school_class_id: filterClassId || undefined,
    }),
    enabled: !!termId,
  });

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (row) => <span className="font-medium text-ink">{row.exam_date?.slice(0, 10)}</span>,
    },
    { key: 'time', label: 'Time', render: (row) => `${row.start_time} – ${row.end_time}` },
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
    { key: 'notes', label: 'Notes', render: (row) => row.notes || '—' },
  ];

  return (
    <>
      <PageHeader title="Exam Timetable" description="Scheduled examinations for this term." />
      <div className="p-4 md:p-8">
        <div className="flex flex-wrap gap-3 mb-4">
          <Select className="w-64" value={termId} onChange={(e) => setTermId(e.target.value)}>
            {allTerms.map((t) => (
              <option key={t.id} value={t.id}>{t.sessionName} — {t.name} Term</option>
            ))}
          </Select>

          {/* Admin/teacher roles: optional class filter */}
          {!isStudent && !isParent && (
            <Select className="w-48" value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)}>
              <option value="">All classes</option>
              {classesQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
              ))}
            </Select>
          )}

          {/* Parent: child picker */}
          {isParent && childrenQuery.data?.length > 1 && (
            <Select className="w-56" value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}>
              {childrenQuery.data.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </Select>
          )}
        </div>

        <Card>
          <DataTable
            columns={columns}
            rows={examQuery.data}
            emptyMessage={examQuery.isLoading ? 'Loading…' : 'No exams scheduled for this term yet.'}
          />
        </Card>
      </div>
    </>
  );
}
