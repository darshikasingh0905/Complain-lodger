/**
 * complaintService.js
 * Single source of truth for all complaint data operations.
 * Persists to localStorage under COMPLAINTS_KEY.
 *
 * Flat record schema (each stored complaint):
 * {
 *   id          : "CMP-0001"
 *   citizenId   : aadhaar string  (used for per-citizen filtering)
 *   citizenName : string
 *   citizenPhone: string
 *   citizenEmail: string
 *   citizenAddress: string
 *   title       : string
 *   description : string
 *   area        : string
 *   landmark    : string | null
 *   pinCode     : string | null
 *   department  : string
 *   priority    : string
 *   status      : "Pending" | "Submitted" | "Assigned" | "In Progress" | "Resolved"
 *   imagePreview: data-URL string | null  (first image, display only)
 *   createdAt   : ISO string
 *   updatedAt   : ISO string
 * }
 *
 * To connect to a real backend, replace each function body with the
 * corresponding API call. The signatures and return shapes stay the same.
 */

const COMPLAINTS_KEY = 'complaints';

// ─── ID Generator ─────────────────────────────────────────────────────────────
const generateId = () => {
  try {
    const existing = JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || '[]');
    const next = existing.length + 1;
    return `CMP-${String(next).padStart(4, '0')}`;
  } catch {
    return `CMP-${Date.now()}`;
  }
};

// ─── Raw Storage Helpers (synchronous, internal use only) ─────────────────────
const _readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || '[]');
  } catch {
    return [];
  }
};

const _writeAll = (records) => {
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(records));
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get all complaints.
 * @returns {Promise<Array>}
 */
export const getComplaints = async () => {
  await new Promise((r) => setTimeout(r, 60));
  return _readAll();
};

/**
 * Get a single complaint by its ID string (e.g. "CMP-0001").
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export const getComplaintById = async (id) => {
  await new Promise((r) => setTimeout(r, 60));
  return _readAll().find((c) => c.id === id) || null;
};

/**
 * Get all complaints belonging to a specific citizen (by Aadhaar number).
 * @param {string} citizenId  Aadhaar number
 * @returns {Promise<Array>}
 */
export const getCitizenComplaints = async (citizenId) => {
  await new Promise((r) => setTimeout(r, 60));
  return _readAll().filter((c) => c.citizenId === citizenId);
};

/**
 * Create and persist a new complaint.
 *
 * @param {Object} payload
 *   citizen         : { name, aadhaar, mobile, email, address }
 *   complaintLocation: { area, landmark, pinCode }
 *   complaint       : { title, description, department, priority }
 *   imagePreview    : data-URL string | null
 *
 * @returns {Promise<Object>} The saved flat record
 */
export const createComplaint = async (payload) => {
  await new Promise((r) => setTimeout(r, 700));

  const { citizen, complaintLocation, complaint, imagePreview } = payload;
  const now = new Date().toISOString();

  const record = {
    id:             generateId(),
    citizenId:      citizen.aadhaar || '',
    citizenName:    citizen.name    || '',
    citizenPhone:   citizen.mobile  || '',
    citizenEmail:   citizen.email   || '',
    citizenAddress: citizen.address || '',
    title:          complaint.title,
    description:    complaint.description,
    area:           complaintLocation.area,
    landmark:       complaintLocation.landmark || null,
    pinCode:        complaintLocation.pinCode  || null,
    department:     complaint.department || 'Pending Classification',
    priority:       complaint.priority   || 'Pending',
    status:         'Submitted',
    imagePreview:   imagePreview || null,
    createdAt:      now,
    updatedAt:      now,
  };

  const existing = _readAll();
  existing.push(record);
  _writeAll(existing);

  return record;
};

/**
 * Update the status of a complaint.
 * @param {string} id
 * @param {string} newStatus
 * @returns {Promise<Object>} Updated record
 */
export const updateComplaintStatus = async (id, newStatus) => {
  await new Promise((r) => setTimeout(r, 200));

  const all = _readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error(`Complaint ${id} not found.`);

  all[idx] = { ...all[idx], status: newStatus, updatedAt: new Date().toISOString() };
  _writeAll(all);
  return all[idx];
};

/**
 * Delete a complaint by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteComplaint = async (id) => {
  await new Promise((r) => setTimeout(r, 200));
  _writeAll(_readAll().filter((c) => c.id !== id));
};

// ─── Legacy alias (backwards compat — SubmitComplaint previously called this) ─
export const submitComplaint = createComplaint;
