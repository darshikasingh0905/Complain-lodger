# 🎤 Slide Deck — Key Features
> One block ≈ one slide. Copy the bullets straight into your deck.

---

## Slide 1 — Title
**AI-Powered Grievance Lodging & Tracking System**
*"File a complaint in your own voice. Watch the AI hold the city accountable."*
- 100% local AI (Ollama) — no cloud, no API keys, privacy by design
- React + FastAPI + MySQL/SQLite failover

---

## Slide 2 — The Problem
- Manual routing → complaints reach the **wrong department**, sit for weeks
- No evidence verification → **fake/mismatched complaints** clog the queue
- "Resolved" is claimed, never **proven** — citizens reopen or give up
- English-only, typing-only portals **exclude** millions of citizens
- Zero public visibility into **which departments actually perform**

---

## Slide 3 — The Solution (one-liner per pillar)
1. 🗣️ **Speak it** — complaint in any Indian language, AI drafts it in English
2. 🧠 **AI routes it** — department, category, priority scored in seconds
3. 📸 **AI verifies the fix** — before/after photo audit blocks fake close-outs
4. 🏆 **Public scoreboard** — departments ranked live, no login needed
5. 🌸 **Women Safety Mode** — pink portal, optional photos, +15 priority boost

---

## Slide 4 — USP #1: Voice Complaint in Any Language 🎤
- Pick your language: हिंदी, मराठी, தமிழ், తెలుగు, ಕನ್ನಡ, বাংলা, ગુજરાતી, English
- Speak → live transcript → **local LLM translates + drafts a formal English complaint + auto-fills the title**
- No typing. No English. **Filing takes ~30 seconds**
- Inclusion: works for citizens who can't type or read English

---

## Slide 5 — USP #2: AI Before/After Fix Verification 📸 *(demo-killer)*
- Admin **cannot** mark "Resolved" without uploading a fix photo
- Vision AI compares citizen's BEFORE photo vs crew's AFTER photo
- Verdict: **FIXED / NOT_FIXED / UNCERTAIN** with confidence %
- **NOT_FIXED = close-out BLOCKED** (explicit override only, logged)
- *"The AI is the citizen's advocate"* — nobody else does closed-loop verification

---

## Slide 6 — USP #3: Public Accountability Scoreboard 🏆
- Public page — **no login required**
- Every department ranked: 🥇🥈🥉 + grades A+ → D
- Score = 50% resolution rate + 30% SLA compliance + 20% citizen ratings
- Avg fix time, SLA breach %, star ratings — all live from real data
- AI-generated one-line city performance summary
- **Gamified shame keeps departments honest**

---

## Slide 7 — Civic Sathi: The AI Chatbot 🤖
- Floating assistant on every citizen page
- Knows the citizen's **real tickets** — "Where is my complaint?" → live status
- Safety-aware: mentions of danger → helplines first (112 / 100 / 1091 / 181)
- Triple fallback: Ollama → rule-based backend → local responder
- **Never breaks the demo, even fully offline**

---

## Slide 8 — Women Safety Mode 🌸
- One switch → the entire portal turns **pink**
- Photo evidence becomes **optional** (safety incidents rarely have photos)
- Reports route to the **Women Safety Cell**, never below High priority
- **+15 dedicated priority boost** in the scoring engine
- Safety complaints stay **pink-badged everywhere** — citizen lists, admin panel, map pins

---

## Slide 9 — The AI Engine Room 🧠
- **Routing**: LLM classifies description → department, category, priority, keywords, confidence
- **Vision audit at intake**: does the photo actually show the reported issue? (fraud filter)
- **Priority engine (0–100)**: safety risk 30 + public impact 20 + essential service 20 + urgency 10 + duplicates 10 + proximity 5 + time pending 5 (+15 safety boost, +20 SLA escalation)
- **SLA auto-escalation**: Critical 24h / High 3d / Medium 7d / Low 14d
- Every AI feature has a **deterministic fallback** — zero external dependencies

---

## Slide 10 — Complete Accountability Loop (the pitch)
```
Citizen speaks (any language)
   → AI drafts, routes & prioritizes
      → Crew fixes; AI verifies the fix photo
         → Citizen confirms & rates (or reopens)
            → Public scoreboard ranks the department
```
**Every step is verified. Nobody can lie to the system.**

---

## Slide 11 — Tech Stack & Resilience
- Frontend: React (Vite), Tailwind, Leaflet maps, Recharts
- Backend: FastAPI, SQLAlchemy · AI: Ollama (llama3.2 + llama3.2-vision)
- MySQL → SQLite automatic failover · API → localStorage offline fallback
- Runs fully offline on one laptop — **demo cannot fail**

---

## Slide 12 — Demo Script (5 minutes)
1. First login → guided spotlight tour fires automatically
2. Speak a pothole complaint **in Hindi** → AI drafts it in English → submit
3. Show instant AI routing + priority breakdown on Track page
4. Admin: try to resolve **without** proof → blocked; upload wrong photo → **AI blocks close-out**; upload real fix photo → verified ✅
5. Citizen confirms + rates → open the **public scoreboard** → department rank updates
6. Toggle **Women Safety Mode** → portal turns pink → one-tap safety report
7. Ask Civic Sathi: *"Where is my complaint?"*
