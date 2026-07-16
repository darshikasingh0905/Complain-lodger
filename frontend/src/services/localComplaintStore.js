// ─────────────────────────────────────────────────────────────────────────────
// Offline fallback store (localStorage).
// Used ONLY when the FastAPI backend is unreachable, so the demo keeps
// working end-to-end without MySQL/uvicorn. Mirrors the backend's
// classification + priority engine rules.
// ─────────────────────────────────────────────────────────────────────────────

const COMPLAINTS_KEY = "complaints";

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
    description:
      "There is a massive water pipeline leakage near Shivaji Nagar bus stand. Millions of liters of clean water are being wasted. Please address this urgently.",
    area: "Shivaji Nagar Bus Stand, Pune",
    address: "Shivaji Nagar Bus Stand, Pune",
    landmark: "Near Bus Stand",
    pinCode: "411005",
    department: "Water Supply Department",
    category: "Water Leakage / Deficit",
    priority: "Critical",
    ai_severity: "Critical",
    ai_confidence: 0.95,
    ai_reason: "Complaint mentions massive pipeline leakage wasting millions of liters.",
    ai_keywords: ["water", "pipeline", "leakage"],
    status: "In Progress",
    imagePreview: null,
    latitude: 18.5312,
    longitude: 73.8445,
    is_escalated: false,
    assigned_officer: "Officer Sharma",
    priorityScore: 82,
    priorityLevel: "Critical",
    priorityBreakdown: { safetyRisk: 30, publicImpact: 20, essentialService: 20, urgency: 10, duplicates: 0, location: 5, timePending: 2 },
    priorityReason:
      "Complaint prioritized due to: a safety risk flagged as Critical, and disruption to essential services, and near critical public location/infrastructure.",
    createdAt: "2026-07-12T10:30:00.000Z",
    submitted_at: "2026-07-12T10:30:00.000Z",
    updatedAt: "2026-07-13T14:20:00.000Z",
  },
  {
    id: "CMP-0002",
    citizenId: "123456789012",
    citizenName: "Demo Citizen",
    citizenPhone: "9876543210",
    citizenEmail: "citizen@example.com",
    citizenAddress: "123 MG Road, Pune, Maharashtra - 411001",
    title: "Street light not functioning",
    description:
      "Three street lights are completely dark on the lane opposite to D-Mart. It is unsafe for women and children to walk at night.",
    area: "Kothrud, Pune",
    address: "Kothrud, Pune",
    landmark: "Opposite D-Mart",
    pinCode: "411038",
    department: "Electricity Department",
    category: "Power Issue",
    priority: "High",
    ai_severity: "Moderate",
    ai_confidence: 0.88,
    ai_reason: "Dark road reported causing unsafe walking conditions.",
    ai_keywords: ["street light", "dark road"],
    status: "Submitted",
    imagePreview: null,
    latitude: 18.5074,
    longitude: 73.8077,
    is_escalated: false,
    assigned_officer: "Officer Sharma",
    priorityScore: 55,
    priorityLevel: "Medium",
    priorityBreakdown: { safetyRisk: 15, publicImpact: 10, essentialService: 20, urgency: 5, duplicates: 0, location: 0, timePending: 2 },
    priorityReason: "Complaint prioritized due to: disruption to essential services.",
    createdAt: "2026-07-14T18:45:00.000Z",
    submitted_at: "2026-07-14T18:45:00.000Z",
    updatedAt: "2026-07-14T18:45:00.000Z",
  },
  {
    id: "CMP-0003",
    citizenId: "999999999999",
    citizenName: "Aarav Sharma",
    citizenPhone: "9876500000",
    citizenEmail: "aarav@example.com",
    citizenAddress: "Flat 402, Rohan Heights, Pune",
    title: "Potholes on main road",
    description:
      "Severe potholes on the main road causing vehicular damage and potential accidents. They have become very deep after the rain.",
    area: "Viman Nagar, Pune",
    address: "Viman Nagar, Pune",
    landmark: "Near Phoenix Mall",
    pinCode: "411014",
    department: "Roads and Drainage",
    category: "Water Logging and Road Damage",
    priority: "High",
    ai_severity: "Critical",
    ai_confidence: 0.92,
    ai_reason: "Deep potholes causing immediate road danger and vehicle damage.",
    ai_keywords: ["potholes", "road", "vehicular damage"],
    status: "Assigned",
    imagePreview: null,
    latitude: 18.5679,
    longitude: 73.9143,
    is_escalated: false,
    assigned_officer: "Officer Sharma",
    priorityScore: 73,
    priorityLevel: "High",
    priorityBreakdown: { safetyRisk: 30, publicImpact: 20, essentialService: 0, urgency: 10, duplicates: 5, location: 5, timePending: 3 },
    priorityReason:
      "Complaint prioritized due to: a safety risk flagged as Critical, and linked to multiple similar reports, and near critical public location/infrastructure.",
    createdAt: "2026-07-15T09:15:00.000Z",
    submitted_at: "2026-07-15T09:15:00.000Z",
    updatedAt: "2026-07-15T11:00:00.000Z",
  },
  {
    id: "CMP-0004",
    citizenId: "888888888888",
    citizenName: "Priya Patel",
    citizenPhone: "9876511111",
    citizenEmail: "priya@example.com",
    citizenAddress: "Row House 7, Sun City, Pune",
    title: "Garbage dumping on roadside",
    description:
      "Large garbage dump has accumulated on the roadside. It emits foul smell and attracts stray dogs/insects.",
    area: "Hadapsar, Pune",
    address: "Hadapsar, Pune",
    landmark: "Near Noble Hospital",
    pinCode: "411028",
    department: "Solid Waste Management",
    category: "Garbage Accumulation",
    priority: "Low",
    ai_severity: "Minor",
    ai_confidence: 0.9,
    ai_reason: "Roadside garbage accumulation attracting stray animals.",
    ai_keywords: ["garbage", "dump", "roadside"],
    status: "Resolved",
    imagePreview: null,
    latitude: 18.5089,
    longitude: 73.9258,
    is_escalated: false,
    assigned_officer: "Officer Sharma",
    priorityScore: 22,
    priorityLevel: "Low",
    priorityBreakdown: { safetyRisk: 5, publicImpact: 5, essentialService: 0, urgency: 2, duplicates: 5, location: 5, timePending: 0 },
    priorityReason: "Complaint classified with general parameters. Priority level: Low.",
    createdAt: "2026-07-10T08:00:00.000Z",
    submitted_at: "2026-07-10T08:00:00.000Z",
    updatedAt: "2026-07-12T16:30:00.000Z",
  },
];

