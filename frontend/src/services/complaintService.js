/**
 * complaintService.js
 * Abstracts complaint submission logic.
 * Currently persists to localStorage.
 * Replace submitComplaint() body with a real API call in production:
 *   POST /complaints  →  { complaintId, ... }
 */

const COMPLAINTS_KEY = 'local_complaints';

/**
 * Generate the next sequential complaint ID (e.g. CMP-0001).
 */
const generateComplaintId = () => {
  try {
    const existing = JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || '[]');
    const next = existing.length + 1;
    return `CMP-${String(next).padStart(4, '0')}`;
  } catch {
    return 'CMP-0001';
  }
};

/**
 * Submit a new complaint.
 * @param {Object} payload  - Full complaint object (citizen, location, details)
 * @returns {Promise<Object>} saved complaint record with complaintId & createdAt
 */
export const submitComplaint = async (payload) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 700));

  const complaintId = generateComplaintId();
  const record = {
    complaintId,
    ...payload,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  try {
    const existing = JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || '[]');
    existing.push(record);
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Could not persist complaint to localStorage:', e);
    throw new Error('Failed to store complaint locally.');
  }

  return record;
};

/**
 * Retrieve all locally stored complaints.
 * @returns {Promise<Array>}
 */
export const getLocalComplaints = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  try {
    return JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || '[]');
  } catch {
    return [];
  }
};
