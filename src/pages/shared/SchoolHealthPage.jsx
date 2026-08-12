import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import * as schoolHealthApi from '../../api/schoolHealth';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';

function MetricCard({ label, value, suffix = '', tone = 'default' }) {
  const toneClasses = {
    default: 'text-ink',
    good: 'text-success',
    warn: 'text-accent',
    bad: 'text-danger',
  };

  return (
    <Card>
      <p className="text-xs text-muted uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-3xl font-bold font-display mt-1 ${toneClasses[tone]}`}>
        {value === null || value === undefined ? '—' : `${value}${suffix}`}
      </p>
    </Card>
  );
}

function rateTone(value) {
  if (value === null || value === undefined) return 'default';
  if (value >= 80) return 'good';
  if (value >= 50) return 'warn';
  return 'bad';
}

export default function SchoolHealthPage() {
  const { hasRole } = useAuth();
  const basePath = hasRole('principal') ? '/principal' : '/proprietor';

  const { data, isLoading } = useQuery({
    queryKey: ['school-health'],
    queryFn: schoolHealthApi.getSchoolHealth,
  });

  const metrics = data?.metrics;
  const issues = data?.audit_issues ?? [];

  return (
    <>
      <PageHeader
        title="School Health"
        description={
          metrics?.current_term
            ? `Overview and data-audit for ${metrics.current_term}.`
            : 'Overview and data-audit for your school.'
        }
      />

      <div className="p-4 md:p-8">
        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <MetricCard label="Students" value={metrics.total_students} />
              <MetricCard label="Staff" value={metrics.total_staff} />
              <MetricCard label="Classes" value={metrics.total_classes} />
              <MetricCard
                label="Fee Collection"
                value={metrics.fee_collection_rate}
                suffix="%"
                tone={rateTone(metrics.fee_collection_rate)}
              />
              <MetricCard
                label="Attendance Rate"
                value={metrics.attendance_rate}
                suffix="%"
                tone={rateTone(metrics.attendance_rate)}
              />
              <MetricCard
                label="Results Published"
                value={metrics.result_publication_rate}
                suffix="%"
                tone={rateTone(metrics.result_publication_rate)}
              />
            </div>

            <Card title="Audit Checklist">
              {issues.length === 0 ? (
                <p className="text-sm text-success py-4">
                  ✓ No data-setup gaps found — everything looks properly configured.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {issues.map((issue) => (
                    <div key={issue.key} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                        <div>
                          <p className="text-sm text-ink">{issue.label}</p>
                          {issue.count !== null && (
                            <p className="text-xs text-muted">{issue.count} affected</p>
                          )}
                        </div>
                      </div>
                      {issue.link && (
                        <Link
                          to={`${basePath}${issue.link}`}
                          className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
                        >
                          Fix →
                        </Link>
                      )}
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
