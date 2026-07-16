"""
AI Classification Service
--------------------------
Attempts to classify grievance text using a local Ollama LLM.
If Ollama is unavailable or returns an unparseable response,
falls back to a deterministic keyword-based classifier so the
system stays functional during development / demo.
"""

import os
import re
import json
import base64
import requests
from typing import Dict

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "llama3.2-vision")
OLLAMA_TIMEOUT = 15  # seconds

DEPARTMENTS = [
    "Roads", "Water Supply", "Electricity", "Sanitation",
    "Drainage", "Street Lights", "Public Transport", "Other"
]

PRIORITIES = ["Low", "Medium", "High"]

# ---------------------------------------------------------------------------
# Keyword-based fallback classifier
# ---------------------------------------------------------------------------

_DEPT_KEYWORDS: Dict[str, list] = {
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
}

_PRIORITY_KEYWORDS: Dict[str, list] = {
    "High": [
        "urgent", "emergency", "danger", "dangerous", "immediate",
        "critical", "accident", "injury", "death", "fire", "electrocute",
        "collapse", "flood", "severe", "major", "fatal"
    ],
    "Low": [
        "minor", "small", "slight", "little", "cosmetic", "tiny",
        "not urgent", "eventually", "whenever possible"
    ],
}


def _keyword_classify(text: str) -> Dict[str, str]:
    """Rule-based fallback: score each department by keyword hits."""
    lower = text.lower()

    # Department scoring
    dept_scores = {dept: 0 for dept in DEPARTMENTS}
    for dept, keywords in _DEPT_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                dept_scores[dept] += 1

    best_dept = max(dept_scores, key=dept_scores.get)
    if dept_scores[best_dept] == 0:
        best_dept = "Other"

    # Priority scoring
    priority = "Medium"
    for level, keywords in _PRIORITY_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            priority = level
            break

    # Category: use the strongest keyword match as the category label
    category_map = {
        "Roads": "Road Damage",
        "Water Supply": "Water Issue",
        "Electricity": "Power Outage",
        "Sanitation": "Sanitation & Hygiene",
        "Drainage": "Drainage & Flooding",
        "Street Lights": "Street Lighting",
        "Public Transport": "Transport Issue",
        "Other": "General Complaint",
    }
    category = category_map.get(best_dept, "General Complaint")

    # Generate a short deterministic summary
    summary = f"{category} reported at the mentioned location. Priority assessed as {priority}. Routed to {best_dept} department for resolution."

    return {
        "department": best_dept,
        "category": category,
        "priority": priority,
        "ai_summary": summary,
        "source": "keyword_fallback",
    }


# ---------------------------------------------------------------------------
# Ollama integration
# ---------------------------------------------------------------------------

_PROMPT_TEMPLATE = """You are an AI assistant for a government grievance system.
Analyze the following citizen complaint and return ONLY a valid JSON object with these fields:
- department: one of [Roads, Water Supply, Electricity, Sanitation, Drainage, Street Lights, Public Transport, Other]
- category: a short label for the specific issue type (e.g. Pothole, Water Leakage, Power Outage)
- priority: one of [Low, Medium, High]
- ai_summary: a single concise sentence summarizing the complaint

Complaint:
\"\"\"{description}\"\"\"

Respond with ONLY the JSON object. No explanation, no markdown.
Example: {{"department":"Roads","category":"Pothole","priority":"High","ai_summary":"Large pothole on NH-8 causing traffic disruption."}}"""


