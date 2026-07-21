  # 🔧 Technical Guide — How Every Feature Is Integrated
> The engineering companion: file paths, data flow, and design decisions for each feature.
> Sibling docs: `SLIDES.md`(image.png) (deck bullets) · `PPT_BLUEPRINT.md` (full deck plan) · `FEATURES_EXPLAINED.md` (what & why).

---

## 0. System map

```
frontend/ (React + Vite + Tailwind)
  src/context/        AuthContext · LanguageContext · SafetyModeContext · ComplaintContext
  src/services/       complaintService · assistantService · authService · tokenStore · localComplaintStore
  src/components/     chat/ChatbotWidget · tour/CitizenTour · ui/ResolveProofModal · ui/Badge …
  src/pages/          citizen/ · admin/ · public/Scoreboard · auth/
  src/i18n/           translations.js (8 languages)

backend/ (FastAPI + SQLAlchemy)
  app/routes/         complaint_routes · assistant_routes · auth_routes
  app/services/       ai_service (LLM+vision) · chat_service · scoreboard_service ·
                      priority_engine · complaint_service · security (JWT) · notification_service
  app/models/         Complaint · Notification
  Ollama:             llama3.2 (text) · llama3.2-vision (images) — all local
  DB:                 MySQL → SQLite auto-failover (app/database/db.py)
```

**Resilience doctrine (applies to every feature):** three degradation layers — Ollama down → deterministic fallback on the backend; backend down → localStorage simulation on the frontend; nothing ever throws a blank screen.

---

## 1. 🤖 Chatbot ("Civic Sathi") — how it was integrated

**Files:** `backend/app/services/chat_service.py` · `backend/app/routes/assistant_routes.py` · `frontend/src/components/chat/ChatbotWidget.jsx` · `frontend/src/services/assistantService.js`

**Request flow:**
1. `ChatbotWidget` (mounted once in `App.jsx`, renders only for authenticated citizens) collects the message + last 8 chat turns + the citizen's phone number.
2. `assistantService.sendChatMessage()` → `POST /api/assistant/chat` (JWT-authenticated).
3. `chat_service.chat()` **injects real data into the prompt**: it queries the citizen's 8 most recent complaints from the DB and renders them into the system prompt (`_complaints_block`) — ID, status, priority, department, escalation flag. This is why "where is my complaint?" gets a *true* answer, not a generic one.
4. The system prompt also teaches the model portal navigation, SLA tables, and helpline numbers, then calls Ollama's **`/api/chat`** endpoint (multi-turn message array, `temperature 0.4`, `num_predict 300`, 25s timeout).
5. **Fallback chain:** Ollama unreachable → `_fallback_reply()` — a rule-based responder that still does *real DB lookups* (regex-extracts `CMP-0004` / `#4` from the message and answers with the live status). Backend unreachable → `localReply()` in `assistantService` answers from the already-loaded complaints in React state.

**UI details:** theme tokens only (`bg-primary` etc.) so the widget turns pink automatically in Women Safety Mode; a mini markdown renderer for `**bold**` + line breaks; quick-suggestion chips shown until the conversation starts; auto-scroll on new messages.

---

## 2. 🏆 Public Scoreboard — how it was integrated

**Files:** `backend/app/services/scoreboard_service.py` · endpoint in `backend/app/main.py` (`GET /api/scoreboard`, deliberately **outside** the JWT-protected routers) · `frontend/src/pages/public/Scoreboard.jsx` · client fallback in `complaintService.js`

**Computation (single pass over the complaints table):**
1. Group all complaints by department.
2. Per department: `resolution_rate` = (Resolved+Closed)/total · `avg_resolution_hours` = mean(updated_at − created_at) over resolved tickets · `sla_breach_pct` = escalated/total · `avg_rating` = mean of citizen star ratings.
3. **Composite score** `= 0.5·resolution_rate + 0.3·(100 − sla_breach_pct) + 0.2·satisfaction` where satisfaction = rating/5·100 (neutral 60 when unrated). Grade bands: A+ ≥85, A ≥70, B ≥55, C ≥40, else D. Sort by score → rank → medals.
4. A one-line **AI city summary** via one Ollama call with an 8-second timeout; a templated sentence takes over when the model is offline (`ai_source: "fallback"`).

**Why it's public:** the route is registered *before/outside* the authenticated routers — accountability only works if a journalist with no account can open it.

**Offline story:** `getScoreboard()` in `complaintService` tries the API; on failure it recomputes the **identical formula in JS** (`computeLocalScoreboard`) from whatever complaint data the client has — the page can never 404.

**Frontend rendering:** rank medals 🥇🥈🥉, per-department card with a colored left border from `getDeptColor()`, score progress bar, grade chip, and the formula printed in the footer for transparency.

