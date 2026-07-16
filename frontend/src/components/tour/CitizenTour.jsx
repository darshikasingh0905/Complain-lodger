import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, ArrowLeft, X } from "lucide-react";
import useAuth from "../../hooks/useAuth";

/**
 * First-time citizen tour.
 *
 * A spotlight walkthrough that teaches new citizens how to lodge a complaint
 * and track its status. While the tour is running a full-screen overlay
 * blocks ALL interaction — only the tour controls are clickable.
 *
 * - Auto-starts on a citizen's first login (persisted via localStorage).
 * - Can be replayed via `window.dispatchEvent(new Event("start-citizen-tour"))`
 *   (the dashboard's "Take a Tour" button does this).
 * - Steps target elements marked with `data-tour="..."` and can span pages —
 *   the engine navigates, waits for the target, scrolls it into view and
 *   tracks its position with a single requestAnimationFrame loop (no scroll
 *   listeners, no polling timers, no re-render storms).
 *
 * Perf notes (this file was rewritten to fix tour lag):
 * - ONE rAF loop reads getBoundingClientRect once per frame and lerps the
 *   spotlight toward it — smooth motion with zero CSS transitions, so the
 *   spotlight never rubber-bands behind programmatic scrolling.
 * - The page dim (huge box-shadow) lives on its own non-animated element;
 *   the pulsing ring is a separate element. Previously the pulse keyframes
 *   overrode the dim shadow and made the whole overlay flicker.
 * - Rect state only updates when the rounded rect actually changed, so
 *   steady frames cost one layout read and no React render.
 */

const TOUR_KEY = "citizen_tour_done_v1";

const STEPS = [
  {
    path: "/dashboard",
    selector: null,
    title: "Welcome to the Grievance Portal 👋",
    body: "Let's take a quick one-minute tour of how to lodge a complaint and track its progress. Interaction with the page is paused while the tour is running.",
  },
  {
    path: "/dashboard",
    selector: '[data-tour="lodge-card"]',
    title: "Lodge a Complaint",
    body: "Start here whenever you want to report a civic issue — potholes, water leaks, power outages, garbage and more.",
  },
  {
    path: "/dashboard",
    selector: '[data-tour="safety-card"]',
    title: "Community Safety Center 🛡️",
    body: "Our signature feature: one-tap reporting for robbery, dark streets, fights and harassment — safety complaints get a dedicated +15 priority boost for everyone. Inside, women can flip on Women Safety Mode: the portal turns pink, helplines appear, and photo evidence becomes optional.",
  },
  {
    path: "/",
    selector: '[data-tour="citizen-details"]',
    title: "Your Details — Auto-filled",
    body: "Your Aadhaar-verified identity is attached automatically. Nothing to type here.",
  },
  {
    path: "/",
    selector: '[data-tour="location-section"]',
    title: "Where is the Issue?",
    body: "Describe the area, and optionally pin the exact spot using GPS or the map picker — it helps crews find the problem faster.",
  },
  {
    path: "/",
    selector: '[data-tour="details-section"]',
    title: "Describe the Problem",
    body: "Give a clear title and description — type it, or speak it in your own language with the mic. Our AI reads this to route your complaint to the right department and score its urgency.",
  },
  {
    path: "/",
    selector: '[data-tour="evidence-upload"]',
    title: "Add Photo Evidence",
    body: "At least one photo is required. AI also verifies that the image matches your complaint.",
  },
  {
    path: "/",
    selector: '[data-tour="submit-btn"]',
    title: "Submit It",
    body: "That's it — you'll instantly receive a complaint ID (like CMP-0007) that you can use to track progress.",
  },
  {
    path: "/track",
    selector: '[data-tour="track-page"]',
    title: "Track Your Complaints",
    body: "All your complaints live here. Click any of them to see the resolution timeline and priority analysis — and once it's resolved, confirm & rate the fix right from this page.",
  },
  {
    path: "/dashboard",
    selector: '[data-tour="notifications"]',
    title: "Stay Notified",
    body: "You'll get an alert here every time your complaint's status changes or it gets escalated. You're all set — go report your first issue!",
  },
];

const TOOLTIP_W = 360;
const TOOLTIP_H_EST = 230;
const PAD = 8;
const FIND_DEADLINE_MS = 4000; // give up locating a target after ~4s

/** Round a DOMRect to whole pixels so tiny sub-pixel jitter never re-renders. */
const roundRect = (r) => ({
  top: Math.round(r.top),
  left: Math.round(r.left),
  width: Math.round(r.width),
  height: Math.round(r.height),
  bottom: Math.round(r.bottom),
});

