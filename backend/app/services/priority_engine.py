import re
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.complaint import Complaint

# Configurable Weights/Max Scores
MAX_SAFETY_RISK = 30
MAX_PUBLIC_IMPACT = 20
MAX_ESSENTIAL_SERVICE = 20
MAX_URGENCY = 10
MAX_DUPLICATES = 10
MAX_LOCATION = 5
MAX_TIME_PENDING = 5
MAX_WOMEN_SAFETY = 15  # boost for women-safety related grievances

# Women-safety detection: matched against category + description + address.
# These complaints get a dedicated priority boost so they surface first.
WOMEN_SAFETY_KEYWORDS = [
    "harass", "stalk", "eve teasing", "eve-teasing", "molest", "lewd",
    "women safety", "unsafe for women", "catcall", "followed me",
    "inappropriate touch", "chain snatch", "snatching", "robbery",
    "kidnap", "assault", "unsafe at night", "drunk men", "misbehav",
]

# Mapping Factors
SAFETY_RISK_MAP = {
    "High": 30,
    "Critical": 30,
    "Medium": 15,
    "Moderate": 15,
    "Low": 5,
    "Minor": 5
}

PUBLIC_IMPACT_MAP = {
    "High": 20,
    "Medium": 10,
    "Low": 5
}

URGENCY_MAP = {
    "High": 10,
    "Medium": 5,
    "Low": 2
}

LOCATION_KEYWORDS = [
    "hospital", "clinic", "school", "college", "station", "highway",
    "market", "airport", "bus stand", "bus stop", "metro", "railway"
]

def calculate_priority(
    db: Session,
    complaint_id: int,
    description: str,
    address: str,
    category: str,
    created_at: datetime,
    status: str,
    ai_metadata: dict,
    is_escalated: bool = False
    ai_metadata: dict,
    is_escalated: bool = False
) -> dict:
    """
    Computes a transparent rule-based priority score between 0 and 100.
    Returns:
        {
            "priorityScore": int,
            "priorityLevel": str,
            "priorityBreakdown": dict,
            "reason": str
        }
    """
    # 1. Safety Risk
    safety_risk_val = ai_metadata.get("safetyRisk", "Medium")
    safety_score = SAFETY_RISK_MAP.get(safety_risk_val, 15)
    
    # 2. Public Impact
    public_impact_val = ai_metadata.get("publicImpact", "Medium")
    impact_score = PUBLIC_IMPACT_MAP.get(public_impact_val, 10)
    
    # 3. Essential Service
    essential_val = ai_metadata.get("essentialService", False)
    essential_score = MAX_ESSENTIAL_SERVICE if essential_val else 0
    
    # 4. Urgency
    urgency_val = ai_metadata.get("urgency", "Medium")
    urgency_score = URGENCY_MAP.get(urgency_val, 5)
    
    # 5. Duplicate Complaints (same category and address or within same area)
    duplicate_count = 0
    if category and address and db:
        try:
            duplicate_count = (
                db.query(Complaint)
                .filter(
                    Complaint.category == category,
                    Complaint.address == address,
                    Complaint.id != complaint_id
                )
                .count()
            )
        except Exception as e:
            print(f"[Priority Engine] Error counting duplicates: {e}")
            
    # Score duplicate complaints: 5 points for 1 duplicate, 10 points for 2+ duplicates
    duplicates_score = min(MAX_DUPLICATES, duplicate_count * 5)
    
    # 6. Location Importance
    location_score = 0
    combined_text = (description + " " + (address or "")).lower()
    if any(kw in combined_text for kw in LOCATION_KEYWORDS):
        location_score = MAX_LOCATION
        
    # 7. Time Pending
    time_pending_score = 0
    if status not in ["Resolved", "Closed"] and created_at:
    if status not in ["Resolved", "Closed"] and created_at:
        hours_pending = (datetime.now() - created_at).total_seconds() / 3600
        # 1 point per 24 hours pending, capped at 5
        time_pending_score = min(MAX_TIME_PENDING, int(hours_pending // 24))

    # 8. SLA Escalation Boost (+20 points)
    escalation_score = 20 if is_escalated else 0

    # 9. Women Safety Boost (+15 points)
    # Detected from the AI category (Women Safety Cell) or safety keywords in
    # the complaint text — these grievances must never sit at the bottom.
    category_l = (category or "").lower()
    women_safety_score = 0
    if (
        "eve teasing" in category_l
        or "unsafe spot" in category_l
        or "women" in category_l
        or any(kw in combined_text for kw in WOMEN_SAFETY_KEYWORDS)
    ):
        women_safety_score = MAX_WOMEN_SAFETY

    # Total Score Calculation
    total_score = (
        safety_score +
        impact_score +
        essential_score +
        urgency_score +
        duplicates_score +
        location_score +
        time_pending_score +
        escalation_score +
        women_safety_score
    )
    total_score = max(0, min(100, total_score))
    
    # Determine Priority Level
    if total_score >= 81:
        level = "Critical"
    elif total_score >= 61:
        level = "High"
    elif total_score >= 31:
        level = "Medium"
    else:
        level = "Low"
        
    # Build Reason Explanation
    reasons = []
    if safety_score >= 15:
        reasons.append(f"a safety risk flagged as {safety_risk_val}")
    if essential_val:
        reasons.append("disruption to essential services")
    if duplicates_score > 0:
        reasons.append(f"linked to multiple similar reports ({duplicate_count} duplicate(s) detected)")
    if location_score > 0:
        reasons.append("near critical public location/infrastructure")
    if is_escalated:
        reasons.append("SLA breach escalation boost")
    if women_safety_score > 0:
        reasons.append("flagged as a public-safety concern (dedicated priority boost applied)")

    if reasons:
        reason_explanation = f"Complaint prioritized due to: {', and '.join(reasons)}."
    else:
        reason_explanation = f"Complaint classified with general parameters. Priority level: {level}."
        
    return {
        "priorityScore": total_score,
        "priorityLevel": level,
        "priorityBreakdown": {
            "safetyRisk": safety_score,
            "publicImpact": impact_score,
            "essentialService": essential_score,
            "urgency": urgency_score,
            "duplicates": duplicates_score,
            "location": location_score,
            "timePending": time_pending_score,
            "escalationBoost": escalation_score,
            "womenSafety": women_safety_score
        },
        "reason": reason_explanation
    }
