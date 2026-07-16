// Shared domain constants used across citizen and admin views.

export const STATUS_OPTIONS = ["Submitted", "Assigned", "In Progress", "Resolved"];

export const DEPARTMENTS = [
  "Roads",
  "Water Supply",
  "Electricity",
  "Sanitation",
  "Drainage",
  "Street Lights",
  "Public Transport",
  "Other",
];

export const PRIORITY_LEVELS = ["Critical", "High", "Medium", "Low"];

/** Badge classes (see index.css) for a complaint status. */
export const STATUS_BADGE = {
  Resolved: "badge-success",
  "In Progress": "badge-warning",
  Assigned: "badge-primary",
  Submitted: "badge-info",
  Closed: "badge-neutral",
};

/** Badge classes for a priority level. */
export const PRIORITY_BADGE = {
  Critical: "badge-error",
  High: "badge-warning",
  Medium: "badge-info",
  Low: "badge-success",
};

/** Solid hex colors for charts / map markers, keyed by department. */
export const DEPT_COLORS = {
  Roads: "#EA8A3E",
  "Water Supply": "#2596A6",
  Electricity: "#C9A227",
  Sanitation: "#4C9A62",
  Drainage: "#7C6BAE",
  "Street Lights": "#B98A2F",
  "Public Transport": "#B85B7E",
  Other: "#8A897F",
};

/**
 * Resolve a department name to its color, tolerating naming variations
 * coming from the AI classifier (e.g. "Water Supply Department",
 * "Roads and Drainage", "Solid Waste Management").
 */
export const getDeptColor = (dept) => {
  if (!dept) return DEPT_COLORS.Other;
  if (DEPT_COLORS[dept]) return DEPT_COLORS[dept];

  const d = dept.toLowerCase();
  if (d.includes("water")) return DEPT_COLORS["Water Supply"];
  if (d.includes("road")) return DEPT_COLORS.Roads;
  if (d.includes("electric") || d.includes("power")) return DEPT_COLORS.Electricity;
  if (d.includes("sanit") || d.includes("waste") || d.includes("garbage"))
    return DEPT_COLORS.Sanitation;
  if (d.includes("drain") || d.includes("sewer")) return DEPT_COLORS.Drainage;
  if (d.includes("light")) return DEPT_COLORS["Street Lights"];
  if (d.includes("transport") || d.includes("bus")) return DEPT_COLORS["Public Transport"];
  return DEPT_COLORS.Other;
};

/** Solid hex colors for priority levels (charts, map pins). */
export const PRIORITY_COLORS = {
  Critical: "#DC2626",
  High: "#EA8A3E",
  Medium: "#3B82F6",
  Low: "#22C55E",
};

/** Municipal department registry: leads + contact details (demo directory). */
export const DEPT_REGISTRY = {
  "Water Supply Department": {
    lead: "Rajesh Deshmukh",
    title: "Executive Engineer",
    email: "watersupply@pmc.gov.in",
    phone: "020-2550 1101",
  },
  "Electricity Department": {
    lead: "Sunita Kulkarni",
    title: "Chief Electrical Engineer",
    email: "electricity@pmc.gov.in",
    phone: "020-2550 1102",
  },
  "Roads and Drainage": {
    lead: "Amit Pawar",
    title: "Superintendent Engineer",
    email: "roads@pmc.gov.in",
    phone: "020-2550 1103",
  },
  "Solid Waste Management": {
    lead: "Meena Joshi",
    title: "Deputy Commissioner (SWM)",
    email: "swm@pmc.gov.in",
    phone: "020-2550 1104",
  },
  "Public Health": {
    lead: "Dr. Vikram Sane",
    title: "Medical Officer of Health",
    email: "health@pmc.gov.in",
    phone: "020-2550 1105",
  },
  "Traffic Police": {
    lead: "Insp. Kavita Rane",
    title: "Traffic Superintendent",
    email: "traffic@punepolice.gov.in",
    phone: "020-2550 1106",
  },
  Other: {
    lead: "Central Grievance Cell",
    title: "Nodal Officer",
    email: "grievance@pmc.gov.in",
    phone: "020-2550 1100",
  },
};

/** SLA resolution limits (hours) by priority — mirrors the backend engine. */
export const SLA_LIMITS = {
  Critical: 24,
  High: 72,
  Medium: 168,
  Low: 336,
};

/** Priority engine weights — mirrors the backend scoring formula. */
export const PRIORITY_WEIGHTS = [
  { label: "Safety Risk", max: 30, desc: "Hazard level flagged by the AI classifier" },
  { label: "Public Impact", max: 20, desc: "Extent of public disruption" },
  { label: "Essential Service", max: 20, desc: "Water / power / health / fire disruption" },
  { label: "Urgency", max: 10, desc: "Language urgency rating" },
  { label: "Duplicate Reports", max: 10, desc: "+5 per identical report in the same area" },
  { label: "Location Proximity", max: 5, desc: "Near hospitals, schools, transit hubs" },
  { label: "Time Pending", max: 5, desc: "+1 per day unresolved" },
];
