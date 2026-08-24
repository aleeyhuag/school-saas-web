import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import * as idCardsApi from '../../api/idCards';
import Button from '../../components/ui/Button';
import { CardBack, CardFront, safe } from './IdCardFaces';
import './IdCardPreviewPage.css';

export default function IdCardPreviewPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['id-card-preview', studentId],
    queryFn: () => idCardsApi.getStudentIdCardPreview(studentId),
    enabled: Boolean(studentId),
  });

  if (query.isLoading) return <div className="id-card-preview-loading">Loading the ID card…</div>;
  if (query.isError) return <div className="id-card-preview-error">Could not load this ID card. Please return to Students and try again.</div>;

  const card = query.data;
  if (!card) return null;

  return (
    <div className="id-card-browser id-card-preview-page">
      <div className="id-card-preview-toolbar">
        <h1>Student ID Card</h1>
        <p><strong>{safe(card.student.full_name)}</strong> — {safe(card.student.admission_number)}. This is the browser-rendered card; what you see here is what the print layout uses.</p>
        <div className="id-card-preview-actions">
          <Button type="button" onClick={() => window.print()}>Print ID Card</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Back</Button>
        </div>
      </div>

      <div className="id-card-preview-stage">
        <div className="id-card-preview-side">
          <div className="id-card-preview-label">Front</div>
          <div className="id-card-preview-card"><CardFront card={card} /></div>
        </div>
        <div className="id-card-preview-side">
          <div className="id-card-preview-label">Back</div>
          <div className="id-card-preview-card"><CardBack card={card} /></div>
        </div>
      </div>

      <div className="id-card-print-page"><CardFront card={card} /></div>
      <div className="id-card-print-page"><CardBack card={card} /></div>
    </div>
  );
}
