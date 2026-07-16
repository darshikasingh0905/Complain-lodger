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

import { attachAuthInterceptor } from "./tokenStore";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");

const http = axios.create({ baseURL: API_URL, timeout: 20000 });
attachAuthInterceptor(http); // JWT: every API call carries the Bearer token

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
  fix_image_url: c.fix_image_url || null,
  fixImageFullUrl: c.fix_image_url ? `${BACKEND_URL}/${c.fix_image_url.replace(/^\//, "")}` : null,
  fix_verdict: c.fix_verdict || null,
  fix_reason: c.fix_reason || null,
  fix_confidence: c.fix_confidence ?? null,
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
    // Line 1: what the citizen typed. Line 2: the GPS-verified street address
    // (reverse-geocoded from the pin) for crew-level accuracy.
    const address = [
      complaintLocation.area,
      complaintLocation.gpsAddress || null,
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

/**
 * Closed-loop resolution (USP): upload the crew's AFTER photo; the backend
 * vision AI compares it with the citizen's BEFORE evidence. A NOT_FIXED
 * verdict blocks the Resolved transition unless force=true.
 * Offline fallback: plain status update (no AI available locally).
 */
export const resolveWithProof = async (id, fixImageFile, force = false) => {
  if (isApiOnline()) {
    const form = new FormData();
    form.append("fix_image", fixImageFile);
    form.append("force", force ? "true" : "false");
    try {
      const res = await http.post(`/complaints/${numericIdOf(id)}/resolve-with-proof`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000, // before/after vision audit runs inline
      });
      return normalizeComplaint(res.data);
    } catch (err) {
      throw apiError(err, "Fix verification failed. Please try again.");
    }
  }
  return localUpdateStatus(id, "Resolved");
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

// ─── Public accountability scoreboard ─────────────────────────────────────────

const RESOLVED_STATES = ["Resolved", "Closed"];

const gradeOf = (score) =>
  score >= 85 ? "A+" : score >= 70 ? "A" : score >= 55 ? "B" : score >= 40 ? "C" : "D";

/** Client-side scoreboard computation — mirrors the backend formula. Used offline. */
const computeLocalScoreboard = (complaints) => {
  const byDept = {};
  complaints.forEach((c) => {
    const d = c.department || "Other";
    (byDept[d] = byDept[d] || []).push(c);
  });

  const departments = Object.entries(byDept).map(([department, items]) => {
    const total = items.length;
    const resolvedItems = items.filter((c) => RESOLVED_STATES.includes(c.status));
    const resolved = resolvedItems.length;
    const escalated = items.filter((c) => c.is_escalated).length;
    const ratings = items.filter((c) => c.rating).map((c) => c.rating);

    const hours = resolvedItems
      .map((c) => (new Date(c.updatedAt) - new Date(c.createdAt)) / 36e5)
      .filter((h) => Number.isFinite(h) && h >= 0);

    const resolution_rate = total ? Math.round((resolved / total) * 100) : 0;
    const sla_breach_pct = total ? Math.round((escalated / total) * 100) : 0;
    const avg_rating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;
    const satisfaction = avg_rating ? (avg_rating / 5) * 100 : 60;
    const score = Math.round(
      0.5 * resolution_rate + 0.3 * (100 - sla_breach_pct) + 0.2 * satisfaction
    );

    return {
      department,
      total,
      resolved,
      open: total - resolved,
      resolution_rate,
      avg_resolution_hours: hours.length
        ? Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) / 10
        : null,
      sla_breaches: escalated,
      sla_breach_pct,
      avg_rating,
      ratings_count: ratings.length,
      score,
      grade: gradeOf(score),
      insight: null,
    };
  });

  departments.sort((a, b) => b.score - a.score || b.total - a.total);
  departments.forEach((d, i) => (d.rank = i + 1));

  const total = complaints.length;
  const resolved = complaints.filter((c) => RESOLVED_STATES.includes(c.status)).length;
  const escalated = complaints.filter((c) => c.is_escalated).length;
  const allRatings = complaints.filter((c) => c.rating).map((c) => c.rating);

  return {
    departments,
    overall: {
      total,
      resolved,
      resolution_rate: total ? Math.round((resolved / total) * 100) : 0,
      sla_breach_pct: total ? Math.round((escalated / total) * 100) : 0,
      avg_rating: allRatings.length
        ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
        : null,
      departments_count: departments.length,
    },
    ai_summary: null,
    ai_source: "local",
    generated_at: new Date().toISOString(),
  };
};

/** Fetch the public scoreboard; computes it locally when the API is down. */
export const getScoreboard = async () => {
  if (await checkApiOnline()) {
    try {
      const res = await http.get("/scoreboard", { timeout: 30000 });
      return res.data;
    } catch (err) {
      console.warn("[scoreboard] API fetch failed, computing locally:", err.message);
    }
  }
  const complaints = await getComplaints();
  return computeLocalScoreboard(complaints);
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
