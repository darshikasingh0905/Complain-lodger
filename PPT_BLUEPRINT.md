# 🎯 PPT Blueprint — Everything the Deck Needs to Do the Project Justice
> Slide-by-slide plan with content, visuals, speaker notes and Q&A prep.
> Companions: `SLIDES.md` (copy-paste bullets) · `FEATURES_EXPLAINED.md` (deep dives).

---

## Deck strategy (read this first)

- **Narrative spine:** *"Nobody can lie to the system."* Every slide either sets up that promise or proves it.
- **Order matters:** problem → human story → solution pillars → the three USPs (escalating wow) → engine room → resilience → demo → impact. Save fix-verification for the emotional peak.
- **Rule of thumb:** max 5 bullets/slide, one screenshot per feature slide, formula/numbers on their own slides. Judges skim slides and listen to *you*.
- **Screenshots to capture beforehand:** pink-mode dashboard, voice dictation mid-listening, priority breakdown panel, blocked NOT_FIXED modal, scoreboard with medals, chatbot answering a real ticket, hotspot map. Use real seeded data.

---

## Slide 1 — Title
**Content:** Project name + tagline: *"File a complaint in your own voice. Watch the AI hold the city accountable."* Team names.
**Visual:** Hero screenshot of the citizen dashboard (or split: green theme | pink theme).
**Speaker note:** One breath: "We built a grievance portal where AI works for the citizen, not the government."

## Slide 2 — The Problem (make it hurt)
**Content:**
- India's grievance portals receive millions of complaints; routing is manual → weeks of delay
- Wrong-department misrouting kills tickets silently
- "Resolved" is self-declared — no proof, no verification, citizens give up
- Text + English-only forms exclude non-English speakers, elderly, low-literacy citizens
- Zero public visibility → zero pressure on underperforming departments
**Visual:** A 4-step "where complaints die" funnel graphic.
**Speaker note:** Tell a 15-second story: "A widow in Pune reports a dark street in Marathi… the portal wants typed English and a photo. She gives up. We built this for her."

## Slide 3 — Solution Overview (the 5 pillars)
**Content (one line each):**
1. 🗣️ Voice complaint in any Indian language → AI drafts it in English
2. 🧠 Instant AI routing + explainable 0–100 priority score
3. 📸 AI-verified before/after fix proof — fake resolutions get **blocked**
4. 🏆 Public accountability scoreboard — no login, live grades
5. 🌸 Women Safety Mode — pink portal, optional photos, +15 priority
**Visual:** 5 icons in a loop diagram (they form the accountability cycle).
**Speaker note:** "Three of these don't exist in ANY production grievance portal. Let me show each."

## Slide 4 — USP 1: Voice in Any Language 🎤
**Content:**
- 8 languages: English, हिंदी, मराठी, தமிழ், తెలుగు, ಕನ್ನಡ, বাংলা, ગુજરાતી
- Speak → live transcript → local LLM translates + writes formal English description + auto-titles
- Filing time: **~30 seconds, zero typing, zero English**
**Visual:** Screenshot of the mic + language picker + "AI translated your Hindi dictation" note.
**Speaker note:** Emphasize *inclusion*: "The people who most need grievance portals are the least able to use them. We removed literacy as a requirement."

## Slide 5 — USP 2: AI Fix Verification 📸 (THE differentiator — give it 2 slides if needed)
**Content:**
- Resolving requires an AFTER photo — no photo, no close-out
- Vision AI compares citizen's BEFORE vs crew's AFTER → FIXED / NOT_FIXED / UNCERTAIN + confidence
- **NOT_FIXED blocks resolution** — override is explicit and logged
- Citizen sees the verified before/after pair when confirming
**Visual:** The blocked modal screenshot (red NOT_FIXED verdict) — this is the money shot.
**Speaker note:** "Every portal on earth trusts the department's word. Ours demands photographic proof and lets an AI — the citizen's advocate — judge it. This closes the loop that has never been closed."

