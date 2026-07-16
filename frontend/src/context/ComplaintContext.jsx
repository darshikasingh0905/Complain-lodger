import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  getComplaints,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  classifyComplaintAI,
  auditEvidenceAI,
  getNotifications,
  markNotificationAsRead,
  confirmResolution,
} from '../services/complaintService';

// ─── Context ──────────────────────────────────────────────────────────────────
const ComplaintContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ComplaintProvider = ({ children }) => {
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Load all complaints from localStorage on mount
  useEffect(() => {
    getComplaints()
      .then(setComplaints)
      .finally(() => setLoadingComplaints(false));
  }, []);

  /**
   * Fetch active notifications for a citizen phone.
   */
  const fetchNotifications = useCallback(async (phone) => {
    if (!phone) return [];
    try {
      const data = await getNotifications(phone);
      setNotifications(data);
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  }, []);

  /**
   * Mark a notification as read.
   */
  const markAsRead = useCallback(async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  }, []);

  /**
   * Confirm complaint resolution with rating/feedback
   */
  const confirmComplaintResolution = useCallback(async (id, rating, feedback) => {
    const updated = await confirmResolution(id, rating, feedback);
    setComplaints((prev) => prev.map((c) => (c.id.toLowerCase() === id.toLowerCase() ? updated : c)));
    return updated;
  }, []);

  /**
   * Add a new complaint.
   * Saves to localStorage and immediately updates React state.
   */
  const addComplaint = useCallback(async (payload) => {
    const record = await createComplaint(payload);
    setComplaints((prev) => [...prev, record]);
    return record;
  }, []);

  /**
   * Update status on a single complaint.
   */
  const updateStatus = useCallback(async (id, newStatus) => {
    const updated = await updateComplaint(id, { status: newStatus });
    setComplaints((prev) => prev.map((c) => (c.id.toLowerCase() === id.toLowerCase() ? updated : c)));
    return updated;
  }, []);

  /**
   * Update a complaint with arbitrary fields.
   */
  const updateComplaintData = useCallback(async (id, data) => {
    const updated = await updateComplaint(id, data);
    setComplaints((prev) => prev.map((c) => (c.id.toLowerCase() === id.toLowerCase() ? updated : c)));
    return updated;
  }, []);

  /**
   * Run simulated AI classification and update state.
   */
  const reclassifyComplaint = useCallback(async (id) => {
    const updated = await classifyComplaintAI(id);
    setComplaints((prev) => prev.map((c) => (c.id.toLowerCase() === id.toLowerCase() ? updated : c)));
    return updated;
  }, []);

  /**
   * Run simulated AI evidence audit and update state.
   */
  const auditEvidence = useCallback(async (id) => {
    const updated = await auditEvidenceAI(id);
    setComplaints((prev) => prev.map((c) => (c.id.toLowerCase() === id.toLowerCase() ? updated : c)));
    return updated;
  }, []);

  /**
   * Remove a complaint.
   */
  const removeComplaint = useCallback(async (id) => {
    await deleteComplaint(id);
    setComplaints((prev) => prev.filter((c) => c.id.toLowerCase() !== id.toLowerCase()));
  }, []);

  /**
   * Force re-read all complaints from localStorage.
   */
  const refreshComplaints = useCallback(async () => {
    const all = await getComplaints();
    setComplaints(all);
  }, []);

  const value = {
    complaints,
    loadingComplaints,
    notifications,
    fetchNotifications,
    markAsRead,
    confirmComplaintResolution,
    addComplaint,
    updateStatus,
    updateComplaint: updateComplaintData,
    reclassifyComplaint,
    auditEvidence,
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
