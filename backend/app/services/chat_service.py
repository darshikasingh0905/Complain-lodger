"""
Civic Assistant Chat Service
----------------------------
Powers the floating chatbot on the citizen portal.

Primary path: local Ollama LLM (/api/chat) with the citizen's own complaint
records injected as context, so it can answer "where is my complaint?"
truthfully. Fallback path: a deterministic rule-based responder so the
assistant keeps working when Ollama is offline.
"""

import os
import re
import requests
from typing import Dict, List, Optional

from sqlalchemy.orm import Session
from app.models.complaint import Complaint

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_TIMEOUT = 25  # seconds

MAX_HISTORY = 8       # last N chat turns forwarded to the model
MAX_COMPLAINTS = 8    # citizen's most recent complaints injected as context

_SYSTEM_PROMPT = """You are "Civic Sathi", the friendly AI assistant of a government Grievance Lodging & Tracking portal.

You help citizens:
- lodge civic complaints (potholes, water, electricity, garbage, drainage, street lights…)
- report safety issues (the Safety Center gives them a +15 priority boost; Women Safety Mode turns the portal pink, makes photos optional and routes reports to the Women Safety Cell)
- track complaint status (statuses flow: Submitted → Assigned → In Progress → Resolved → Closed)
- understand priorities and SLAs (Critical: 24h, High: 72h, Medium: 7 days, Low: 14 days; breaches auto-escalate)
- check the public department scoreboard for accountability

Portal navigation: "Lodge Grievance" to submit, "Track Status" to follow tickets, "Safety" for the Safety Center, "Scoreboard" for department rankings.
Emergency helplines: 112 (emergency), 100 (police), 1091 (women helpline), 181 (women in distress).

{complaints_block}

Rules:
- Be warm, concise (2-4 short sentences), and concrete. Use the citizen's real complaint data above when they ask about their tickets.
- If they describe a NEW problem, encourage them to lodge it and tell them which button to use.
- If they mention feeling unsafe or in danger, share the helpline numbers first.
- Never invent complaint IDs or statuses that are not in the data above."""


def _complaints_block(complaints: List[Complaint]) -> str:
    if not complaints:
        return "The citizen has not lodged any complaints yet."
    lines = ["The citizen's complaints (most recent first):"]
    for c in complaints:
        cid = f"CMP-{str(c.id).zfill(4)}"
        lines.append(
            f"- {cid}: \"{(c.title or c.description or '')[:60]}\" | status: {c.status}"
            f" | priority: {c.priorityLevel or c.priority or 'Medium'}"
            f" | department: {c.department or 'Other'}"
            f"{' | ESCALATED (SLA breached)' if c.is_escalated else ''}"
        )
    return "\n".join(lines)


def _get_citizen_complaints(db: Session, phone: Optional[str]) -> List[Complaint]:
    if not phone:
        return []
    try:
        return (
            db.query(Complaint)
            .filter(Complaint.citizen_phone == phone)
            .order_by(Complaint.created_at.desc())
            .limit(MAX_COMPLAINTS)
            .all()
        )
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Rule-based fallback (Ollama offline)
# ---------------------------------------------------------------------------

