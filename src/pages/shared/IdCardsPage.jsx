import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as academicApi from '../../api/academic';
import * as exportsApi from '../../api/exports';
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
  const [scope, setScope] = useState(''); // '' = whole school
  const [format, setFormat] = useState('zip');

  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: academicApi.getClasses });
  const exportFlow = useExportPolling(() => exportsApi.requestIdCards(format, scope || null));

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
                  <option key={c.id} value={c.id}>{c.full_name}</option>
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

        <Card title="How the QR code works">
          <p className="text-sm text-muted">
            Each card has a QR code that anyone can scan — no app or login
            needed — to confirm the card is genuine. It shows only the
            student's name, photo, class, and school; nothing else is
            attached to the code itself.
          </p>
        </Card>
      </div>
    </>
  );
}
