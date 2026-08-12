import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as academicApi from '../../api/academic';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { Field, Input, Select } from '../../components/ui/FormFields';

const EMPTY_FORM = {
  school_class_id: '',
  admission_number: '',
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  guardian_name: '',
  guardian_phone: '',
  login_email: '',
};

/**
 * Debounces a fast-changing value (search input) so we don't fire a
 * request on every keystroke — waits `delay`ms after typing stops.
 */
function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function StudentsPage() {
  const queryClient = useQueryClient();

  const [classFilter, setClassFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounced(searchInput);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [classFilter, debouncedSearch]);

  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: academicApi.getClasses });

  const studentsQuery = useQuery({
    queryKey: ['students', classFilter, debouncedSearch, page],
    queryFn: () =>
      academicApi.getStudents({
        school_class_id: classFilter || undefined,
        search: debouncedSearch || undefined,
        page,
        per_page: 25,
      }),
  });

  const students = studentsQuery.data?.data ?? [];
  const currentPage = studentsQuery.data?.current_page ?? 1;
  const lastPage = studentsQuery.data?.last_page ?? 1;
  const total = studentsQuery.data?.total ?? students.length;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  // Shown once right after creating a new student — their auto-
  // generated login email + temporary password.
  const [creationResult, setCreationResult] = useState(null);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editingStudent
        ? academicApi.updateStudent(editingStudent.id, payload)
        : academicApi.createStudent(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (!editingStudent) {
        // create response shape: { student, temporary_password, login_email }
        setCreationResult(data);
      } else {
        closeModal();
      }
    },
    onError: (err) =>
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not save student.'
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: academicApi.deleteStudent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const [loginRevealResult, setLoginRevealResult] = useState(null);

  const createLoginMutation = useMutation({
    mutationFn: academicApi.createStudentLogin,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setLoginRevealResult(data);
    },
  });

  function openCreateModal() {
    setEditingStudent(null);
    setForm({ ...EMPTY_FORM, school_class_id: classFilter || '' });
    setError(null);
    setCreationResult(null);
    setModalOpen(true);
  }

  function openEditModal(student) {
    setEditingStudent(student);
    setForm({
      school_class_id: student.school_class_id ?? '',
      admission_number: student.admission_number ?? '',
      first_name: student.first_name ?? '',
      last_name: student.last_name ?? '',
      date_of_birth: student.date_of_birth?.slice(0, 10) ?? '',
      gender: student.gender ?? '',
      guardian_name: student.guardian_name ?? '',
      guardian_phone: student.guardian_phone ?? '',
      login_email: '',
    });
    setError(null);
    setCreationResult(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingStudent(null);
    setCreationResult(null);
  }

  function handleDelete(student) {
    if (window.confirm(`Remove ${student.first_name} ${student.last_name}? This cannot be undone.`)) {
      deleteMutation.mutate(student.id);
    }
  }

  // ---- Family modal (guardians only — login is automatic now) ----
  const [familyModalStudent, setFamilyModalStudent] = useState(null);

  // ---- Bulk import ----
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <span className="font-medium text-ink">
          {row.first_name} {row.last_name}
        </span>
      ),
    },
    { key: 'admission_number', label: 'Admission No.' },
    {
      key: 'class',
      label: 'Class',
      render: (row) => (
        <Badge tone="primary">
          {row.school_class?.name} {row.school_class?.arm}
        </Badge>
      ),
    },
    {
      key: 'login',
      label: 'Login',
      render: (row) =>
        row.user ? (
          <span className="text-xs text-muted">{row.user.email}</span>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={createLoginMutation.isPending}
            onClick={() => createLoginMutation.mutate(row.id)}
          >
            Create login
          </Button>
        ),
    },
    {
      key: 'guardians',
      label: 'Guardians',
      render: (row) =>
        row.guardians?.length > 0 ? (
          <Badge tone="success">{row.guardians.length} linked</Badge>
        ) : (
          <span className="text-muted text-xs">None</span>
        ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setFamilyModalStudent(row)}>
            Guardians
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(row)}>
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Students"
        description="Manage every student enrolled across your classes."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setBulkImportOpen(true)}>
              Bulk import
            </Button>
            <Button onClick={openCreateModal}>+ Add student</Button>
          </div>
        }
      />

      <div className="p-4 md:p-8">
        <Card>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input
              className="flex-1"
              placeholder="Search by name or admission number…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Select className="sm:w-56" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="">All classes</option>
              {classesQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.arm}
                </option>
              ))}
            </Select>
          </div>

          <DataTable
            columns={columns}
            rows={students}
            emptyMessage={
              studentsQuery.isLoading
                ? 'Loading…'
                : debouncedSearch
                ? `No students match "${debouncedSearch}".`
                : 'No students yet — add your first one, or set up a class first.'
            }
          />

          {lastPage > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted">
                Page {currentPage} of {lastPage} — {total} student(s) total
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="secondary" size="sm" disabled={currentPage >= lastPage} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingStudent ? 'Edit student' : 'Add a student'}>
        {creationResult ? (
          <div>
            <p className="text-sm text-ink mb-3">
              <strong>
                {creationResult.student.first_name} {creationResult.student.last_name}
              </strong>{' '}
              added — their login was created automatically.
            </p>
            <div className="bg-warning-soft border border-warning/20 rounded-lg p-3 mb-4 space-y-1">
              <p className="text-xs text-muted">Login email:</p>
              <p className="font-mono text-sm text-ink">{creationResult.login_email}</p>
              <p className="text-xs text-muted mt-2">Temporary password (share this securely):</p>
              <p className="font-mono text-sm text-ink">{creationResult.temporary_password}</p>
            </div>
            <Button className="w-full" onClick={closeModal}>
              Done
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate({
                ...form,
                school_class_id: Number(form.school_class_id),
                date_of_birth: form.date_of_birth || null,
                gender: form.gender || null,
                login_email: form.login_email || undefined,
              });
            }}
          >
            {error && <p className="text-sm text-danger mb-4">{error}</p>}

            <Field label="Class">
              <Select
                required
                value={form.school_class_id}
                onChange={(e) => setForm({ ...form, school_class_id: e.target.value })}
              >
                <option value="" disabled>Select a class</option>
                {classesQuery.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                ))}
              </Select>
            </Field>

            <Field label="Admission number">
              <Input
                required
                value={form.admission_number}
                onChange={(e) => setForm({ ...form, admission_number: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <Input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </Field>
              <Field label="Last name">
                <Input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of birth (optional)">
                <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              </Field>
              <Field label="Gender (optional)">
                <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </Select>
              </Field>
            </div>

            {!editingStudent && (
              <Field
                label="Login email (optional)"
                hint="A login is created automatically either way — leave blank to auto-generate one from the admission number."
              >
                <Input
                  type="email"
                  value={form.login_email}
                  onChange={(e) => setForm({ ...form, login_email: e.target.value })}
                />
              </Field>
            )}

            <Field
              label="Emergency contact name (optional)"
              hint="Just a name/number for urgent contact — not a portal login. Use the Guardians button after saving to give a parent actual app access."
            >
              <Input value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} />
            </Field>

            <Field label="Emergency contact phone (optional)">
              <Input value={form.guardian_phone} onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })} />
            </Field>

            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editingStudent ? 'Save changes' : 'Save student'}
            </Button>
          </form>
        )}
      </Modal>

      <GuardiansModal student={familyModalStudent} onClose={() => setFamilyModalStudent(null)} />
      <BulkImportModal open={bulkImportOpen} onClose={() => setBulkImportOpen(false)} />

      <Modal open={!!loginRevealResult} onClose={() => setLoginRevealResult(null)} title="Login created">
        {loginRevealResult && (
          <div>
            <p className="text-sm text-ink mb-3">Login created successfully.</p>
            <div className="bg-warning-soft border border-warning/20 rounded-lg p-3 mb-4 space-y-1">
              <p className="text-xs text-muted">Login email:</p>
              <p className="font-mono text-sm text-ink">{loginRevealResult.login_email}</p>
              <p className="text-xs text-muted mt-2">Temporary password (share this securely):</p>
              <p className="font-mono text-sm text-ink">{loginRevealResult.temporary_password}</p>
            </div>
            <Button className="w-full" onClick={() => setLoginRevealResult(null)}>Done</Button>
          </div>
        )}
      </Modal>
    </>
  );
}

