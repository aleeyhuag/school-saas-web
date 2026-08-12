import { useQuery } from '@tanstack/react-query';
import * as familyApi from '../../api/family';
import * as sessionsApi from '../../api/sessions';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import ChildOverview from '../../components/ChildOverview';

export default function StudentOverviewPage() {
  const myRecordQuery = useQuery({
    queryKey: ['my-student-record'],
    queryFn: familyApi.getMyStudentRecord,
    retry: false,
  });
  const currentTermQuery = useQuery({ queryKey: ['current-term'], queryFn: sessionsApi.getCurrentTerm });
  const termId = currentTermQuery.data?.id;

  if (myRecordQuery.isError) {
    return (
      <>
        <PageHeader title="My Dashboard" description="Your attendance, results, and fees." />
        <div className="p-4 md:p-8">
          <Card>
            <p className="text-sm text-muted">
              {myRecordQuery.error?.response?.data?.message ??
                'No student record is linked to your account yet — ask your school admin to link it.'}
            </p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My Dashboard"
        description={
          myRecordQuery.data
            ? `${myRecordQuery.data.school_class?.name ?? ''} ${myRecordQuery.data.school_class?.arm ?? ''} — ${currentTermQuery.data?.name ?? ''} Term`
            : ''
        }
      />
      <div className="p-4 md:p-8">
        {myRecordQuery.data && termId && (
          <ChildOverview studentId={myRecordQuery.data.id} termId={termId} />
        )}
      </div>
    </>
  );
}
