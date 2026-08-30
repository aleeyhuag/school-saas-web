import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ThemeSwitcher from './ThemeSwitcher';
import OfflineIndicator from './OfflineIndicator';
import BranchSwitcher from './BranchSwitcher';
import * as announcementsApi from '../api/announcements';
import { BRAND } from '../config/brand';

/**
 * The shell every dashboard renders inside: a sidebar with nav links
 * specific to the current role, a topbar with the school name / user
 * menu, and a content area. `navItems` is passed in per-dashboard
 * since each role sees different sections — this component only
 * handles the chrome, not the role logic.
 *
 * Responsive pattern: below the `md` breakpoint the sidebar becomes
 * an off-canvas drawer (fixed, slides in from the left, dark backdrop
 * behind it) opened via a hamburger button in the topbar, instead of
 * always eating ~40% of a phone's width. At `md` and above it's back
 * to a normal static sidebar and the hamburger disappears.
 */
export default function DashboardLayout({ navItems, children }) {
  const { user, school, roles, logout, hasRole } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Shares its query key with AnnouncementsPage — reading an item
  // there invalidates this too, so the badge clears itself without
  // needing its own separate "did they read it" plumbing.
  const { data: announcementsData } = useQuery({
    queryKey: ['announcements'],
    queryFn: announcementsApi.getAnnouncements,
    refetchInterval: 60_000,
    enabled: !!school,
  });
  const unreadAnnouncements = announcementsData?.unread_count ?? 0;

  const sidebarContent = (
    <>
      {hasRole('proprietor') ? (
        <BranchSwitcher />
      ) : (
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-display font-bold text-sm overflow-hidden shrink-0">
              {school?.logo_url ? (
                <img src={school.logo_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = BRAND.faviconPath; }} />
              ) : (
                <img src={BRAND.faviconPath} alt={`${BRAND.productName} logo`} className="w-full h-full object-contain p-1" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{school?.name ?? BRAND.productName}</p>
              <p className="text-xs text-muted capitalize">{roles[0]?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileNavOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-soft text-primary'
                  : 'text-muted hover:bg-bg hover:text-ink'
              }`
            }
          >
            {item.icon && <span className="text-base leading-none">{item.icon}</span>}
            {item.label}
            {item.to.endsWith('/announcements') && unreadAnnouncements > 0 && (
              <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center">
                {unreadAnnouncements > 9 ? '9+' : unreadAnnouncements}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-border">
        <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
        <p className="text-xs text-muted truncate mb-2">{user?.email}</p>
        <button onClick={logout} className="text-xs text-muted hover:text-danger transition-colors">
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Mobile backdrop — only rendered (and only intercepts clicks)
          while the drawer is open */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 bg-surface border-r border-border flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out
          ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:z-auto`}
      >
        {sidebarContent}
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="h-14 border-b border-border bg-surface flex items-center px-4 md:px-6 shrink-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-ink transition-colors md:hidden"
            aria-label="Open menu"
          >
            <span className="text-lg leading-none">☰</span>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <ThemeSwitcher />
            <OfflineIndicator />
            <NotificationBell />
          </div>
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </main>
    </div>
  );
}
