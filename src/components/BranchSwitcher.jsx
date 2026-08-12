import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as branchesApi from '../api/branches';
import { useAuth } from '../context/AuthContext';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Field, Input } from './ui/FormFields';

const EMPTY_FORM = { name: '', email: '', phone: '', address: '', group_name: '' };

/**
 * Only ever rendered for a Proprietor (DashboardLayout decides that)
 * — replaces the plain school-name block every other role sees with
 * a dropdown: switch to any other accessible branch, or add a new
 * one. A Proprietor with only one branch still sees this (rather
 * than the static block), so "Add a branch" is always one click away
 * without needing to have planned for multi-branch from day one.
 */
export default function BranchSwitcher() {
  const { school, accessibleSchools, switchBranch, refreshAccessibleSchools } = useAuth();
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [switching, setSwitching] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addBranchMutation = useMutation({
    mutationFn: branchesApi.addBranch,
    onSuccess: async () => {
      await refreshAccessibleSchools();
      setAddOpen(false);
      setForm(EMPTY_FORM);
      setError(null);
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not add this branch.'),
  });

  async function handleSwitch(schoolId) {
    if (schoolId === school?.id) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    try {
      await switchBranch(schoolId); // navigates away on success
    } catch {
      setSwitching(false);
    }
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 px-5 py-5 border-b border-border hover:bg-bg transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-display font-bold text-sm overflow-hidden shrink-0">
            {school?.logo_url ? (
              <img src={school.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              school?.name?.[0] ?? 'S'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink truncate">{school?.name ?? 'Platform'}</p>
            <p className="text-xs text-muted">Proprietor · {accessibleSchools.length} branch{accessibleSchools.length === 1 ? '' : 'es'}</p>
          </div>
          <span className="text-muted text-xs shrink-0">▾</span>
        </button>

        {open && (
          <div className="absolute left-3 right-3 mt-1 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            {accessibleSchools.map((b) => (
              <button
                key={b.id}
                type="button"
                disabled={switching}
                onClick={() => handleSwitch(b.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-bg transition-colors border-b border-border last:border-0 ${
                  b.id === school?.id ? 'text-primary font-medium' : 'text-ink'
                }`}
              >
                <span className="truncate">{b.name}</span>
                {b.id === school?.id && <span className="text-xs shrink-0">✓ Current</span>}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setAddOpen(true);
              }}
              className="w-full px-3 py-2.5 text-sm text-primary font-medium text-left hover:bg-bg transition-colors"
            >
              + Add a branch
            </button>
          </div>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a Branch">
        <p className="text-xs text-muted mb-4">
          This creates a fully separate branch — its own classes, staff, and students, set up from
          scratch. You'll be able to switch to it from this same menu.
        </p>
        {error && <p className="text-sm text-danger mb-3">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (addBranchMutation.isPending) return;
            setError(null);
            addBranchMutation.mutate(form);
          }}
        >
          <Field label="Branch name">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Bright Future Academy — Abuja"
            />
          </Field>
          <Field label="Group name (optional)">
            <Input
              value={form.group_name}
              onChange={(e) => setForm({ ...form, group_name: e.target.value })}
              placeholder="Bright Future Group"
            />
          </Field>
          <Field label="Email (optional)">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone (optional)">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Address (optional)">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Button type="submit" className="w-full" disabled={addBranchMutation.isPending}>
            {addBranchMutation.isPending ? 'Adding…' : 'Add Branch'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