// ─── AI Keyword Classification Rules (mirror of backend fallback) ────────────
const DEPT_KEYWORDS = {
  "Roads and Drainage": [
    "pothole", "road", "highway", "street", "pavement", "crater",
    "bump", "broken road", "repair road", "asphalt", "divider",
    "footpath", "sidewalk", "carriageway", "drainage", "drain",
    "sewage", "overflow", "waterlogging", "flood", "nala",
    "blocked drain", "gutter", "manhole", "overflowing",
  ],
  "Electricity Department": [
    "electricity", "power", "electric", "wire", "transformer",
    "outage", "blackout", "no power", "current", "meter",
    "short circuit", "sparking", "tripping", "voltage",
  ],
  "Water Supply Department": [
    "water", "pipe", "leakage", "leak", "tap", "supply", "shortage",
    "no water", "water cut", "drinking water", "nal", "pipeline",
    "contaminated water", "murky water",
  ],
  "Solid Waste Management": [
    "garbage", "waste", "trash", "rubbish", "litter", "dump",
    "sweeping", "cleanliness", "filth", "smell", "dustbin", "landfill",
  ],
  "Public Health": [
    "health", "medical", "epidemic", "disease", "dengue", "malaria",
    "mosquito", "clinic", "hospital", "hygiene", "sanitation", "open defecation",
  ],
  "Traffic Police": [
    "traffic", "signal", "zebra crossing", "parking", "jam",
    "vehicle", "fine", "congestion", "speeding", "one way",
  ],
  "Pollution Control Board": [
    "pollution", "smoke", "dust", "air quality", "chemical",
    "factory emission", "noise", "loud speaker", "sound pollution",
  ],
  "Parks and Gardens": ["park", "garden", "tree", "grass", "branch", "municipal park", "green belt"],
  "Fire Department": ["fire", "smoke", "burn", "explosion", "cylinder blast", "rescue"],
  "Municipal Corporation": [
    "tax", "building permission", "birth certificate", "death certificate",
    "encroachment", "hawkers", "license", "shop act",
  ],
  "Women Safety Cell": ["harassment", "unsafe", "women safety", "eve teasing", "stalking", "abuse"],
  "Cyber Crime": [
    "cyber", "online fraud", "scam", "phishing", "hacked", "password",
    "hack", "spam", "bank fraud", "credit card fraud",
  ],
  Police: ["theft", "robbery", "fight", "police", "crime", "law and order", "brawl", "kidnap", "assault"],
  "Animal Control": ["stray dog", "cattle", "monkey menace", "animal bite", "rabies", "pig", "stray"],
};

