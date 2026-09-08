import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

const BASE_NAV_ITEMS = [
  { to: '/proprietor', label: 'Overview', icon: '⌂', end: true },
  { to: '/proprietor/sessions-terms', label: 'Sessions & Terms', icon: '▦' },
  { to: '/proprietor/staff', label: 'Staff', icon: '⚇' },
  { to: '/proprietor/classes-subjects', label: 'Classes & Subjects', icon: '▤' },
  { to: '/proprietor/teacher-assignments', label: 'Teacher Assignments', icon: '⇄' },
  { to: '/proprietor/students', label: 'Students', icon: '☺' },
  { to: '/proprietor/parents', label: 'Parents', icon: '♥' },
  { to: '/proprietor/enrollment-applications', label: 'Enrollment Applications', icon: '📥' },
  { to: '/proprietor/fees', label: 'Fees', icon: '₦' },
  { to: '/proprietor/timetable', label: 'Timetable', icon: '▦' },
  { to: '/proprietor/exam-timetable', label: 'Exam Timetable', icon: '▤' },
  { to: '/proprietor/results-export', label: 'Results Export', icon: '⬇' },
  { to: '/proprietor/announcements', label: 'Announcements', icon: '📣' },
  { to: '/proprietor/school-health', label: 'School Health', icon: '♡' },
  { to: '/proprietor/billing', label: 'Billing', icon: '💳' },
  { to: '/proprietor/backup', label: 'Data Backup', icon: '⬇' },
  { to: '/proprietor/audit', label: 'Audit Log', icon: '◌' },
  { to: '/proprietor/settings', label: 'Settings', icon: '⚙' },
];
const MY_TEACHING_ITEM = { to: '/teaching', label: 'My Teaching', icon: '🍎' };
export default function ProprietorDashboard() {
  const { hasRole } = useAuth();
  const navItems = hasRole('teacher') ? [...BASE_NAV_ITEMS, MY_TEACHING_ITEM] : BASE_NAV_ITEMS;
  return <DashboardLayout navItems={navItems}><Outlet /></DashboardLayout>;
}
