import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as academicApi from '../../api/academic';
import * as schoolApi from '../../api/school';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/FormFields';

/**
 * Browser-based student ID card management.
 *
 * Students are selected here and rendered by the dedicated browser print
 * views. The old queued PDF/ZIP bulk-download flow is intentionally not used.
 * The school's principal signature is managed here because it is printed on
 * the front of the browser-rendered ID card.
 */
export default function IdCardsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scope, setScope] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [signatureError, setSignatureError] = useState(null);
  const signatureInputRef = useRef(null);

  const classesQuery = useQuery({
    queryKey: ['classes'],
    queryFn: academicApi.getClasses,
  });

  const studentsQuery = useQuery({
    queryKey: ['id-card-students', scope, search],
    queryFn: () => academicApi.getStudents({
      school_class_id: scope || undefined,
      search: search || undefined,
    }),
  });

  const schoolQuery = useQuery({
    queryKey: ['school-profile'],
    queryFn: schoolApi.getSchoolProfile,
  });

  const signatureMutation = useMutation({
    mutationFn: schoolApi.uploadPrincipalSignature,
    onSuccess: () => {
      setSignatureError(null);
      queryClient.invalidateQueries({ queryKey: ['school-profile'] });
    },
    onError: (err) => {
      setSignatureError(
        err.response?.data?.errors?.signature?.[0]
          ?? err.response?.data?.message
          ?? 'Could not upload this signature.'
      );
    },
  });

  const students = studentsQuery.data ?? [];
  const activeStudents = students.filter((student) => student.status === 'active');
  const studentName = (student) =>
    [student.first_name, student.last_name].filter(Boolean).join(' ').trim() || 'Unnamed student';

  const allShownSelected =
    activeStudents.length > 0 && activeStudents.every((student) => selectedIds.includes(student.id));

  function toggleOne(id) {
    setSelectedIds((prev) => (
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    ));
  }

  function toggleAllShown() {
    if (allShownSelected) {
      const shownIds = new Set(activeStudents.map((student) => student.id));
      setSelectedIds((prev) => prev.filter((id) => !shownIds.has(id)));
    } else {
      setSelectedIds((prev) => (
        Array.from(new Set([...prev, ...activeStudents.map((student) => student.id)]))
      ));
    }
  }

  function printSelected() {
    if (selectedIds.length === 0) return;
    navigate(`bulk-print?ids=${selectedIds.join(',')}`);
  }

  function handleSignatureChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      setSignatureError(null);
      signatureMutation.mutate(file);
    }
    // Allow selecting the same file again after a failed/replaced upload.
    event.target.value = '';
  }

  return (
    <>
      <PageHeader
        title="ID Cards"
        description="Preview and print student ID cards directly from the browser — no PDF generator involved."
      />

      <div className="p-4 md:p-8 max-w-5xl space-y-5">
        <Card title="Print a student ID card">
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Choose a class or search for a student, then open the browser preview.
              The front and back are rendered as normal HTML/CSS and printed with
              your browser&apos;s print dialog.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Class</label>
                <Select value={scope} onChange={(e) => setScope(e.target.value)}>
                  <option value="">Whole school</option>
                  {(classesQuery.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.arm}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted block mb-1">Search</label>
                <input
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or admission number"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Students">
          {studentsQuery.isLoading ? <p className="text-sm text-muted">Loading students…</p> : null}
          {studentsQuery.isError ? <p className="text-sm text-danger">Could not load students.</p> : null}
          {!studentsQuery.isLoading && activeStudents.length === 0 ? (
            <p className="text-sm text-muted">No students found.</p>
          ) : null}

          {activeStudents.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-border mb-1">
                <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input type="checkbox" checked={allShownSelected} onChange={toggleAllShown} />
                  Select all shown ({activeStudents.length})
                </label>
                <Button
                  type="button"
                  size="sm"
                  disabled={selectedIds.length === 0}
                  onClick={printSelected}
                >
                  Print Selected ({selectedIds.length})
                </Button>
              </div>

              <div className="divide-y divide-border">
                {activeStudents.map((student) => (
                  <div key={student.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleOne(student.id)}
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{studentName(student)}</div>
                        <div className="text-xs text-muted">
                          {student.admission_number} · {student.schoolClass?.full_name ?? '—'}
                          {student.photo_url ? ' · Photo ✓' : ' · No photo'}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/principal/id-cards/${student.id}/preview`)}
                    >
                      Preview &amp; Print
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card title="Bulk printing">
          <p className="text-sm text-muted">
            Select a class from the dropdown above to filter the list to one class,
            use <strong>Select all shown</strong>, then <strong>Print Selected</strong>
            to print the whole class&apos;s ID cards (front and back) in a single
            browser print job — no PDF or ZIP download is required.
          </p>
        </Card>

        <Card title="Printing">
          <p className="text-sm text-muted">
            The print view hides all controls and prints the front and back as two
            clean pages. For a CR80 card printer, choose the printer&apos;s card-size/media
            setting and print at 100% / actual size. For regular paper, use your
            browser&apos;s A4 settings and cut the cards out.
          </p>
        </Card>

        <Card title="Principal&apos;s signature">
          <div className="space-y-3">
            <p className="text-sm text-muted">
              The principal&apos;s signature is displayed on the front of the browser-rendered
              ID card. If no signature is uploaded, the card can still be printed with
              the signature area left blank.
            </p>

            {signatureError ? (
              <p className="text-sm text-danger" role="alert">{signatureError}</p>
            ) : null}

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-40 h-20 rounded-lg border border-border bg-bg flex items-center justify-center overflow-hidden shrink-0">
                {schoolQuery.data?.principal_signature_url ? (
                  <img
                    src={schoolQuery.data.principal_signature_url}
                    alt="Current principal signature"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted">No signature uploaded</span>
                )}
              </div>

              <div className="space-y-2">
                <input
                  ref={signatureInputRef}
                  id="principal-signature-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSignatureChange}
                  className="sr-only"
                />

                <Button
                  type="button"
                  variant="secondary"
                  disabled={signatureMutation.isPending}
                  onClick={() => signatureInputRef.current?.click()}
                >
                  {signatureMutation.isPending
                    ? 'Uploading signature…'
                    : schoolQuery.data?.principal_signature_url
                      ? 'Replace signature'
                      : 'Upload signature'}
                </Button>

                <p className="text-xs text-muted">
                  {schoolQuery.data?.principal_signature_url
                    ? 'Upload a new image to replace the current signature.'
                    : 'Upload the principal’s signature to print it on every ID card.'}
                </p>
                <p className="text-xs text-muted">
                  JPEG, PNG, or WebP, up to 1MB. A scan on a plain background works best.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="How the QR code works">
          <p className="text-sm text-muted">
            Every card&apos;s back has a QR code anyone can scan — no app or login
            needed — to confirm the card is genuine. It shows only the student&apos;s
            name, photo, class, and school; nothing else is attached to the code itself.
          </p>
        </Card>
      </div>
    </>
  );
}
