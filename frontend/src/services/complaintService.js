// ─────────────────────────────────────────────────────────────────────────────
// Complaint service — API-first with offline fallback.
//
// Primary path:   FastAPI backend  (VITE_API_URL, default http://localhost:8000/api)
// Fallback path:  localStorage simulation (localComplaintStore.js), used only
//                 when the backend is unreachable so the demo never breaks.
// ─────────────────────────────────────────────────────────────────────────────
import axios from "axios";
import {
  localGetComplaints,
  localCreateComplaint,
  localUpdateStatus,
  localConfirmResolution,
  localClassify,
  localAuditEvidence,
} from "./localComplaintStore";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");

const http = axios.create({ baseURL: API_URL, timeout: 20000 });

// ─── Online / offline detection ───────────────────────────────────────────────

let apiOnline = null; // null = unknown, true/false = probed

/** Probe backend health once; cached for the session. */
export const checkApiOnline = async () => {
  if (apiOnline !== null) return apiOnline;
  try {
    const res = await axios.get(`${API_URL}/health`, { timeout: 3000 });
    apiOnline = res.data?.database === "connected";
  } catch {
    apiOnline = false;
  }
  return apiOnline;
};

export const isApiOnline = () => apiOnline === true;

/** Extract the numeric backend id from "CMP-0004" / "4" / 4. */
export const numericIdOf = (id) => parseInt(String(id).replace(/\D/g, ""), 10);

const apiError = (err, fallbackMsg) =>
  new Error(err?.response?.data?.detail || err?.message || fallbackMsg);

// ─── Normalization: backend record → UI shape ─────────────────────────────────

const toDisplayId = (n) => `CMP-${String(n).padStart(4, "0")}`;

export const normalizeComplaint = (c) => ({
  id: toDisplayId(c.id),
  numericId: c.id,
  citizenId: c.citizen_phone || "",
  citizenName: c.citizen_name || "Anonymous",
  citizenPhone: c.citizen_phone || "",
  title: c.title || (c.description || "").slice(0, 60),
  description: c.description || "",
  area: c.address || "",
  address: c.address || "",
  landmark: null,
  pinCode: null,
  latitude: c.latitude,
  longitude: c.longitude,
  department: c.department || "Other",
  category: c.category || "General",
  priority: c.priorityLevel || c.priority || "Medium",
  ai_severity: c.ai_severity,
  ai_confidence: c.ai_confidence,
  ai_reason: c.ai_reason,
  ai_keywords: c.ai_keywords,
  ai_summary: c.ai_summary,
  priorityScore: c.priorityScore ?? 0,
  priorityLevel: c.priorityLevel || c.priority || "Medium",
  priorityBreakdown: c.priorityBreakdown || {},
  priorityReason: c.ai_reason,
  is_escalated: !!c.is_escalated,
  rating: c.rating ?? null,
  feedback: c.feedback ?? null,
  assigned_officer: c.assigned_officer || null,
  evidence_verdict: c.evidence_verdict || null,
  evidence_reason: c.evidence_reason || null,
  evidence_confidence: c.evidence_confidence ?? null,
  status: c.status || "Submitted",
  image_url: c.image_url || null,
  imageFullUrl: c.image_url ? `${BACKEND_URL}/${c.image_url.replace(/^\//, "")}` : null,
  imagePreview: null,
  createdAt: c.created_at,
  submitted_at: c.created_at,
  updatedAt: c.updated_at,
  source: "api",
});

// ─── Complaints ───────────────────────────────────────────────────────────────

/**
 * List complaints. Pass { role: "department_admin", department } to let the
 * backend scope results to a department admin's jurisdiction.
 */
export const getComplaints = async ({ role, department } = {}) => {
  if (await checkApiOnline()) {
    try {
      const params = {};
      if (role === "department_admin" && department) {
        params.role = role;
        params.department = department;
      }
      const res = await http.get("/complaints/", { params });
      return res.data.map(normalizeComplaint);
    } catch (err) {
      console.warn("[complaints] API list failed, using local fallback:", err.message);
    }
  }
  return localGetComplaints();
};

/**
 * Submit a new complaint. API path uses multipart /complaints/submit with the
 * first evidence image; offline path stores a data-URL preview instead.
 */
