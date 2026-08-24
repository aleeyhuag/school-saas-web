import api from './client';

// ---- ID Cards (Stage 53) ----

// Two steps rather than one blob-fetch download: get a short-lived
// signed URL (authenticated call), then navigate the browser to it
// directly. Blob-URL downloads were unreliable specifically on mobile
// — a plain page navigation to a signed PDF URL is what every browser
// already handles correctly, the same pattern exports and payment
// proofs already use in this app.
export async function getStudentIdCardUrls(studentId) {
  const { data } = await api.get(`/id-cards/${studentId}/download-url`);
  return data;
}

export async function downloadStudentIdCard(studentId) {
  const data = await getStudentIdCardUrls(studentId);
  window.location.href = data.download_url;
}

// TEMPORARY Stage 55 visual editor. Opens the browser-rendered card so the
// layout can be tuned in DevTools before we translate the final coordinates
// back into the Dompdf-safe template.
export async function previewStudentIdCard(studentId) {
  // Open synchronously from the click so popup blockers do not reject the
  // new tab while the authenticated API request is in flight.
  const previewWindow = window.open('about:blank', '_blank');
  try {
    const data = await getStudentIdCardUrls(studentId);
    if (previewWindow) {
      previewWindow.location.href = data.preview_url;
    } else {
      window.location.href = data.preview_url;
    }
  } catch (error) {
    previewWindow?.close();
    throw error;
  }
}
