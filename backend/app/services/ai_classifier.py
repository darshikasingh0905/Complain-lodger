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

    return {
        "department": best_dept,
        "category": category,
        "priority": priority,
        "severity": severity,
        "confidence": 0.0,
        "reason": "Ollama offline or returned invalid response. Fallback rule-based matching was used.",
        "keywords": found_keywords[:5]
    }


# ─── System Prompt ──────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """You are an expert municipal complaint classifier.
Given a complaint title, description, and optional location, identify:
1. The correct government department from this list ONLY:
   [Roads and Drainage, Electricity Department, Water Supply Department, Solid Waste Management, Public Health, Traffic Police, Pollution Control Board, Parks and Gardens, Fire Department, Municipal Corporation, Women Safety Cell, Cyber Crime, Police, Animal Control, Other]
2. A specific complaint category (e.g. "Pothole", "Water Leakage", "Illegal Parking", "Garbage Pile", "Stray Dog Bite").
3. Priority level: one of [Low, Medium, High]
4. Severity level: one of [Minor, Moderate, Major, Critical]
5. Confidence score: a float between 0.00 and 1.00 indicating classification certainty
6. Reason: a single sentence explaining why this classification was made
7. Keywords: a list of up to 5 relevant technical/topic words from the complaint text

Return ONLY a valid JSON object. No explanation, no markdown blocks.

Output JSON format template:
{
  "department": "Roads and Drainage",
  "category": "Water Logging",
  "priority": "High",
  "severity": "Critical",
  "confidence": 0.97,
  "reason": "Complaint describes severe flooding causing dangerous traffic conditions.",
  "keywords": ["flooding", "traffic", "roads", "drainage"]
}"""


def classify_complaint(title: str, description: str, location: str = None) -> Dict[str, Any]:
    """
    Classify municipal grievance using local Ollama model, or fallback to rule-based indexing.
    Always returns: department, category, priority, severity, confidence, reason, keywords
    """
    if not title.strip() and not description.strip():
        return {
            "department": "Other",
            "category": "General",
            "priority": "Medium",
            "severity": "Moderate",
            "confidence": 0.0,
            "reason": "Empty complaint inputs.",
            "keywords": []
        }

    prompt = f"Title: {title}\nDescription: {description}\nLocation: {location or 'Not provided'}"

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "system": _SYSTEM_PROMPT,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.1, "num_predict": 250},
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

        # Validate priority
        priority = parsed.get("priority", "Medium")
        if priority not in PRIORITIES:
            priority = "Medium"

        # Validate severity
        severity = parsed.get("severity", "Moderate")
        if severity not in SEVERITIES:
            severity = "Moderate"

        # Validate confidence
        confidence = parsed.get("confidence", 0.5)
        try:
            confidence = float(confidence)
            confidence = max(0.0, min(1.0, confidence))
        except (TypeError, ValueError):
            confidence = 0.5

        return {
            "department": dept,
            "category": parsed.get("category", "General"),
            "priority": priority,
            "severity": severity,
            "confidence": confidence,
            "reason": parsed.get("reason", "No reason provided by model."),
            "keywords": parsed.get("keywords", [])[:5]
        }

    except Exception as e:
        print(f"[AI Classifier] LLM classification failed: {e}. Using rule-based fallback.")
        return _fallback_classify(title, description)
