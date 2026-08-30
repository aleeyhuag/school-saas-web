import { useEffect, useMemo, useState } from 'react';

const CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
  { id: 'students', label: 'Students', icon: '👨‍🎓' },
  { id: 'teachers', label: 'Teachers & Staff', icon: '👨‍🏫' },
  { id: 'academic', label: 'Academic', icon: '📝' },
  { id: 'finance', label: 'Finance & Billing', icon: '💰' },
  { id: 'id-cards', label: 'ID Cards', icon: '🪪' },
  { id: 'communication', label: 'Communication', icon: '📣' },
  { id: 'account', label: 'Account & Security', icon: '⚙️' },
];

const ARTICLES = [
  {
    id: 'register-school', category: 'getting-started', title: 'Register your school', roles: ['New school administrators'],
    summary: 'Create the school account that becomes the starting point for your Skulag workspace.',
    steps: ['Open the Skulag registration page.', 'Enter the school and administrator details requested on the form.', 'Submit the registration and complete any verification requested.', 'Sign in and complete the school setup shown on the dashboard.'],
    result: 'Your school workspace is ready for its academic setup and staff accounts.',
  },
  {
    id: 'login', category: 'getting-started', title: 'Log in to Skulag', roles: ['All users'],
    summary: 'Sign in with the account credentials supplied or created for you.',
    steps: ['Open the Skulag login page.', 'Enter your email/username and password.', 'Select Log in.', 'If you cannot remember your password, use Forgot password and follow the reset instructions.'],
    result: 'Skulag sends you to the dashboard for your assigned role.',
  },
  {
    id: 'dashboard', category: 'getting-started', title: 'Understand your dashboard', roles: ['All users'],
    summary: 'Use the dashboard as your starting point for the tasks available to your role.',
    steps: ['Review the summary cards and recent activity.', 'Use the sidebar for the modules available to your role.', 'Use the notification bell for new system messages.', 'Use the Help button at the top of the dashboard whenever you need guidance.'],
    result: 'You can quickly find the work relevant to your role without navigating through unrelated school administration areas.',
  },
  {
    id: 'school-setup', category: 'getting-started', title: 'Set up your school', roles: ['Proprietor', 'Principal'],
    summary: 'Complete the basic school structure before day-to-day academic operations begin.',
    steps: ['Confirm school profile and contact information.', 'Create the academic session and terms.', 'Create classes and subjects.', 'Add staff and assign their roles/classes/subjects.', 'Add students and guardians as needed.', 'Review settings before opening the system to the wider school community.'],
    result: 'The school has the basic structure needed for students, teachers, results, fees and communication.',
  },
  {
    id: 'add-student', category: 'students', title: 'Add a student', roles: ['Proprietor', 'Principal', 'Authorized staff'],
    summary: 'Create a student record with the information your school needs.',
    steps: ['Open Students.', 'Choose the option to add a student.', 'Enter the required personal and academic information.', 'Assign the correct class and other applicable details.', 'Save the record.', 'Open the student record to verify the information.'],
    result: 'The student becomes available to authorized school modules such as attendance, results and ID cards.',
  },
  {
    id: 'student-photo', category: 'students', title: 'Upload or replace a student photo', roles: ['Proprietor', 'Principal', 'Authorized Class Teacher'],
    summary: 'Keep a student photo current for identification and school documents.',
    steps: ['Open the student record or the class-teacher student editing screen.', 'Choose Edit.', 'Select the student photo field.', 'Choose a suitable image from the device.', 'Save the student record and confirm that the new photo appears.'],
    result: 'The photo is stored with the student record and can be used by authorized ID-card/document features.',
  },
  {
    id: 'bulk-import', category: 'students', title: 'Bulk import students', roles: ['Proprietor', 'Principal'],
    summary: 'Bring many student records into Skulag using the supported import process.',
    steps: ['Open the student import tool.', 'Download or use the supplied template if available.', 'Fill the spreadsheet carefully using the expected column names and formats.', 'Validate required fields such as admission number and class.', 'Upload the completed file.', 'Review the import result and correct any rejected rows.'],
    result: 'Valid rows are added to the school while import errors are identified for correction.',
  },
  {
    id: 'student-login', category: 'students', title: 'Create student access', roles: ['Authorized administrators'],
    summary: 'Give a student an account for the student-facing parts of Skulag.',
    steps: ['Open the student record.', 'Use the student account/login option when available.', 'Confirm the generated or supplied credentials.', 'Give the credentials to the student securely.', 'Ask the student to change a temporary password if the system requests it.'],
    result: 'The student can sign in and access features permitted for the student role.',
  },
  {
    id: 'promotion', category: 'students', title: 'Promote students', roles: ['Principal'],
    summary: 'Move eligible students to their next class while retaining their academic history.',
    steps: ['Open Promotion.', 'Select the current session/class and the target class.', 'Review the students selected for promotion.', 'Confirm the promotion only after checking the list.', 'Verify a promoted student in the new class.'],
    result: 'The student is associated with the new class for the new academic period while previous term results remain part of the student history.',
  },
  {
    id: 'teacher-assignment', category: 'teachers', title: 'Assign teachers to classes and subjects', roles: ['Proprietor', 'Principal'],
    summary: 'Give teachers the class and subject scope they need to perform their work.',
    steps: ['Open teacher assignments.', 'Select the teacher.', 'Assign the appropriate class or subject.', 'Review existing assignments to avoid conflicts.', 'Save the assignment.'],
    result: 'The teacher sees the appropriate class/subject tools and the backend applies the same authorization boundary.',
  },
  {
    id: 'class-teacher', category: 'teachers', title: 'Class teacher workflow', roles: ['Class Teacher'],
    summary: 'Manage the students and academic duties within your assigned class.',
    steps: ['Open My Class to view the assigned students.', 'Edit only the student information your role permits.', 'Upload or replace student photos when needed.', 'Use Attendance for daily attendance.', 'Use the marksheet/results tools for the academic work assigned to you.', 'Use CBT features available to teachers when the school has enabled them.'],
    result: 'Your class records stay up to date without giving the class teacher unrestricted school-administration privileges.',
  },
  {
    id: 'attendance', category: 'teachers', title: 'Record attendance', roles: ['Class Teacher', 'Authorized Teacher'],
    summary: 'Record whether students are present, absent or otherwise marked according to the school workflow.',
    steps: ['Open Attendance.', 'Select the relevant class/date when prompted.', 'Review the student list.', 'Mark each student using the available attendance status.', 'Save the attendance.', 'Review the saved result before leaving the page.'],
    result: 'Attendance is stored against the appropriate school/class/date and can be used by authorized reporting features.',
  },
  {
    id: 'enter-results', category: 'academic', title: 'Enter and publish results', roles: ['Authorized Teachers', 'Exam Officer', 'Principal'],
    summary: 'Record assessment scores and publish results through the academic workflow.',
    steps: ['Open the relevant marksheet or score-entry area.', 'Select the correct session, term, class and subject.', 'Enter or review scores.', 'Save the scores and correct any validation errors.', 'Use the publishing control only after the results have been checked.', 'Confirm that the published result is visible to the intended student/parent audience.'],
    result: 'The approved result becomes available to the roles permitted to view published results.',
  },
  {
    id: 'report-cards', category: 'academic', title: 'Generate and view report cards', roles: ['Authorized school staff'],
    summary: 'Use published academic records to produce student report documents.',
    steps: ['Select the student or class and the applicable academic period.', 'Review the displayed results and school information.', 'Generate or preview the report.', 'Check the preview before printing or downloading.', 'Use the print controls provided by the report screen.'],
    result: 'The report represents the selected academic period and the results currently stored for that period.',
  },
  {
    id: 'cbt-overview', category: 'academic', title: 'Use CBT examinations', roles: ['Exam Officer', 'Authorized Teachers', 'Students'],
    summary: 'Create, deliver and complete computer-based examinations.',
    steps: ['Authorized staff create an exam with its class, subject, instructions, timing and questions.', 'Publish the exam after checking the settings.', 'Students open an available exam and start an attempt during the permitted window.', 'Students answer questions while the server tracks the attempt and timing.', 'Students submit manually or the system submits when time expires.', 'Authorized staff review the resulting scores and analytics.'],
    result: 'The attempt is marked by the server and the resulting score is available to authorized users.',
  },
  {
    id: 'question-bank', category: 'academic', title: 'Build a subject question bank', roles: ['Exam Officer', 'Authorized Teachers'],
    summary: 'Keep reusable CBT questions organized by subject and, where supported, topic/category.',
    steps: ['Open the CBT/question-bank area.', 'Choose the subject for the question.', 'Create a question and its answer options.', 'Mark the correct answer and assign the mark value.', 'Add a topic/category when the workflow provides it.', 'Save the question and reuse it when creating future exams.'],
    result: 'Questions remain associated with their subject so staff can build a reusable pool instead of rewriting every exam from scratch.',
  },
  {
    id: 'cbt-student', category: 'academic', title: 'Take a CBT exam as a student', roles: ['Student'],
    summary: 'Complete an assigned CBT examination safely and submit your answers.',
    steps: ['Open My CBT/available examinations.', 'Read the exam instructions before starting.', 'Select Start/Resume when the exam is available.', 'Answer questions and use the navigator to move between them.', 'Use Submit when you are finished, or continue until the timer expires.', 'Wait for the submission/result confirmation rather than repeatedly clicking the button.'],
    result: 'Your attempt is submitted and marked by the server; the final score is shown according to the school result policy.',
  },
  {
    id: 'fees', category: 'finance', title: 'Manage fees and payments', roles: ['Bursar', 'Proprietor', 'Principal'],
    summary: 'Set up fee structures, track balances and record payments.',
    steps: ['Open the Fees module.', 'Review the active academic session/term.', 'Set or review applicable fee structures.', 'Record payments against the correct student.', 'Review the receipt/payment status.', 'Use reports or balances to follow up outstanding amounts.'],
    result: 'Student fee balances and payment records reflect the transactions recorded in Skulag.',
  },
  {
    id: 'billing', category: 'finance', title: 'Manage Skulag subscription billing', roles: ['Proprietor', 'Principal'],
    summary: 'Review your platform subscription and submit billing/payment information when required.',
    steps: ['Open Billing from the account dashboard when available.', 'Review the current plan, trial or subscription status.', 'Follow the payment/submission instructions shown on the billing page.', 'Submit the required billing information or payment evidence.', 'Wait for the billing status to update rather than submitting repeatedly.'],
    result: 'Your school subscription request/payment is recorded for the platform billing workflow.',
  },
  {
    id: 'id-card-photo', category: 'id-cards', title: 'Prepare student information for ID cards', roles: ['Principal', 'Authorized staff'],
    summary: 'Make sure student photos and school identity information are ready before generating cards.',
    steps: ['Confirm the student record is complete.', 'Upload or replace the student photo.', 'Confirm the school logo and required school details.', 'Confirm the principal/signature information where applicable.', 'Open the ID-card preview before printing.'],
    result: 'The ID-card generator has the information needed for a clean card output.',
  },
  {
    id: 'id-card-print', category: 'id-cards', title: 'Preview and print ID cards', roles: ['Principal', 'Authorized staff'],
    summary: 'Generate individual or bulk ID-card output and verify the print layout.',
    steps: ['Open ID Cards.', 'Select one or more students for the browser print workflow.', 'Preview the cards.', 'Check names, photos, admission numbers and school details.', 'Use the print controls provided by the preview page.', 'Test a single physical print before a large batch.'],
    result: 'You get print-ready student ID cards without changing the underlying student records.',
  },
  {
    id: 'announcements', category: 'communication', title: 'Post a school announcement', roles: ['Authorized school staff'],
    summary: 'Share an important message with the intended school audience.',
    steps: ['Open Announcements.', 'Create a new announcement.', 'Write a clear title and message.', 'Select the intended audience/options available to your role.', 'Publish the announcement.', 'Check the announcement list and notification indicators.'],
    result: 'The announcement becomes available to its intended audience and may generate in-app notifications.',
  },
  {
    id: 'notifications', category: 'communication', title: 'Use notifications', roles: ['All users'],
    summary: 'Stay informed about important school and account events.',
    steps: ['Select the notification bell in the dashboard header.', 'Review unread notifications.', 'Open a notification when it contains a relevant link.', 'Mark individual notifications as read or use Mark all as read when appropriate.'],
    result: 'Your notification list stays current and unread counts reflect outstanding notifications.',
  },
  {
    id: 'profile', category: 'account', title: 'Manage your profile and password', roles: ['All users'],
    summary: 'Keep your account information secure and up to date.',
    steps: ['Open your account/settings area.', 'Review the name and account details shown.', 'Change your password using the available password controls.', 'Use a strong, unique password and do not share it with another person.', 'Log out when using a shared device.'],
    result: 'Your account information remains current and access is better protected.',
  },
  {
    id: 'theme', category: 'account', title: 'Choose Light, Dark or System theme', roles: ['All users'],
    summary: 'Adjust the Skulag interface for your preferred viewing environment.',
    steps: ['Open the theme control in the dashboard header.', 'Choose Light for a bright interface, Dark for a low-light interface, or System to follow the device preference.', 'Your choice is saved for future visits on that browser/device.', 'Change it again at any time from the same control.'],
    result: 'The application interface changes without changing school records or printed/PDF documents.',
  },
  {
    id: 'security', category: 'account', title: 'Use Skulag securely', roles: ['All users'],
    summary: 'Protect school information and report anything that looks unusual.',
    steps: ['Never share your password or temporary credentials publicly.', 'Use only the modules and records your role gives you access to.', 'Check student/class details before saving important changes.', 'Log out from shared computers.', 'Report unexpected access, incorrect permissions or suspicious activity to the school administrator.'],
    result: 'Your account and the school data it can access are less likely to be exposed through everyday mistakes.',
  },
];