const sameRect = (a, b) =>
  !!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;

/** Move `from` a fraction of the way toward `to` (spotlight easing). */
const lerpRect = (from, to, t) => ({
  top: from.top + (to.top - from.top) * t,
  left: from.left + (to.left - from.left) * t,
  width: from.width + (to.width - from.width) * t,
  height: from.height + (to.height - from.height) * t,
  bottom: from.bottom + (to.bottom - from.bottom) * t,
});

export default function CitizenTour() {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState(null); // smoothed viewport rect of the spotlighted element
  const tooltipRef = useRef(null);
  const [tipHeight, setTipHeight] = useState(TOOLTIP_H_EST);

  const step = active ? STEPS[stepIdx] : null;
  const hasTarget = !!(step?.selector && rect);

  // Measure the real tooltip height only when its content changes (step) or
  // it first attaches to a target — NOT on every render. The clamp below uses
  // it so the buttons never end up off-screen (scroll is locked during the tour).
  useLayoutEffect(() => {
    if (tooltipRef.current) setTipHeight(tooltipRef.current.offsetHeight);
  }, [stepIdx, hasTarget, active]);

  // ── Auto-start on first citizen login — exactly ONCE ───────────────────────
  // The seen-flag is written the moment the tour fires, so refreshing the page
  // (or abandoning mid-tour) never replays it. Replay stays available via the
  // dashboard's "Take a Tour" button.
  useEffect(() => {
    if (isAuthenticated && userRole === "citizen" && !localStorage.getItem(TOUR_KEY)) {
      localStorage.setItem(TOUR_KEY, "1");
      const t = setTimeout(() => {
        setStepIdx(0);
        setActive(true);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, userRole]);

  // ── Manual replay (dashboard "Take a Tour" button) ──────────────────────────
  useEffect(() => {
    const start = () => {
      setStepIdx(0);
      setActive(true);
    };
    window.addEventListener("start-citizen-tour", start);
    return () => window.removeEventListener("start-citizen-tour", start);
  }, []);

  const end = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "1");
    setActive(false);
    setRect(null);
  }, []);

  // Tour only makes sense for citizens — bail out if the role changes mid-way
  useEffect(() => {
    if (active && (!isAuthenticated || userRole !== "citizen")) setActive(false);
  }, [active, isAuthenticated, userRole]);

  // ── Navigate to the step's page ─────────────────────────────────────────────
  useEffect(() => {
    if (!active || !step) return;
    if (location.pathname !== step.path) navigate(step.path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIdx]);

  // ── Locate + track the target element (single rAF loop) ────────────────────
  useEffect(() => {
    if (!active || !step) return;
    if (location.pathname !== step.path) return; // wait for navigation

    setRect(null);
    if (!step.selector) return; // centered welcome step — no target

    let raf = 0;
    let el = null;
    let scrolled = false;
    let smooth = null; // the lerped rect we actually render
    const startedAt = performance.now();

    const frame = () => {
      if (!el || !el.isConnected) {
        el = document.querySelector(step.selector);
        if (!el) {
          // Element not on the page yet (data still loading / route settling).
          if (performance.now() - startedAt < FIND_DEADLINE_MS) {
            raf = requestAnimationFrame(frame);
          }
          return; // give up silently after the deadline; overlay stays dimmed
        }
      }

      if (!scrolled) {
        scrolled = true;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }

      const target = roundRect(el.getBoundingClientRect());
      // Ease toward the target; snap when close so steady frames do nothing.
      smooth = !smooth ? target : lerpRect(smooth, target, 0.3);
      if (Math.abs(smooth.top - target.top) < 1 && Math.abs(smooth.left - target.left) < 1) {
        smooth = target;
      }
      const next = roundRect({ ...smooth, bottom: smooth.top + smooth.height });
      setRect((prev) => (sameRect(prev, next) ? prev : next));

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, stepIdx, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Esc to exit ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === "Escape" && end();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, end]);

  // ── Hard interaction lock ───────────────────────────────────────────────────
  // While the tour runs, the page is frozen: user scrolling (wheel, touch,
  // scroll keys) is blocked and Tab focus is trapped inside the tooltip.
  // Programmatic scrolling (scrollIntoView for each step) still works, so the
  // spotlight can move.
  useEffect(() => {
    if (!active) return;

    const insideTour = (node) =>
      node instanceof Element && node.closest("[data-tour-root]");

    // Wheel/touch scrolling is fully frozen — the tour drives all scrolling
    // itself via scrollIntoView, and the tooltip has nothing to scroll.
    const blockScroll = (e) => e.preventDefault();

    const SCROLL_KEYS = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
    const blockKeys = (e) => {
      if (e.key === "Escape") return; // exit shortcut stays available
      if (e.key === "Tab") {
        // Focus trap: cycle through the tour's own buttons instead of letting
        // focus escape into the frozen page underneath.
        e.preventDefault();
        const root = document.querySelector("[data-tour-tooltip]");
        if (!root) return;
        const focusables = Array.from(root.querySelectorAll("button"));
        if (!focusables.length) return;
        const idx = focusables.indexOf(document.activeElement);
        const nextIdx = e.shiftKey
          ? (idx <= 0 ? focusables.length - 1 : idx - 1)
          : (idx === -1 || idx === focusables.length - 1 ? 0 : idx + 1);
        focusables[nextIdx].focus();
        return;
      }
      if (SCROLL_KEYS.includes(e.key) && !insideTour(e.target)) e.preventDefault();
    };

    window.addEventListener("wheel", blockScroll, { passive: false, capture: true });
    window.addEventListener("touchmove", blockScroll, { passive: false, capture: true });
    window.addEventListener("keydown", blockKeys, true);
    return () => {
      window.removeEventListener("wheel", blockScroll, { capture: true });
      window.removeEventListener("touchmove", blockScroll, { capture: true });
      window.removeEventListener("keydown", blockKeys, true);
    };
  }, [active]);

  if (!active || !step) return null;

  const isLast = stepIdx === STEPS.length - 1;

  // ── Tooltip placement: below the target, flipping above when cramped, and
  //    always fully clamped into the viewport using the MEASURED tooltip
  //    height (scroll is locked, so an off-screen tooltip is unreachable) ─────
  let tooltipStyle;
  if (hasTarget) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(TOOLTIP_W, vw - 32);
    const h = tipHeight || TOOLTIP_H_EST;
    let top = rect.bottom + PAD + 14;
    if (top + h > vh - 16) top = rect.top - PAD - 14 - h;
    top = Math.min(Math.max(16, top), Math.max(16, vh - h - 16));
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - width / 2, 16),
      vw - width - 16
    );
    tooltipStyle = { top, left, width };
  }

  return (
    <div
      className="fixed inset-0 z-[999]"
      role="dialog"
      aria-modal="true"
      aria-label="Getting started tour"
      data-tour-root
    >
      {/* Full-screen click blocker — disables ALL page interaction */}
      <div className="absolute inset-0" aria-hidden="true" />

      {hasTarget ? (
        <>
          {/* Page dim: its huge box-shadow darkens everything around the
              cutout. Deliberately NOT animated — the pulsing ring below is a
              separate element so its keyframes can never clobber this shadow. */}
          <div
            className="absolute rounded-xl pointer-events-none"
            style={{
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              boxShadow: "0 0 0 100vmax rgba(15, 23, 42, 0.6)",
            }}
          />
          {/* Pulsing highlight ring (separate layer) */}
          <div
            className="absolute rounded-xl pointer-events-none ring-2 ring-primary animate-pulse-ring"
            style={{
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-[#0f172a]/60" />
      )}

      {/* Tooltip card */}
      {/* Positioning wrapper is separate from the animated card: the pop
          animation overrides `transform`, which would break the centering
          translate if both lived on the same element. */}
      <div
        className={`absolute ${
          hasTarget ? "" : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(400px,calc(100vw-32px))]"
        }`}
        style={tooltipStyle}
      >
      <div
        key={stepIdx}
        ref={tooltipRef}
        data-tour-tooltip
        className="bg-surface border border-border rounded-card shadow-lift p-5 animate-pop"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            Getting Started
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted font-mono">
              {stepIdx + 1}/{STEPS.length}
            </span>
            <button
              onClick={end}
              aria-label="Exit tour"
              className="p-1 rounded text-muted hover:text-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 className="font-bold text-text">{step.title}</h3>
        <p className="text-sm text-muted mt-1.5 leading-relaxed">{step.body}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mt-4">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stepIdx ? "w-5 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 mt-4">
          <button onClick={end} className="btn-ghost !px-3 !py-2 text-xs">
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIdx > 0 && (
              <button
                onClick={() => setStepIdx((i) => i - 1)}
                className="btn-secondary !px-3 !py-2 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? end() : setStepIdx((i) => i + 1))}
              className="btn-primary !px-4 !py-2 text-xs"
            >
              {isLast ? "Finish" : "Next"}
              {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