export const createComplaint = async (payload) => {
  const { citizen, complaintLocation, complaint, imageFile, imagePreview, latitude, longitude } = payload;

  if (await checkApiOnline()) {
    const address = [
      complaintLocation.area,
      complaintLocation.landmark ? `Near ${complaintLocation.landmark}` : null,
      complaintLocation.pinCode || null,
    ]
      .filter(Boolean)
      .join(" • ");

    const form = new FormData();
    form.append("citizen_name", citizen.name || "");
    form.append("citizen_phone", citizen.mobile || "");
    form.append("title", complaint.title || "");
    form.append("description", complaint.description || "");
    form.append("address", address);
    if (latitude != null) form.append("latitude", latitude);
    if (longitude != null) form.append("longitude", longitude);
    if (imageFile) form.append("image", imageFile);

    try {
      const res = await http.post("/complaints/submit", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000, // classification runs inline on the backend
      });
      return normalizeComplaint(res.data);
    } catch (err) {
      throw apiError(err, "Submission failed. Please try again.");
    }
  }

  return localCreateComplaint({ citizen, complaintLocation, complaint, imagePreview, latitude, longitude });
};

export const updateComplaintStatus = async (id, newStatus) => {
  if (isApiOnline()) {
    try {
      const res = await http.patch(`/complaints/${numericIdOf(id)}/status`, { status: newStatus });
      return normalizeComplaint(res.data);
    } catch (err) {
      throw apiError(err, "Unable to update complaint status.");
    }
  }
  return localUpdateStatus(id, newStatus);
};

/** Citizen confirms a resolved complaint: rating (1-5) + feedback → Closed. */
export const confirmResolution = async (id, rating, feedback) => {
  if (isApiOnline()) {
    try {
      const res = await http.post(`/complaints/${numericIdOf(id)}/confirm-resolution`, {
        rating,
        feedback: feedback || null,
      });
      return normalizeComplaint(res.data);
    } catch (err) {
      throw apiError(err, "Unable to confirm resolution.");
    }
  }
  return localConfirmResolution(id, rating, feedback);
};

export const classifyComplaintAI = async (id) => {
  if (isApiOnline()) {
    try {
      const res = await http.post(`/complaints/${numericIdOf(id)}/classify`, null, { timeout: 60000 });
      return normalizeComplaint(res.data);
    } catch (err) {
      throw apiError(err, "AI classification failed.");
    }
  }
  return localClassify(id);
};

export const auditEvidenceAI = async (id) => {
  if (isApiOnline()) {
    try {
      const res = await http.post(`/complaints/${numericIdOf(id)}/analyze-evidence`, null, { timeout: 90000 });
      return normalizeComplaint(res.data);
    } catch (err) {
      throw apiError(err, "Evidence analysis failed.");
    }
  }
  return localAuditEvidence(id);
};

// ─── Analytics ────────────────────────────────────────────────────────────────

/**
 * Fetch trends/analytics from the backend.
 * Returns null when offline — callers compute a local approximation instead.
 */
export const getTrends = async ({ role, department } = {}) => {
  if (!(await checkApiOnline())) return null;
  try {
    const params = {};
    if (role === "department_admin" && department) {
      params.role = role;
      params.department = department;
    }
    const res = await http.get("/complaints/trends", { params });
    return res.data;
  } catch (err) {
    console.warn("[analytics] trends fetch failed:", err.message);
    return null;
  }
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const getCitizenNotifications = async (phone) => {
  if (!phone || !(await checkApiOnline())) return [];
  try {
    const res = await http.get(`/complaints/notifications/${phone}`);
    return res.data;
  } catch {
    return [];
  }
};

export const getAdminNotifications = async ({ role, department } = {}) => {
  if (!(await checkApiOnline())) return [];
  try {
    const params = {};
    if (role === "department_admin" && department) {
      params.role = role;
      params.department = department;
    }
    const res = await http.get("/complaints/admin-notifications", { params });
    return res.data;
  } catch {
    return [];
  }
};

export const markNotificationRead = async (notificationId) => {
  if (!isApiOnline()) return;
  try {
    await http.patch(`/complaints/notifications/${notificationId}/read`);
  } catch {
    /* non-fatal */
  }
};
