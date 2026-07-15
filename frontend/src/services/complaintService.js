/**
 * complaintService.js
 * Single source of truth for all complaint data operations.
 * Persists to localStorage under COMPLAINTS_KEY.
 *
 * Schema:
 * {
 *   id          : "CMP-0001"
 *   citizenId   : aadhaar string
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
 *   status      : "Submitted" | "Assigned" | "In Progress" | "Resolved"
 *   imagePreview: data-URL string | null
 *   latitude    : number
 *   longitude   : number
 *   evidence_verdict: "MATCH" | "MISMATCH" | "UNCERTAIN" | null
 *   evidence_reason: string | null
 *   evidence_confidence: number | null
 *   createdAt   : ISO string
 *   updatedAt   : ISO string
 * }
 */

const COMPLAINTS_KEY = 'complaints';

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_COMPLAINTS = [
  {
    id: "CMP-0001",
    citizenId: "123456789012",
    citizenName: "Demo Citizen",
    citizenPhone: "9876543210",
    citizenEmail: "citizen@example.com",
    citizenAddress: "123 MG Road, Pune, Maharashtra - 411001",
    title: "Water pipeline leakage",
    description: "There is a massive water pipeline leakage near Shivaji Nagar bus stand. Millions of liters of clean water are being wasted. Please address this urgently.",
    area: "Shivaji Nagar Bus Stand, Pune",
    landmark: "Near Bus Stand",
    pinCode: "411005",
    department: "Water Supply",
    priority: "High",
    status: "In Progress",
    imagePreview: null,
    latitude: 18.5312,
    longitude: 73.8445,
    createdAt: "2026-07-12T10:30:00.000Z",
    submitted_at: "2026-07-12T10:30:00.000Z",
    updatedAt: "2026-07-13T14:20:00.000Z"
  },
  {
    id: "CMP-0002",
    citizenId: "123456789012",
    citizenName: "Demo Citizen",
    citizenPhone: "9876543210",
    citizenEmail: "citizen@example.com",
    citizenAddress: "123 MG Road, Pune, Maharashtra - 411001",
    title: "Street light not functioning",
    description: "Three street lights are completely dark on the lane opposite to D-Mart. It is unsafe for women and children to walk at night.",
    area: "Kothrud, Pune",
    landmark: "Opposite D-Mart",
    pinCode: "411038",
    department: "Street Lights",
    priority: "Medium",
    status: "Submitted",
    imagePreview: null,
    latitude: 18.5074,
    longitude: 73.8077,
    createdAt: "2026-07-14T18:45:00.000Z",
    submitted_at: "2026-07-14T18:45:00.000Z",
    updatedAt: "2026-07-14T18:45:00.000Z"
  },
  {
    id: "CMP-0003",
    citizenId: "999999999999",
    citizenName: "Aarav Sharma",
    citizenPhone: "9876500000",
    citizenEmail: "aarav@example.com",
    citizenAddress: "Flat 402, Rohan Heights, Pune",
    title: "Potholes on main road",
    description: "Severe potholes on the main road causing vehicular damage and potential accidents. They have become very deep after the rain.",
    area: "Viman Nagar, Pune",
    landmark: "Near Phoenix Mall",
    pinCode: "411014",
    department: "Roads",
    priority: "High",
    status: "Assigned",
    imagePreview: null,
    latitude: 18.5679,
    longitude: 73.9143,
    createdAt: "2026-07-15T09:15:00.000Z",
    submitted_at: "2026-07-15T09:15:00.000Z",
    updatedAt: "2026-07-15T11:00:00.000Z"
  },
  {
    id: "CMP-0004",
    citizenId: "888888888888",
    citizenName: "Priya Patel",
    citizenPhone: "9876511111",
    citizenEmail: "priya@example.com",
    citizenAddress: "Row House 7, Sun City, Pune",
    title: "Garbage dumping on roadside",
    description: "Large garbage dump has accumulated on the roadside. It emits foul smell and attracts stray dogs/insects.",
    area: "Hadapsar, Pune",
    landmark: "Near Noble Hospital",
    pinCode: "411028",
    department: "Sanitation",
    priority: "Low",
    status: "Resolved",
    imagePreview: null,
    latitude: 18.5089,
    longitude: 73.9258,
    createdAt: "2026-07-10T08:00:00.000Z",
    submitted_at: "2026-07-10T08:00:00.000Z",
    updatedAt: "2026-07-12T16:30:00.000Z"
  }
];

