import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './routes/Home';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './routes/ProtectedRoute';

const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const RegisterSchool = lazy(() => import('./pages/RegisterSchool'));
const EnrollPage = lazy(() => import('./pages/EnrollPage'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const SchoolsPage = lazy(() => import('./pages/super-admin/SchoolsPage'));
const SchoolDetailPage = lazy(() => import('./pages/super-admin/SchoolDetailPage'));
const SuperAdminsPage = lazy(() => import('./pages/super-admin/SuperAdminsPage'));
const PlatformLeadsPage = lazy(() => import('./pages/super-admin/PlatformLeadsPage'));
const PlatformCampaignsPage = lazy(() => import('./pages/super-admin/PlatformCampaignsPage'));
const ReferralPartnersPage = lazy(() => import('./pages/super-admin/ReferralPartnersPage'));
const PlatformStatsPage = lazy(() => import('./pages/super-admin/PlatformStatsPage'));
const PlatformBillingPage = lazy(() => import('./pages/super-admin/PlatformBillingPage'));
const SuperAdminBackupPage = lazy(() => import('./pages/super-admin/SuperAdminBackupPage'));
const ProprietorDashboard = lazy(() => import('./pages/ProprietorDashboard'));
const OverviewPage = lazy(() => import('./pages/proprietor/OverviewPage'));
const ClassesAndSubjectsPage = lazy(() => import('./pages/proprietor/ClassesAndSubjectsPage'));
const StudentsPage = lazy(() => import('./pages/proprietor/StudentsPage'));
const StaffPage = lazy(() => import('./pages/proprietor/StaffPage'));
const TeacherAssignmentsPage = lazy(() => import('./pages/proprietor/TeacherAssignmentsPage'));
const SessionsAndTermsPage = lazy(() => import('./pages/proprietor/SessionsAndTermsPage'));
const FeesPage = lazy(() => import('./pages/proprietor/FeesPage'));
const SettingsPage = lazy(() => import('./pages/proprietor/SettingsPage'));
const ParentsPage = lazy(() => import('./pages/shared/ParentsPage'));
const PrincipalDashboard = lazy(() => import('./pages/PrincipalDashboard'));
const ExamOfficerDashboard = lazy(() => import('./pages/ExamOfficerDashboard'));
const BursarDashboard = lazy(() => import('./pages/BursarDashboard'));
const BursarSettingsPage = lazy(() => import('./pages/bursar/BursarSettingsPage'));
const GradingSettingsPage = lazy(() => import('./pages/exam-officer/GradingSettingsPage'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const ClassTeacherAttendancePage = lazy(() => import('./pages/class-teacher/ClassTeacherAttendancePage'));
const ClassTeacherMarksheetPage = lazy(() => import('./pages/class-teacher/ClassTeacherMarksheetPage'));
const ScoreEntryPage = lazy(() => import('./pages/subject-teacher/ScoreEntryPage'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const ParentChildrenPage = lazy(() => import('./pages/parent/ParentChildrenPage'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentOverviewPage = lazy(() => import('./pages/student/StudentOverviewPage'));
const ClassTimetablePage = lazy(() => import('./pages/principal/ClassTimetablePage'));
const ExamTimetablePage = lazy(() => import('./pages/exam-officer/ExamTimetablePage'));
const TimetableViewPage = lazy(() => import('./pages/shared/TimetableViewPage'));
const ExamTimetableViewPage = lazy(() => import('./pages/shared/ExamTimetableViewPage'));
const ResultsExportPage = lazy(() => import('./pages/shared/ResultsExportPage'));
const AnnouncementsPage = lazy(() => import('./pages/shared/AnnouncementsPage'));
const AuditLogsPage = lazy(() => import('./pages/shared/AuditLogsPage'));
const AccountSettingsPage = lazy(() => import('./pages/shared/AccountSettingsPage'));
const SchoolHealthPage = lazy(() => import('./pages/shared/SchoolHealthPage'));
const BillingPage = lazy(() => import('./pages/proprietor/BillingPage'));
const BackupPage = lazy(() => import('./pages/proprietor/BackupPage'));
const IdCardsPage = lazy(() => import('./pages/shared/IdCardsPage'));
const IdCardPreviewPage = lazy(() => import('./pages/shared/IdCardPreviewPage'));
const IdCardBulkPrintPage = lazy(() => import('./pages/shared/IdCardBulkPrintPage'));
const CbtManagementPage = lazy(() => import('./pages/shared/CbtManagementPage'));
const StudentCbtPage = lazy(() => import('./pages/student/StudentCbtPage'));
const MyClassPage = lazy(() => import('./pages/class-teacher/MyClassPage'));
const EnrollmentApplicationsPage = lazy(() => import('./pages/proprietor/EnrollmentApplicationsPage'));
const PromotionPage = lazy(() => import('./pages/proprietor/PromotionPage'));
const Contact = lazy(() => import('./pages/Contact'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const ReferralPartnersPublic = lazy(() => import('./pages/ReferralPartnersPublic'));
const PartnerLogin = lazy(() => import('./pages/PartnerLogin'));
const PartnerDashboard = lazy(() => import('./pages/PartnerDashboard'));
const ReferralPartnerDetailPage = lazy(() => import('./pages/super-admin/ReferralPartnerDetailPage'));
const TeachingLandingRedirect = lazy(() => import('./pages/TeachingLandingRedirect'));

/**
 * Every page below is loaded on demand (React.lazy) instead of being packed
 * into one big file that every visitor downloads up front. A proprietor no
 * longer downloads the super-admin, CBT or referral screens just to open the
 * dashboard — the first load is much smaller, which matters on weak networks.
 */
function PageLoading() {
  return <div className="p-6 text-sm text-muted">Loading…</div>;
}

function Page({ children }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<Page><ForgotPassword /></Page>} />
        <Route path="/reset-password" element={<Page><ResetPassword /></Page>} />
        <Route path="/register-school" element={<Page><RegisterSchool /></Page>} />
        <Route path="/enroll/:slug" element={<Page><EnrollPage /></Page>} />
        <Route path="/contact" element={<Page><Contact /></Page>} />
        <Route path="/terms" element={<Page><Terms /></Page>} />
        <Route path="/privacy" element={<Page><Privacy /></Page>} />
        <Route path="/help" element={<Page><HelpPage /></Page>} />
        <Route path="/referrals" element={<Page><ReferralPartnersPublic /></Page>} />
        <Route path="/partner/register" element={<Page><ReferralPartnersPublic /></Page>} />
        <Route path="/partner/login" element={<Page><PartnerLogin /></Page>} />
        <Route path="/partner/dashboard" element={<Page><PartnerDashboard /></Page>} />

        {/* "/" is the site's actual homepage — an anonymous visitor
            sees the marketing Landing page; a signed-in user is
            handed off to whichever dashboard matches their role. */}
        <Route path="/" element={<Home />} />

        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Suspense fallback={<PageLoading />}><SuperAdminDashboard /></Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Page><SchoolsPage /></Page>} />
          <Route path="schools/:schoolId" element={<Page><SchoolDetailPage /></Page>} />
          <Route path="stats" element={<Page><PlatformStatsPage /></Page>} />
          <Route path="billing" element={<Page><PlatformBillingPage /></Page>} />
          <Route path="backup" element={<Page><SuperAdminBackupPage /></Page>} />
          <Route path="admins" element={<Page><SuperAdminsPage /></Page>} />
          <Route path="leads" element={<Page><PlatformLeadsPage /></Page>} />
          <Route path="campaigns" element={<Page><PlatformCampaignsPage /></Page>} />
          <Route path="referrals" element={<Page><ReferralPartnersPage /></Page>} />
          <Route path="referrals/:partnerId" element={<Page><ReferralPartnerDetailPage /></Page>} />
          <Route path="settings" element={<Page><AccountSettingsPage /></Page>} />
        </Route>

        {/* Proprietor: a layout shell (sidebar) with nested sub-pages —
            fully built out as of Stage 16. Principal reuses the exact
            same page components below (see PrincipalDashboard.jsx). */}
        <Route
          path="/proprietor"
          element={
            <ProtectedRoute allowedRoles={['proprietor']}>
              <Suspense fallback={<PageLoading />}><ProprietorDashboard /></Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Page><OverviewPage /></Page>} />
          <Route path="classes-subjects" element={<Page><ClassesAndSubjectsPage /></Page>} />
          <Route path="students" element={<Page><StudentsPage /></Page>} />
          <Route path="enrollment-applications" element={<Page><EnrollmentApplicationsPage /></Page>} />
          <Route path="staff" element={<Page><StaffPage /></Page>} />
          <Route path="parents" element={<Page><ParentsPage /></Page>} />
          <Route path="teacher-assignments" element={<Page><TeacherAssignmentsPage /></Page>} />
          <Route path="sessions-terms" element={<Page><SessionsAndTermsPage /></Page>} />
          <Route path="fees" element={<Page><FeesPage /></Page>} />
          <Route path="settings" element={<Page><SettingsPage /></Page>} />
          <Route path="timetable" element={<Page><TimetableViewPage /></Page>} />
          <Route path="exam-timetable" element={<Page><ExamTimetableViewPage /></Page>} />
          <Route path="results-export" element={<Page><ResultsExportPage /></Page>} />
          <Route path="announcements" element={<Page><AnnouncementsPage /></Page>} />
          <Route path="school-health" element={<Page><SchoolHealthPage /></Page>} />
          <Route path="billing" element={<Page><BillingPage /></Page>} />
          <Route path="backup" element={<Page><BackupPage /></Page>} />
          <Route path="audit" element={<Page><AuditLogsPage /></Page>} />
          <Route path="my-class" element={<Page><MyClassPage /></Page>} />
        </Route>

        <Route
          path="/principal"
          element={
            <ProtectedRoute allowedRoles={['principal']}>
              <Suspense fallback={<PageLoading />}><PrincipalDashboard /></Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Page><OverviewPage /></Page>} />
          <Route path="classes-subjects" element={<Page><ClassesAndSubjectsPage /></Page>} />
          <Route path="students" element={<Page><StudentsPage /></Page>} />
          <Route path="enrollment-applications" element={<Page><EnrollmentApplicationsPage /></Page>} />
          <Route path="promotion" element={<Page><PromotionPage /></Page>} />
          <Route path="staff" element={<Page><StaffPage /></Page>} />
          <Route path="parents" element={<Page><ParentsPage /></Page>} />
          <Route path="teacher-assignments" element={<Page><TeacherAssignmentsPage /></Page>} />
          <Route path="sessions-terms" element={<Page><SessionsAndTermsPage /></Page>} />
          <Route path="fees" element={<Page><FeesPage /></Page>} />
          <Route path="settings" element={<Page><SettingsPage /></Page>} />
          <Route path="timetable" element={<Page><ClassTimetablePage /></Page>} />
          <Route path="exam-timetable" element={<Page><ExamTimetableViewPage /></Page>} />
          <Route path="results-export" element={<Page><ResultsExportPage /></Page>} />
          <Route path="announcements" element={<Page><AnnouncementsPage /></Page>} />
          <Route path="school-health" element={<Page><SchoolHealthPage /></Page>} />
          <Route path="billing" element={<Page><BillingPage /></Page>} />
          <Route path="backup" element={<Page><BackupPage /></Page>} />
          <Route path="id-cards" element={<Page><IdCardsPage /></Page>} />
          <Route path="id-cards/:studentId/preview" element={<Page><IdCardPreviewPage /></Page>} />
          <Route path="id-cards/bulk-print" element={<Page><IdCardBulkPrintPage /></Page>} />
          <Route path="audit" element={<Page><AuditLogsPage /></Page>} />
          <Route path="my-class" element={<Page><MyClassPage /></Page>} />
        </Route>

        <Route
          path="/exam-officer"
          element={
            <ProtectedRoute allowedRoles={['exam_officer']}>
              <Suspense fallback={<PageLoading />}><ExamOfficerDashboard /></Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="grading-settings" replace />} />
          <Route path="grading-settings" element={<Page><GradingSettingsPage /></Page>} />
          <Route path="settings" element={<Page><BursarSettingsPage /></Page>} />
          <Route path="timetable" element={<Page><TimetableViewPage /></Page>} />
          <Route path="exam-timetable" element={<Page><ExamTimetablePage /></Page>} />
          <Route path="cbt" element={<Page><CbtManagementPage /></Page>} />
          <Route path="results-export" element={<Page><ResultsExportPage /></Page>} />
          <Route path="announcements" element={<Page><AnnouncementsPage /></Page>} />
          <Route path="my-class" element={<Page><MyClassPage /></Page>} />
        </Route>

        <Route
          path="/bursar"
          element={
            <ProtectedRoute allowedRoles={['bursar']}>
              <Suspense fallback={<PageLoading />}><BursarDashboard /></Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="fees" replace />} />
          <Route path="fees" element={<Page><FeesPage /></Page>} />
          <Route path="parents" element={<Page><ParentsPage /></Page>} />
          <Route path="settings" element={<Page><BursarSettingsPage /></Page>} />
          <Route path="announcements" element={<Page><AnnouncementsPage /></Page>} />
          <Route path="my-class" element={<Page><MyClassPage /></Page>} />
        </Route>

        <Route 
          path="/teaching" 
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Suspense fallback={<PageLoading />}><TeacherDashboard /></Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Page><TeachingLandingRedirect /></Page>} />
          <Route path="attendance" element={<Page><ClassTeacherAttendancePage /></Page>} />
          <Route path="my-class" element={<Page><MyClassPage /></Page>} />
          <Route path="marksheet" element={<Page><ClassTeacherMarksheetPage /></Page>} />
          <Route path="scores" element={<Page><ScoreEntryPage /></Page>} />
          <Route path="cbt" element={<Page><CbtManagementPage /></Page>} />
          <Route path="settings" element={<Page><BursarSettingsPage /></Page>} />
          <Route path="timetable" element={<Page><TimetableViewPage /></Page>} />
          <Route path="exam-timetable" element={<Page><ExamTimetableViewPage /></Page>} />
          <Route path="announcements" element={<Page><AnnouncementsPage /></Page>} />
        </Route>

        <Route path="/teacher" element={<Navigate to="/teaching" replace />} />

        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={['parent']}>
              <Suspense fallback={<PageLoading />}><ParentDashboard /></Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="children" replace />} />
          <Route path="children" element={<Page><ParentChildrenPage /></Page>} />
          <Route path="settings" element={<Page><BursarSettingsPage /></Page>} />
          <Route path="timetable" element={<Page><TimetableViewPage /></Page>} />
          <Route path="exam-timetable" element={<Page><ExamTimetableViewPage /></Page>} />
          <Route path="announcements" element={<Page><AnnouncementsPage /></Page>} />
        </Route>

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Suspense fallback={<PageLoading />}><StudentDashboard /></Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Page><StudentOverviewPage /></Page>} />
          <Route path="settings" element={<Page><BursarSettingsPage /></Page>} />
          <Route path="timetable" element={<Page><TimetableViewPage /></Page>} />
          <Route path="exam-timetable" element={<Page><ExamTimetableViewPage /></Page>} />
          <Route path="cbt" element={<Page><StudentCbtPage /></Page>} />
          <Route path="announcements" element={<Page><AnnouncementsPage /></Page>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