---

## 3. 🎤 Voice Complaint (mic) — how it was integrated

**Files:** `frontend/src/pages/citizen/SubmitComplaint.jsx` (capture) · `backend/app/services/ai_service.py::voice_assist` (translate/draft) · `assistant_routes.py` (`POST /api/assistant/voice-assist`)

**Pipeline:** two stages, deliberately split:

*Stage 1 — capture (browser):* the **Web Speech API** (`window.SpeechRecognition || webkitSpeechRecognition`) with `lang` set from the language picker (`hi-IN`, `mr-IN`, …), `continuous: true`, `interimResults: true`. On every `onresult` event the handler rebuilds finals+interims from scratch (never appends deltas — that's what causes duplicated text) and paints the live transcript into the description field. Finalized text accumulates in `voiceBufferRef`.

*Stage 2 — AI drafting (backend):* when recognition ends, the raw transcript posts to `/api/assistant/voice-assist`. Ollama receives a JSON-forced prompt: *"translate to English, write a formal 2–4 sentence complaint description keeping every factual detail, and a ≤10-word title."* Response auto-fills the description and (if empty) the title, with a note like *"✨ AI translated your Hindi dictation."* Ollama offline → the raw transcript simply stays in the field.

**Why the split matters:** speech-to-text runs on the browser's engine (fast, streaming), while translation/formalization runs on the local LLM (private). Neither stage blocks the other from failing gracefully.

**Failure diagnosis (the "mic does nothing" class of bugs):**
- Every `onerror` code maps to a human explanation (`not-allowed` → permission steps, `network` → Chrome's recognizer needs internet, `audio-capture` → no mic).
- An **8-second watchdog**: if listening starts but no `onspeechstart`/`onresult` arrives, recognition is stopped and a checklist is shown (speak louder / use Chrome or Edge — Brave & Firefox silently block speech / check internet / check mic device). This turns silent failure into actionable guidance.
- Unsupported browsers see a static hint instead of a dead button.

**Known platform constraints (not bugs):** Chrome's speech recognition is cloud-backed — it *requires internet* even though our AI is local; Brave disables it silently; Firefox doesn't implement it. Edge and Chrome work.

---

## 4. 🌐 Site-Wide Languages — how it was integrated

**Files:** `frontend/src/i18n/translations.js` · `frontend/src/context/LanguageContext.jsx` · applied in Navbar, CitizenDashboard, SubmitComplaint, TrackComplaint, SafetyPage

**Design: a 40-line hand-rolled i18n instead of react-i18next** — no bundle weight, no async loading, and the whole dictionary is one readable file per language.

1. `translations.js` — flat `key → string` maps for **8 languages** (the same set the voice feature supports): en, hi, mr, ta, te, kn, bn, gu.
2. `LanguageContext` — holds the current language (persisted to localStorage, mirrored to `<html lang>`), exposes `t(key)` with a two-level fallback: **chosen language → English → the key itself**. A missing translation can therefore never crash or blank a page — it just shows English.
3. The navbar **globe picker** is rendered for both authenticated and anonymous users (the login page must be translatable too).
4. **Voice follows UI:** changing the site language re-defaults the mic's dictation language (`voiceLang = language + "-IN"`), still manually overridable.
5. **Typed input in the chosen language** is translated at submit time: `handleSubmit` sends non-English title+description through the same `/voice-assist` endpoint before submission, so the classifier, priority engine and admins always process English. Best-effort — Ollama offline submits the original text unchanged.

**Extending:** add a language = add one block to `translations.js` + one entry to `LANGUAGES`. Add a string = add the key to `en` (mandatory) and translate where available.

---

## 5. 🔐 JWT Authentication — how it was integrated

**Files:** `backend/app/services/security.py` · `backend/app/routes/auth_routes.py` · `backend/app/main.py` (router protection) · `frontend/src/services/tokenStore.js` · `authService.js` · interceptors in `complaintService.js`/`assistantService.js`

1. **Zero-dependency HS256**: `security.py` implements JWT sign/verify with stdlib `hmac` + `hashlib` — base64url(header).base64url(payload).HMAC-SHA256 signature, verified with timing-safe `hmac.compare_digest`, expiry checked from the `exp` claim. Config: `JWT_SECRET`, `JWT_TTL_HOURS` (12), `JWT_ENFORCE`.
2. **Issuing** (`auth_routes.py`): `POST /api/auth/citizen/login` (aadhaar+mobile vs demo registry) and `POST /api/auth/admin/login` (username + SHA-256-compared password; 7 demo admins with only hashes in memory). Claims carry `sub`, `role`, `name`, and for admins `adminRole` + `department`.
3. **Enforcement**: one line per router — `dependencies=[Depends(require_auth)]` on the complaints and assistant routers. Public by design: `/api/auth/*`, `/api/health`, `/api/scoreboard`, `/uploads`, `/docs`.
4. **Frontend**: `tokenStore.js` owns the token + provides `attachAuthInterceptor()`; both API axios instances use it, so every request carries `Authorization: Bearer <jwt>` automatically. `authService` exchanges the locally-verified identity for a token right after OTP/password success and clears it on logout.
5. **Degradation**: backend offline → token exchange skipped, app runs in localStorage fallback mode; stale pre-JWT sessions get 401s which the service layer already catches → re-login restores full API mode.

---

## 6. 📸 Fix Verification (before/after) — how it was integrated

**Files:** `ai_service.py::verify_fix` · `complaint_routes.py::resolve_with_proof` · `complaint_service.py::resolve_with_proof` · `ResolveProofModal.jsx` · model columns `fix_image_url/fix_verdict/fix_reason/fix_confidence`

- Admin clicks "Resolved" → `ResolveProofModal` demands an AFTER photo → multipart `POST /api/complaints/{id}/resolve-with-proof`.
- Backend saves the photo, then sends **both images in one Ollama vision call** (`images: [before_b64, after_b64]` with a prompt labeling image 1 = BEFORE, image 2 = AFTER; single-image prompt when the complaint had no photo, e.g. safety reports).
- Verdict `FIXED`/`UNCERTAIN` → normal Resolved transition (notifications, priority recalc). **`NOT_FIXED` → status unchanged**, citizen gets a "close-out blocked" notification, and the modal offers only an explicit `force=true` override.
- DB migration is dialect-agnostic (`ALTER TABLE ADD COLUMN` driven by SQLAlchemy inspector) so existing MySQL *and* SQLite files upgrade on boot.
- Citizen side: the Track page shows the before/after pair + verdict badge inside the confirmation panel.

---

## 7. 🌸 Pink Safety Identity & Theme — how it was integrated

- **Theme engine:** 3 CSS variables (`--c-primary`, `--c-primary-hover`, `--c-primary-light`) consumed by Tailwind's `primary` color; `SafetyModeContext` toggles `.theme-safety` on `<html>` to swap teal→pink globally. Applied **only** for authenticated citizens; logout resets the mode and clears the flag (the logout-stays-pink bug fix).
- **Per-complaint identity:** `isSafetyComplaint()` in `constants/index.js` (department/category/priorityBreakdown heuristics) drives the always-pink `SafetyBadge` and pink left borders in every list — Track, Dashboard, AdminPanel, EvidenceAnalyzer, SafetyPage — plus pink map-pin colors for safety departments.

---

## 8. 🧭 Guided Tour engine — how it was rebuilt

**File:** `frontend/src/components/tour/CitizenTour.jsx`

- **One `requestAnimationFrame` loop** per step finds the `[data-tour]` target, `scrollIntoView`s it once, then each frame reads `getBoundingClientRect`, **lerps** the spotlight 30% toward the target (smooth motion without CSS transitions), rounds to whole pixels, and only calls `setRect` when the value actually changed — steady frames cost one layout read and zero React renders.
- **Dim vs. pulse separation:** the page dim is a non-animated element with a `0 0 0 100vmax` box-shadow; the pulsing ring is a *separate* element — previously the pulse keyframes overrode the dim shadow every cycle (the flicker bug).
- Interaction lock: wheel/touch/scroll-keys blocked at capture phase; **Tab is a real focus trap** cycling the tooltip's buttons; Esc exits. Element search has a 4s deadline instead of a `setTimeout` polling chain.

---

## 9. Cross-cutting: the fallback matrix

| Layer | Down | What happens | Where |
|---|---|---|---|
| MySQL | ✗ | SQLite file auto-created | `database/db.py` |
| Backend API | ✗ | localStorage simulation of complaints | `localComplaintStore.js` |
| Ollama text | ✗ | keyword classifier · rule-based chat (real DB lookups) · raw transcript kept | `ai_classifier.py`, `chat_service.py`, `ai_service.py` |
| Ollama vision | ✗ | `UNCERTAIN` verdicts (status-quo behavior, never blocks) | `ai_service.py` |
| Browser speech | ✗ | mapped error messages + 8s watchdog checklist | `SubmitComplaint.jsx` |
| JWT backend | ✗ | token exchange skipped, offline mode continues | `authService.js` |
| Scoreboard API | ✗ | identical formula recomputed client-side | `complaintService.js` |
| A translation key | ✗ | falls back to English, then the key | `LanguageContext.jsx` |
