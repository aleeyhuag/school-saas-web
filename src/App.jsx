import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RegisterSchool from './pages/RegisterSchool';
import Home from './routes/Home';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SchoolsPage from './pages/super-admin/SchoolsPage';
import SchoolDetailPage from './pages/super-admin/SchoolDetailPage';
import SuperAdminsPage from './pages/super-admin/SuperAdminsPage';
import NotFoundPage from './pages/NotFoundPage';
// import PlatformLeadsPage from './pages/super-admin/PlatformLeadsPage';
// import PlatformCampaignsPage from './pages/super-admin/PlatformCampaignsPage';
import PlatformStatsPage from './pages/super-admin/PlatformStatsPage';
import PlatformBillingPage from './pages/super-admin/PlatformBillingPage';
import SuperAdminBackupPage from './pages/super-admin/SuperAdminBackupPage';
import ProprietorDashboard from './pages/ProprietorDashboard';
import OverviewPage from './pages/proprietor/OverviewPage';
import ClassesAndSubjectsPage from './pages/proprietor/ClassesAndSubjectsPage';
import StudentsPage from './pages/proprietor/StudentsPage';
import StaffPage from './pages/proprietor/StaffPage';
import TeacherAssignmentsPage from './pages/proprietor/TeacherAssignmentsPage';
import SessionsAndTermsPage from './pages/proprietor/SessionsAndTermsPage';
import FeesPage from './pages/proprietor/FeesPage';
import SettingsPage from './pages/proprietor/SettingsPage';
import ParentsPage from './pages/shared/ParentsPage';
import PrincipalDashboard from './pages/PrincipalDashboard';
import ExamOfficerDashboard from './pages/ExamOfficerDashboard';
import BursarDashboard from './pages/BursarDashboard';
import BursarSettingsPage from './pages/bursar/BursarSettingsPage';
import GradingSettingsPage from './pages/exam-officer/GradingSettingsPage';
import TeacherDashboard from './pages/TeacherDashboard';
import ClassTeacherAttendancePage from './pages/class-teacher/ClassTeacherAttendancePage';
import ClassTeacherMarksheetPage from './pages/class-teacher/ClassTeacherMarksheetPage';
import ScoreEntryPage from './pages/subject-teacher/ScoreEntryPage';
import ParentDashboard from './pages/ParentDashboard';
import ParentChildrenPage from './pages/parent/ParentChildrenPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentOverviewPage from './pages/student/StudentOverviewPage';
import ProtectedRoute from './routes/ProtectedRoute';
import ClassTimetablePage from './pages/principal/ClassTimetablePage';
import ExamTimetablePage from './pages/exam-officer/ExamTimetablePage';
import TimetableViewPage from './pages/shared/TimetableViewPage';
import ExamTimetableViewPage from './pages/shared/ExamTimetableViewPage';
import ResultsExportPage from './pages/shared/ResultsExportPage';
import AnnouncementsPage from './pages/shared/AnnouncementsPage';
import AuditLogsPage from './pages/shared/AuditLogsPage';
import AccountSettingsPage from './pages/shared/AccountSettingsPage';
import SchoolHealthPage from './pages/shared/SchoolHealthPage';
import BillingPage from './pages/proprietor/BillingPage';
import BackupPage from './pages/proprietor/BackupPage';
import IdCardsPage from './pages/shared/IdCardsPage';
import IdCardPreviewPage from './pages/shared/IdCardPreviewPage';
import IdCardBulkPrintPage from './pages/shared/IdCardBulkPrintPage';
import CbtManagementPage from './pages/shared/CbtManagementPage';
import StudentCbtPage from './pages/student/StudentCbtPage';
import PromotionPage from './pages/proprietor/PromotionPage';
import MyClassPage from './pages/class-teacher/MyClassPage';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import HelpPage from './pages/HelpPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register-school" element={<RegisterSchool />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/help" element={<HelpPage />} />

        {/* "/" is the site's actual homepage — an anonymous visitor
            sees the marketing Landing page; a signed-in user is
            handed off to whichever dashboard matches their role. */}
        <Route path="/" element={<Home />} />

        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<SchoolsPage />} />
          <Route path="schools/:schoolId" element={<SchoolDetailPage />} />
          <Route path="stats" element={<PlatformStatsPage />} />
          <Route path="billing" element={<PlatformBillingPage />} />
          <Route path="backup" element={<SuperAdminBackupPage />} />
          <Route path="admins" element={<SuperAdminsPage />} />
          {/* <Route path="leads" element={<PlatformLeadsPage />} />
          <Route path="campaigns" element={<PlatformCampaignsPage />} /> */}
          <Route path="settings" element={<AccountSettingsPage />} />
        </Route>

        {/* Proprietor: a layout shell (sidebar) with nested sub-pages —
            fully built out as of Stage 16. Principal reuses the exact
            same page components below (see PrincipalDashboard.jsx). */}
        <Route
          path="/proprietor"
          element={
            <ProtectedRoute allowedRoles={['proprietor']}>
              <ProprietorDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="classes-subjects" element={<ClassesAndSubjectsPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="promotion" element={<PromotionPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="parents" element={<ParentsPage />} />
          <Route path="teacher-assignments" element={<TeacherAssignmentsPage />} />
          <Route path="sessions-terms" element={<SessionsAndTermsPage />} />
          <Route path="fees" element={<FeesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="timetable" element={<TimetableViewPage />} />
          <Route path="exam-timetable" element={<ExamTimetableViewPage />} />
          <Route path="results-export" element={<ResultsExportPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="school-health" element={<SchoolHealthPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="backup" element={<BackupPage />} />
          <Route path="id-cards" element={<IdCardsPage />} />
          <Route path="id-cards/:studentId/preview" element={<IdCardPreviewPage />} />
          <Route path="id-cards/bulk-print" element={<IdCardBulkPrintPage />} />
          <Route path="audit" element={<AuditLogsPage />} />
        </Route>

        <Route
          path="/principal"
          element={
            <ProtectedRoute allowedRoles={['principal']}>
              <PrincipalDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="classes-subjects" element={<ClassesAndSubjectsPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="promotion" element={<PromotionPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="parents" element={<ParentsPage />} />
          <Route path="teacher-assignments" element={<TeacherAssignmentsPage />} />
          <Route path="sessions-terms" element={<SessionsAndTermsPage />} />
          <Route path="fees" element={<FeesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="timetable" element={<ClassTimetablePage />} />
          <Route path="exam-timetable" element={<ExamTimetableViewPage />} />
          <Route path="results-export" element={<ResultsExportPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="school-health" element={<SchoolHealthPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="id-cards" element={<IdCardsPage />} />
          <Route path="id-cards/:studentId/preview" element={<IdCardPreviewPage />} />
          <Route path="id-cards/bulk-print" element={<IdCardBulkPrintPage />} />
          <Route path="audit" element={<AuditLogsPage />} />
        </Route>

        <Route
          path="/exam-officer"
          element={
            <ProtectedRoute allowedRoles={['exam_officer']}>
              <ExamOfficerDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="grading-settings" replace />} />
          <Route path="grading-settings" element={<GradingSettingsPage />} />
          <Route path="settings" element={<BursarSettingsPage />} />
          <Route path="timetable" element={<TimetableViewPage />} />
          <Route path="exam-timetable" element={<ExamTimetablePage />} />
          <Route path="cbt" element={<CbtManagementPage />} />
          <Route path="results-export" element={<ResultsExportPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>

        <Route
          path="/bursar"
          element={
            <ProtectedRoute allowedRoles={['bursar']}>
              <BursarDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="fees" replace />} />
          <Route path="fees" element={<FeesPage />} />
          <Route path="parents" element={<ParentsPage />} />
          <Route path="settings" element={<BursarSettingsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>

        <Route 
          path="/teacher" 
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="attendance" replace />} />
          <Route path="attendance" element={<ClassTeacherAttendancePage />} />
          <Route path="my-class" element={<MyClassPage />} />
          <Route path="marksheet" element={<ClassTeacherMarksheetPage />} />
          <Route path="scores" element={<ScoreEntryPage />} />
          <Route path="cbt" element={<CbtManagementPage />} />
          <Route path="settings" element={<BursarSettingsPage />} />
          <Route path="timetable" element={<TimetableViewPage />} />
          <Route path="exam-timetable" element={<ExamTimetableViewPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>

        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={['parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="children" replace />} />
          <Route path="children" element={<ParentChildrenPage />} />
          <Route path="settings" element={<BursarSettingsPage />} />
          <Route path="timetable" element={<TimetableViewPage />} />
          <Route path="exam-timetable" element={<ExamTimetableViewPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<StudentOverviewPage />} />
          <Route path="settings" element={<BursarSettingsPage />} />
          <Route path="timetable" element={<TimetableViewPage />} />
          <Route path="exam-timetable" element={<ExamTimetableViewPage />} />
          <Route path="cbt" element={<StudentCbtPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
