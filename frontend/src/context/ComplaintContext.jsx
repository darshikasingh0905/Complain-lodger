import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  getComplaints,
  createComplaint,
  updateComplaintStatus,
  confirmResolution as confirmResolutionApi,
  classifyComplaintAI,
  auditEvidenceAI,
  checkApiOnline,
} from "../services/complaintService";
import useAuth from "../hooks/useAuth";

// ─── Context ──────────────────────────────────────────────────────────────────
const ComplaintContext = createContext(null);

const sameId = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ComplaintProvider = ({ children }) => {
  const { userData, userRole } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [apiOnline, setApiOnline] = useState(null);

  const load = useCallback(async () => {
    // Scope for department admins — the backend filters records server-side.
    const adminScope =
      userRole === "admin" && userData?.adminRole === "department_admin"
        ? { role: "department_admin", department: userData?.department }
        : {};
    const online = await checkApiOnline();
    setApiOnline(online);
    const all = await getComplaints(adminScope);
    setComplaints(all);
  }, [userRole, userData]);

  // (Re)load whenever the signed-in identity changes
  useEffect(() => {
    setLoadingComplaints(true);
    load().finally(() => setLoadingComplaints(false));
  }, [load]);

  const replaceRecord = (updated) =>
    setComplaints((prev) => prev.map((c) => (sameId(c.id, updated.id) ? updated : c)));

  /** Add a new complaint (multipart upload when the API is online). */
  const addComplaint = useCallback(async (payload) => {
    const record = await createComplaint(payload);
    setComplaints((prev) => [record, ...prev]);
    return record;
  }, []);

  /** Update status on a single complaint. */
  const updateStatus = useCallback(async (id, newStatus) => {
    const updated = await updateComplaintStatus(id, newStatus);
    replaceRecord(updated);
    return updated;
  }, []);

  /** Citizen confirms resolution with a rating + optional feedback → Closed. */
  const confirmResolution = useCallback(async (id, rating, feedback) => {
    const updated = await confirmResolutionApi(id, rating, feedback);
    replaceRecord(updated);
    return updated;
  }, []);

  /** Re-run AI classification. */
  const reclassifyComplaint = useCallback(async (id) => {
    const updated = await classifyComplaintAI(id);
    replaceRecord(updated);
    return updated;
  }, []);

  /** Run vision AI evidence audit. */
  const auditEvidence = useCallback(async (id) => {
    const updated = await auditEvidenceAI(id);
    replaceRecord(updated);
    return updated;
  }, []);

  /** Force re-fetch of all complaints. */
  const refreshComplaints = useCallback(async () => {
    await load();
  }, [load]);

  const value = {
    complaints,
    loadingComplaints,
    apiOnline,
    addComplaint,
    updateStatus,
    confirmResolution,
    reclassifyComplaint,
    auditEvidence,
    refreshComplaints,
  };

  return <ComplaintContext.Provider value={value}>{children}</ComplaintContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useComplaints = () => {
  const ctx = useContext(ComplaintContext);
  if (!ctx) {
    throw new Error("useComplaints must be used inside <ComplaintProvider>");
  }
  return ctx;
};

export default ComplaintContext;
