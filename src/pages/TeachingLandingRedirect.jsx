import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as myAssignmentsApi from '../api/myAssignments';

export default function TeachingLandingRedirect() {
  const { data = [], isLoading } = useQuery({ queryKey: ['my-assignments'], queryFn: myAssignmentsApi.getMyAssignments });
  if (isLoading) return <div className="p-8 text-sm text-muted">Loading your teaching assignments…</div>;
  const classTeacher = data.some((a) => a.is_class_teacher);
  const subjectTeacher = data.some((a) => a.subject_id);
  return <Navigate to={classTeacher ? 'attendance' : subjectTeacher ? 'scores' : 'my-class'} replace />;
}
