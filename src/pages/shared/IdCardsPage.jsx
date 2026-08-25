import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as academicApi from '../../api/academic';
import * as exportsApi from '../../api/exports';
import * as schoolApi from '../../api/school';
import { useExportPolling } from '../../hooks/useExportPolling';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/FormFields';

/**
 * Stage 53 — bulk ID card generation. Shared between Proprietor and
 * Principal (identical page, mounted at each role's own route in
 * App.jsx) since both can manage the whole school's ID cards.
 *
 * Two independent choices: WHO (a specific class, or the whole
 * school) and WHAT SHAPE (a ZIP of individual CR80 PDFs for a card
 * printer, or a single print-sheet PDF with several cards per A4 page
 * for printing on regular paper and cutting out). Both go through the
 * same queued-export flow report cards and backups already use.
 */
export default function IdCardsPage() {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState(''); // '' = whole school
  const [format, setFormat] = useState('zip');
  const [signatureError, setSignatureError] = useState(null);
  const signatureInputRef = useRef(null);

  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: academicApi.getClasses });
  const schoolQuery = useQuery({ queryKey: ['school-profile'], queryFn: schoolApi.getSchoolProfile });
  const exportFlow = useExportPolling(() => exportsApi.requestIdCards(format, scope || null));

  const signatureMutation = useMutation({
    mutationFn: schoolApi.uploadPrincipalSignature,
    onSuccess: () => {
      setSignatureError(null);
      queryClient.invalidateQueries({ queryKey: ['school-profile'] });
    },
    onError: (err) => setSignatureError(err.response?.data?.errors?.signature?.[0] ?? err.response?.data?.message ?? 'Could not upload this signature.'),
  });

  function handleSignatureChange(e) {
    const file = e.target.files?.[0];
    if (file) signatureMutation.mutate(file);
    // Allow selecting the same file again after a failed/replaced upload.
    e.target.value = '';
  }

  function statusMessage() {
    switch (exportFlow.status) {
      case 'requesting': return 'Requesting…';
      case 'queued': return 'Queued — this can take a few minutes to start.';
      case 'processing': return 'Building ID cards…';
      case 'completed': return 'Your ID cards are ready.';
      case 'failed': return exportFlow.errorMessage ?? 'Could not build these ID cards.';
      default: return null;
    }
  }

  return (
    <>
      <PageHeader title="ID Cards" description="Generate student ID cards with a photo and a scannable verification QR code." />
      <div className="p-4 md:p-8 max-w-2xl space-y-5">
        <Card title="Generate ID cards">
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Only students marked active are included. A student without
              a photo yet still gets a card — add their photo from the
              Students page first if you'd rather not print a blank spot.
            </p>

            <div>
              <label className="text-xs font-medium text-muted block mb-1">Class</label>
              <Select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="">Whole school</option>
                {(classesQuery.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted block mb-1">Format</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="format" checked={format === 'zip'} onChange={() => setFormat('zip')} />
                  Individual PDFs (ZIP) — for a card printer
                </label>
              </div>
              <div className="flex gap-3 mt-1.5">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="format" checked={format === 'print_sheet'} onChange={() => setFormat('print_sheet')} />
                  Print sheet (one PDF, several cards per page) — for regular paper
                </label>
              </div>
            </div>

            {statusMessage() && (
              <p className={`text-sm rounded-lg px-3 py-2 ${exportFlow.status === 'completed' ? 'text-success bg-success-soft' : exportFlow.status === 'failed' ? 'text-danger bg-danger-soft' : 'text-ink bg-primary-soft'}`}>
                {statusMessage()}
              </p>
            )}

            {exportFlow.status === 'completed' ? (
              <div className="flex gap-3">
                <Button type="button" onClick={exportFlow.openDownload}>Download</Button>
                <Button type="button" variant="secondary" onClick={exportFlow.reset}>Generate another batch</Button>
              </div>
            ) : (
              <Button type="button" disabled={exportFlow.isBusy} onClick={() => exportFlow.request()}>
                {exportFlow.isBusy ? 'Preparing…' : 'Generate ID cards'}
              </Button>
            )}
          </div>
        </Card>

        <Card title="Principal's signature">
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Printed on the front of every card. If none is uploaded, cards
              print with a blank line for a signature to be added by hand
              instead.
            </p>
            {signatureError && <p className="text-sm text-danger">{signatureError}</p>}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-40 h-20 rounded-lg border border-border bg-bg flex items-center justify-center overflow-hidden shrink-0">
                {schoolQuery.data?.principal_signature_url ? (
                  <img src={schoolQuery.data.principal_signature_url} alt="Current principal signature" className="max-w-full max-h-full object-contain" />
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
                <p className="text-xs text-muted">JPEG, PNG, or WebP, up to 1MB. A scan on a plain background works best.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="How the QR code works">
          <p className="text-sm text-muted">
            Every card's back has a QR code anyone can scan — no app or login
            needed — to confirm the card is genuine. It shows only the
            student's name, photo, class, and school; nothing else is
            attached to the code itself.
          </p>
        </Card>
      </div>
    </>
  );
}