const PRIORITY_KEYWORDS = {
  High: [
    "urgent", "emergency", "danger", "dangerous", "immediate",
    "critical", "accident", "injury", "death", "fire", "electrocute",
    "collapse", "flood", "severe", "major", "fatal", "risk",
  ],
  Low: ["minor", "small", "slight", "little", "cosmetic", "tiny", "not urgent", "eventually", "whenever possible"],
};

const CATEGORY_MAP = {
  "Roads and Drainage": "Water Logging and Road Damage",
  "Electricity Department": "Power Issue",
  "Water Supply Department": "Water Leakage / Deficit",
  "Solid Waste Management": "Garbage Accumulation",
  "Public Health": "Mosquito Breeding / Unhygienic Site",
  "Traffic Police": "Traffic Congestion",
  "Pollution Control Board": "Air / Noise Pollution",
  "Parks and Gardens": "Park Maintenance",
  "Fire Department": "Fire Hazard",
  "Municipal Corporation": "Property Tax / Regulation",
  "Women Safety Cell": "Eve Teasing / Unsafe Spot",
  "Cyber Crime": "Cyber Scam / Account Hack",
  Police: "Public Nuisance / Theft",
  "Animal Control": "Stray Animal Menace",
  Other: "General Grievance",
};

export const runLocalClassification = (title, description) => {
  const text = (title + " " + description).toLowerCase();

  const deptScores = {};
  Object.keys(DEPT_KEYWORDS).forEach((dept) => {
    deptScores[dept] = 0;
    DEPT_KEYWORDS[dept].forEach((kw) => {
      if (text.includes(kw)) deptScores[dept]++;
    });
  });

  let bestDept = "Other";
  let maxScore = 0;
  Object.keys(deptScores).forEach((dept) => {
    if (deptScores[dept] > maxScore) {
      maxScore = deptScores[dept];
      bestDept = dept;
    }
  });

  const category = CATEGORY_MAP[bestDept] || "General Grievance";

  let priority = "Medium";
  for (const level of Object.keys(PRIORITY_KEYWORDS)) {
    if (PRIORITY_KEYWORDS[level].some((kw) => text.includes(kw))) {
      priority = level;
      break;
    }
  }

  const severity = priority === "High" ? "Critical" : priority === "Low" ? "Minor" : "Moderate";

  const foundKeywords = [];
  Object.values(DEPT_KEYWORDS).forEach((list) => {
    list.forEach((kw) => {
      if (text.includes(kw) && !foundKeywords.includes(kw)) foundKeywords.push(kw);
    });
  });

  return {
    department: bestDept,
    category,
    priority,
    severity,
    confidence: 0.0,
    reason: "Backend offline. Local keyword fallback was applied.",
    keywords: foundKeywords.slice(0, 5),
  };
};

