import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const NAV_ITEMS = [
  { to: '/exam-officer/grading-settings', label: 'Grading Settings', icon: '⚖', end: true },
  { to: '/exam-officer/timetable', label: 'Timetable', icon: '▦' },
  { to: '/exam-officer/exam-timetable', label: 'Exam Timetable', icon: '▤' },
  { to: '/exam-officer/cbt', label: 'CBT Exams', icon: '📝' },
  { to: '/exam-officer/results-export', label: 'Results Export', icon: '⬇' },
  { to: '/exam-officer/announcements', label: 'Announcements', icon: '📣' },
  { to: '/exam-officer/settings', label: 'Account', icon: '⚙' },
];

/**
 * Exam Officer's dashboard is narrow and focused: Grading Settings
 * (the actual edit forms for assessment weights + grade boundaries —
 * the one thing only this role can change, per Stage 11) and a
 * minimal Account page (password only, reusing BursarSettingsPage's
 * component since the content is identical and generic).
 */
export default function ExamOfficerDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS}>
      <Outlet />
    </DashboardLayout>
  );
}