def _call_ollama(description: str) -> Dict[str, str] | None:
    """
    Calls the local Ollama API. Returns a parsed dict on success,
    or None if Ollama is unreachable or returns invalid JSON.
    """
    prompt = _PROMPT_TEMPLATE.format(description=description)
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.1, "num_predict": 200},
    }

    try:
        response = requests.post(
            f"{OLLAMA_API_URL}/api/generate",
            json=payload,
            timeout=OLLAMA_TIMEOUT,
        )
        response.raise_for_status()
        raw = response.json().get("response", "")

        # Extract JSON substring if the model wraps it in prose
        json_match = re.search(r"\{.*?\}", raw, re.DOTALL)
        if not json_match:
            return None

        parsed = json.loads(json_match.group())

        # Validate required keys and allowed values
        dept = parsed.get("department", "Other")
        if dept not in DEPARTMENTS:
            dept = "Other"
        priority = parsed.get("priority", "Medium")
        if priority not in PRIORITIES:
            priority = "Medium"

        return {
            "department": dept,
            "category": parsed.get("category", "General Complaint"),
            "priority": priority,
            "ai_summary": parsed.get("ai_summary", ""),
            "source": "ollama",
        }

    except requests.exceptions.ConnectionError:
        print(f"[AI Service] Ollama not reachable at {OLLAMA_API_URL}. Using fallback.")
        return None
    except requests.exceptions.Timeout:
        print("[AI Service] Ollama request timed out. Using fallback.")
        return None
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        print(f"[AI Service] Failed to parse Ollama response: {e}. Using fallback.")
        return None


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def classify_complaint(description: str) -> Dict[str, str]:
    """
    Main entry point. Tries Ollama first; falls back to keyword classifier.
    Always returns a dict with: department, category, priority, ai_summary, source.
    """
    if not description or not description.strip():
        return {
            "department": "Other",
            "category": "General Complaint",
            "priority": "Medium",
            "ai_summary": "No description provided.",
            "source": "default",
        }

    result = _call_ollama(description)
    if result:
        return result

    return _keyword_classify(description)


# ---------------------------------------------------------------------------
# Vision Evidence Audit
# ---------------------------------------------------------------------------

_VISION_PROMPT_TEMPLATE = """You are an AI evidence auditor for a government grievance portal.
A citizen has submitted a complaint with the following description:
\"\"\"{description}\"\"\"

Carefully examine the attached image and determine if it is consistent with the above complaint.
Return ONLY a valid JSON object with these fields:
- verdict: one of [MATCH, MISMATCH, UNCERTAIN]
  - MATCH: the image clearly shows the reported issue
  - MISMATCH: the image is unrelated or contradicts the complaint (possible fraud)
  - UNCERTAIN: the image is ambiguous, too dark, irrelevant metadata, or unreadable
- reason: a single sentence explaining your verdict
- confidence: a float between 0.0 (no confidence) and 1.0 (fully confident)

Respond with ONLY the JSON object. No explanation, no markdown.
Example: {{"verdict":"MATCH","reason":"Image clearly shows a pothole on a road surface.","confidence":0.92}}"""


def _fallback_audit(reason: str) -> Dict:
    return {
        "verdict": "UNCERTAIN",
        "reason": reason,
        "confidence": 0.0,
        "source": "fallback",
    }


def analyze_evidence(image_path: str, description: str) -> Dict:
    """
    Calls the Ollama Vision model to audit whether the uploaded image
    is consistent with the complaint description.

    Returns a dict with: verdict, reason, confidence, source.
    Falls back gracefully if the model or file is unavailable.
    """
    if not image_path or not description:
        return _fallback_audit("Missing image path or complaint description.")

    # Read and base64-encode the image
    try:
        with open(image_path, "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode("utf-8")
    except FileNotFoundError:
        return _fallback_audit(f"Evidence image not found at path: {image_path}")
    except Exception as e:
        return _fallback_audit(f"Failed to read evidence image: {str(e)}")

    prompt = _VISION_PROMPT_TEMPLATE.format(description=description)

    # Detect image format from extension
    ext = os.path.splitext(image_path)[1].lower().lstrip(".")
    mime_map = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png", "gif": "gif", "webp": "webp"}
    img_format = mime_map.get(ext, "jpeg")

    payload = {
        "model": OLLAMA_VISION_MODEL,
        "prompt": prompt,
        "images": [image_b64],
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.1, "num_predict": 250},
    }

    try:
        response = requests.post(
            f"{OLLAMA_API_URL}/api/generate",
            json=payload,
            timeout=60,  # Vision models are slower
        )
        response.raise_for_status()
        raw = response.json().get("response", "")

        json_match = re.search(r"\{.*?\}", raw, re.DOTALL)
        if not json_match:
            return _fallback_audit("Vision model returned unparseable response.")

        parsed = json.loads(json_match.group())
        verdict = parsed.get("verdict", "UNCERTAIN")
        if verdict not in ["MATCH", "MISMATCH", "UNCERTAIN"]:
            verdict = "UNCERTAIN"

        confidence = parsed.get("confidence", 0.5)
        try:
            confidence = float(confidence)
            confidence = max(0.0, min(1.0, confidence))
        except (TypeError, ValueError):
            confidence = 0.5

        return {
            "verdict": verdict,
            "reason": parsed.get("reason", "No reason provided."),
            "confidence": confidence,
            "source": "ollama_vision",
        }

    except requests.exceptions.ConnectionError:
        print(f"[Vision AI] Ollama Vision not reachable at {OLLAMA_API_URL}. Using fallback.")
        return _fallback_audit("Vision model service is currently unavailable.")
    except requests.exceptions.Timeout:
        print("[Vision AI] Ollama Vision request timed out.")
        return _fallback_audit("Vision model request timed out. Please try again.")
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        print(f"[Vision AI] Failed to parse vision response: {e}")
        return _fallback_audit("Failed to parse vision model response.")


