import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import * as branchesApi from '../api/branches';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [roles, setRoles] = useState([]);
  const [billingLocked, setBillingLocked] = useState(false);
  const [accessibleSchools, setAccessibleSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleBillingLock = () => {
      // The API has already authenticated this request. A billing lock is
      // not a logout condition; preserve the session and let the route guard
      // move the user to the Billing page.
      setBillingLocked(true);
    };

    window.addEventListener('skulag:billing-locked', handleBillingLock);
    return () => window.removeEventListener('skulag:billing-locked', handleBillingLock);
  }, []);

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
        setBillingLocked(Boolean(data.billing_locked));
        setAccessibleSchools(data.accessible_schools ?? []);
      })
      .catch(() => {
        // Token was invalid/expired — the Axios interceptor handles clearing
        // it and redirecting. A 403 school_disabled intentionally does NOT
        // clear the token; the billing-lock event above handles that state.
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const data = await authApi.login({ ...credentials, device_name: 'web' });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setRoles(data.roles ?? []);
    setBillingLocked(Boolean(data.billing_locked));
    const me = await authApi.fetchCurrentUser();
    setSchool(me.school);
    setRoles(me.roles ?? []);
    setBillingLocked(Boolean(me.billing_locked));
    setAccessibleSchools(me.accessible_schools ?? []);
    return data;
  }

  async function hydrateFromToken(token) {
    localStorage.setItem('token', token);
    const me = await authApi.fetchCurrentUser();
    setUser(me.user);
    setSchool(me.school);
    setRoles(me.roles ?? []);
    setBillingLocked(Boolean(me.billing_locked));
    setAccessibleSchools(me.accessible_schools ?? []);
  }

  async function refreshAccessibleSchools() {
    const me = await authApi.fetchCurrentUser();
    setUser(me.user);
    setRoles(me.roles ?? []);
    setSchool(me.school);
    setBillingLocked(Boolean(me.billing_locked));
    setAccessibleSchools(me.accessible_schools ?? []);
  }

  async function refreshCurrentUser() {
    const me = await authApi.fetchCurrentUser();
    setUser(me.user);
    setRoles(me.roles ?? []);
    setSchool(me.school);
    setBillingLocked(Boolean(me.billing_locked));
    setAccessibleSchools(me.accessible_schools ?? []);
    return me;
  }

  async function switchBranch(schoolId) {
    const data = await branchesApi.switchBranch(schoolId);
    setUser(data.user);
    setSchool(data.school);
    setRoles(data.roles ?? []);
    setBillingLocked(false);
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
      setBillingLocked(false);
      setAccessibleSchools([]);
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
        user, school, roles, accessibleSchools, billingLocked, loading,
        login, logout, hydrateFromToken, switchBranch, refreshAccessibleSchools, refreshCurrentUser, hasRole,
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
