import { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as idCardsApi from '../../api/idCards';
import Button from '../../components/ui/Button';
import { CardBack, CardFront, safe } from './IdCardFaces';
import './IdCardPreviewPage.css';

/**
 * Prints many students' ID cards in a single browser print job instead
 * of one at a time. Reuses the exact same CardFront/CardBack layout and
 * the exact same @media print rules as IdCardPreviewPage — each
 * student's front and back are just two more `.id-card-print-page`
 * blocks in the DOM, and the existing CSS already handles page-break
 * correctly for any number of them (`:last-child` avoids a trailing
 * blank page regardless of count).
 *
 * On screen this deliberately shows a compact list rather than full-size
 * cards for every student — rendering, say, 60 students × 2 full card
 * renders (with real photo/logo/signature <img> tags) just for an on-
 * screen preview is unnecessary weight when the point is to print. The
 * full-size cards only exist in the hidden `.id-card-print-page` blocks
 * that `@media print` reveals.
 */
export default function IdCardBulkPrintPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const studentIds = (searchParams.get('ids') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number);

  const query = useQuery({
    queryKey: ['id-card-bulk-preview', studentIds.join(',')],
    queryFn: () => idCardsApi.getBulkIdCardPreviews(studentIds),
    enabled: studentIds.length > 0,
  });

  if (studentIds.length === 0) {
    return (
      <div className="id-card-preview-error" style={{ margin: 28 }}>
        No students were selected. Go back to ID Cards and select at least one student.
      </div>
    );
  }

  if (query.isLoading) return <div className="id-card-preview-loading">Loading {studentIds.length} ID card{studentIds.length === 1 ? '' : 's'}…</div>;
  if (query.isError) return <div className="id-card-preview-error">Could not load these ID cards. Please return to ID Cards and try again.</div>;

  const cards = query.data ?? [];

  return (
    <div className="id-card-browser id-card-preview-page">
      <div className="id-card-preview-toolbar">
        <h1>Bulk Print — {cards.length} ID Card{cards.length === 1 ? '' : 's'}</h1>
        <p>Printing sends {cards.length * 2} pages (front + back for each student) to your browser's print dialog in one job.</p>
        <div className="id-card-preview-actions">
          <Button type="button" onClick={() => window.print()}>Print All {cards.length} ID Cards</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Back</Button>
        </div>
      </div>

      <div className="id-card-preview-toolbar" style={{ maxWidth: 980 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '6px 18px', fontSize: 13, color: '#333' }}>
          {cards.map((card) => (
            <div key={card.student.id}>{safe(card.student.full_name)} — {safe(card.student.admission_number)}</div>
          ))}
        </div>
      </div>

      {cards.map((card) => (
        <Fragment key={card.student.id}>
          <div className="id-card-print-page"><CardFront card={card} /></div>
          <div className="id-card-print-page"><CardBack card={card} /></div>
        </Fragment>
      ))}
    </div>
  );
}
