import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import * as academicApi from '../../api/academic';
import * as announcementsApi from '../../api/announcements';

function formatNaira(amount) { return `₦${Number(amount ?? 0).toLocaleString()}`; }
function firstName(name) { return name?.trim()?.split(/\s+/)[0] || 'there'; }

const roleActions = {
  proprietor: [
    ['/proprietor/students', 'Add / manage students', 'Keep the student register current', '☺'],
    ['/proprietor/staff', 'Manage staff', 'Teachers and school staff', '⚇'],
    ['/proprietor/fees', 'Review fees', 'Collections and outstanding balances', '₦'],
    ['/proprietor/announcements', 'Post announcement', 'Keep families and staff informed', '📣'],
  ],
  principal: [
    ['/principal/students', 'Manage students', 'Review the school register', '☺'],
    ['/principal/timetable', 'View timetable', 'See class schedules at a glance', '▦'],
    ['/principal/results-export', 'Review results', 'Export academic records', '⬇'],
    ['/principal/announcements', 'Post announcement', 'Keep the school informed', '📣'],
  ],
};

export default function ModernOverviewPage() {
  const { user, school, roles } = useAuth();
  const role = roles?.[0] || 'school user';
  const statsQuery = useQuery({ queryKey: ['dashboard-stats'], queryFn: academicApi.getDashboardStats });
  const announcementsQuery = useQuery({ queryKey: ['announcements'], queryFn: announcementsApi.getAnnouncements, enabled: !!school });
  const stats = statsQuery.data;
  const announcements = announcementsQuery.data?.announcements ?? announcementsQuery.data?.data ?? [];
  const actions = roleActions[role] ?? [
    ['/teacher/attendance', 'Take attendance', 'Record today’s attendance', '☑'],
    ['/teacher/scores', 'Enter scores', 'Keep assessment records current', '✎'],
    ['/teacher/timetable', 'View timetable', 'Check today’s schedule', '▦'],
    ['/teacher/announcements', 'Announcements', 'Read school updates', '📣'],
  ];
  const attendance = stats?.attendance_percentage ?? stats?.attendance_rate;

  return (
    <div className="min-h-full">
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-10 max-w-7xl mx-auto space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-primary text-white p-6 md:p-8">
          <div className="absolute -right-20 -top-24 w-64 h-64 rounded-full bg-white/10" aria-hidden="true" />
          <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[.18em] font-semibold text-primary-soft">{school?.name || 'School workspace'}</p>
              <h1 className="font-display text-3xl md:text-4xl font-extrabold mt-2">Good morning, {firstName(user?.name)} 👋</h1>
              <p className="text-sm md:text-base text-primary-soft/90 mt-3 max-w-2xl">Here’s your school at a glance. Jump into the work that matters most today.</p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/10 border border-white/15 px-4 py-3 min-w-48">
              <p className="text-xs text-primary-soft">Signed in as</p>
              <p className="font-semibold capitalize mt-1">{role.replace('_', ' ')}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          {[
            ['Students', stats?.students_count ?? 0, 'Total enrolled', '☺'],
            ['Staff', stats?.staff_count ?? 0, 'Teachers & admin staff', '⚇'],
            ['Fees collected', stats?.has_current_term ? formatNaira(stats?.fee_collected_this_term) : '—', stats?.has_current_term ? 'This term' : 'No current term', '₦'],
            ['Attendance', attendance != null ? `${Number(attendance).toFixed(0)}%` : '—', 'Current available rate', '✓'],
          ].map(([label, value, hint, icon]) => (
            <div key={label} className="bg-surface border border-border rounded-2xl p-4 md:p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold text-muted">{label}</p><span className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center" aria-hidden="true">{icon}</span></div>
              <p className="font-display text-2xl md:text-3xl font-extrabold text-ink mt-3">{statsQuery.isLoading ? '…' : value}</p>
              <p className="text-xs text-muted mt-1">{hint}</p>
            </div>
          ))}
        </section>

        <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-6">
          <section className="bg-surface border border-border rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between gap-4 mb-4"><div><h2 className="font-display text-lg font-bold text-ink">Quick actions</h2><p className="text-sm text-muted mt-1">Common tasks for your role.</p></div></div>
            <div className="grid sm:grid-cols-2 gap-3">
              {actions.map(([to, title, body, icon]) => <Link key={to} to={to} className="group rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all"><div className="flex gap-3"><span className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0" aria-hidden="true">{icon}</span><span><span className="block font-semibold text-sm text-ink group-hover:text-primary">{title}</span><span className="block text-xs text-muted mt-1 leading-5">{body}</span></span></div></Link>)}
            </div>
          </section>

          <section className="bg-surface border border-border rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-display text-lg font-bold text-ink">Recent updates</h2><p className="text-sm text-muted mt-1">Latest school announcements.</p></div><Link to={`/${role === 'principal' ? 'principal' : role === 'proprietor' ? 'proprietor' : 'teacher'}/announcements`} className="text-xs font-semibold text-primary">View all</Link></div>
            <div className="space-y-3">
              {announcementsQuery.isLoading ? <p className="text-sm text-muted">Loading updates…</p> : announcements.length === 0 ? <p className="text-sm text-muted">No recent announcements.</p> : announcements.slice(0, 4).map((item, index) => <div key={item.id ?? index} className="flex gap-3 border-b border-border last:border-0 pb-3 last:pb-0"><span className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" /><div className="min-w-0"><p className="text-sm font-medium text-ink line-clamp-2">{item.title ?? item.message ?? 'School announcement'}</p><p className="text-xs text-muted mt-1">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</p></div></div>)}
            </div>
          </section>
        </div>

        <section className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-surface border border-border rounded-2xl p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-bold text-ink">School pulse</h2><p className="text-sm text-muted mt-1">A simple view of what needs attention.</p></div><span className="text-xs rounded-full px-2.5 py-1 bg-success-soft text-success font-semibold">Live data</span></div><div className="mt-5 grid sm:grid-cols-3 gap-3"><div className="rounded-xl bg-bg p-4"><p className="text-xs text-muted">Outstanding fees</p><p className="font-display font-bold text-xl text-ink mt-2">{stats?.has_current_term ? formatNaira(stats?.fee_balance_this_term) : '—'}</p></div><div className="rounded-xl bg-bg p-4"><p className="text-xs text-muted">Current term</p><p className="font-display font-bold text-base text-ink mt-2">{stats?.current_term_name || 'Not set'}</p></div><div className="rounded-xl bg-bg p-4"><p className="text-xs text-muted">School status</p><p className="font-display font-bold text-base text-success mt-2">Operational</p></div></div></div>
          <div className="rounded-2xl bg-accent-soft border border-accent/20 p-5 md:p-6"><p className="text-xs font-bold uppercase tracking-wider text-warning">Need a hand?</p><h2 className="font-display font-bold text-lg text-ink mt-2">Use the Help Center</h2><p className="text-sm text-muted leading-6 mt-2">Step-by-step guides explain what each module does and how to complete common school tasks.</p><Link to="/help" className="inline-flex mt-4 text-sm font-semibold text-primary">Open Help Center →</Link></div>
        </section>
      </div>
    </div>
  );
}
