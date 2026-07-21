~# 📖 Features Explained — What & Why
> The deep-dive companion to `SLIDES.md`. For Q&A prep, judges' questions, and onboarding teammates.

---

## 1. Voice Complaint in Any Language 🎤

**What it is**
On the complaint form, the citizen picks their spoken language (English, हिंदी, मराठी, தமிழ், తెలుగు, ಕನ್ನಡ, বাংলা, ગુજરાતી), taps the mic, and speaks. The browser's Web Speech API transcribes in that language, the transcript appears live in the description box, and when they stop, the local LLM (Ollama) translates it to English, rewrites it as a formal complaint description, and auto-drafts a title.

**Why it matters**
Real grievance portals fail the people who need them most: citizens who can't type, can't write English, or are standing at the incident site on a phone. Voice + auto-translation removes every barrier — filing takes ~30 seconds and zero literacy in English. This is an *inclusion* feature, not a gimmick.

**How it works / resilience**
`SubmitComplaint.jsx` → Web Speech API (`lang` set from the picker) → `POST /api/assistant/voice-assist` → Ollama prompt returns `{title, description}` JSON. If Ollama is offline, the raw transcript stays in the field so dictation always works.

---

## 2. AI Before/After Fix Verification 📸 (closed-loop resolution)

**What it is**
An admin can no longer just click "Resolved." The Resolved button opens a modal that **requires a photo of the completed fix**. The vision model receives two images — the citizen's original evidence (BEFORE) and the crew's proof (AFTER) — plus the complaint text, and returns a verdict: `FIXED`, `NOT_FIXED`, or `UNCERTAIN` with a confidence score. A `NOT_FIXED` verdict **blocks the close-out**; the admin can only proceed via an explicit "Override & Resolve Anyway" action. The citizen sees the before/after pair and the AI verdict when confirming the resolution.

**Why it matters**
The single biggest failure of grievance systems is *fake resolution* — tickets closed on paper while the pothole is still there. Every existing portal trusts the department's word. Here the AI acts as the **citizen's advocate**: the burden of proof is on the government, and the proof is photographic and machine-audited. This closes the accountability loop end-to-end and is the project's most defensible USP.