# ---------------------------------------------------------------------------
# Fix Verification: before/after resolution audit (closed-loop accountability)
# ---------------------------------------------------------------------------

_FIX_PROMPT_TWO_IMAGES = """You are an AI resolution auditor for a government grievance portal.
A citizen reported this issue:
\"\"\"{description}\"\"\"

You are given TWO images:
- Image 1 (BEFORE): the citizen's original evidence of the problem.
- Image 2 (AFTER): the photo the repair crew submitted as proof that the issue is fixed.

Compare them and decide whether the reported issue has genuinely been resolved.
Return ONLY a valid JSON object with:
- verdict: one of [FIXED, NOT_FIXED, UNCERTAIN]
  - FIXED: the after photo clearly shows the issue is repaired/resolved
  - NOT_FIXED: the issue is still visible, or the after photo shows the same unresolved problem
  - UNCERTAIN: the photos are too ambiguous, dark, or unrelated to judge
- reason: one sentence explaining your verdict
- confidence: a float between 0.0 and 1.0

Respond with ONLY the JSON object. No explanation, no markdown.
Example: {{"verdict":"FIXED","reason":"The pothole visible in the before image has been filled with fresh asphalt in the after image.","confidence":0.9}}"""

_FIX_PROMPT_ONE_IMAGE = """You are an AI resolution auditor for a government grievance portal.
A citizen reported this issue:
\"\"\"{description}\"\"\"

You are given ONE image: the photo the repair crew submitted as proof that the issue is now fixed.
Decide whether it credibly shows the reported issue has been resolved.
Return ONLY a valid JSON object with:
- verdict: one of [FIXED, NOT_FIXED, UNCERTAIN]
- reason: one sentence explaining your verdict
- confidence: a float between 0.0 and 1.0

Respond with ONLY the JSON object. No explanation, no markdown."""


def _fallback_fix(reason: str) -> Dict:
    return {
        "verdict": "UNCERTAIN",
        "reason": reason,
        "confidence": 0.0,
        "source": "fallback",
    }


def _read_b64(path: str) -> str | None:
    try:
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    except Exception:
        return None


def verify_fix(before_path: str | None, after_path: str, description: str) -> Dict:
    """
    Vision-audits a resolution: compares the citizen's BEFORE evidence with
    the crew's AFTER photo and verdicts FIXED / NOT_FIXED / UNCERTAIN.
    Falls back gracefully (UNCERTAIN) when the vision model is unavailable,
    so resolution flows keep working without Ollama.
    """
    if not after_path or not description:
        return _fallback_fix("Missing fix photo or complaint description.")

    after_b64 = _read_b64(after_path)
    if not after_b64:
        return _fallback_fix("Could not read the uploaded fix photo.")

    images = []
    before_b64 = _read_b64(before_path) if before_path else None
    if before_b64:
        images = [before_b64, after_b64]
        prompt = _FIX_PROMPT_TWO_IMAGES.format(description=description)
    else:
        images = [after_b64]
        prompt = _FIX_PROMPT_ONE_IMAGE.format(description=description)

    payload = {
        "model": OLLAMA_VISION_MODEL,
        "prompt": prompt,
        "images": images,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.1, "num_predict": 250},
    }

    try:
        response = requests.post(
            f"{OLLAMA_API_URL}/api/generate",
            json=payload,
            timeout=90,  # two images are slower
        )
        response.raise_for_status()
        raw = response.json().get("response", "")

        json_match = re.search(r"\{.*?\}", raw, re.DOTALL)
        if not json_match:
            return _fallback_fix("Vision model returned an unparseable response.")

        parsed = json.loads(json_match.group())
        verdict = parsed.get("verdict", "UNCERTAIN")
        if verdict not in ["FIXED", "NOT_FIXED", "UNCERTAIN"]:
            verdict = "UNCERTAIN"

        confidence = parsed.get("confidence", 0.5)
        try:
            confidence = max(0.0, min(1.0, float(confidence)))
        except (TypeError, ValueError):
            confidence = 0.5

        return {
            "verdict": verdict,
            "reason": parsed.get("reason", "No reason provided."),
            "confidence": confidence,
            "source": "ollama_vision",
        }

    except requests.exceptions.ConnectionError:
        print(f"[Fix Verify] Ollama Vision not reachable at {OLLAMA_API_URL}. Using fallback.")
        return _fallback_fix("Vision model service is currently unavailable.")
    except requests.exceptions.Timeout:
        print("[Fix Verify] Ollama Vision request timed out.")
        return _fallback_fix("Vision model request timed out. Please try again.")
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        print(f"[Fix Verify] Failed to parse vision response: {e}")
        return _fallback_fix("Failed to parse vision model response.")


