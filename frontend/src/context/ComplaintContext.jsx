import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  getComplaints,
  createComplaint,
  updateComplaintStatus,
  deleteComplaint,
} from '../services/complaintService';

// ─── Context ──────────────────────────────────────────────────────────────────
const ComplaintContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ComplaintProvider = ({ children }) => {
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  // Load all complaints from localStorage on mount
  useEffect(() => {
    getComplaints()
      .then(setComplaints)
      .finally(() => setLoadingComplaints(false));
  }, []);

  /**
   * Add a new complaint.
   * Saves to localStorage and immediately updates React state.
   *
   * @param {Object} payload  Same shape as createComplaint() expects
   * @returns {Promise<Object>}  The saved flat record
   */
  const addComplaint = useCallback(async (payload) => {
    const record = await createComplaint(payload);
    setComplaints((prev) => [...prev, record]);
    return record;
  }, []);

  /**
   * Update status on a single complaint.
   * Saves to localStorage and immediately updates React state.
   *
   * @param {string} id
   * @param {string} newStatus
   * @returns {Promise<Object>}  Updated record
   */
  const updateStatus = useCallback(async (id, newStatus) => {
    const updated = await updateComplaintStatus(id, newStatus);
    setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  /**
   * Remove a complaint.
   * @param {string} id
   */
  const removeComplaint = useCallback(async (id) => {
    await deleteComplaint(id);
    setComplaints((prev) => prev.filter((c) => c.id !== id));
  }, []);

  /**
   * Force re-read all complaints from localStorage.
   * Useful after importing data from an external source.
   */
  const refreshComplaints = useCallback(async () => {
    const all = await getComplaints();
    setComplaints(all);
  }, []);

  const value = {
    complaints,
    loadingComplaints,
    addComplaint,
    updateStatus,
    removeComplaint,
    refreshComplaints,
  };

  return (
    <ComplaintContext.Provider value={value}>
      {children}
    </ComplaintContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useComplaints = () => {
  const ctx = useContext(ComplaintContext);
  if (!ctx) {
    throw new Error('useComplaints must be used inside <ComplaintProvider>');
  }
  return ctx;
};

export default ComplaintContext;
