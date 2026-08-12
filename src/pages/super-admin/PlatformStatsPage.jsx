import { useQuery } from '@tanstack/react-query';
import * as platformApi from '../../api/platform';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';

function MetricCard({ label, value }) {
  return (
    <Card>
      <p className="text-xs text-muted uppercase tracking-wide font-medium">{label}</p>
      <p className="text-3xl font-bold font-display mt-1 text-ink">
        {value === null || value === undefined ? '—' : value}
      </p>
    </Card>
  );
}

/**
 * Cross-tenant platform overview for Super Admin — headline growth
 * metrics plus a checklist of schools that might need an onboarding
 * nudge. Deliberately broader-strokes than the per-school Health
 * Dashboard (Stage 35) — this is about spotting which SCHOOLS need
 * attention, not fixing any one school's configuration in detail.
 */
export default function PlatformStatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: platformApi.getPlatformStats,
  });

  const metrics = data?.metrics;
  const issues = data?.audit_issues ?? [];

  return (
    <>
      <PageHeader title="Platform Stats & Audit" description="Growth and health across every school on the platform." />

      <div className="p-4 md:p-8">
        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <MetricCard label="Total Schools" value={metrics.total_schools} />
              <MetricCard label="Active Schools" value={metrics.active_schools} />
              <MetricCard label="Disabled Schools" value={metrics.disabled_schools} />
              <MetricCard label="Total Students" value={metrics.total_students} />
              <MetricCard label="Total Staff" value={metrics.total_staff} />
              <MetricCard label="New Schools (30d)" value={metrics.new_schools_last_30_days} />
            </div>

            <p className="text-xs text-muted mb-2">
              {metrics.new_schools_last_7_days} new school{metrics.new_schools_last_7_days === 1 ? '' : 's'} in the last 7 days.
            </p>

            <Card title="Schools That May Need Attention" className="mt-6">
              {issues.length === 0 ? (
                <p className="text-sm text-success py-4">✓ Nothing flagged right now.</p>
              ) : (
                <div className="divide-y divide-border">
                  {issues.map((issue) => (
                    <div key={issue.key} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                        <p className="text-sm text-ink">{issue.label}</p>
                      </div>
                      <span className="text-sm font-semibold text-ink whitespace-nowrap">{issue.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </>
  );
}