function categoryLabel(id) {
  return CATEGORIES.find((category) => category.id === id)?.label ?? 'Help';
}

export default function HelpCenter({ onClose }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return ARTICLES.filter((article) => {
      const categoryMatch = category === 'all' || article.category === category;
      if (!categoryMatch) return false;
      if (!normalized) return true;
      const haystack = [article.title, article.summary, article.category, ...article.roles, ...article.steps].join(' ').toLowerCase();
      return haystack.includes(normalized);
    });
  }, [category, query]);

  const selected = ARTICLES.find((article) => article.id === selectedId) ?? null;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const close = () => {
    setSelectedId(null);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-bg overflow-y-auto" role="dialog" aria-modal="true" aria-label="Skulag Help Center">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur px-4 md:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center text-lg shrink-0" aria-hidden="true">?</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Skulag Help Center</p>
            <p className="text-xs text-muted hidden sm:block">Simple, step-by-step guidance for school operations</p>
          </div>
          <button type="button" onClick={close} className="ml-auto w-9 h-9 rounded-lg text-muted hover:bg-bg hover:text-ink" aria-label="Close Help Center">✕</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {!selected ? (
          <>
            <section className="rounded-2xl bg-primary text-white p-5 md:p-8 mb-6">
              <p className="text-xs uppercase tracking-wider font-semibold opacity-80">Skulag documentation</p>
              <h1 className="font-display text-2xl md:text-3xl font-bold mt-1">How can we help?</h1>
              <p className="text-sm md:text-base opacity-90 mt-2 max-w-2xl">Find a task below or search for what you want to do. Each guide explains what the feature does, who can use it, and the steps to complete it.</p>
              <label className="block mt-5">
                <span className="sr-only">Search help articles</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search: student photo, CBT, fees, results..." className="w-full rounded-xl border-0 bg-white text-ink placeholder:text-muted px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-white/70" autoFocus />
              </label>
            </section>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-5" role="tablist" aria-label="Help categories">
              <button type="button" onClick={() => setCategory('all')} className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium border ${category === 'all' ? 'bg-primary-soft text-primary border-primary/20' : 'bg-surface text-muted border-border hover:text-ink'}`} role="tab" aria-selected={category === 'all'}>All topics</button>
              {CATEGORIES.map((item) => (
                <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium border ${category === item.id ? 'bg-primary-soft text-primary border-primary/20' : 'bg-surface text-muted border-border hover:text-ink'}`} role="tab" aria-selected={category === item.id}>
                  <span aria-hidden="true">{item.icon}</span> {item.label}
                </button>
              ))}
            </div>

            {filteredArticles.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                <div className="text-2xl mb-2" aria-hidden="true">🔎</div>
                <h2 className="font-display font-semibold text-ink">No matching help article</h2>
                <p className="text-sm text-muted mt-1">Try a shorter search term or choose another category.</p>
                <button type="button" onClick={() => { setQuery(''); setCategory('all'); }} className="mt-4 text-sm font-semibold text-primary hover:underline">Clear search</button>
              </div>
            ) : (
              <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite">
                {filteredArticles.map((article) => (
                  <button key={article.id} type="button" onClick={() => setSelectedId(article.id)} className="text-left rounded-2xl border border-border bg-surface p-5 hover:border-primary/30 hover:shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary">
                    <p className="text-xs font-semibold text-primary">{categoryLabel(article.category)}</p>
                    <h2 className="font-display font-semibold text-ink mt-1">{article.title}</h2>
                    <p className="text-sm text-muted mt-2 leading-6">{article.summary}</p>
                    <span className="inline-block text-xs font-semibold text-primary mt-4">Read guide →</span>
                  </button>
                ))}
              </section>
            )}
          </>
        ) : (
          <article className="max-w-3xl">
            <button type="button" onClick={() => setSelectedId(null)} className="text-sm font-semibold text-primary hover:underline mb-5">← Back to Help Center</button>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{categoryLabel(selected.category)}</p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink mt-1">{selected.title}</h1>
            <p className="text-base text-muted mt-2">{selected.summary}</p>

            <div className="mt-6 rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Who can use this</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {selected.roles.map((role) => <span key={role} className="px-2.5 py-1 rounded-full bg-primary-soft text-primary text-xs font-medium">{role}</span>)}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-surface p-5 md:p-6">
              <h2 className="font-display text-lg font-semibold text-ink">Steps</h2>
              <ol className="mt-4 space-y-4">
                {selected.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-ink leading-6">
                    <span className="w-7 h-7 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold shrink-0">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 rounded-2xl border border-success/20 bg-success-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-success">Result</p>
              <p className="text-sm text-ink mt-1 leading-6">{selected.result}</p>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
