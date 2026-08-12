import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as academicApi from '../../api/academic';
import * as sessionsApi from '../../api/sessions';
import * as reportsApi from '../../api/reports';
import { readBlobError } from '../../utils/download';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Field, Select } from '../../components/ui/FormFields';

/**
 * The admin-facing results export — Proprietor, Principal, Exam
 * Officer. Produces one .xlsx workbook (one sheet per class, full
 * CA/Assignment/Exam breakdown) rather than PDFs — this is a review
 * / audit tool across many students at once, distinct from the
 * per-student report card PDFs class teachers hand out (see the
 * Marksheet page for that).
 */
export default function ResultsExportPage() {
  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: academicApi.getClasses });
  const sessionsQuery = useQuery({ queryKey: ['sessions'], queryFn: sessionsApi.getSessions });

  const [sessionId, setSessionId] = useState('');
  useEffect(() => {
    if (!sessionId && sessionsQuery.data?.length) {
      const current = sessionsQuery.data.find((s) => s.is_current);
      setSessionId(String((current ?? sessionsQuery.data[0]).id));
    }
  }, [sessionsQuery.data, sessionId]);

  const termsQuery = useQuery({
    queryKey: ['terms', sessionId],
    queryFn: () => sessionsApi.getTerms(sessionId),
    enabled: !!sessionId,
  });
  const [termId, setTermId] = useState('');
  useEffect(() => {
    if (termsQuery.data?.length && !termsQuery.data.find((t) => t.id === Number(termId))) {
      const current = termsQuery.data.find((t) => t.is_current);
      setTermId(String((current ?? termsQuery.data[0]).id));
    }
  }, [termsQuery.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const [scope, setScope] = useState('school'); // 'school' | 'class'
  const [schoolClassId, setSchoolClassId] = useState('');

  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  async function handleDownload() {
    setIsDownloading(true);
    setError(null);
    try {
      await reportsApi.downloadResultsExport({
        scope,
        schoolClassId: scope === 'class' ? schoolClassId : undefined,
        termId,
      });
    } catch (err) {
      setError(await readBlobError(err));
    } finally {
      setIsDownloading(false);
    }
  }

  const canDownload = !!termId && (scope === 'school' || !!schoolClassId);

  return (
    <>
      <PageHeader
        title="Results Export"
        description="Download subject-by-subject results as a spreadsheet, for review or record-keeping."
      />
      <div className="p-4 md:p-8">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Session">
              <Select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
                {sessionsQuery.data?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Term">
              <Select value={termId} onChange={(e) => setTermId(e.target.value)}>
                {termsQuery.data?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Scope">
              <Select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="school">Whole school (one sheet per class)</option>
                <option value="class">A single class</option>
              </Select>
            </Field>
            {scope === 'class' && (
              <Field label="Class">
                <Select value={schoolClassId} onChange={(e) => setSchoolClassId(e.target.value)}>
                  <option value="">Select a class…</option>
                  {classesQuery.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                  ))}
                </Select>
              </Field>
            )}
          </div>

          <p className="text-xs text-muted mt-2">
            {scope === 'school'
              ? "Only classes whose results have been approved by their class teacher are included — anything not yet approved is listed on a separate sheet in the workbook."
              : 'The selected class must have its results approved by the class teacher before it can be exported.'}
          </p>

          {error && <p className="text-sm text-danger mt-3">{error}</p>}

          <Button className="mt-4" onClick={handleDownload} disabled={!canDownload || isDownloading}>
            {isDownloading ? 'Preparing spreadsheet…' : '↓ Download Results (.xlsx)'}
          </Button>
        </Card>
      </div>
    </>
  );
}