// ─── AI Keyword Classification Rules ──────────────────────────────────────────
const DEPT_KEYWORDS = {
  "Roads": [
    "pothole", "road", "highway", "street", "pavement", "crater",
    "bump", "broken road", "repair road", "asphalt", "divider",
    "footpath", "sidewalk", "carriageway"
  ],
  "Water Supply": [
    "water", "pipe", "leakage", "leak", "tap", "supply", "shortage",
    "no water", "water cut", "drinking water", "nal", "pipeline",
    "contaminated water", "murky water"
  ],
  "Electricity": [
    "electricity", "power", "electric", "wire", "transformer",
    "outage", "blackout", "no power", "current", "meter",
    "short circuit", "sparking", "tripping", "voltage"
  ],
  "Sanitation": [
    "garbage", "waste", "trash", "rubbish", "litter", "dump",
    "sanitation", "sweeping", "cleanliness", "filth", "smell",
    "open defecation", "toilet", "sewage smell"
  ],
  "Drainage": [
    "drainage", "drain", "sewage", "overflow", "waterlogging",
    "flood", "nala", "blocked drain", "stagnant water", "gutter",
    "manhole", "overflowing"
  ],
  "Street Lights": [
    "street light", "streetlight", "lamp post", "dark road",
    "light not working", "lamppost", "pole light", "night light",
    "no light", "dim light"
  ],
  "Public Transport": [
    "bus", "train", "metro", "auto", "transport", "route",
    "driver", "conductor", "stop", "halt", "schedule",
    "overcrowding", "overloaded"
  ],
};

const PRIORITY_KEYWORDS = {
  "High": [
    "urgent", "emergency", "danger", "dangerous", "immediate",
    "critical", "accident", "injury", "death", "fire", "electrocute",
    "collapse", "flood", "severe", "major", "fatal"
  ],
  "Low": [
    "minor", "small", "slight", "little", "cosmetic", "tiny",
    "not urgent", "eventually", "whenever possible"
  ],
};

const CATEGORY_MAP = {
  "Roads": "Road Damage",
  "Water Supply": "Water Issue",
  "Electricity": "Power Outage",
  "Sanitation": "Sanitation & Hygiene",
  "Drainage": "Drainage & Flooding",
  "Street Lights": "Street Lighting",
  "Public Transport": "Transport Issue",
  "Other": "General Complaint",
};

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

// ─── Raw Storage Helpers ──────────────────────────────────────────────────────
const _readAll = () => {
  try {
    const raw = localStorage.getItem(COMPLAINTS_KEY);
    if (!raw) {
      localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(SEED_COMPLAINTS));
      return SEED_COMPLAINTS;
    }
    return JSON.parse(raw);
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
  return _readAll().find((c) => c.id.toLowerCase() === id.toLowerCase()) || null;
};

/**
 * Get all complaints belonging to a specific citizen (by Aadhaar number).
 * @param {string} citizenId  Aadhaar number
 * @returns {Promise<Array>}
 */
export const getCitizenComplaints = async (citizenId) => {
  await new Promise((r) => setTimeout(r, 60));
  const cleanId = (citizenId || '').replace(/\s+/g, '');
  return _readAll().filter((c) => (c.citizenId || '').replace(/\s+/g, '') === cleanId);
};

/**
 * Create and persist a new complaint.
 * Automatically assigns randomized geolocations inside Pune, Maharashtra.
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
  await new Promise((r) => setTimeout(r, 400));

  const { citizen, complaintLocation, complaint, imagePreview } = payload;
  const now = new Date().toISOString();

  // Generate Pune-bound geolocations if none are provided
  const latitude = payload.latitude || (18.5204 + (Math.random() - 0.5) * 0.08);
  const longitude = payload.longitude || (73.8567 + (Math.random() - 0.5) * 0.08);

  const record = {
    id:             generateId(),
    citizenId:      (citizen.aadhaar || '').replace(/\s+/g, ''),
    citizenName:    citizen.name    || '',
    citizenPhone:   citizen.mobile  || '',
    citizenEmail:   citizen.email   || '',
    citizenAddress: citizen.address || '',
    title:          complaint.title,
    description:    complaint.description,
    area:           complaintLocation.area,
    landmark:       complaintLocation.landmark || null,
    pinCode:        complaintLocation.pinCode  || null,
    department:     complaint.department || 'Pending AI Classification',
    priority:       complaint.priority   || 'Pending AI Analysis',
    status:         'Submitted',
    imagePreview:   imagePreview || null,
    latitude,
    longitude,
    evidence_verdict: null,
    evidence_reason: null,
    evidence_confidence: null,
    createdAt:      now,
    submitted_at:   now,
    updatedAt:      now,
  };

  const existing = _readAll();
  existing.push(record);
  _writeAll(existing);

  return record;
};

/**
 * Update any fields on a complaint by ID.
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object>} Updated record
 */
