import api from './client';

// ---- ID Cards (Stage 53) ----

// Two steps rather than one blob-fetch download: get a short-lived
// signed URL (authenticated call), then navigate the browser to it
// directly. Blob-URL downloads were unreliable specifically on mobile
// — a plain page navigation to a signed PDF URL is what every browser
// already handles correctly, the same pattern exports and payment
// proofs already use in this app.
export async function downloadStudentIdCard(studentId) {
  const { data } = await api.get(`/id-cards/${studentId}/download-url`);
  window.location.href = data.download_url;
}
