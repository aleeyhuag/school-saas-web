import { downloadFile } from '../utils/download';

// ---- ID Cards (Stage 53) ----

export const downloadStudentIdCard = (studentId, filename = 'id-card.pdf') =>
  downloadFile(`/id-cards/${studentId}`, { filename });
