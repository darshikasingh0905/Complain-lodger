import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
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
    priorityScore: 82,
    priorityLevel: "Critical",
    priorityBreakdown: { safetyRisk: 30, publicImpact: 20, essentialService: 20, urgency: 10, duplicates: 0, location: 5, timePending: 2 },
    priorityReason: "Complaint prioritized due to: a safety risk flagged as Critical, and disruption to essential services, and near critical public location/infrastructure.",
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
    priorityScore: 55,
    priorityLevel: "Medium",
    priorityBreakdown: { safetyRisk: 15, publicImpact: 10, essentialService: 20, urgency: 5, duplicates: 0, location: 0, timePending: 2 },
    priorityReason: "Complaint prioritized due to: disruption to essential services.",
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
    priorityScore: 73,
    priorityLevel: "High",
    priorityBreakdown: { safetyRisk: 30, publicImpact: 20, essentialService: 0, urgency: 10, duplicates: 5, location: 5, timePending: 3 },
    priorityReason: "Complaint prioritized due to: a safety risk flagged as Critical, and linked to multiple similar reports, and near critical public location/infrastructure.",
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
    department: "Solid Waste Management",
    category: "Garbage Accumulation",
    priority: "Low",
    ai_severity: "Minor",
    ai_confidence: 0.90,
    ai_reason: "Roadside garbage accumulation attracting stray animals.",
    ai_keywords: ["garbage", "dump", "roadside"],
    status: "Resolved",
    imagePreview: null,
    latitude: 18.5089,
    longitude: 73.9258,
    priorityScore: 22,
    priorityLevel: "Low",
    priorityBreakdown: { safetyRisk: 5, publicImpact: 5, essentialService: 0, urgency: 2, duplicates: 5, location: 5, timePending: 0 },
    priorityReason: "Complaint classified with general parameters. Priority level: Low.",
    createdAt: "2026-07-10T08:00:00.000Z",
    submitted_at: "2026-07-10T08:00:00.000Z",
    updatedAt: "2026-07-12T16:30:00.000Z"
  }
];

// ─── AI Keyword Classification Rules ──────────────────────────────────────────
const DEPT_KEYWORDS = {
  "Roads and Drainage": [
    "pothole", "road", "highway", "street", "pavement", "crater",
    "bump", "broken road", "repair road", "asphalt", "divider",
    "footpath", "sidewalk", "carriageway", "drainage", "drain",
    "sewage", "overflow", "waterlogging", "flood", "nala",
    "blocked drain", "gutter", "manhole", "overflowing"
  ],
  "Electricity Department": [
    "electricity", "power", "electric", "wire", "transformer",
    "outage", "blackout", "no power", "current", "meter",
    "short circuit", "sparking", "tripping", "voltage"
  ],
  "Water Supply Department": [
    "water", "pipe", "leakage", "leak", "tap", "supply", "shortage",
    "no water", "water cut", "drinking water", "nal", "pipeline",
    "contaminated water", "murky water"
  ],
  "Solid Waste Management": [
    "garbage", "waste", "trash", "rubbish", "litter", "dump",
    "sweeping", "cleanliness", "filth", "smell", "dustbin", "landfill"
  ],
  "Public Health": [
    "health", "medical", "epidemic", "disease", "dengue", "malaria",
    "mosquito", "clinic", "hospital", "hygiene", "sanitation", "open defecation"
  ],
  "Traffic Police": [
    "traffic", "signal", "zebra crossing", "parking", "jam",
    "vehicle", "fine", "congestion", "speeding", "one way"
  ],
  "Pollution Control Board": [
    "pollution", "smoke", "dust", "air quality", "chemical",
    "factory emission", "noise", "loud speaker", "sound pollution"
  ],
  "Parks and Gardens": [
    "park", "garden", "tree", "grass", "branch", "municipal park", "green belt"
  ],
  "Fire Department": [
    "fire", "smoke", "burn", "explosion", "cylinder blast", "rescue"
  ],
  "Municipal Corporation": [
    "tax", "building permission", "birth certificate", "death certificate",
    "encroachment", "hawkers", "license", "shop act"
  ],
  "Women Safety Cell": [
    "harassment", "unsafe", "women safety", "eve teasing", "stalking", "abuse"
  ],
  "Cyber Crime": [
    "cyber", "online fraud", "scam", "phishing", "hacked", "password",
    "hack", "spam", "bank fraud", "credit card fraud"
  ],
  "Police": [
    "theft", "robbery", "fight", "police", "crime", "law and order",
    "brawl", "kidnap", "assault"
  ],
  "Animal Control": [
    "stray dog", "cattle", "monkey menace", "animal bite", "rabies", "pig", "stray"
  ]
};

