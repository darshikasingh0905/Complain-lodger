import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  HeartHandshake,
  PhoneCall,
  ChevronRight,
  Siren,
  EyeOff,
  Lightbulb,
  Users,
  SprayCan,
  HandHelping,
} from "lucide-react";
import { useSafetyMode } from "../../context/SafetyModeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useComplaints } from "../../context/ComplaintContext";
import { StatusBadge, PriorityBadge, SafetyBadge } from "../../components/ui/Badge";
import { SAFETY_PINK } from "../../constants";
import { PageHeader } from "../../components/ui/PageHeader";

/**
 * Community Safety Center — the citizen-side safety hub.
 *
 * Safety reporting is for EVERYONE (robbery, dark streets, fights,
 * suspicious activity). Women can additionally switch on Women Safety Mode
 * here: the portal re-themes pink and women-safety complaints receive the
 * dedicated priority boost.
 */

// Gender-neutral quick presets. Starters carry the keywords the classifier
// and priority engine recognise, so reports route + boost correctly.
const GENERAL_PRESETS = [
  {
    label: "Robbery / Snatching",
    icon: Siren,
    title: "Robbery / snatching incident at ",
    starter: "A robbery / snatching incident occurred here. People in the area feel unsafe. ",
  },
  {
    label: "Unsafe / Dark Street",
    icon: Lightbulb,
    title: "Unsafe dark street at ",
    starter: "This street is unsafe at night — the lights are dead and the lane is completely dark. ",
  },
  {
    label: "Suspicious Activity",
    icon: EyeOff,
    title: "Suspicious activity near ",
    starter: "Suspicious individuals have been loitering here, making residents feel unsafe. ",
  },
  {
    label: "Street Fight / Nuisance",
    icon: Users,
    title: "Public nuisance / fights at ",
    starter: "Frequent fights and drunk nuisance here create an unsafe atmosphere and risk of assault. ",
  },
  {
    label: "Harassment",
    icon: HandHelping,
    title: "Harassment incident near ",
    starter: "I want to report harassment in this area. It feels very unsafe. ",
  },
  {
    label: "Vandalism",
    icon: SprayCan,
    title: "Vandalism at ",
    starter: "Public property is being vandalised here, and confrontations feel dangerous. ",
  },
];

const HELPLINES = [
  { label: "Emergency", number: "112" },
  { label: "Police", number: "100" },
  { label: "Women Helpline", number: "1091" },
  { label: "Women in Distress", number: "181" },
];

const SAFETY_DEPTS = ["Police", "Women Safety Cell"];

export default function SafetyPage() {
  const navigate = useNavigate();
  const { safetyMode, toggleSafetyMode } = useSafetyMode();
  const { t } = useLanguage();
  const { complaints } = useComplaints();

  // Recent safety reports across the community (both cells)
  const safetyComplaints = useMemo(
    () =>
      complaints
        .filter((c) => SAFETY_DEPTS.includes(c.department))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [complaints]
  );

  const startReport = (preset) =>
    navigate("/safety/report", {
      state: preset ? { safetyPreset: { title: preset.title, starter: preset.starter } } : undefined,
    });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Community Safety"
        icon={Shield}
        title={t("safety.title")}
        description="Report anything that makes your neighbourhood feel unsafe — for everyone. Safety complaints receive a dedicated priority boost so they're acted on first."
      />

      {/* ── Women Safety Mode switch ── */}
      <section
        className={`card relative overflow-hidden transition-all duration-300 ${
          safetyMode ? "!border-primary/40" : ""
        }`}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="icon-chip w-12 h-12 shrink-0">
              <HeartHandshake className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-text flex items-center gap-2 flex-wrap">
                {t("safety.womenMode")}
                {safetyMode && <span className="badge-primary !text-[10px]">Active</span>}
              </h2>
              <p className="text-xs text-muted mt-1 leading-relaxed max-w-xl">
                Designed for women: the portal switches to a pink theme, unlocks
                one-tap safety reporting with emergency helplines, photo evidence
                becomes optional, and women-safety complaints get a{" "}
                <strong>+15 priority boost</strong> routed to the Women Safety Cell.
              </p>
            </div>
          </div>

          <button
            onClick={toggleSafetyMode}
            role="switch"
            aria-checked={safetyMode}
            className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-full border font-semibold text-sm transition-all duration-300 ${
              safetyMode
                ? "bg-primary text-white border-primary shadow-lift"
                : "bg-surface text-text border-border hover:border-primary/40 hover:text-primary"
            }`}
          >
            {safetyMode ? "On" : "Off"}
            <span
              className={`w-9 h-[20px] rounded-full relative transition-colors duration-300 ${
                safetyMode ? "bg-white/30" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                  safetyMode ? "left-[18px]" : "left-[2px]"
                }`}
              />
            </span>
          </button>
        </div>
      </section>

      {/* ── Quick report presets (for everyone) ── */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="section-title">{t("safety.report")}</h2>
            <p className="section-description">
              One tap starts a pre-filled complaint — add the location and details, done.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GENERAL_PRESETS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.label}
                onClick={() => startReport(p)}
                className="inset-panel card-hover p-4 text-left flex flex-col gap-2.5 group"
              >
                <div className="icon-chip w-10 h-10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
                  {p.label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-auto">
                  Report
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => startReport(null)}
          className="btn-secondary w-full mt-4 !py-2.5 text-xs"
        >
          Something else? Open the safety report form
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Helplines */}
        <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {t("safety.helplines")}
          </span>
          {HELPLINES.map((h) => (
            <a
              key={h.number}
              href={`tel:${h.number}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              {h.label}: <span className="font-mono">{h.number}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Recent community safety reports ── */}
      {safetyComplaints.length > 0 && (
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="section-title">Recent Safety Reports</h2>
              <p className="section-description">
                Safety complaints from your community, prioritized by the engine.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {safetyComplaints.map((c) => (
              <div
                key={c.id}
                style={{ borderLeft: `3px solid ${SAFETY_PINK}` }}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-lg inset-panel"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-primary font-semibold">{c.id}</p>
                  <p className="font-medium text-text truncate">{c.title}</p>
                  <p className="text-xs text-muted truncate">{c.area}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <SafetyBadge compact />
                  <PriorityBadge level={c.priorityLevel || c.priority} score={c.priorityScore ?? null} />
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
