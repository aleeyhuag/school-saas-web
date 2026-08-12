import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as familyApi from '../../api/family';
import * as sessionsApi from '../../api/sessions';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import ChildOverview from '../../components/ChildOverview';
import { Select } from '../../components/ui/FormFields';

export default function ParentChildrenPage() {
  const childrenQuery = useQuery({ queryKey: ['my-children'], queryFn: familyApi.getMyChildren });
  const currentTermQuery = useQuery({ queryKey: ['current-term'], queryFn: sessionsApi.getCurrentTerm });
  const termId = currentTermQuery.data?.id;

  const [selectedChildId, setSelectedChildId] = useState('');
  useEffect(() => {
    if (!selectedChildId && childrenQuery.data?.length) {
      setSelectedChildId(String(childrenQuery.data[0].id));
    }
  }, [childrenQuery.data, selectedChildId]);

  const selectedChild = childrenQuery.data?.find((c) => c.id === Number(selectedChildId));

  if (!childrenQuery.isLoading && childrenQuery.data?.length === 0) {
    return (
      <>
        <PageHeader title="My Children" description="Attendance, results, and fees for your children." />
        <div className="p-4 md:p-8">
          <Card>
            <p className="text-sm text-muted">
              No children are linked to your account yet — ask your school admin to link them under
              Students.
            </p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My Children"
        description={currentTermQuery.data ? `${currentTermQuery.data.name} Term` : ''}
        action={
          childrenQuery.data?.length > 1 && (
            <Select className="w-56" value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}>
              {childrenQuery.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} — {c.school_class?.name} {c.school_class?.arm}
                </option>
              ))}
            </Select>
          )
        }
      />

      <div className="p-4 md:p-8">
        {selectedChild && (
          <p className="text-sm text-muted mb-4">
            {selectedChild.first_name} {selectedChild.last_name} — {selectedChild.school_class?.name}{' '}
            {selectedChild.school_class?.arm}
          </p>
        )}
        {selectedChild && termId && <ChildOverview studentId={selectedChild.id} termId={termId} />}
      </div>
    </>
  );
}