const PRIORITY_KEYWORDS = {
  "High": [
    "urgent", "emergency", "danger", "dangerous", "immediate",
    "critical", "accident", "injury", "death", "fire", "electrocute",
    "collapse", "flood", "severe", "major", "fatal", "risk"
  ],
  "Low": [
    "minor", "small", "slight", "little", "cosmetic", "tiny",
    "not urgent", "eventually", "whenever possible"
  ],
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
  "Police": "Public Nuisance / Theft",
  "Animal Control": "Stray Animal Menace",
  "Other": "General Grievance"
};

// Local fallback classifier matching backend rules
const runLocalClassification = (title, description) => {
  const text = (title + " " + description).toLowerCase();

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

  const category = CATEGORY_MAP[bestDept] || "General Grievance";

  let priority = "Medium";
  for (const level of Object.keys(PRIORITY_KEYWORDS)) {
    if (PRIORITY_KEYWORDS[level].some(kw => text.includes(kw))) {
      priority = level;
      break;
    }
  }

  const severity = priority === "High" ? "Critical" : priority === "Low" ? "Minor" : "Moderate";

  const foundKeywords = [];
  Object.values(DEPT_KEYWORDS).forEach(list => {
    list.forEach(kw => {
      if (text.includes(kw) && !foundKeywords.includes(kw)) {
        foundKeywords.push(kw);
      }
    });
  });

  return {
    department: bestDept,
    category: category,
    priority: priority,
    severity: severity,
    confidence: 0.0,
    reason: "Ollama offline or API error. Local keyword fallback was applied.",
    keywords: foundKeywords.slice(0, 5)
  };
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

const CONFIG_PRIORITY = {
  weights: {
    safetyRisk: 30,
    publicImpact: 20,
    essentialService: 20,
    urgency: 10,
    duplicates: 10,
    location: 5,
    timePending: 5
  },
  safetyRiskMap: {
    "High": 30,
    "Critical": 30,
    "Medium": 15,
    "Moderate": 15,
    "Low": 5,
    "Minor": 5
  },
  publicImpactMap: {
    "High": 20,
    "Medium": 10,
    "Low": 5
  },
  urgencyMap: {
    "High": 10,
    "Medium": 5,
    "Low": 2
  },
  locationKeywords: [
    "hospital", "clinic", "school", "college", "station", "highway",
    "market", "airport", "bus stand", "bus stop", "metro", "railway"
  ]
};

const NOTIFICATIONS_KEY = 'notifications';

export const getNotifications = async (phone) => {
  await new Promise((r) => setTimeout(r, 60));
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY) || '[]';
    const list = JSON.parse(raw);
    const cleanPhone = (phone || '').replace(/\s+/g, '');
    return list.filter(n => (n.citizen_phone || '').replace(/\s+/g, '') === cleanPhone);
  } catch {
    return [];
  }
};

export const markNotificationAsRead = async (id) => {
  await new Promise((r) => setTimeout(r, 60));
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY) || '[]';
    const list = JSON.parse(raw);
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx].is_read = true;
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
      return { status: "success", id };
    }
  } catch (e) {
    console.error("Error marking notification read", e);
  }
  return { status: "error" };
};