// ─── Priority Engine (mirror of backend weights) ──────────────────────────────
// Women-safety detection (mirrors backend priority_engine)
const WOMEN_SAFETY_KEYWORDS = [
  "harass", "stalk", "eve teasing", "eve-teasing", "molest", "lewd",
  "women safety", "unsafe for women", "catcall", "followed me",
  "inappropriate touch", "chain snatch", "snatching", "robbery",
  "kidnap", "assault", "unsafe at night", "drunk men", "misbehav",
];

const CONFIG_PRIORITY = {
  weights: { safetyRisk: 30, publicImpact: 20, essentialService: 20, urgency: 10, duplicates: 10, location: 5, timePending: 5, womenSafety: 15 },
  safetyRiskMap: { High: 30, Critical: 30, Medium: 15, Moderate: 15, Low: 5, Minor: 5 },
  publicImpactMap: { High: 20, Medium: 10, Low: 5 },
  urgencyMap: { High: 10, Medium: 5, Low: 2 },
  locationKeywords: [
    "hospital", "clinic", "school", "college", "station", "highway",
    "market", "airport", "bus stand", "bus stop", "metro", "railway",
  ],
};

const calculateLocalPriority = (description, address, category, createdAt, status, aiResult, allComplaints) => {
  const safetyVal = aiResult.severity || aiResult.safetyRisk || "Medium";
  const safetyScore = CONFIG_PRIORITY.safetyRiskMap[safetyVal] !== undefined ? CONFIG_PRIORITY.safetyRiskMap[safetyVal] : 15;

  const impactVal = aiResult.publicImpact || "Medium";
  const impactScore = CONFIG_PRIORITY.publicImpactMap[impactVal] !== undefined ? CONFIG_PRIORITY.publicImpactMap[impactVal] : 10;

  const essentialVal =
    !!aiResult.essentialService ||
    ["Electricity Department", "Water Supply Department", "Public Health", "Fire Department"].includes(aiResult.department);
  const essentialScore = essentialVal ? CONFIG_PRIORITY.weights.essentialService : 0;

  const urgencyVal = aiResult.urgency || aiResult.priority || "Medium";
  const urgencyScore = CONFIG_PRIORITY.urgencyMap[urgencyVal] !== undefined ? CONFIG_PRIORITY.urgencyMap[urgencyVal] : 5;

  const duplicateCount = allComplaints.filter((c) => c.category === category && c.area === address).length;
  const duplicatesScore = Math.min(CONFIG_PRIORITY.weights.duplicates, duplicateCount * 5);

  let locationScore = 0;
  const combinedText = `${description} ${address || ""}`.toLowerCase();
  if (CONFIG_PRIORITY.locationKeywords.some((kw) => combinedText.includes(kw))) {
    locationScore = CONFIG_PRIORITY.weights.location;
  }

  let timePendingScore = 0;
  if (status !== "Resolved" && status !== "Closed" && createdAt) {
    const elapsedHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    timePendingScore = Math.min(CONFIG_PRIORITY.weights.timePending, Math.floor(elapsedHours / 24));
  }

  // Women-safety boost (mirrors backend): category or text keywords
  const catL = (category || "").toLowerCase();
  const womenSafetyScore =
    catL.includes("eve teasing") ||
    catL.includes("unsafe spot") ||
    catL.includes("women") ||
    WOMEN_SAFETY_KEYWORDS.some((kw) => combinedText.includes(kw))
      ? CONFIG_PRIORITY.weights.womenSafety
      : 0;

  const totalScore = safetyScore + impactScore + essentialScore + urgencyScore + duplicatesScore + locationScore + timePendingScore + womenSafetyScore;
  const finalScore = Math.max(0, Math.min(100, totalScore));

  let level = "Medium";
  if (finalScore >= 81) level = "Critical";
  else if (finalScore >= 61) level = "High";
  else if (finalScore >= 31) level = "Medium";
  else level = "Low";

  const reasons = [];
  if (safetyScore >= 15) reasons.push(`a safety risk flagged as ${safetyVal}`);
  if (essentialVal) reasons.push("disruption to essential services");
  if (duplicatesScore > 0) reasons.push(`linked to multiple similar reports (${duplicateCount} duplicate(s) detected)`);
  if (locationScore > 0) reasons.push("near critical public location/infrastructure");
  if (womenSafetyScore > 0) reasons.push("flagged as a women-safety concern (dedicated priority boost applied)");

  const reason =
    reasons.length > 0
      ? `Complaint prioritized due to: ${reasons.join(", and ")}.`
      : `Complaint classified with general parameters. Priority level: ${level}.`;

  return {
    priorityScore: finalScore,
    priorityLevel: level,
    priorityBreakdown: {
      safetyRisk: safetyScore,
      publicImpact: impactScore,
      essentialService: essentialScore,
      urgency: urgencyScore,
      duplicates: duplicatesScore,
      location: locationScore,
      timePending: timePendingScore,
      womenSafety: womenSafetyScore,
    },
    reason,
  };
};

