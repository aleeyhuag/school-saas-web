import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import * as branchesApi from '../api/branches';

const AuthContext = createContext(null);

/**
 * Wraps the whole app. Holds the current user, their school, and
 * their roles — every dashboard reads from this via useAuth() rather
 * than each component fetching /auth/me independently.
 *
 * `roles` is an array because Spatie supports multiple roles per
 * user, but most components will just check the primary one, e.g.
 * `hasRole('proprietor')`.
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [roles, setRoles] = useState([]);
  // Only ever non-empty for a Proprietor with more than one branch —
  // every other role just has their single `school` above.
  const [accessibleSchools, setAccessibleSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  // On app load, if a token is already saved, restore the session by
  // asking the API who it belongs to — this is what makes "stay
  // logged in after refresh" work.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .fetchCurrentUser()
      .then((data) => {
        setUser(data.user);
        setSchool(data.school);
        setRoles(data.roles ?? []);
        setAccessibleSchools(data.accessible_schools ?? []);
      })
      .catch(() => {
        // Token was invalid/expired — the Axios interceptor already
        // handles clearing it and redirecting, nothing more to do here.
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const data = await authApi.login({ ...credentials, device_name: 'web' });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setRoles(data.roles ?? []);
    // /auth/login doesn't return `school` directly (only /auth/me does)
    // — fetch it once so context is fully populated right after login.
    const me = await authApi.fetchCurrentUser();
    setSchool(me.school);
    setAccessibleSchools(me.accessible_schools ?? []);
    return data;
  }

  /**
   * For flows that already have a token from somewhere other than
   * /auth/login — right now just self-serve school registration,
   * which returns its own token in the same request that creates the
   * account. Avoids a redundant second round-trip through /auth/login.
   */
  async function hydrateFromToken(token) {
    localStorage.setItem('token', token);
    const me = await authApi.fetchCurrentUser();
    setUser(me.user);
    setSchool(me.school);
    setRoles(me.roles ?? []);
    setAccessibleSchools(me.accessible_schools ?? []);
  }

  /**
   * Re-fetches just the branch list — used after adding a new branch.
   * Unlike switchBranch() below, the active school hasn't changed
   * here, so no cache-wipe or navigation needed, just an updated list
   * for the switcher dropdown.
   */
  async function refreshAccessibleSchools() {
    const me = await authApi.fetchCurrentUser();
    setAccessibleSchools(me.accessible_schools ?? []);
  }

  /**
   * Switches which branch a Proprietor is currently operating in.
   * This is the SAME login/token — only school_id changed server-side
   * — but virtually every piece of cached data (classes, students,
   * fees, everything) is scoped to the OLD branch, so this wipes the
   * entire query cache and does a full navigation to "/" rather than
   * trying to surgically invalidate dozens of individual query keys.
   */
  async function switchBranch(schoolId) {
    const data = await branchesApi.switchBranch(schoolId);
    setUser(data.user);
    setSchool(data.school);
    setRoles(data.roles ?? []);
    queryClient.clear();
    window.location.href = '/';
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setSchool(null);
      setRoles([]);
      setAccessibleSchools([]);
      // Critical: wipe every cached query. Without this, the NEXT
      // person to log in on this browser (a different role, a
      // different school) would briefly see the previous user's
      // cached data until each query happened to refetch — a real
      // data-leakage bug, not just a UX glitch.
      queryClient.clear();
    }
  }

  function hasRole(roleOrRoles) {
    const check = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    return roles.some((r) => check.includes(r));
  }

  return (
    <AuthContext.Provider
      value={{
        user, school, roles, accessibleSchools, loading,
        login, logout, hydrateFromToken, switchBranch, refreshAccessibleSchools, hasRole,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