export const createLocalNotification = (complaintId, phone, message, type = "status_change") => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY) || '[]';
    const list = JSON.parse(raw);
    const newNotif = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      complaint_id: complaintId,
      citizen_phone: phone,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    };
    list.unshift(newNotif);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
    
    // Log simulated alerts to console
    console.log(`\n=================== [LOCAL SIMULATED NOTIFICATION] ===================`);
    console.log(`[*] Local Storage Alert for Ticket #${complaintId}:`);
    console.log(`[LOCAL SMS] To +91 ${phone}: "${message}"`);
    console.log(`[LOCAL Email] To citizen_${phone}@gmail.com: "${message}"`);
    console.log(`======================================================================\n`);
    
    return newNotif;
  } catch (e) {
    console.error("Error creating local notification", e);
  }
  return null;
};

const checkLocalSLAsAndEscalate = (list) => {
  const SLA_LIMITS = {
    "Critical": 24,
    "High": 72,
    "Medium": 168,
    "Low": 336
  };
  
  let changed = false;
  
  const updated = list.map(c => {
    if (['Assigned', 'In Progress'].includes(c.status) && !c.is_escalated) {
      const priority = c.priorityLevel || c.priority || 'Medium';
      const limitHours = SLA_LIMITS[priority] || 168;
      
      const elapsedMs = Date.now() - new Date(c.createdAt || c.submitted_at).getTime();
      const elapsedHours = elapsedMs / (1000 * 60 * 60);
      
      if (elapsedHours >= limitHours) {
        c.is_escalated = true;
        changed = true;
        
        // Elevate priority
        const levelUp = {
          "Low": "Medium",
          "Medium": "High",
          "High": "Critical",
          "Critical": "Critical"
        }[priority] || "Critical";
        
        c.priority = levelUp;
        c.priorityLevel = levelUp;
        
        // Create notifications
        const supervisorMsg = `Grievance Ticket #${c.id} has exceeded its SLA of ${limitHours} hours and has been escalated.`;
        createLocalNotification(c.id, c.citizenPhone, supervisorMsg, 'escalation');
        
        const citizenMsg = `Your grievance Ticket #${c.id} has been escalated to senior supervisor review due to resolution delay.`;
        createLocalNotification(c.id, c.citizenPhone, citizenMsg, 'escalation');
      }
    }
    return c;
  });
  
  return { updated, changed };
};

const calculateLocalPriority = (description, address, category, createdAt, status, aiResult, allComplaints, isEscalated = false) => {
  const safetyVal = aiResult.severity || aiResult.safetyRisk || "Medium";
  const safetyScore = CONFIG_PRIORITY.safetyRiskMap[safetyVal] !== undefined ? CONFIG_PRIORITY.safetyRiskMap[safetyVal] : 15;

  const impactVal = aiResult.publicImpact || "Medium";
  const impactScore = CONFIG_PRIORITY.publicImpactMap[impactVal] !== undefined ? CONFIG_PRIORITY.publicImpactMap[impactVal] : 10;

  const essentialVal = !!aiResult.essentialService || ["Electricity Department", "Water Supply Department", "Public Health", "Fire Department"].includes(aiResult.department);
  const essentialScore = essentialVal ? CONFIG_PRIORITY.weights.essentialService : 0;

  const urgencyVal = aiResult.urgency || aiResult.priority || "Medium";
  const urgencyScore = CONFIG_PRIORITY.urgencyMap[urgencyVal] !== undefined ? CONFIG_PRIORITY.urgencyMap[urgencyVal] : 5;

  // Duplicate count
  const duplicateCount = allComplaints.filter(c => c.category === category && c.area === address).length;
  const duplicatesScore = Math.min(CONFIG_PRIORITY.weights.duplicates, duplicateCount * 5);

  let locationScore = 0;
  const combinedText = `${description} ${address || ""}`.toLowerCase();
  if (CONFIG_PRIORITY.locationKeywords.some(kw => combinedText.includes(kw))) {
    locationScore = CONFIG_PRIORITY.weights.location;
  }

  let timePendingScore = 0;
  if (status !== "Resolved" && status !== "Closed" && createdAt) {
    const elapsedMs = Date.now() - new Date(createdAt).getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    timePendingScore = Math.min(CONFIG_PRIORITY.weights.timePending, Math.floor(elapsedHours / 24));
  }

  // SLA Escalation Boost (+20 pts)
  const escalationScore = isEscalated ? 20 : 0;

  const totalScore = safetyScore + impactScore + essentialScore + urgencyScore + duplicatesScore + locationScore + timePendingScore + escalationScore;
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
  if (isEscalated) reasons.push("SLA breach escalation boost");

  const reason = reasons.length > 0 
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
      escalationBoost: escalationScore
    },
    reason
  };
};

