"""
AI Classifier Service
---------------------
Classifies government complaints into departments, categories, priority,
severity, confidence, reasoning, and keywords using a local Ollama LLM
or a robust keyword-based rule system.
"""

import os
import re
import json
import requests
from typing import Dict, Any, List

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_TIMEOUT = 10  # seconds

DEPARTMENTS = [
    "Roads and Drainage",
    "Electricity Department",
    "Water Supply Department",
    "Solid Waste Management",
    "Public Health",
    "Traffic Police",
    "Pollution Control Board",
    "Parks and Gardens",
    "Fire Department",
    "Municipal Corporation",
    "Women Safety Cell",
    "Cyber Crime",
    "Police",
    "Animal Control",
    "Other"
]

PRIORITIES = ["Low", "Medium", "High"]
SEVERITIES = ["Minor", "Moderate", "Major", "Critical"]

# ─── Robust Rule-Based Fallback Classifier ──────────────────────────────────
_DEPT_KEYWORDS: Dict[str, List[str]] = {
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
}

_PRIORITY_KEYWORDS: Dict[str, List[str]] = {
    "High": [
        "urgent", "emergency", "danger", "dangerous", "immediate",
        "critical", "accident", "injury", "death", "fire", "electrocute",
        "collapse", "flood", "severe", "major", "fatal", "risk"
    ],
    "Low": [
        "minor", "small", "slight", "little", "cosmetic", "tiny",
        "not urgent", "eventually", "whenever possible"
    ],
}


def _fallback_classify(title: str, description: str) -> Dict[str, Any]:
    text = (title + " " + description).lower()

    # Department Scoring
    dept_scores = {dept: 0 for dept in DEPARTMENTS}
    for dept, keywords in _DEPT_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                dept_scores[dept] += 1

    best_dept = max(dept_scores, key=dept_scores.get)
    if dept_scores[best_dept] == 0:
        best_dept = "Other"

    # Category Mapping
    category_map = {
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
    }
    category = category_map.get(best_dept, "General Grievance")

    # Priority Scoring
    priority = "Medium"
    for level, keywords in _PRIORITY_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            priority = level
            break

    # Severity Scoring
    severity = "Moderate"
    if priority == "High":
        severity = "Critical"
    elif priority == "Low":
        severity = "Minor"

    # Extract keywords found
    found_keywords = []
    for keywords in _DEPT_KEYWORDS.values():
        for kw in keywords:
            if kw in text and kw not in found_keywords:
                found_keywords.append(kw)

    is_essential = best_dept in ["Electricity Department", "Water Supply Department", "Public Health", "Fire Department"]
    fallback_reason = "Ollama offline or returned invalid response. Fallback rule-based matching was used."
    return {
        "department": best_dept,
        "category": category,
        "priority": priority,
        "severity": severity,
        "confidence": 0.0,
        "reason": fallback_reason,
        "keywords": found_keywords[:5],
        "safetyRisk": priority,  # Fallback maps safetyRisk to priority level
        "publicImpact": priority,  # Fallback maps publicImpact to priority level
        "essentialService": is_essential,
        "urgency": priority,  # Fallback maps urgency to priority level
        "summary": description[:100] + "..." if len(description) > 100 else description,
        "reasoning": fallback_reason
    }


# ─── System Prompt ──────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """You are an expert municipal complaint classifier.
Given a complaint title, description, and optional location, analyze the complaint and extract structured information.
Identify:
1. department: The correct government department from this list ONLY:
   [Roads and Drainage, Electricity Department, Water Supply Department, Solid Waste Management, Public Health, Traffic Police, Pollution Control Board, Parks and Gardens, Fire Department, Municipal Corporation, Women Safety Cell, Cyber Crime, Police, Animal Control, Other]
2. category: A specific complaint category (e.g. "Pothole", "Water Leakage", "Illegal Parking", "Garbage Pile", "Stray Dog Bite").
3. summary: A single concise sentence summarizing the complaint.
4. severity: one of [Low, Medium, High, Critical]
5. urgency: one of [Low, Medium, High]
6. safetyRisk: one of [Low, Medium, High]
7. publicImpact: one of [Low, Medium, High]
8. essentialService: true (boolean) if it disrupts vital public resources like electricity, main drinking water pipeline, critical fire hazards, public hospitals; false otherwise.
9. reasoning: a single sentence explaining why this classification was made.

Return ONLY a valid JSON object. No explanation, no markdown blocks.

Output JSON format template:
{
  "category": "Water Logging",
  "department": "Roads and Drainage",
  "summary": "Heavy water accumulation near bus stand wasting fresh water.",
  "severity": "High",
  "urgency": "High",
  "safetyRisk": "High",
  "publicImpact": "High",
  "essentialService": true,
  "reasoning": "Complaint describes severe flooding near public transport hotspot."
}"""


def classify_complaint(title: str, description: str, location: str = None) -> Dict[str, Any]:
    """
    Classify municipal grievance using local Ollama model, or fallback to rule-based indexing.
    """
    if not title.strip() and not description.strip():
        return {
            "department": "Other",
            "category": "General",
            "priority": "Medium",
            "severity": "Moderate",
            "confidence": 0.0,
            "reason": "Empty complaint inputs.",
            "keywords": [],
            "safetyRisk": "Medium",
            "publicImpact": "Medium",
            "essentialService": False,
            "urgency": "Medium",
            "summary": "Empty complaint.",
            "reasoning": "No description provided."
        }

    prompt = f"Title: {title}\nDescription: {description}\nLocation: {location or 'Not provided'}"

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "system": _SYSTEM_PROMPT,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.1, "num_predict": 300},
    }

    try:
        response = requests.post(
            f"{OLLAMA_API_URL}/api/generate",
            json=payload,
            timeout=OLLAMA_TIMEOUT
        )
        response.raise_for_status()
        raw = response.json().get("response", "")

        # Safe extraction of JSON body
        json_match = re.search(r"\{.*?\}", raw, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON substring located.")

        parsed = json.loads(json_match.group())

        # Validate department
        dept = parsed.get("department", "Other")
        if dept not in DEPARTMENTS:
            dept = "Other"

        # Validate safetyRisk, publicImpact, urgency
        safety_risk = parsed.get("safetyRisk", "Medium")
        public_impact = parsed.get("publicImpact", "Medium")
        urgency = parsed.get("urgency", "Medium")
        severity = parsed.get("severity", "Medium")

        # Derive a base priority for legacy compatibility
        priority = urgency if urgency in ["Low", "Medium", "High"] else "Medium"

        return {
            "department": dept,
            "category": parsed.get("category", "General"),
            "priority": priority,
            "severity": severity,
            "confidence": 0.9,
            "reason": parsed.get("reasoning", parsed.get("reason", "Classified by AI model.")),
            "keywords": parsed.get("keywords", [])[:5],
            "safetyRisk": safety_risk,
            "publicImpact": public_impact,
            "essentialService": bool(parsed.get("essentialService", False)),
            "urgency": urgency,
            "summary": parsed.get("summary", ""),
            "reasoning": parsed.get("reasoning", "")
        }

    except Exception as e:
        print(f"[AI Classifier] LLM classification failed: {e}. Using rule-based fallback.")
        return _fallback_classify(title, description)
