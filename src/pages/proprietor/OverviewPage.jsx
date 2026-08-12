import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import * as academicApi from '../../api/academic';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/PageHeader';

function formatNaira(amount) {
  return `₦${Number(amount ?? 0).toLocaleString()}`;
}

export default function OverviewPage() {
  const { user, school } = useAuth();

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: academicApi.getDashboardStats,
  });
  const stats = statsQuery.data;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? ''}`}
        description={school?.name}
      />
      <div className="p-4 md:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card title="Students">
          <p className="text-3xl font-bold font-display text-ink">
            {statsQuery.isLoading ? '…' : stats?.students_count ?? 0}
          </p>
          <p className="text-sm text-muted mt-1">Total enrolled</p>
        </Card>
        <Card title="Staff">
          <p className="text-3xl font-bold font-display text-ink">
            {statsQuery.isLoading ? '…' : stats?.staff_count ?? 0}
          </p>
          <p className="text-sm text-muted mt-1">Teachers & admin staff</p>
        </Card>
        <Card title="Fee collection">
          {stats?.has_current_term ? (
            <>
              <p className="text-3xl font-bold font-display text-ink">
                {statsQuery.isLoading ? '…' : formatNaira(stats?.fee_collected_this_term)}
              </p>
              <p className="text-sm text-muted mt-1">
                Collected this term
                {stats?.fee_balance_this_term > 0 && (
                  <> — {formatNaira(stats.fee_balance_this_term)} outstanding</>
                )}
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold font-display text-ink">—</p>
              <p className="text-sm text-muted mt-1">No current term set yet</p>
            </>
          )}
        </Card>
      </div>
      <div className="px-8 pb-8">
        <Card title="Getting started">
          <p className="text-sm text-muted">
            Use the sidebar to set up your classes and subjects first, then add students and
            invite your staff.
          </p>
        </Card>
      </div>
    </>
  );
}
