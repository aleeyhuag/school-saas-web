import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

const BASE_NAV_ITEMS = [
  { to: '/exam-officer/grading-settings', label: 'Grading Settings', icon: '⚖', end: true },
  { to: '/exam-officer/timetable', label: 'Timetable', icon: '▦' },
  { to: '/exam-officer/exam-timetable', label: 'Exam Timetable', icon: '▤' },
  { to: '/exam-officer/cbt', label: 'CBT Exams', icon: '📝' },
  { to: '/exam-officer/results-export', label: 'Results Export', icon: '⬇' },
  { to: '/exam-officer/announcements', label: 'Announcements', icon: '📣' },
  { to: '/exam-officer/settings', label: 'Account', icon: '⚙' },
];

const MY_TEACHING_ITEM = { to: '/teaching', label: 'My Teaching', icon: '🍎' };

/**
 * Exam Officer's dashboard is narrow and focused: Grading Settings
 * (the actual edit forms for assessment weights + grade boundaries —
 * the one thing only this role can change, per Stage 11) and a
 * minimal Account page (password only, reusing BursarSettingsPage's
 * component since the content is identical and generic).
 *
 * "My Teaching" only appears if this Exam Officer ALSO holds the
 * 'teacher' role (added via Staff > addRole) — see
 * PrincipalDashboard's docblock for the full reasoning, same
 * mechanism here.
 */
export default function ExamOfficerDashboard() {
  const { hasRole } = useAuth();
  const navItems = hasRole('teacher') ? [...BASE_NAV_ITEMS, MY_TEACHING_ITEM] : BASE_NAV_ITEMS;

  return (
    <DashboardLayout navItems={navItems}>
      <Outlet />
    </DashboardLayout>
  );
}
