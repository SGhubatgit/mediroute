const BASE_URL = '/api';

export const analyzeSymptoms = async (data) => {
  const response = await fetch(`${BASE_URL}/analyze-symptoms/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to analyze symptoms');
  }
  return response.json();
};

export const bookAppointment = async (data) => {
  const response = await fetch(`${BASE_URL}/book-appointment/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to book appointment');
  }
  return response.json();
};

export const getSymptomSuggestions = async (query) => {
  const response = await fetch(`${BASE_URL}/symptom-suggestions/?q=${encodeURIComponent(query)}`);
  if (!response.ok) return { suggestions: [] };
  return response.json();
};

// ─── Doctor Dashboard ─────────────────────────────────────────────────────────

export const getDoctorDashboard = async (doctorId) => {
  const r = await fetch(`${BASE_URL}/doctor/${doctorId}/dashboard/`);
  if (!r.ok) throw new Error('Failed to load dashboard');
  return r.json();
};

export const getDoctorQueries = async (doctorId, status = '') => {
  const r = await fetch(`${BASE_URL}/doctor/${doctorId}/queries/${status ? `?status=${status}` : ''}`);
  if (!r.ok) throw new Error('Failed to load queries');
  return r.json();
};

export const getDoctorQueryDetail = async (doctorId, queryId) => {
  const r = await fetch(`${BASE_URL}/doctor/${doctorId}/queries/${queryId}/`);
  if (!r.ok) throw new Error('Failed to load query');
  return r.json();
};

export const doctorReply = async (doctorId, queryId, content) => {
  const r = await fetch(`${BASE_URL}/doctor/${doctorId}/queries/${queryId}/reply/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!r.ok) throw new Error('Failed to send reply');
  return r.json();
};

export const updateQueryStatus = async (doctorId, queryId, status) => {
  const r = await fetch(`${BASE_URL}/doctor/${doctorId}/queries/${queryId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!r.ok) throw new Error('Failed to update status');
  return r.json();
};

export const getDoctorAppointments = async (doctorId, date = '') => {
  const r = await fetch(`${BASE_URL}/doctor/${doctorId}/appointments/${date ? `?date=${date}` : ''}`);
  if (!r.ok) throw new Error('Failed to load appointments');
  return r.json();
};

// ─── Patient Query Submission ─────────────────────────────────────────────────

export const submitQuery = async (data) => {
  const r = await fetch(`${BASE_URL}/queries/submit/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed'); }
  return r.json();
};

export const getQueryStatus = async (queryId) => {
  const r = await fetch(`${BASE_URL}/queries/${queryId}/`);
  if (!r.ok) throw new Error('Query not found');
  return r.json();
};

export const patientReply = async (queryId, content) => {
  const r = await fetch(`${BASE_URL}/queries/${queryId}/reply/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!r.ok) throw new Error('Failed to send');
  return r.json();
};

export const getDoctors = async () => {
  const r = await fetch(`${BASE_URL}/doctors/`);
  if (!r.ok) throw new Error('Failed');
  return r.json();
};

export const createDoctor = async (data) => {
  const r = await fetch(`${BASE_URL}/doctors/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const e = await r.json();
    throw new Error(e.error || 'Failed to create doctor');
  }
  return r.json();
};

export const updateDoctorAvailability = async (doctorId, is_available) => {
  const r = await fetch(`${BASE_URL}/doctor/${doctorId}/availability/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_available }),
  });
  if (!r.ok) throw new Error('Failed to update availability');
  return r.json();
};
