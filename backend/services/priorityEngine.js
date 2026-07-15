// Configurable Weights & Max Scores
const CONFIG = {
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

/**
 * Computes priority score, level, breakdown, and explanation.
 * 
 * @param {Object} params
 * @param {string} params.description
 * @param {string} params.address
 * @param {number} params.duplicateCount
 * @param {string} params.createdAt - ISO Date string
 * @param {string} params.status
 * @param {Object} params.aiMetadata - { safetyRisk, publicImpact, essentialService, urgency }
 * 
 * @returns {Object} { priorityScore, priorityLevel, priorityBreakdown, reason }
 */
function calculatePriority({
  description = "",
  address = "",
  duplicateCount = 0,
  createdAt = null,
  status = "Submitted",
  aiMetadata = {}
}) {
  // 1. Safety Risk
  const safetyVal = aiMetadata.safetyRisk || "Medium";
  const safetyScore = CONFIG.safetyRiskMap[safetyVal] !== undefined ? CONFIG.safetyRiskMap[safetyVal] : 15;

  // 2. Public Impact
  const impactVal = aiMetadata.publicImpact || "Medium";
  const impactScore = CONFIG.publicImpactMap[impactVal] !== undefined ? CONFIG.publicImpactMap[impactVal] : 10;

  // 3. Essential Service
  const essentialVal = !!aiMetadata.essentialService;
  const essentialScore = essentialVal ? CONFIG.weights.essentialService : 0;

  // 4. Urgency
  const urgencyVal = aiMetadata.urgency || "Medium";
  const urgencyScore = CONFIG.urgencyMap[urgencyVal] !== undefined ? CONFIG.urgencyMap[urgencyVal] : 5;

  // 5. Duplicate Complaints
  const duplicatesScore = Math.min(CONFIG.weights.duplicates, duplicateCount * 5);

  // 6. Location Importance
  let locationScore = 0;
  const combinedText = `${description} ${address || ""}`.toLowerCase();
  if (CONFIG.locationKeywords.some(kw => combinedText.includes(kw))) {
    locationScore = CONFIG.weights.location;
  }

  // 7. Time Pending
  let timePendingScore = 0;
  if (status !== "Resolved" && createdAt) {
    const elapsedMs = Date.now() - new Date(createdAt).getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    // 1 point per 24 hours pending, capped at 5
    timePendingScore = Math.min(CONFIG.weights.timePending, Math.floor(elapsedHours / 24));
  }

  // Total Score
  let totalScore = safetyScore + impactScore + essentialScore + urgencyScore + duplicatesScore + locationScore + timePendingScore;
  totalScore = Math.max(0, Math.min(100, totalScore));

  // Determine Level
  let level = "Medium";
  if (totalScore >= 81) level = "Critical";
  else if (totalScore >= 61) level = "High";
  else if (totalScore >= 31) level = "Medium";
  else level = "Low";

  // Formulate Reason
  const reasons = [];
  if (safetyScore >= 15) reasons.push(`a safety risk flagged as ${safetyVal}`);
  if (essentialVal) reasons.push("disruption to essential services");
  if (duplicatesScore > 0) reasons.push(`linked to multiple similar reports (${duplicateCount} duplicate(s) detected)`);
  if (locationScore > 0) reasons.push("near critical public location/infrastructure");

  const reason = reasons.length > 0 
    ? `Complaint prioritized due to: ${reasons.join(", and ")}.`
    : `Complaint classified with general parameters. Priority level: ${level}.`;

  return {
    priorityScore: totalScore,
    priorityLevel: level,
    priorityBreakdown: {
      safetyRisk: safetyScore,
      publicImpact: impactScore,
      essentialService: essentialScore,
      urgency: urgencyScore,
      duplicates: duplicatesScore,
      location: locationScore,
      timePending: timePendingScore
    },
    reason
  };
}

module.exports = {
  calculatePriority,
  CONFIG
};