export const updateComplaint = async (id, data) => {
  await new Promise((r) => setTimeout(r, 100));

  const all = _readAll();
  const idx = all.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
  if (idx === -1) throw new Error(`Complaint ${id} not found.`);

  all[idx] = { 
    ...all[idx], 
    ...data, 
    updatedAt: new Date().toISOString() 
  };
  _writeAll(all);
  return all[idx];
};

/**
 * Delete a complaint by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteComplaint = async (id) => {
  await new Promise((r) => setTimeout(r, 100));
  _writeAll(_readAll().filter((c) => c.id.toLowerCase() !== id.toLowerCase()));
};

// ─── Simulated AI Helpers (Offline Support) ───────────────────────────────────

/**
 * Perform keyword-based AI classification on a complaint description.
 * @param {string} id
 * @returns {Promise<Object>} Updated complaint record
 */
export const classifyComplaintAI = async (id) => {
  await new Promise((r) => setTimeout(r, 500));
  const all = _readAll();
  const idx = all.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
  if (idx === -1) throw new Error(`Complaint ${id} not found.`);

  const c = all[idx];
  const text = (c.description || '').toLowerCase();

  // Score departments based on keyword counts
  const deptScores = {};
  Object.keys(DEPT_KEYWORDS).forEach(dept => {
    deptScores[dept] = 0;
    DEPT_KEYWORDS[dept].forEach(kw => {
      if (text.includes(kw)) {
        deptScores[dept]++;
      }
    });
  });

  let bestDept = "Other";
  let maxScore = 0;
  Object.keys(deptScores).forEach(dept => {
    if (deptScores[dept] > maxScore) {
      maxScore = deptScores[dept];
      bestDept = dept;
    }
  });

  // Score priorities
  let priority = "Medium";
  for (const level of Object.keys(PRIORITY_KEYWORDS)) {
    if (PRIORITY_KEYWORDS[level].some(kw => text.includes(kw))) {
      priority = level;
      break;
    }
  }

  const category = CATEGORY_MAP[bestDept] || "General Complaint";
  const summary = `${category} reported at the mentioned location. Priority assessed as ${priority}. Routed to ${bestDept} department for resolution.`;

  all[idx] = {
    ...c,
    department: bestDept,
    category,
    priority,
    ai_summary: summary,
    updatedAt: new Date().toISOString()
  };

  _writeAll(all);
  return all[idx];
};

/**
 * Perform simulated vision model audit on complaint evidence image.
 * @param {string} id
 * @returns {Promise<Object>} Updated complaint record
 */
export const auditEvidenceAI = async (id) => {
  await new Promise((r) => setTimeout(r, 600));
  const all = _readAll();
  const idx = all.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
  if (idx === -1) throw new Error(`Complaint ${id} not found.`);

  const c = all[idx];
  if (!c.imagePreview && !c.image_url) {
    throw new Error("This complaint has no attached evidence image to analyze.");
  }

  const verdict = "MATCH";
  const reason = "Evidence verified — image matches the complaint description.";
  const confidence = 0.95;

  all[idx] = {
    ...c,
    evidence_verdict: verdict,
    evidence_reason: reason,
    evidence_confidence: confidence,
    updatedAt: new Date().toISOString()
  };

  _writeAll(all);
  return all[idx];
};

// ─── Legacy compatibility exports ─────────────────────────────────────────────
export const updateComplaintStatus = async (id, newStatus) => {
  return updateComplaint(id, { status: newStatus });
};

export const submitComplaint = createComplaint;