# ---------------------------------------------------------------------------
# Voice Assist: any-language dictation → English complaint draft
# ---------------------------------------------------------------------------

_VOICE_PROMPT_TEMPLATE = """You are an AI assistant for a government grievance portal in India.
A citizen dictated a complaint by voice. The raw speech transcript (language code: {language}) is:
\"\"\"{transcript}\"\"\"

Convert it into a clean ENGLISH complaint draft. Return ONLY a valid JSON object with:
- title: a short complaint title in English (max 10 words)
- description: a clear, formal English description of the issue (2-4 sentences, first person, keep every factual detail: places, times, what is broken/unsafe)

If the transcript is already in English, just clean it up.
Respond with ONLY the JSON object. No explanation, no markdown.
Example: {{"title":"Water pipeline leaking on Main Road","description":"There is a major water pipeline leak on Main Road near the bus stand. Water has been flowing onto the street since yesterday morning and the road is flooding."}}"""

LANGUAGE_NAMES = {
    "en": "English", "hi": "Hindi", "mr": "Marathi", "ta": "Tamil",
    "te": "Telugu", "kn": "Kannada", "bn": "Bengali", "gu": "Gujarati",
    "ml": "Malayalam", "pa": "Punjabi", "ur": "Urdu",
}


def voice_assist(transcript: str, language: str = "en") -> Dict:
    """
    Turns a raw voice transcript (any language) into an English complaint
    draft {title, description}. Falls back to the raw transcript if Ollama
    is unavailable so dictation always works.
    """
    lang_code = (language or "en").split("-")[0].lower()
    lang_name = LANGUAGE_NAMES.get(lang_code, lang_code)

    fallback = {
        "title": " ".join(transcript.split()[:8]),
        "description": transcript.strip(),
        "detected_language": lang_name,
        "translated": False,
        "source": "fallback",
    }

    prompt = _VOICE_PROMPT_TEMPLATE.format(transcript=transcript, language=lang_name)
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.2, "num_predict": 300},
    }

    try:
        response = requests.post(
            f"{OLLAMA_API_URL}/api/generate",
            json=payload,
            timeout=OLLAMA_TIMEOUT * 2,
        )
        response.raise_for_status()
        raw = response.json().get("response", "")
        json_match = re.search(r"\{.*?\}", raw, re.DOTALL)
        if not json_match:
            return fallback
        parsed = json.loads(json_match.group())
        title = (parsed.get("title") or "").strip()
        description = (parsed.get("description") or "").strip()
        if not description:
            return fallback
        return {
            "title": title[:150] or fallback["title"],
            "description": description[:1000],
            "detected_language": lang_name,
            "translated": lang_code != "en",
            "source": "ollama",
        }
    except requests.exceptions.RequestException:
        print(f"[Voice Assist] Ollama not reachable at {OLLAMA_API_URL}. Returning raw transcript.")
        return fallback
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        print(f"[Voice Assist] Failed to parse response: {e}. Returning raw transcript.")
        return fallback
