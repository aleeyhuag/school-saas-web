import api from './client';

/**
 * Thin wrappers around the Stage 4 (Academic Structure) endpoints.
 * Each dashboard imports what it needs from here rather than calling
 * `api.get(...)` directly — keeps endpoint URLs in one place.
 */

// Classes
export const getClasses = () => api.get('/classes').then((r) => r.data);
export const createClass = (payload) => api.post('/classes', payload).then((r) => r.data);
export const updateClass = (id, payload) => api.put(`/classes/${id}`, payload).then((r) => r.data);
export const deleteClass = (id) => api.delete(`/classes/${id}`).then((r) => r.data);
export const syncClassSubjects = (id, subjectIds) =>
  api.post(`/classes/${id}/subjects`, { subject_ids: subjectIds }).then((r) => r.data);

// Subjects
export const getSubjects = () => api.get('/subjects').then((r) => r.data);
export const createSubject = (payload) => api.post('/subjects', payload).then((r) => r.data);
export const updateSubject = (id, payload) => api.put(`/subjects/${id}`, payload).then((r) => r.data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`).then((r) => r.data);

// Students
export const getStudents = (params) => api.get('/students', { params }).then((r) => r.data);
export const getStudent = (id) => api.get(`/students/${id}`).then((r) => r.data);
export const createStudent = (payload) => api.post('/students', payload).then((r) => r.data);
export const updateStudent = (id, payload) => api.put(`/students/${id}`, payload).then((r) => r.data);
export const deleteStudent = (id) => api.delete(`/students/${id}`).then((r) => r.data);
export const syncStudentGuardians = (studentId, userIds) =>
  api.post(`/students/${studentId}/guardians`, { user_ids: userIds }).then((r) => r.data);
export const createStudentLogin = (studentId) =>
  api.post(`/students/${studentId}/create-login`).then((r) => r.data);
export const uploadStudentPhoto = (studentId, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return api.post(`/students/${studentId}/photo`, formData).then((r) => r.data);
};

// Staff
export const getStaff = (params) => api.get('/staff', { params }).then((r) => r.data);
export const inviteUser = (payload) => api.post('/invite-user', payload).then((r) => r.data);
export const toggleStaffStatus = (userId) =>
  api.post(`/staff/${userId}/toggle-status`).then((r) => r.data);
export const resetStaffPassword = (userId) =>
  api.post(`/staff/${userId}/reset-password`).then((r) => r.data);
export const addStaffRole = (userId, role) =>
  api.post(`/staff/${userId}/add-role`, { role }).then((r) => r.data);
export const removeStaffRole = (userId, role) =>
  api.post(`/staff/${userId}/remove-role`, { role }).then((r) => r.data);

// Teacher assignments
export const getTeacherAssignments = (params) =>
  api.get('/teacher-assignments', { params }).then((r) => r.data);
export const createTeacherAssignment = (payload) =>
  api.post('/teacher-assignments', payload).then((r) => r.data);
export const deleteTeacherAssignment = (id) =>
  api.delete(`/teacher-assignments/${id}`).then((r) => r.data);

// Dashboard overview stats (Proprietor/Principal)
export const getDashboardStats = () => api.get('/dashboard-stats').then((r) => r.data);

// ---------------------------------------------------------------------------
// Bulk student import
//
// The API enrolls students one at a time (password hashing + several database
// round trips each), so a large file cannot finish inside one request: the
// app's 15-second request timeout fired while the server was still part-way
// through, which showed "Could not import this file" after only a few students
// had been created. The file is therefore sent in small batches and the results
// are merged into the same shape the API returns for a single request.
// ---------------------------------------------------------------------------
const BULK_IMPORT_BATCH_SIZE = 8;
const BULK_IMPORT_BATCH_TIMEOUT_MS = 60_000;

// Splits CSV text into raw records without breaking quoted fields that
// contain commas or line breaks. Blank lines are kept so row numbers match.
function splitCsvRecords(text) {
  const records = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      records.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current !== '') records.push(current);

  return records;
}

function importError(message) {
  // Same shape the page's onError handler already reads.
  return Object.assign(new Error(message), { response: { data: { message } } });
}

export const bulkImportStudents = async (file) => {
  const records = splitCsvRecords(await file.text());

  if (records.length === 0 || records[0].trim() === '') {
    throw importError('The CSV file is empty.');
  }

  const header = records[0];
  const rows = records
    .slice(1)
    .map((raw, i) => ({ raw, rowNumber: i + 2 })) // header is row 1
    .filter((r) => r.raw.trim() !== '');

  if (rows.length === 0) {
    throw importError('The CSV file has a header but no student rows.');
  }

  const created = [];
  const skipped = [];
  let autoGenerated = false;

  for (let start = 0; start < rows.length; start += BULK_IMPORT_BATCH_SIZE) {
    const batch = rows.slice(start, start + BULK_IMPORT_BATCH_SIZE);
    const csv = [header, ...batch.map((r) => r.raw)].join('\n');
    const formData = new FormData();
    formData.append('file', new Blob([csv], { type: 'text/csv' }), 'students.csv');

    try {
      const { data } = await api.post('/students/bulk-import', formData, {
        timeout: BULK_IMPORT_BATCH_TIMEOUT_MS,
      });
      created.push(...data.created);
      // Server row numbers are relative to this batch (header = 1); map them
      // back to the row numbers in the original file.
      data.skipped.forEach((s) =>
        skipped.push({ ...s, row: batch[s.row - 2]?.rowNumber ?? s.row })
      );
      autoGenerated = Boolean(data.auto_generated_admission_numbers);
    } catch (err) {
      // A rejected file (e.g. missing required columns) fails the same way for
      // every batch, so show that error straight away.
      if (start === 0 && err.response) throw err;

      batch.forEach((r) =>
        skipped.push({
          row: r.rowNumber,
          reason:
            'This batch did not finish (the connection timed out or the server errored). ' +
            'Check the Students list before re-importing — this row may already have been created.',
        })
      );
    }
  }

  return {
    message: `${created.length} student(s) created, ${skipped.length} skipped.`,
    created,
    skipped,
    auto_generated_admission_numbers: autoGenerated,
  };
};