## Slide 6 — USP 3: Public Accountability Scoreboard 🏆
**Content:**
- Public URL, **no login** — anyone can inspect government performance
- Departments ranked 🥇🥈🥉 with grades A+ → D
- **Score = 50% resolution rate + 30% SLA compliance + 20% citizen satisfaction**
- Shows avg fix time, SLA breach %, star ratings, per-dept insight + AI city summary
- Offline-proof: recomputed client-side if the API is down
**Visual:** Scoreboard screenshot with medals visible.
**Speaker note:** "Transparency changes behavior. When your D grade sits next to a rival's A+, resolution speed becomes reputation. Citizens get an accountability weapon; commissioners get a free KPI dashboard."

## Slide 7 — Civic Sathi Chatbot 🤖
**Content:**
- Floating assistant on every citizen page
- Answers from the citizen's **real tickets** — live status, SLA quotes, how-to
- Safety-aware: danger mentions → helplines FIRST (112/100/1091/181)
- Triple fallback: Ollama → rule-based backend (still does real DB lookups) → local responder
**Visual:** Chat screenshot answering "Where is my complaint CMP-0001?" with a real status.
**Speaker note:** "Injecting the user's actual tickets into the LLM context is the difference between a toy chatbot and a tool."

## Slide 8 — Women Safety Mode 🌸
**Content:**
- One switch → entire portal re-themes pink (CSS variables, instant)
- Photo evidence **optional** — harassment rarely has photos
- Routes to Women Safety Cell, never below High priority, **+15 boost**
- Pink identity follows safety complaints EVERYWHERE: citizen lists, admin panel, map pins
- Helplines one tap away during reporting
**Visual:** Side-by-side green vs pink screenshots.
**Speaker note:** "Two barriers stop safety victims: proof and speed. We removed both. And the pink badge means an admin scanning 200 tickets cannot miss a safety report — design as triage."

## Slide 9 — The AI Engine Room 🧠
**Content:**
- **Routing LLM:** description → department (15 cells), category, severity, keywords, confidence, reason
- **Intake vision audit:** does the photo match the complaint? (MATCH/MISMATCH → fraud filter)
- **Priority engine (0–100, fully explainable):**
  Safety 30 · Public impact 20 · Essential service 20 · Urgency 10 · Duplicates 10 · Proximity (hospital/school) 5 · Time pending 5 · Safety boost +15 · SLA-breach boost +20
- **SLA auto-escalation:** Critical 24h / High 72h / Medium 7d / Low 14d → auto-escalate + notify
**Visual:** The priority breakdown panel screenshot (bars per factor).
**Speaker note:** "Every score is explainable — citizens see WHY they're priority 87. Explainability builds the trust that black-box systems destroy."

## Slide 10 — Duplicate Detection & Hotspot Prediction 🗺️
**Content:**
- Same issue + same area → +5 per duplicate: 14 pothole reports = one loud ticket, not 14 lost ones
- Surge detection: last-3-days vs prior-7-days velocity → CRITICAL/WARNING hotspot forecasts
- Leaflet heatmap for admins with dept-colored pins (safety = pink)
**Visual:** Hotspot map screenshot.
**Speaker note:** "The map predicts infrastructure stress before total failure — monsoon week pipe-burst patterns show up as WARNING zones."

## Slide 11 — Architecture & Tech Stack 🏗️
**Content (diagram, not bullets):**
```
React (Vite) + Tailwind ──► FastAPI ──► MySQL ─(auto-failover)─► SQLite
        │                     │
        │  offline fallback   ├──► Ollama: llama3.2 (text) · llama3.2-vision (images)
        └─► localStorage      └──► uploads (evidence + fix photos)
```
- 100% local AI — no cloud APIs, no keys, no data leaves the machine (government-grade privacy)
**Speaker note:** "Citizen data and complaint photos never leave the government's own hardware — that's not a limitation, it's a compliance feature."