// ─── Raw storage helpers ──────────────────────────────────────────────────────
const _writeAll = (records) => localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(records));

const _readAll = () => {
  try {
    const raw = localStorage.getItem(COMPLAINTS_KEY);
    let list = [];
    if (!raw) {
      list = SEED_COMPLAINTS;
      _writeAll(SEED_COMPLAINTS);
    } else {
      list = JSON.parse(raw);
    }

    // Recalculate priorities on read to keep pending times / duplicates fresh
    let changed = false;
    const updated = list.map((c) => {
      const p = calculateLocalPriority(
        c.description || "",
        c.area || "",
        c.category || "",
        c.createdAt || c.submitted_at,
        c.status || "Submitted",
        {
          severity: c.ai_severity,
          safetyRisk: c.safetyRisk,
          publicImpact: c.publicImpact,
          essentialService: c.essentialService,
          urgency: c.urgency,
          priority: c.priority,
          department: c.department,
        },
        list.filter((other) => other.id !== c.id)
      );

      if (c.priorityScore !== p.priorityScore || c.priorityLevel !== p.priorityLevel) {
        changed = true;
        return {
          ...c,
          priorityScore: p.priorityScore,
          priorityLevel: p.priorityLevel,
          priorityBreakdown: p.priorityBreakdown,
          priorityReason: p.reason,
          priority: p.priorityLevel,
          ai_reason: p.reason,
        };
      }
      return c;
    });

    if (changed) {
      _writeAll(updated);
      return updated;
    }
    return list;
  } catch (e) {
    console.error("Local storage read error", e);
    return [];
  }
};

const generateId = () => {
  try {
    const existing = JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || "[]");
    return `CMP-${String(existing.length + 1).padStart(4, "0")}`;
  } catch {
    return `CMP-${Date.now()}`;
  }
};

const findIndexOrThrow = (all, id) => {
  const idx = all.findIndex((c) => String(c.id).toLowerCase() === String(id).toLowerCase());
  if (idx === -1) throw new Error(`Complaint ${id} not found.`);
  return idx;
};

// ─── Public local API (same shapes the app consumes) ──────────────────────────

export const localGetComplaints = async () => _readAll();