// ─── Raw Storage Helpers ──────────────────────────────────────────────────────
const _readAll = () => {
  try {
    const raw = localStorage.getItem(COMPLAINTS_KEY);
    let list = [];
    if (!raw) {
      list = SEED_COMPLAINTS;
      localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(SEED_COMPLAINTS));
    } else {
      list = JSON.parse(raw);
    }
    
    // 1. Run local SLA checks first
    const slaRes = checkLocalSLAsAndEscalate(list);
    list = slaRes.updated;
    let changed = slaRes.changed;
    
    // 2. Automatically recalculate priorities on read to keep pending times / duplicate counts fresh
    const updated = list.map(c => {
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
          department: c.department
        },
        list.filter(other => other.id !== c.id),
        !!c.is_escalated
      );
      
      if (c.priorityScore !== p.priorityScore || c.priorityLevel !== p.priorityLevel || c.is_escalated !== c.is_escalated) {
        changed = true;
        return {
          ...c,
          priorityScore: p.priorityScore,
          priorityLevel: p.priorityLevel,
          priorityBreakdown: p.priorityBreakdown,
          priorityReason: p.reason,
          priority: p.priorityLevel,
          ai_reason: p.reason
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

const _writeAll = (records) => {
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(records));
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get all complaints, optionally filtered by admin role & department.
 * @param {string|null} adminRole - 'super_admin' | 'department_admin' | null
 * @param {string|null} adminDepartment - e.g. 'Roads', 'Electricity'
 * @returns {Promise<Array>}
 */
export const getComplaints = async (adminRole = null, adminDepartment = null) => {
  await new Promise((r) => setTimeout(r, 60));
  const all = _readAll();
  // If department_admin with a set department, return only their complaints
  if (adminRole === 'department_admin' && adminDepartment) {
    return all.filter((c) => {
      const dept = (c.department || '').toLowerCase();
      const target = adminDepartment.toLowerCase();
      // Match department field which may have " Department" suffix or not
      return dept === target || dept.startsWith(target) || dept.includes(target) || target.includes(dept.replace(' department', '').trim());
    });
  }
  return all;
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
 *   complaint       : { title, description }
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

  // Run AI classification pipeline
  let ai_result;
  try {
    const res = await axios.post(`${API_URL}/classify`, {
      title: complaint.title || "",
      description: complaint.description || "",
      location: complaintLocation.area || ""
    });
    ai_result = res.data;
  } catch (err) {
    console.warn("[AI Classifier] Backend offline or error. Using local fallback:", err);
    ai_result = runLocalClassification(complaint.title || "", complaint.description || "");
  }

  const existing = _readAll();

  // Calculate local priority
  const p = calculateLocalPriority(
    complaint.description || "",
    complaintLocation.area || "",
    ai_result.category || "",
    now,
    'Submitted',
    ai_result,
    existing
  );

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
    department:     ai_result.department,
    category:       ai_result.category,
    priority:       p.priorityLevel,
    ai_severity:    ai_result.severity,
    ai_confidence:  ai_result.confidence,
    ai_reason:      p.reason,
    ai_keywords:    ai_result.keywords,
    ai_summary:     ai_result.reason,
    priorityScore:  p.priorityScore,
    priorityLevel:  p.priorityLevel,
    priorityBreakdown: p.priorityBreakdown,
    priorityReason: p.reason,
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

  const oldRecord = all[idx];
  const newRecord = { 
    ...oldRecord, 
    ...data, 
    updatedAt: new Date().toISOString() 
  };
  
  // Check if status changed
  if (data.status && data.status !== oldRecord.status) {
    const msg = `Your grievance Ticket #${id} status has been updated to '${data.status}'.`;
    createLocalNotification(id, oldRecord.citizenPhone, msg, "status_change");
    
    if (data.status === "In Progress" && ["Resolved", "Closed"].includes(oldRecord.status)) {
      newRecord.is_escalated = false;
      const officerMsg = `[OFFICER ALERT] Complaint #${id} has been REOPENED by the citizen. Please resume resolution immediately.`;
      console.log(`\n=================== [LOCAL OFFICER ALERT] ===================`);
      console.log(`[*] Dispatching reopen alert to Officer: ${oldRecord.assigned_officer || 'Officer Sharma'}`);
      console.log(`[ALERT Message]: "${officerMsg}"`);
      console.log(`=============================================================\n`);
    }
  }

  all[idx] = newRecord;
  _writeAll(all);
  return all[idx];
};

/**
 * Confirms resolution of a complaint, saves rating/feedback, and changes status to Closed.
 * @param {string} id
 * @param {number} rating
 * @param {string} feedback
 * @returns {Promise<Object>} Updated complaint record
 */
export const confirmResolution = async (id, rating, feedback) => {
  try {
    const res = await axios.post(`${API_URL}/complaints/${id}/confirm-resolution`, { rating, feedback });
    return res.data;
  } catch (err) {
    console.warn("[Resolution] Backend offline or error. Confirming locally:", err);
    await new Promise((r) => setTimeout(r, 200));
    
    const all = _readAll();
    const idx = all.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
    if (idx === -1) throw new Error(`Complaint ${id} not found.`);
    
    const c = all[idx];
    all[idx] = {
      ...c,
      status: 'Closed',
      rating: rating,
      feedback: feedback,
      is_escalated: false,
      updatedAt: new Date().toISOString()
    };
    
    _writeAll(all);
    
    // Create local notification
    const msg = `Thank you for confirming resolution for Ticket #${id}. Your feedback and ${rating}-star rating have been recorded.`;
    createLocalNotification(id, c.citizenPhone, msg, "feedback");
    
    return all[idx];
  }
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

// ─── AI Classifier Operations (Offline/Online Support) ──────────────────────

/**
 * Perform AI classification on a complaint description (Re-run classifier).
 * @param {string} id
 * @returns {Promise<Object>} Updated complaint record
 */
export const classifyComplaintAI = async (id) => {
  await new Promise((r) => setTimeout(r, 500));
  const all = _readAll();
  const idx = all.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
  if (idx === -1) throw new Error(`Complaint ${id} not found.`);

  const c = all[idx];
  let ai_result;

  try {
    const res = await axios.post(`${API_URL}/classify`, {
      title: c.title || "",
      description: c.description || "",
      location: c.area || ""
    });
    ai_result = res.data;
  } catch (err) {
    console.warn("[AI Classifier] Backend offline or error. Using local fallback:", err);
    ai_result = runLocalClassification(c.title || "", c.description || "");
  }

  // Calculate local priority
  const p = calculateLocalPriority(
    c.description || "",
    c.area || "",
    ai_result.category || "",
    c.createdAt || c.submitted_at,
    c.status || "Submitted",
    ai_result,
    all.filter(other => other.id !== c.id)
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

export const updateComplaintStatus = async (id, newStatus) => {
  return updateComplaint(id, { status: newStatus });
};

export const submitComplaint = createComplaint;
