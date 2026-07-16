"""
Public Accountability Scoreboard
--------------------------------
Ranks every department by real performance: resolution speed, SLA
compliance, citizen satisfaction and resolution rate. Served publicly
(no login) so citizens can hold departments accountable.

An optional one-line AI city summary is generated via Ollama with a strict
timeout; a deterministic template is used when the model is offline.
"""

import os
import requests
from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy.orm import Session
from app.models.complaint import Complaint

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

RESOLVED_STATES = ("Resolved", "Closed")


def _grade(score: float) -> str:
    if score >= 85: return "A+"
    if score >= 70: return "A"
    if score >= 55: return "B"
    if score >= 40: return "C"
    return "D"


def _hours_between(a: Optional[datetime], b: Optional[datetime]) -> Optional[float]:
    if not a or not b:
        return None
    try:
        return max(0.0, (b - a).total_seconds() / 3600.0)
    except Exception:
        return None


def _insight(d: Dict) -> str:
    """Deterministic one-liner per department."""
    if d["total"] == 0:
        return "No complaints recorded yet."
    if d["grade"] in ("A+", "A"):
        return f"Strong performer — {d['resolution_rate']}% resolved with {d['sla_breach_pct']}% SLA breaches."
    if d["sla_breach_pct"] >= 30:
        return f"Needs attention — {d['sla_breach_pct']}% of tickets breached their SLA."
    if d["resolution_rate"] < 40:
        return f"Backlog building — only {d['resolution_rate']}% of complaints resolved so far."
    return f"Steady — {d['resolution_rate']}% resolved, average fix in {d['avg_resolution_hours'] or '—'}h."


def _ai_city_summary(departments: List[Dict], overall: Dict) -> Dict:
    """One-line AI summary of city performance. Fast timeout + fallback."""
    fallback = (
        f"{overall['resolved']} of {overall['total']} complaints resolved city-wide "
        f"({overall['resolution_rate']}%), with an average citizen rating of "
        f"{overall['avg_rating'] or '—'}★."
    )
    top = departments[0]["department"] if departments else None
    if top:
        fallback += f" Best performing department: {top}."

    try:
        dept_lines = "; ".join(
            f"{d['department']}: {d['resolution_rate']}% resolved, grade {d['grade']}"
            for d in departments[:6]
        )
        res = requests.post(
            f"{OLLAMA_API_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": (
                    "You are a civic transparency analyst. In ONE sentence (max 30 words), "
                    "summarize this city's grievance-resolution performance for a public "
                    f"scoreboard. Data — overall: {overall['resolution_rate']}% resolved, "
                    f"{overall['sla_breach_pct']}% SLA breaches, avg rating {overall['avg_rating']}. "
                    f"Departments: {dept_lines}. Reply with only the sentence."
                ),
                "stream": False,
                "options": {"temperature": 0.4, "num_predict": 60},
            },
            timeout=8,
        )
        res.raise_for_status()
        text = (res.json().get("response") or "").strip().strip('"')
        if text:
            return {"summary": text, "source": "ollama"}
    except Exception:
        pass
    return {"summary": fallback, "source": "fallback"}


def build_scoreboard(db: Session) -> Dict:
    complaints: List[Complaint] = db.query(Complaint).all()

    by_dept: Dict[str, List[Complaint]] = {}
    for c in complaints:
        by_dept.setdefault(c.department or "Other", []).append(c)

    departments = []
    for dept, items in by_dept.items():
        total = len(items)
        resolved_items = [c for c in items if c.status in RESOLVED_STATES]
        resolved = len(resolved_items)
        escalated = sum(1 for c in items if c.is_escalated)
        ratings = [c.rating for c in items if c.rating]

        res_hours = [
            h for c in resolved_items
            if (h := _hours_between(c.created_at, c.updated_at)) is not None
        ]
        avg_hours = round(sum(res_hours) / len(res_hours), 1) if res_hours else None

        resolution_rate = round(resolved / total * 100) if total else 0
        sla_breach_pct = round(escalated / total * 100) if total else 0
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else None

        # Composite performance score (0-100):
        #   50% resolution rate, 30% SLA compliance, 20% citizen satisfaction
        satisfaction = (avg_rating / 5 * 100) if avg_rating else 60  # neutral default
        score = round(
            0.5 * resolution_rate +
            0.3 * (100 - sla_breach_pct) +
            0.2 * satisfaction
        )

        d = {
            "department": dept,
            "total": total,
            "resolved": resolved,
            "open": total - resolved,
            "resolution_rate": resolution_rate,
            "avg_resolution_hours": avg_hours,
            "sla_breaches": escalated,
            "sla_breach_pct": sla_breach_pct,
            "avg_rating": avg_rating,
            "ratings_count": len(ratings),
            "score": score,
            "grade": _grade(score),
        }
        d["insight"] = _insight(d)
        departments.append(d)

    departments.sort(key=lambda d: (-d["score"], -d["total"]))
    for i, d in enumerate(departments):
        d["rank"] = i + 1

    total = len(complaints)
    resolved = sum(1 for c in complaints if c.status in RESOLVED_STATES)
    escalated = sum(1 for c in complaints if c.is_escalated)
    all_ratings = [c.rating for c in complaints if c.rating]
    overall = {
        "total": total,
        "resolved": resolved,
        "resolution_rate": round(resolved / total * 100) if total else 0,
        "sla_breach_pct": round(escalated / total * 100) if total else 0,
        "avg_rating": round(sum(all_ratings) / len(all_ratings), 1) if all_ratings else None,
        "departments_count": len(departments),
    }

    ai = _ai_city_summary(departments, overall)

    return {
        "departments": departments,
        "overall": overall,
        "ai_summary": ai["summary"],
        "ai_source": ai["source"],
        "generated_at": datetime.now().isoformat(),
    }