export const localCreateComplaint = async (payload) => {
  const { citizen, complaintLocation, complaint, imagePreview, latitude, longitude } = payload;
  const now = new Date().toISOString();

  const ai_result = runLocalClassification(complaint.title || "", complaint.description || "");
  const existing = _readAll();

  const p = calculateLocalPriority(
    complaint.description || "",
    complaintLocation.area || "",
    ai_result.category || "",
    now,
    "Submitted",
    ai_result,
    existing
  );

  const record = {
    id: generateId(),
    citizenId: (citizen.aadhaar || "").replace(/\s+/g, ""),
    citizenName: citizen.name || "",
    citizenPhone: citizen.mobile || "",
    citizenEmail: citizen.email || "",
    citizenAddress: citizen.address || "",
    title: complaint.title,
    description: complaint.description,
    area: complaintLocation.area,
    address: complaintLocation.area,
    landmark: complaintLocation.landmark || null,
    pinCode: complaintLocation.pinCode || null,
    department: ai_result.department,
    category: ai_result.category,
    priority: p.priorityLevel,
    ai_severity: ai_result.severity,
    ai_confidence: ai_result.confidence,
    ai_reason: p.reason,
    ai_keywords: ai_result.keywords,
    ai_summary: ai_result.reason,
    priorityScore: p.priorityScore,
    priorityLevel: p.priorityLevel,
    priorityBreakdown: p.priorityBreakdown,
    priorityReason: p.reason,
    is_escalated: false,
    assigned_officer: "Officer Sharma",
    rating: null,
    feedback: null,
    status: "Submitted",
    imagePreview: imagePreview || null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    evidence_verdict: null,
    evidence_reason: null,
    evidence_confidence: null,
    createdAt: now,
    submitted_at: now,
    updatedAt: now,
  };

  existing.push(record);
  _writeAll(existing);
  return record;
};

export const localUpdateComplaint = async (id, data) => {
  const all = _readAll();
  const idx = findIndexOrThrow(all, id);
  all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
  _writeAll(all);
  return all[idx];
};

export const localUpdateStatus = async (id, newStatus) => {
  const extra = {};
  // Reopening resets escalation, mirroring the backend
  if (newStatus === "In Progress") extra.is_escalated = false;
  return localUpdateComplaint(id, { status: newStatus, ...extra });
};

export const localConfirmResolution = async (id, rating, feedback) =>
  localUpdateComplaint(id, { status: "Closed", rating, feedback: feedback || null, is_escalated: false });

export const localClassify = async (id) => {
  const all = _readAll();
  const idx = findIndexOrThrow(all, id);
  const c = all[idx];

  const ai_result = runLocalClassification(c.title || "", c.description || "");
  const p = calculateLocalPriority(
    c.description || "",
    c.area || "",
    ai_result.category || "",
    c.createdAt || c.submitted_at,
    c.status || "Submitted",
    ai_result,
    all.filter((other) => other.id !== c.id)
  );

  all[idx] = {
    ...c,
    department: ai_result.department,
    category: ai_result.category,
    priority: p.priorityLevel,
    ai_severity: ai_result.severity,
    ai_confidence: ai_result.confidence,
    ai_reason: p.reason,
    ai_keywords: ai_result.keywords,
    ai_summary: ai_result.reason,
    priorityScore: p.priorityScore,
    priorityLevel: p.priorityLevel,
    priorityBreakdown: p.priorityBreakdown,
    updatedAt: new Date().toISOString(),
  };

  _writeAll(all);
  return all[idx];
};

export const localAuditEvidence = async (id) => {
  const all = _readAll();
  const idx = findIndexOrThrow(all, id);
  const c = all[idx];

  if (!c.imagePreview && !c.image_url) {
    throw new Error("This complaint has no attached evidence image to analyze.");
  }

  all[idx] = {
    ...c,
    evidence_verdict: "MATCH",
    evidence_reason: "Evidence verified — image matches the complaint description. (offline simulation)",
    evidence_confidence: 0.95,
    updatedAt: new Date().toISOString(),
  };

  _writeAll(all);
  return all[idx];
};