/**
 * Links parent/guardian ACCOUNTS to a student — search-driven (not
 * "list every parent in the school"), with an inline invite shortcut.
 * The student's OWN login is no longer handled here — it's automatic
 * at creation (see the main form above) or via the "Create login"
 * button directly in the table for older records.
 */
function GuardiansModal({ student, onClose }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  const [guardianSearch, setGuardianSearch] = useState('');
  const debouncedGuardianSearch = useDebounced(guardianSearch, 300);
  const guardianResultsQuery = useQuery({
    queryKey: ['staff-search', 'parent', debouncedGuardianSearch],
    queryFn: () => academicApi.getStaff({ role: 'parent', search: debouncedGuardianSearch }),
    enabled: debouncedGuardianSearch.length >= 2,
  });

  const [selectedGuardians, setSelectedGuardians] = useState([]);
  useEffect(() => {
    if (student) setSelectedGuardians(student.guardians ?? []);
  }, [student]);

  const [showInviteParent, setShowInviteParent] = useState(false);
  const [inviteParentForm, setInviteParentForm] = useState({ name: '', email: '' });

  const inviteParentMutation = useMutation({
    mutationFn: academicApi.inviteUser,
    onSuccess: (data) => {
      setSelectedGuardians((prev) => [...prev, data.user]);
      setShowInviteParent(false);
      setInviteParentForm({ name: '', email: '' });
      setGuardianSearch('');
    },
    onError: (err) =>
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not invite this parent.'
      ),
  });

  const saveGuardiansMutation = useMutation({
    mutationFn: () => academicApi.syncStudentGuardians(student.id, selectedGuardians.map((g) => g.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not update guardians.'),
  });

  function addGuardian(person) {
    if (!selectedGuardians.some((g) => g.id === person.id)) {
      setSelectedGuardians((prev) => [...prev, person]);
    }
    setGuardianSearch('');
  }

  function removeGuardian(id) {
    setSelectedGuardians((prev) => prev.filter((g) => g.id !== id));
  }

  if (!student) return null;

  return (
    <Modal open={!!student} onClose={onClose} title={`Guardians — ${student.first_name} ${student.last_name}`}>
      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <p className="text-xs text-muted mb-3">
        Parent accounts who can view this child's attendance, results, and fees.
      </p>

      {selectedGuardians.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {selectedGuardians.map((g) => (
            <Badge key={g.id} tone="success">
              {g.name}
              <button onClick={() => removeGuardian(g.id)} className="ml-1.5 hover:text-danger" title="Remove">
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      {!showInviteParent ? (
        <>
          <Input
            placeholder="Search invited parents by name or email…"
            value={guardianSearch}
            onChange={(e) => setGuardianSearch(e.target.value)}
          />
          {guardianSearch.length >= 2 && (
            <div className="mt-2 border border-border rounded-lg divide-y divide-border max-h-40 overflow-y-auto">
              {guardianResultsQuery.data?.length ? (
                guardianResultsQuery.data.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addGuardian(p)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-bg flex justify-between items-center"
                  >
                    <span>{p.name} <span className="text-muted text-xs">({p.email})</span></span>
                    <span className="text-xs text-primary">+ Add</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-muted">
                  {guardianResultsQuery.isLoading ? 'Searching…' : 'No matching invited parents.'}
                </p>
              )}
            </div>
          )}
          <button onClick={() => setShowInviteParent(true)} className="text-xs text-primary hover:underline mt-2">
            + Invite a new parent instead
          </button>
        </>
      ) : (
        <div className="border border-border rounded-lg p-3">
          <Field label="Parent's name">
            <Input value={inviteParentForm.name} onChange={(e) => setInviteParentForm({ ...inviteParentForm, name: e.target.value })} />
          </Field>
          <Field label="Parent's email">
            <Input type="email" value={inviteParentForm.email} onChange={(e) => setInviteParentForm({ ...inviteParentForm, email: e.target.value })} />
          </Field>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={inviteParentMutation.isPending}
              onClick={() => inviteParentMutation.mutate({ ...inviteParentForm, role: 'parent' })}
            >
              {inviteParentMutation.isPending ? 'Inviting…' : 'Invite & add'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowInviteParent(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Button
        size="sm"
        className="mt-4"
        disabled={saveGuardiansMutation.isPending}
        onClick={() => saveGuardiansMutation.mutate()}
      >
        {saveGuardiansMutation.isPending ? 'Saving…' : 'Save guardians'}
      </Button>
    </Modal>
  );
}

const CSV_TEMPLATE =
  'admission_number,first_name,last_name,class_name,class_arm,date_of_birth,gender,guardian_name,guardian_phone,login_email\n' +
  'BFA-2026-001,Amina,Bello,JSS 1,A,,female,,,\n';

function downloadTextFile(filename, content, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Bulk-import students from a CSV — the practical answer to
 * onboarding a real school that already has a full class list in a
 * spreadsheet, rather than adding students one at a time.
 */
function BulkImportModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const importMutation = useMutation({
    mutationFn: academicApi.bulkImportStudents,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setResult(data);
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not import this file.'),
  });

  function handleClose() {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  }

  function downloadCredentials() {
    const header = 'name,admission_number,login_email,temporary_password\n';
    const rows = result.created
      .map((s) => `${s.name},${s.admission_number},${s.login_email},${s.temporary_password}`)
      .join('\n');
    downloadTextFile('new-student-logins.csv', header + rows);
  }

  return (
    <Modal open={open} onClose={handleClose} title="Bulk import students">
      {result ? (
        <div>
          <p className="text-sm text-ink mb-3">{result.message}</p>

          {result.created.length > 0 && (
            <div className="bg-success-soft border border-success/20 rounded-lg p-3 mb-3">
              <p className="text-sm text-ink mb-2">
                {result.created.length} student(s) created with auto-generated logins.
              </p>
              <Button size="sm" onClick={downloadCredentials}>
                Download login credentials (CSV)
              </Button>
            </div>
          )}

          {result.skipped.length > 0 && (
            <div className="bg-warning-soft border border-warning/20 rounded-lg p-3 mb-3 max-h-40 overflow-y-auto">
              <p className="text-sm text-ink mb-2">{result.skipped.length} row(s) skipped:</p>
              {result.skipped.map((s, i) => (
                <p key={i} className="text-xs text-muted">Row {s.row}: {s.reason}</p>
              ))}
            </div>
          )}

          <Button className="w-full" onClick={handleClose}>Done</Button>
        </div>
      ) : (
        <div>
          <p className="text-xs text-muted mb-3">
            Upload a CSV with columns: <code className="text-ink">admission_number, first_name,
            last_name, class_name, class_arm, date_of_birth, gender, guardian_name,
            guardian_phone, login_email</code>. Only the first four are required — everything
            else can be left blank. Each row gets a student record AND an automatic login, exactly
            like adding one manually.
          </p>
          <button
            onClick={() => downloadTextFile('student-import-template.csv', CSV_TEMPLATE)}
            className="text-xs text-primary hover:underline mb-4 block"
          >
            Download a template to start from
          </button>

          {error && <p className="text-sm text-danger mb-4">{error}</p>}

          <Field label="CSV file">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </Field>

          <Button
            className="w-full"
            disabled={!file || importMutation.isPending}
            onClick={() => importMutation.mutate(file)}
          >
            {importMutation.isPending ? 'Importing…' : 'Import students'}
          </Button>
        </div>
      )}
    </Modal>
  );
}