**How it works / resilience**
`ResolveProofModal.jsx` → multipart `POST /api/complaints/{id}/resolve-with-proof` → saves the photo → `ai_service.verify_fix(before, after, description)` (llama3.2-vision, both images in one prompt) → `resolve_with_proof()` stores verdict fields (`fix_image_url`, `fix_verdict`, `fix_reason`, `fix_confidence`) and only transitions to Resolved when verified or forced. Ollama offline → `UNCERTAIN` verdict, which resolves normally (the system degrades to today's status quo instead of breaking). Blocked attempts also fire a notification to the citizen.

---

## 3. Public Accountability Scoreboard 🏆

**What it is**
`/scoreboard` — a page anyone can open **without logging in**. Every department is ranked with medals and letter grades (A+ → D) on a composite score: **50% resolution rate + 30% SLA compliance + 20% citizen satisfaction** (star ratings). It also shows average fix time, SLA breach %, open counts, a per-department insight line, and an AI-generated one-sentence city performance summary.

**Why it matters**
Transparency changes behavior. When a department's D grade is publicly visible next to a rival's A+, resolution speed becomes a matter of reputation. Citizens gain a tool for civic pressure (RTI requests, media, elections); administrators gain an internal KPI dashboard for free. It converts the complaint database — which every portal already has — into public accountability infrastructure.

**How it works / resilience**
`GET /api/scoreboard` computes everything live from the complaints table (`scoreboard_service.py`). The AI summary is one fast Ollama call with an 8-second timeout and a templated fallback. If the whole backend is down, the frontend recomputes the identical formula client-side from cached/offline data — the page never 404s.

---

## 4. Civic Sathi — AI Chatbot 🤖

**What it is**
A floating chat assistant on every citizen page. It answers questions about the citizen's **own complaints** ("Where is my complaint?", "What's the status of CMP-0004?") with real data, explains how to file, quotes SLA deadlines, and — critically — responds to safety-related messages with emergency helplines first.

**Why it matters**
Government portals are confusing; most citizens' first instinct is to ask a person. The chatbot is that person, 24/7. Injecting the citizen's actual tickets into the LLM context means the answers are *true*, not generic — which is the difference between a toy and a tool.

**How it works / resilience**
`ChatbotWidget.jsx` → `POST /api/assistant/chat` with message + history + phone. The backend fetches that citizen's complaints and injects them into the system prompt, then calls Ollama's chat API. **Triple fallback**: (1) Ollama down → deterministic rule-based responder on the backend that still does real ticket lookups from the DB; (2) backend down → a minimal local responder in the frontend. The widget inherits the theme tokens, so it automatically turns pink in Women Safety Mode.

---

## 5. Women Safety Mode & Pink Safety Identity 🌸

**What it is**
A switch on the Safety Center. When on: the entire portal re-themes from teal to pink (CSS variables), photo evidence becomes optional, quick-report presets and helplines appear, and reports route to the **Women Safety Cell** with a dedicated **+15 priority boost** — never classified below High. Additionally (this release), *every* safety complaint — women's or general — carries a **pink identity everywhere**: pink badges and pink left-border accents in the citizen's track list, dashboard, admin panel, evidence analyzer, safety center, and pink map pins.

**Why it matters**
Safety victims face two barriers: proof (harassment rarely has a photo) and speed (a dark street can't wait 7 days). The mode removes the proof barrier and the boost removes the speed barrier. The consistent pink identity means an admin scanning 200 tickets *cannot miss* a safety report — visual design as a triage mechanism.

**How it works**
`SafetyModeContext` toggles a `theme-safety` class on `<html>` which swaps three CSS variables — the whole Tailwind palette follows. `isSafetyComplaint()` (department/category/priority-breakdown heuristics) drives the `SafetyBadge` and pink accents in every list. The +15 boost lives in the backend priority engine and is mirrored in the offline store.

---

## 6. AI Routing, Priority Engine & SLA Escalation 🧠 (the foundation)

**What it is**
Every submitted complaint is instantly analyzed by the LLM: department (15 options), category, priority, severity, keywords, confidence, and a human-readable reason. A separate vision audit checks the uploaded photo actually shows the reported issue (`MATCH / MISMATCH / UNCERTAIN`) — a fraud filter at intake. The priority engine then scores 0–100 from weighted factors (safety risk 30, public impact 20, essential services 20, urgency 10, duplicates 10, proximity to hospitals/schools 5, time pending 5, +15 safety boost, +20 SLA-breach boost). SLAs are enforced automatically: Critical 24h, High 72h, Medium 7d, Low 14d — breaches escalate, boost priority, and notify supervisors and citizens.

**Why it matters**
Misrouting is the #1 cause of grievance backlogs — a water complaint sent to the roads department dies. Instant, explainable AI routing removes the human bottleneck, and the transparent score breakdown (shown to both citizen and admin) builds trust in *why* something was prioritized. Duplicate detection turns 14 reports of one pothole into escalating community pressure rather than 14 lost tickets.

---

## 7. Guided Tour & Resilience Engineering (the polish)

**What it is**
First-time citizens get a spotlight walkthrough across three pages (dashboard → form → tracking) with a hard interaction lock. This release rewrote its engine: one `requestAnimationFrame` loop with lerp smoothing replaces scroll-event storms and polling timers, and the dim overlay was separated from the pulsing ring (whose animation used to override the dim shadow — the flicker bug).

**Why every feature has a fallback**
The entire stack is engineered so **the demo cannot fail**: MySQL down → automatic SQLite; backend down → localStorage simulation; Ollama down → keyword classifier, rule-based chat, raw-transcript dictation, UNCERTAIN vision verdicts. Judges can pull the network cable and the app keeps working — that resilience is itself a talking point: this is what government-grade software should do.

---

## 8. Site-Wide Language Options 🌐

**What it is**
A globe picker in the navbar (visible logged-in *and* logged-out) switches the entire UI between the same 8 languages the voice feature supports: English, हिंदी, मराठी, தமிழ், తెలుగు, ಕನ್ನಡ, বাংলা, ગુજરાતી. The choice persists per browser, sets `<html lang>`, and the voice-dictation language automatically follows it. When a citizen *types* their complaint in the selected language, it is AI-translated to English at submit time (same endpoint as voice) so classification and admin review always run on clean English text.

**Why it matters**
A government portal that assumes English excludes the majority of its citizens. One language choice controls what they read, what they speak, and what they type — the full journey in their own language, while the backend keeps a single processing language.

**How it works**
`src/i18n/translations.js` (flat key→string dictionaries per language) + `LanguageContext` exposing `t(key)` with English→key fallback so untranslated corners can never crash. Applied across the navbar, dashboard, submit form, track page and safety center. Submit-time translation: `handleSubmit` routes non-English text through `POST /api/assistant/voice-assist` (best-effort — Ollama offline submits the original text).

---

## 9. JWT Authentication 🔐

**What it is**
Every API call to complaint and assistant endpoints now requires a signed **JSON Web Token** (`Authorization: Bearer <jwt>`). Tokens are issued at login, carry the user's identity and role claims, expire after 12 hours, and are cryptographically verified on every request.

**Why it matters**
Before this, the API trusted whoever called it — anyone with the URL could read every complaint or resolve tickets. Now the backend independently verifies *who* is calling and *what role* they hold on every single request. Tampering with a token invalidates its signature; expired tokens are rejected; the citizen/admin distinction is enforced server-side, not just in the UI.

**How it was added — implementation details**

*Backend (zero new dependencies):*
- `backend/app/services/security.py` — a hand-rolled **HS256 JWT** implementation using Python's built-in `hmac` + `hashlib` (no PyJWT needed). `create_token(claims)` signs `{sub, role, name, adminRole?, department?, iat, exp}`; `decode_token()` verifies the signature with `hmac.compare_digest` (timing-safe) and checks expiry. Config via env: `JWT_SECRET`, `JWT_TTL_HOURS` (default 12), `JWT_ENFORCE` (set `false` to disable enforcement for debugging).
- `backend/app/routes/auth_routes.py` — the issuing endpoints:
  - `POST /api/auth/citizen/login` `{aadhaar, mobile}` → validates against the demo registry → citizen JWT.
  - `POST /api/auth/admin/login` `{username, password}` → SHA-256 hash comparison server-side (7 demo admins, only hashes kept in memory) → admin JWT with `adminRole` + `department` claims.
  - `GET /api/auth/me` → returns the verified claims of the presented token.
- `backend/app/main.py` — enforcement at **router level**: `app.include_router(complaint_router, dependencies=[Depends(require_auth)])` (same for the assistant router), so every complaints/chat/voice endpoint is protected with one line each. `require_auth` raises **401** for missing/invalid/expired tokens.
- **Public surface (deliberate):** `/api/auth/*`, `/api/health`, `/api/scoreboard` (the whole point is no login), `/uploads` (image rendering), `/docs`.

*Frontend:*
- `src/services/tokenStore.js` — single source of truth for the token (localStorage) + `attachAuthInterceptor(axios)` which adds the `Authorization: Bearer` header to every request. A separate module so `authService` and the API services can share it without circular imports.
- `src/services/authService.js` — after the client-side OTP / password step succeeds, it **exchanges the verified identity for a backend-signed JWT** (`fetchJwt(...)`) and stores it. Logout clears the token. If the backend is offline, the exchange is skipped and the app continues in its localStorage fallback mode — resilience preserved.
- `complaintService` and `assistantService` axios instances both call `attachAuthInterceptor`, so every complaint, chat, voice and fix-verification request carries the token automatically.

*Flow:* login → local credential check → `POST /api/auth/…/login` → JWT stored → every API call carries it → backend verifies signature + expiry + role on each request → logout (or 12h expiry) kills it.

*Honest limitations (say this if asked):* the demo identity registry is in-memory and mirrors the seeded accounts; the citizen OTP is simulated client-side (no SMS gateway), so the token is issued on Aadhaar+mobile match after the OTP step. In production: users table, server-side OTP via SMS gateway, refresh tokens, and a rotated `JWT_SECRET` in a secrets manager. The architecture (issue → attach → verify per request) is exactly the production shape.

---

## The One-Paragraph Pitch

> Public grievance portals fail in three places: complaints get routed wrong, "resolved" is claimed but never proven, and the people who most need help can't use English text forms. We fixed all three with **local AI**: citizens speak their complaint in any Indian language and the LLM drafts and routes it in seconds; departments cannot close a ticket until a vision model verifies a before/after photo of the actual fix; and a public scoreboard ranks every department's real performance for anyone to see — no login. Voice in, verified fix out, public accountability forever. **Nobody can lie to the system.**