def _fallback_reply(message: str, complaints: List[Complaint]) -> str:
    lower = message.lower()

    # Ticket lookup: "CMP-0004", "#4", "complaint 4"
    m = re.search(r"cmp[-\s]?0*(\d+)|#(\d+)|complaint\s+0*(\d+)|ticket\s+0*(\d+)", lower)
    if m:
        num = int(next(g for g in m.groups() if g))
        hit = next((c for c in complaints if c.id == num), None)
        if hit:
            cid = f"CMP-{str(hit.id).zfill(4)}"
            extra = " It has been escalated to senior review due to an SLA breach." if hit.is_escalated else ""
            return (
                f"{cid} — \"{(hit.title or hit.description or '')[:60]}\" is currently "
                f"**{hit.status}** with {hit.priorityLevel or hit.priority or 'Medium'} priority, "
                f"assigned to {hit.department or 'the concerned department'}.{extra}"
            )
        return "I couldn't find that ticket among your complaints. Double-check the ID on the Track Status page."

    if any(k in lower for k in ["status", "track", "where is", "my complaint", "my ticket", "progress", "update"]):
        if not complaints:
            return "You haven't lodged any complaints yet. Tap **Lodge Grievance** in the navbar to submit your first one — it takes under a minute."
        lines = [f"You have {len(complaints)} recent complaint(s):"]
        for c in complaints[:5]:
            lines.append(
                f"• CMP-{str(c.id).zfill(4)} — {c.status} ({c.priorityLevel or c.priority or 'Medium'} priority)"
            )
        lines.append("Open **Track Status** for full timelines.")
        return "\n".join(lines)

    if any(k in lower for k in ["danger", "unsafe", "emergency", "help me", "scared", "followed", "harass"]):
        return (
            "If you're in immediate danger, call **112** (emergency) or **100** (police). "
            "Women's helplines: **1091** and **181**. Once safe, report the incident via the "
            "**Safety** page — safety reports get a +15 priority boost and photos are optional."
        )

    if any(k in lower for k in ["women", "pink", "safety mode"]):
        return (
            "Women Safety Mode is on the **Safety** page — flip the switch and the portal turns pink, "
            "photo evidence becomes optional, and your safety reports route to the Women Safety Cell "
            "with a dedicated +15 priority boost."
        )

    if any(k in lower for k in ["how", "lodge", "submit", "report", "file", "new complaint"]):
        return (
            "Tap **Lodge Grievance**, describe the issue (you can dictate it with the mic in any language), "
            "add a photo and the location, and submit. Our AI instantly routes it to the right department "
            "and you'll get a CMP ID to track it."
        )

    if any(k in lower for k in ["sla", "deadline", "how long", "when will", "resolve time"]):
        return (
            "Resolution SLAs by priority: Critical → 24h, High → 3 days, Medium → 7 days, Low → 14 days. "
            "If a deadline is breached, the ticket auto-escalates to senior review and you're notified."
        )

    if any(k in lower for k in ["scoreboard", "ranking", "performance", "department"]):
        return (
            "The public **Scoreboard** ranks every department by resolution speed, SLA compliance and "
            "citizen ratings — full transparency, no login needed."
        )

    if any(k in lower for k in ["hi", "hello", "hey", "namaste"]):
        return "Namaste! 🙏 I'm Civic Sathi. Ask me about your complaints, how to report an issue, or safety helplines."

    return (
        "I can help you lodge a complaint, track your tickets, explain SLAs, or share safety helplines. "
        "Try asking: \"Where is my complaint?\" or \"How do I report a pothole?\""
    )


# ---------------------------------------------------------------------------
# Ollama chat
# ---------------------------------------------------------------------------

def _call_ollama_chat(message: str, history: List[Dict], complaints: List[Complaint]) -> Optional[str]:
    system = _SYSTEM_PROMPT.format(complaints_block=_complaints_block(complaints))
    messages = [{"role": "system", "content": system}]
    for turn in history[-MAX_HISTORY:]:
        role = turn.get("role")
        content = (turn.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content[:1000]})
    messages.append({"role": "user", "content": message[:1000]})

    try:
        res = requests.post(
            f"{OLLAMA_API_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "options": {"temperature": 0.4, "num_predict": 300},
            },
            timeout=OLLAMA_TIMEOUT,
        )
        res.raise_for_status()
        reply = (res.json().get("message") or {}).get("content", "").strip()
        return reply or None
    except requests.exceptions.RequestException as e:
        print(f"[Chat Service] Ollama unavailable ({e.__class__.__name__}). Using rule-based fallback.")
        return None
    except (KeyError, ValueError) as e:
        print(f"[Chat Service] Bad Ollama response: {e}. Using rule-based fallback.")
        return None


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def chat(db: Session, message: str, history: List[Dict], citizen_phone: Optional[str]) -> Dict:
    """Returns {reply, source} — never raises, never empty."""
    complaints = _get_citizen_complaints(db, citizen_phone)

    reply = _call_ollama_chat(message, history or [], complaints)
    if reply:
        return {"reply": reply, "source": "ollama"}

    return {"reply": _fallback_reply(message, complaints), "source": "fallback"}
