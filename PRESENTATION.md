# Presentation Cheat-Sheet — AI-Powered Grievance Lodging & Tracking System

One-line pitch: *Citizens lodge civic complaints with photo evidence; AI routes them to the right
department, scores their urgency, audits the evidence, and auto-escalates SLA breaches — admins
manage everything from a live dashboard.*

---

## Tech Stack — what & why

| Layer | Tech | Why we chose it |
|---|---|---|
| Frontend | **React 19 + Vite** | Fast dev loop (HMR), component reuse across 14 screens |
| Styling | **Tailwind CSS** (custom design tokens) | One palette defined once (`#006D5B` teal-green gov theme) — every screen stays consistent |
| Backend | **FastAPI (Python)** | Async, auto-generated Swagger docs at `/docs`, Pydantic validation for free |
| Database | **MySQL via SQLAlchemy, auto-fallback to SQLite** | SQLAlchemy = same code for both; SQLite fallback means the demo runs on any machine with zero setup |
| AI | **Ollama (llama3.2 + llama3.2-vision), keyword fallback** | Free, local, no API keys. If Ollama is offline a deterministic keyword classifier takes over — the pipeline never blocks |
| Maps | **Leaflet + react-leaflet (CARTO tiles)** | Free, no API key (vs Google Maps), used for both the hotspot map and the submit-form location picker |
| Charts | **Recharts** | Declarative React charts for trends, priority donut, department bars |
| Icons | **lucide-react** | Consistent lightweight icon set |

---

## Feature → How it works (talking points)

**1. AI Complaint Routing**
Description text → Ollama LLM prompt → returns department, category, severity, confidence, keywords.
Offline fallback: keyword dictionary (e.g. "pothole" → Roads and Drainage). Runs automatically on submit.

**2. Priority Engine (0–100 score)**
Weighted formula, not a black box: Safety 30 + Public Impact 20 + Essential Service 20 + Urgency 10 +
Duplicates 10 + Location proximity 5 + Time pending 5. **+20 boost on SLA breach.**
Recalculated on every read, so scores age upward while tickets sit unresolved.

**3. SLA Auto-Escalation**
Critical 24h / High 3d / Medium 7d / Low 14d. Breach → `is_escalated=true`, priority boost,
red badges in UI, notifications fired to supervisor + citizen. No cron needed — checked on each data read.

**4. Vision Evidence Audit**
Uploaded photo + complaint text → Ollama vision model → verdict MATCH / MISMATCH / UNCERTAIN with
confidence. Detects fraudulent or mismatched evidence. Without Ollama it returns an honest
UNCERTAIN fallback (the UI explains this).

**5. Notification Center**
DB-backed notifications on every status change / escalation / feedback. Bell in navbar (citizen sees
own alerts by phone; admins see department-scoped alerts). Simulated SMS/Email printed to backend console.

**6. Resolution Feedback Loop**
Admin marks Resolved → citizen must confirm: **rate 1–5 stars + feedback → Closed**, or
**Reopen** (resets escalation, alerts the officer). Ratings visible to admins.

**7. Role-Based Access**
- **Citizen** — Aadhaar+OTP login, submit/track own complaints only
- **Super Admin** (`admin/admin123`) — everything + Departments/Users/Settings pages
- **Department Admins** — one per department, server-side filtered to their own complaints,
  map pins, analytics and notifications; no department filter shown, no admin-management pages:
  `water_admin/water123` · `electricity_admin/electricity123` · `roads_admin/roads123` ·
  `swm_admin/swm123` · `health_admin/health123` · `traffic_admin/traffic123`

**8. Hotspot Map & Analytics**
Map: complaint pins colored by department, sized by priority, density mode toggle.
Analytics: 14-day trend, department pressure, priority donut, **surge prediction** (compares last-3-days
vs prior-7-days velocity per area → CRITICAL/WARNING zones with forecasts).

**9. Resilience (demo-proof)**
Backend down → frontend auto-switches to a full localStorage simulation (banner shown).
MySQL down → backend switches to SQLite. Ollama down → keyword classifier. **Nothing crashes.**

**10. ⭐ First-Time User Tour (accessibility & adoption feature)**
New citizens get an automatic 9-step guided spotlight tour on first login: how to lodge a complaint
(identity → location → description → photo evidence → submit) and how to track/rate resolutions.
The page is fully interaction-locked during the tour; it spans three screens with auto-navigation,
persists completion, and can be replayed anytime via the "Take a Tour" button. Built custom
(zero extra dependencies) to match the design system. *Talking point: reduces the biggest barrier
for e-governance — first-time users who don't know where to start.*

**11. ⭐ Small-but-unique differentiators (things other teams won't have)**
- **Voice complaint dictation** — a mic button on the description field uses the browser's
  Web Speech API (`en-IN`) so citizens can *speak* their complaint. Inclusion story: works for
  users uncomfortable typing English, or reporting one-handed from the incident site. Zero deps.
- **Expected-resolution date** — every open complaint shows "Expected resolution by {date}"
  derived from its priority's SLA window; if breached it says so and shows the auto-escalation.
  Transparency story: citizens get a *commitment*, not a black hole.
- **WhatsApp status sharing** — one tap shares a formatted live status card of the complaint
  to WhatsApp (the channel Indian residents actually use to coordinate civic issues).
- **First-run guided tour** (see #10) — with full interaction lock.
- **Branded loading system** — shield spinner + shimmer skeletons everywhere, themed favicon.

**12. Security (client-side demo scope)**
Passwords stored as SHA-256 hashes only, login lockout (5 fails → 15 min), sessions expire (8h),
OTPs are random, hashed, single-use, 5-attempt limited, dev-only on-screen hint stripped from
production builds, Aadhaar always masked (`XXXX XXXX 9012`).

---

## Demo Script (5 min)

1. **Citizen**: login (`123456789012` / `9876543210`, OTP on screen) → **first-run guided tour
   auto-starts** (let 2–3 steps play, point out the interaction lock, then Skip) → Lodge complaint
   with photo + map pin → show instant AI classification + priority score on success screen.
2. **Admin** (`admin/admin123`): show identity card, metric tiles (point at **Escalated**),
   open the new complaint → tabs Overview / AI Analysis / Evidence → walk status to Resolved (confirm modal).
3. Show **notification bell** (alerts just created), **Hotspot Map** (colored pins), **Analytics** (surge zones).
4. **Dept admin** (`water_admin/water123`): show scoped list — only water complaints, no department filter.
5. **Citizen again**: bell has alerts → Track → rate 4★ → ticket **Closed** → back on admin, rating visible.

## Likely Q&A

- **"What if Ollama/MySQL isn't available?"** → Everything degrades gracefully (keyword classifier /
  SQLite / localStorage). Demo never breaks.
- **"Is the auth production-ready?"** → It's a client-side simulation hardened as far as possible;
  production needs the same flows behind JWT endpoints on the FastAPI side (service layer is already
  shaped for that swap).
- **"How does duplicate detection work?"** → Same category + same area = +5 priority each, so
  community-wide issues float to the top.
- **"Why FastAPI?"** → Python ecosystem for AI integration, async performance, free Swagger docs.

> Full login list for every role lives in `CREDENTIALS.md` (gitignored, local only).