## Slide 12 — Resilience: The Demo Cannot Fail 🛡️
**Content — every dependency has a fallback:**
| Down | Fallback |
|---|---|
| MySQL | SQLite auto-failover |
| Backend | localStorage simulation |
| Ollama (text) | keyword classifier + rule-based chat |
| Ollama (vision) | UNCERTAIN verdict (status-quo behavior) |
| Internet (speech) | clear error + typing path |
**Speaker note:** "Pull the network cable — the app keeps working. That resilience is what government software should be."

## Slide 13 — Live Demo Plan (5 min)
1. First login → guided tour fires (rewritten 60fps spotlight engine)
2. **Speak a complaint in Hindi** → AI drafts English → submit → instant routing
3. Track page → priority breakdown + SLA countdown
4. Admin: resolve **without** proof → blocked · wrong photo → **AI blocks NOT_FIXED** · real photo → verified ✅
5. Citizen confirms + 5★ → **public scoreboard** rank updates live
6. Toggle **Women Safety Mode** → pink → one-tap safety report
7. Ask Civic Sathi: "Where is my complaint?"
**Speaker note:** Rehearse step 4 twice — it's the applause moment. Keep Ollama warmed up (run one query before the demo).

## Slide 14 — Impact & Who Benefits
**Content:**
- **Citizens:** file in 30s in their language; provable resolutions; public leverage
- **Departments:** clean routing, deduped tickets, prioritized queues
- **City leadership:** live KPI scoreboard, hotspot forecasts, satisfaction metrics
- **Society:** measurable accountability — the system's incentives favor actually fixing things
**Speaker note:** End with the loop: "Voice in → verified fix out → public accountability forever."

## Slide 15 — Roadmap (shows maturity)
**Content:**
- WhatsApp bot intake (photo + GPS auto-files a complaint)
- Complaint clustering into citizen-backed "Issues" (14 backers = petition weight)
- RTI/escalation letter auto-generation on repeated SLA breach
- Civic trust score for verified reporters (anti-spam)
- AR "point camera at problem" overlay of existing reports
**Speaker note:** "Everything here builds on infrastructure we already have — the vision pipeline, the priority engine, the scoreboard."

## Slide 16 — Closing
**Content:** The one-paragraph pitch + repo QR code + "Nobody can lie to the system."
**Visual:** The accountability loop diagram again.

---

## Q&A Ammunition (put these in your pocket, not on slides)

**"What if the vision AI is wrong?"** → It only *blocks with an override*; a human always has final say, and overrides are explicit and logged. False FIXED verdicts still face the citizen-confirmation step — the human loop backs up the AI loop.

**"Why local LLM instead of GPT/Claude API?"** → Data sovereignty (citizen PII + photos never leave government hardware), zero per-request cost at municipal scale, works in low-connectivity offices. Swappable later — the service layer is one URL.

**"How does this scale?"** → Stateless FastAPI horizontally scales; Ollama nodes scale independently; classification is per-submission (not per-view). SQLite fallback is dev/demo only.

**"What's actually novel here?"** → (1) closed-loop photo-verified resolution — no production portal does this; (2) any-language voice-to-complaint with local AI; (3) public scoreboard computed from live ticket data. The combination = a system where lying is structurally hard.

**"Fake complaints?"** → Intake vision audit flags MISMATCH photo evidence; Aadhaar-verified identity; duplicate detection separates mass-reporting (signal) from spam (same reporter).

**"Why is Women Safety Mode a theme and not just a category?"** → Behavioral design: the visible mode change signals "this system was built for you," presets lower reporting friction, and optional photos remove the biggest barrier for harassment reports. The +15 boost is policy, enforced in the scoring engine, not a label.

**"Measured performance?"** → Complaint filing ~30s by voice; AI routing returns in 1–3s (llama3.2 local); tour and UI at 60fps after the rAF rewrite; scoreboard computed live on request.
