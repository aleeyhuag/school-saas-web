import { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { BRAND } from '../config/brand';
import ThemeSwitcher from '../components/ThemeSwitcher';

const ROLES = [
  ['proprietor','Proprietor','Run the whole school from one place','Enrollment, staff, branches, fees, results and school health — with the control to see what needs attention.'],
  ['principal','Principal','Keep academics and operations moving','Manage classes, teachers, students, timetables, results and the day-to-day work of the school.'],
  ['bursar','Bursar','Know who has paid and who has not','Track fee structures, balances, payments and reminders without chasing spreadsheets or chat messages.'],
  ['exam_officer','Exam Officer','Make results consistent','Set grading rules, enter and review results, approve the publishing workflow and export reports.'],
  ['teacher','Teacher','Work from the classes you actually teach','Mark attendance, enter scores, review results and — when assigned as class teacher — manage your class roster.'],
  ['parent','Parent','Stay connected to your child','See attendance, published results, fees, timetable and school announcements from one account.'],
  ['student','Student','Know what is happening at school','Access your published results, timetable and announcements without waiting for paper copies.'],
];

const FEATURES = [
  ['▦','Academic management','Classes, subjects, students, sessions, terms, results and student progression.'],
  ['↗','Bulk promotion','Promote a whole class or select individual students to promote, repeat, skip, transfer or withdraw.'],
  ['✓','Attendance','Whole-day and subject attendance with class-teacher controls and live summaries.'],
  ['₦','Fees & payments','Fee structures, balances, payment records, reminders and bank-transfer verification.'],
  ['⇄','Role-based access','Every role gets the tools it needs, while school data stays inside the correct school or branch.'],
  ['📣','Communication','Announcements for the whole school, staff, classes and families from one place.'],
  ['▤','Timetables & exams','Build class schedules and exam timetables around the school`s actual periods.'],
  ['♡','School health','Surface setup gaps such as missing teachers, guardians or current-term configuration before they become problems.'],
  ['⬇','Reports & exports','Publish report cards and export academic results for administration and records.'],
];

const STEPS = [
  ['01','Register','Create your school and get your Proprietor account.'],
  ['02','Set up','Create classes, subjects, sessions and staff assignments.'],
  ['03','Run school','Teachers, parents, students and administrators work from the same live data.'],
];

export default function Landing() {
  const [activeRole, setActiveRole] = useState(ROLES[0][0]);
  const role = ROLES.find((r) => r[0] === activeRole) ?? ROLES[0];
  return <div className="min-h-screen bg-bg">
    <SiteHeader />
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-primary-soft/30" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-14 md:pb-20">
          <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-semibold text-primary mb-5">Built for how Nigerian schools actually run</div>
              <h1 className="text-4xl md:text-6xl font-display font-extrabold text-ink leading-[1.05] tracking-tight max-w-3xl">{BRAND.tagline}</h1>
              <p className="text-base md:text-lg text-muted mt-6 max-w-xl leading-8">Manage students, teachers, academics, attendance, fees, results, communication and school operations — all from one secure platform.</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link to="/register-school" className="text-center bg-primary text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-primary-hover transition-colors">Start your school</Link>
                <Link to="/login" className="text-center bg-surface border border-border text-ink font-semibold px-6 py-3.5 rounded-xl hover:bg-bg transition-colors">Log in</Link>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-xs text-muted"><span>✓ Role-based access</span><span>✓ Multi-branch ready</span><span>✓ No spreadsheet maze</span></div>
            </div>
            <div className="bg-surface border border-border rounded-3xl shadow-xl p-3 md:p-4 rotate-0 lg:rotate-1">
              <div className="border border-border rounded-2xl overflow-hidden">
                <div className="h-12 border-b border-border flex items-center px-4 gap-2"><img src={BRAND.logoPath} alt={`${BRAND.productName} logo`} className="w-7 h-7 object-contain" /><span className="text-sm font-display font-bold text-ink">{BRAND.productName} dashboard</span><span className="ml-auto w-2 h-2 rounded-full bg-success" /></div>
                <div className="grid grid-cols-[120px_1fr] min-h-[300px]">
                  <div className="bg-bg border-r border-border p-3 space-y-2"><div className="h-7 rounded bg-primary-soft"/><div className="h-7 rounded bg-primary-soft/60"/><div className="h-7 rounded bg-primary-soft/60"/><div className="h-7 rounded bg-primary-soft/60"/><div className="h-7 rounded bg-primary-soft/60"/></div>
                  <div className="p-4 md:p-5 bg-surface"><div className="flex items-end justify-between mb-4"><div><p className="text-[10px] uppercase tracking-wide text-muted">Overview</p><p className="font-display font-bold text-lg text-ink">Good morning</p></div><div className="w-16 h-7 rounded-lg bg-accent-soft" /></div><div className="grid grid-cols-2 gap-3"><div className="border border-border rounded-xl p-3"><p className="text-[10px] text-muted">Students</p><p className="font-display font-bold text-xl text-ink">1,248</p></div><div className="border border-border rounded-xl p-3"><p className="text-[10px] text-muted">Attendance</p><p className="font-display font-bold text-xl text-ink">94%</p></div><div className="border border-border rounded-xl p-3"><p className="text-[10px] text-muted">Classes</p><p className="font-display font-bold text-xl text-ink">32</p></div><div className="border border-border rounded-xl p-3"><p className="text-[10px] text-muted">Fees</p><p className="font-display font-bold text-xl text-ink">₦4.8m</p></div></div><div className="mt-3 h-20 rounded-xl bg-primary-soft/50 border border-border" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface"><div className="max-w-6xl mx-auto px-4 md:px-8 py-7 grid grid-cols-2 md:grid-cols-4 gap-5 text-center md:text-left"><div><p className="font-display font-bold text-2xl text-ink">7+</p><p className="text-xs text-muted">school roles supported</p></div><div><p className="font-display font-bold text-2xl text-ink">1</p><p className="text-xs text-muted">shared source of truth</p></div><div><p className="font-display font-bold text-2xl text-ink">1000s</p><p className="text-xs text-muted">of students can be managed</p></div><div><p className="font-display font-bold text-2xl text-ink">24/7</p><p className="text-xs text-muted">access to school information</p></div></div></section>

      <section id="features" className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24 scroll-mt-16"><div className="max-w-2xl mx-auto text-center mb-12"><p className="text-xs font-bold text-accent uppercase tracking-widest mb-3">Everything in one place</p><h2 className="text-3xl md:text-4xl font-display font-extrabold text-ink">The school runs from one platform.</h2><p className="text-muted mt-4">From the first student admission to end-of-year promotion, the system keeps academic and administrative work connected.</p></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{FEATURES.map(([icon,label,body])=><div key={label} className="bg-surface border border-border rounded-2xl p-5 hover:shadow-md transition-shadow"><div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center text-lg mb-4">{icon}</div><h3 className="font-display font-bold text-ink mb-1.5">{label}</h3><p className="text-sm text-muted leading-6">{body}</p></div>)}</div></section>

      <section id="how-it-works" className="bg-primary text-white scroll-mt-16"><div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20"><div className="max-w-2xl mb-10"><p className="text-xs font-bold text-accent uppercase tracking-widest mb-3">Simple setup</p><h2 className="text-3xl md:text-4xl font-display font-extrabold">From registration to daily school operations.</h2></div><div className="grid md:grid-cols-3 gap-5">{STEPS.map(([n,label,body])=><div key={n} className="border border-white/15 bg-white/5 rounded-2xl p-6"><span className="text-accent font-display font-extrabold">{n}</span><h3 className="font-display font-bold text-lg mt-4">{label}</h3><p className="text-primary-soft/90 text-sm leading-6 mt-2">{body}</p></div>)}</div></div></section>

      <section className="max-w-5xl mx-auto px-4 md:px-8 py-16 md:py-24"><div className="text-center mb-8"><p className="text-xs font-bold text-accent uppercase tracking-widest mb-3">One school, different responsibilities</p><h2 className="text-3xl md:text-4xl font-display font-extrabold text-ink">Everyone sees what they need.</h2></div><div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden"><div className="flex overflow-x-auto border-b border-border">{ROLES.map(([key,label])=><button key={key} type="button" onClick={()=>setActiveRole(key)} className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 ${activeRole===key?'border-primary text-primary':'border-transparent text-muted hover:text-ink'}`}>{label}</button>)}</div><div className="p-7 md:p-10"><p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">{role[1]}</p><h3 className="text-2xl md:text-3xl font-display font-extrabold text-ink">{role[2]}</h3><p className="text-muted leading-7 mt-3 max-w-2xl">{role[3]}</p></div></div></section>

      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-16"><div className="bg-accent-soft border border-accent/20 rounded-3xl p-7 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"><div><p className="text-xs font-bold text-warning uppercase tracking-widest mb-2">Built to scale with your school</p><h2 className="text-2xl md:text-3xl font-display font-extrabold text-ink">Stop moving school operations between notebooks, spreadsheets and chats.</h2><p className="text-sm text-muted mt-2 max-w-2xl">Give every role a clear place to work and keep the school's records connected.</p></div><Link to="/register-school" className="shrink-0 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-hover">Get started</Link></div></section>

      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-16 md:pb-20">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-2xl p-5"><p className="text-2xl mb-3" aria-hidden="true">🔐</p><h2 className="font-display font-bold text-ink">Role-based by design</h2><p className="text-sm text-muted leading-6 mt-2">Proprietors, principals, teachers, bursars, parents and students see the tools appropriate to their responsibilities.</p></div>
          <div className="bg-surface border border-border rounded-2xl p-5"><p className="text-2xl mb-3" aria-hidden="true">📚</p><h2 className="font-display font-bold text-ink">Guidance when you need it</h2><p className="text-sm text-muted leading-6 mt-2">The Skulag Help Center gives simple, practical steps for everyday school operations.</p><Link to="/help" className="inline-flex text-sm font-semibold text-primary mt-3">Browse the Help Center →</Link></div>
          <div className="bg-surface border border-border rounded-2xl p-5"><p className="text-2xl mb-3" aria-hidden="true">📱</p><h2 className="font-display font-bold text-ink">Built for everyday access</h2><p className="text-sm text-muted leading-6 mt-2">Use Skulag from a phone, tablet or computer and keep the same school records connected.</p></div>
        </div>
      </section>

      <section className="bg-primary"><div className="max-w-4xl mx-auto px-4 md:px-8 py-16 text-center"><h2 className="text-3xl md:text-4xl font-display font-extrabold text-white">Ready to bring your school together?</h2><p className="text-primary-soft/90 mt-3 mb-7">Register your school and start building your digital school workspace.</p><Link to="/register-school" className="inline-flex bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:bg-white/90">Register your school</Link></div></section>
    </main>
    <SiteFooter />
  </div>;
}