import React, { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  User,
  Phone,
  Calendar,
  Activity,
  CheckCircle2,
  Clock,
  Wrench,
  ThumbsUp,
  AlertCircle,
  FileText,
  ClipboardList,
  PlusCircle,
  BarChart2,
  Zap,
  Star,
  ShieldAlert,
  UserCog,
  RotateCcw,
  Loader2,
  BadgeCheck,
  CalendarClock,
  MessageCircle,
} from "lucide-react";
import { useComplaints } from "../../context/ComplaintContext";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { StatusBadge, PriorityBadge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { SkeletonListItem, SkeletonCard } from "../../components/ui/Skeleton";
import { PRIORITY_COLORS, SLA_LIMITS } from "../../constants";
import { formatDate } from "../../utils/format";

/**
 * Expected-resolution transparency: derive the promised date from the
 * priority's SLA window, and say so plainly when it has been breached
 * (the backend auto-escalates those).
 */
const resolutionEstimate = (complaint) => {
  const level = complaint.priorityLevel || complaint.priority || "Medium";
  const hours = SLA_LIMITS[level] || SLA_LIMITS.Medium;
  const due = new Date(new Date(complaint.createdAt).getTime() + hours * 3600 * 1000);
  return { due, overdue: Date.now() > due.getTime(), hours, level };
};

/** Prefilled WhatsApp share link with the complaint's live status. */
const whatsappShareUrl = (c) => {
  const level = c.priorityLevel || c.priority || "Medium";
  const text =
    `🏛️ Grievance Update — ${c.id}\n` +
    `"${c.title}"\n` +
    `📍 ${c.area}\n` +
    `Status: ${c.status} • Priority: ${level}\n` +
    `Department: ${c.department}\n` +
    `— via Grievance Portal, Smart Governance System`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

const STATUS_STEPS = [
  { label: "Submitted", desc: "Grievance received and registered.", icon: CheckCircle2 },
  { label: "Assigned", desc: "Assigned to the appropriate department.", icon: Clock },
  { label: "In Progress", desc: "Crews dispatched to resolve the issue.", icon: Wrench },
  { label: "Resolved", desc: "Issue resolved and verified.", icon: ThumbsUp },
  { label: "Closed", desc: "Resolution confirmed by you. Ticket closed.", icon: BadgeCheck },
];

const STATUS_LIST = STATUS_STEPS.map((s) => s.label);

// ─── Star rating picker ─────────────────────────────────────────────────────
function StarRating({ value, onChange, readOnly = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange && onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={readOnly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"}
        >
          <Star
            className={`w-6 h-6 ${
              n <= value ? "text-status-warning-accent fill-status-warning-accent" : "text-border"
            }`}
            fill={n <= value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

function TrackComplaint() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { complaints, loadingComplaints, confirmResolution, updateStatus } = useComplaints();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Confirm-resolution (rating + feedback) state
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleConfirmResolution = async (id) => {
    if (rating < 1) {
      setActionError("Please select a star rating before confirming.");
      return;
    }
    setConfirming(true);
    setActionError("");
    try {
      await confirmResolution(id, rating, feedback.trim());
      setRating(0);
      setFeedback("");
    } catch (err) {
      setActionError(err.message || "Unable to confirm resolution.");
    } finally {
      setConfirming(false);
    }
  };

  const handleReopen = async (id) => {
    setReopening(true);
    setActionError("");
    try {
      await updateStatus(id, "In Progress");
    } catch (err) {
      setActionError(err.message || "Unable to reopen the complaint.");
    } finally {
      setReopening(false);
    }
  };

  // All complaints belonging to this citizen.
  // API records link ownership by phone; offline records by Aadhaar.
  const myMobile = userData?.mobile || "";
  const myAadhaar = userData?.aadhaar || "";
  const myComplaints = useMemo(
    () =>
      complaints.filter(
        (c) =>
          (myMobile && c.citizenPhone === myMobile) ||
          (myAadhaar && c.citizenId === myAadhaar)
      ),
    [complaints, myMobile, myAadhaar]
  );

  // Filter by search text (ID, area or title)
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return myComplaints;
    return myComplaints.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        (c.area && c.area.toLowerCase().includes(q)) ||
        (c.title && c.title.toLowerCase().includes(q))
    );
  }, [myComplaints, searchQuery]);

  // Timeline step index
  const activeStepIdx = (status) => {
    const idx = STATUS_LIST.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  const current = selectedComplaint
    ? complaints.find((c) => c.id === selectedComplaint.id) || selectedComplaint
    : null;

  const activeIdx = current ? activeStepIdx(current.status) : 0;

  return (
    <div className="max-w-6xl mx-auto w-full pb-12 space-y-6 animate-fade-in">
      {/* ── Header + search ── */}
      <div className="card relative overflow-hidden" data-tour="track-page">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
        <div className="mb-5">
          <h1 className="text-xl md:text-2xl font-bold text-text flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Track My Grievances
          </h1>
          <p className="text-muted text-sm mt-1">
            All your submitted complaints are listed below. Click a complaint to
            see the full timeline.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Complaint ID, title, or area…"
            className="input pl-11 py-3"
          />
        </div>
      </div>

      {/* ── Loading ── */}
      {loadingComplaints && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-80 shrink-0 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonListItem key={i} />
            ))}
          </div>
          <div className="flex-grow">
            <SkeletonCard lines={6} />
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loadingComplaints && myComplaints.length === 0 && (
        <div className="card max-w-md mx-auto">
          <EmptyState
            icon={ClipboardList}
            title="No complaints yet"
            description="You have not submitted any grievances. Lodge a complaint to get started."
            action={
              <button onClick={() => navigate("/")} className="btn-primary">
                <PlusCircle className="w-4 h-4" />
                Lodge a Complaint
              </button>
            }
          />
        </div>
      )}

      {/* ── No search results ── */}
      {!loadingComplaints && myComplaints.length > 0 && filtered.length === 0 && (
        <div className="card max-w-md mx-auto">
          <EmptyState
            icon={AlertCircle}
            title="No matches"
            description="No complaints match your search."
          />
        </div>
      )}

      {/* ── Complaint list + detail ── */}
      {!loadingComplaints && filtered.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: complaint list */}
          <div className="w-full lg:w-80 shrink-0 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted px-1">
              Your Complaints ({filtered.length})
            </h3>
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map((c) => {
                const isSelected = current?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedComplaint(c)}
                    className={`w-full p-4 rounded-card border text-left cursor-pointer transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-primary-light border-primary/40 shadow-card"
                        : "bg-surface border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono font-bold text-primary text-xs shrink-0">
                        {c.id}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <PriorityBadge
                          level={c.priorityLevel || c.priority}
                          score={c.priorityScore ?? null}
                          className="!text-[10px] !px-2"
                        />
                        <StatusBadge status={c.status} className="!text-[10px] !px-2" />
                      </div>
                    </div>
                    <p className="text-sm text-text font-semibold line-clamp-1">{c.title}</p>
                    <p className="text-xs text-muted">{c.area}</p>
                    <span className="text-[11px] text-muted border-t border-border pt-2 mt-1 block">
                      {formatDate(c.createdAt)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: detail view */}
          {current ? (
            <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Timeline */}
              <div className="card md:col-span-5 h-full">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-6 border-b border-border pb-3">
                  Resolution Timeline
                </h3>
                <div className="relative space-y-6 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= activeIdx;
                    const isActive = idx === activeIdx;
                    const StepIcon = step.icon;
                    return (
                      <div key={step.label} className="flex gap-4 items-start relative">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border z-10 transition-all duration-300 shrink-0 ${
                            isCompleted
                              ? "bg-primary border-primary text-white"
                              : "bg-surface border-border text-muted"
                          } ${isActive ? "ring-4 ring-primary/15" : ""}`}
                        >
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-grow pt-1 select-none">
                          <h4
                            className={`text-sm font-bold transition-colors ${
                              isCompleted
                                ? isActive
                                  ? "text-primary"
                                  : "text-text"
                                : "text-muted"
                            }`}
                          >
                            {step.label}
                          </h4>
                          <p className={`text-xs mt-0.5 ${isCompleted ? "text-muted" : "text-muted/60"}`}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detail panel */}
              <div className="card md:col-span-7 space-y-5 h-full">
                {/* Header row */}
                <div className="flex justify-between items-center border-b border-border pb-3 gap-3">
                  <div>
                    <span className="text-[10px] text-muted font-bold uppercase tracking-widest block">
                      Reference Ticket
                    </span>
                    <span className="text-xl font-mono font-bold text-primary">
                      {current.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {current.is_escalated && (
                      <span className="badge-error">
                        <ShieldAlert className="w-3 h-3" />
                        Escalated
                      </span>
                    )}
                    <StatusBadge status={current.status} />
                  </div>
                </div>

                {/* ── Expected resolution + share row ── */}
                {(() => {
                  const isOpen = !["Resolved", "Closed"].includes(current.status);
                  const est = resolutionEstimate(current);
                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {isOpen ? (
                        <span
                          className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border ${
                            est.overdue
                              ? "bg-status-error-bg border-status-error-border text-status-error-text"
                              : "bg-primary-light border-primary/20 text-primary"
                          }`}
                        >
                          <CalendarClock className="w-4 h-4 shrink-0" />
                          {est.overdue ? (
                            <>SLA breached — escalated to senior review automatically</>
                          ) : (
                            <>
                              Expected resolution by{" "}
                              {est.due.toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                              })}{" "}
                              <span className="font-normal opacity-75">
                                ({est.level}-priority SLA: {est.hours}h)
                              </span>
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border bg-status-success-bg border-status-success-border text-status-success-text">
                          <BadgeCheck className="w-4 h-4 shrink-0" />
                          {current.status === "Closed" ? "Ticket closed" : "Marked resolved"} —{" "}
                          {formatDate(current.updatedAt)}
                        </span>
                      )}

                      <a
                        href={whatsappShareUrl(current)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary !py-2 text-xs w-fit shrink-0"
                        title="Share this complaint's status on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-primary" />
                        Share status
                      </a>
                    </div>
                  );
                })()}

                {/* ── Resolution confirmation (Resolved → rate & close / reopen) ── */}
                {current.status === "Resolved" && (
                  <div className="rounded-card border border-status-success-border bg-status-success-bg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-status-success-accent" />
                      <h4 className="text-sm font-bold text-status-success-text">
                        Your issue was marked resolved — please confirm
                      </h4>
                    </div>
                    <p className="text-xs text-status-success-text/80 leading-relaxed">
                      Rate the resolution to close this ticket, or reopen it if the
                      issue still persists.
                    </p>

                    {actionError && (
                      <p className="text-xs text-status-error-text font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {actionError}
                      </p>
                    )}

                    <div className="flex items-center gap-3">
                      <StarRating value={rating} onChange={setRating} />
                      {rating > 0 && (
                        <span className="text-xs font-semibold text-status-success-text">
                          {rating}/5
                        </span>
                      )}
                    </div>

                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="Optional feedback about the resolution…"
                      className="input resize-none !bg-surface text-sm"
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleConfirmResolution(current.id)}
                        disabled={confirming || reopening}
                        className="btn-primary flex-1 !py-2.5 text-xs"
                      >
                        {confirming ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <BadgeCheck className="w-4 h-4" />
                        )}
                        Confirm &amp; Close Ticket
                      </button>
                      <button
                        onClick={() => handleReopen(current.id)}
                        disabled={confirming || reopening}
                        className="btn-secondary flex-1 !py-2.5 text-xs"
                      >
                        {reopening ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        Issue Persists — Reopen
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Closed: show recorded rating ── */}
                {current.status === "Closed" && current.rating != null && (
                  <div className="rounded-card border border-border bg-surfaceSoft p-4 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-text flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4 text-primary" />
                        Resolution confirmed
                      </h4>
                      {current.feedback && (
                        <p className="text-xs text-muted italic mt-1.5">
                          "{current.feedback}"
                        </p>
                      )}
                    </div>
                    <StarRating value={current.rating} readOnly />
                  </div>
                )}

                {/* Title */}
                <div className="inset-panel px-4 py-3">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wide block mb-1">
                    Complaint Title
                  </span>
                  <p className="text-text text-sm font-semibold">{current.title}</p>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1 inset-panel p-3.5">
                    <span className="text-[10px] text-muted font-bold uppercase tracking-wide block">
                      Citizen
                    </span>
                    <p className="text-text font-semibold flex items-center gap-1.5 text-sm">
                      <User className="w-3.5 h-3.5 text-muted" />
                      {current.citizenName || "Anonymous"}
                    </p>
                    {current.citizenPhone && (
                      <p className="text-muted font-mono flex items-center gap-1.5 mt-0.5 text-xs">
                        <Phone className="w-3.5 h-3.5 text-muted" />
                        {current.citizenPhone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 inset-panel p-3.5">
                    <span className="text-[10px] text-muted font-bold uppercase tracking-wide block">
                      Filed On
                    </span>
                    <p className="text-text font-semibold flex items-center gap-1.5 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-muted" />
                      {formatDate(current.createdAt)}
                    </p>
                    <p className="text-muted text-xs">
                      Updated: {new Date(current.updatedAt).toLocaleTimeString()}
                    </p>
                    {current.assigned_officer && (
                      <p className="text-muted text-xs flex items-center gap-1.5 pt-0.5">
                        <UserCog className="w-3.5 h-3.5" />
                        Officer: <span className="font-semibold text-text">{current.assigned_officer}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* AI classification summary */}
                <div className="inset-panel p-4 space-y-3.5 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-muted font-bold block uppercase mb-0.5">
                        Assigned Department
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {current.department || "Other"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted font-bold block uppercase mb-0.5">
                        Category
                      </span>
                      <span className="text-sm font-semibold text-text">
                        {current.category || "General"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted font-bold block uppercase mb-1">
                        Priority Level
                      </span>
                      <PriorityBadge
                        level={current.priorityLevel || current.priority}
                        score={current.priorityScore ?? null}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted font-bold block uppercase mb-1">
                        AI Severity
                      </span>
                      <span
                        className={
                          current.ai_severity === "Critical"
                            ? "badge-error"
                            : current.ai_severity === "Major"
                              ? "badge-warning"
                              : "badge-neutral"
                        }
                      >
                        {current.ai_severity || "Moderate"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-border space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted font-bold uppercase">
                        AI Routing Confidence
                      </span>
                      <span className="font-mono text-text font-bold">
                        {current.ai_confidence != null
                          ? `${Math.round(current.ai_confidence * 100)}%`
                          : "0%"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          (current.ai_confidence ?? 0) >= 0.8
                            ? "bg-status-success-accent"
                            : (current.ai_confidence ?? 0) >= 0.5
                              ? "bg-status-warning-accent"
                              : "bg-status-error-accent"
                        }`}
                        style={{ width: `${Math.round((current.ai_confidence ?? 0) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {current.ai_keywords && (
                    <div className="pt-2 border-t border-border">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(current.ai_keywords)
                          ? current.ai_keywords
                          : (current.ai_keywords || "")
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                        ).map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-surface text-[11px] text-muted rounded-md font-medium border border-border"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {current.ai_reason && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted italic">
                        Classification audit log: "{current.ai_reason}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Priority breakdown */}
                {(() => {
                  const score = current.priorityScore ?? 0;
                  const level = current.priorityLevel || current.priority || "Medium";
                  const bd = current.priorityBreakdown || {};
                  const reason = current.priorityReason || current.ai_reason || null;
                  const barColor = PRIORITY_COLORS[level] || "#8A897F";

                  const factors = [
                    { label: "Safety Risk", val: bd.safetyRisk ?? 0, max: 30 },
                    { label: "Public Impact", val: bd.publicImpact ?? 0, max: 20 },
                    { label: "Essential Service", val: bd.essentialService ?? 0, max: 20 },
                    { label: "Urgency", val: bd.urgency ?? 0, max: 10 },
                    { label: "Duplicates", val: bd.duplicates ?? 0, max: 10 },
                    { label: "Location", val: bd.location ?? 0, max: 5 },
                    { label: "Time Pending", val: bd.timePending ?? 0, max: 5 },
                    ...(bd.womenSafety > 0
                      ? [{ label: "Safety Boost", val: bd.womenSafety, max: 15 }]
                      : []),
                  ];

                  return (
                    <div className="inset-panel p-4 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-primary" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                            Priority Breakdown
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PriorityBadge level={level} />
                          <span className="font-mono font-bold text-text text-sm">
                            {score}
                            <span className="text-muted text-[10px] font-semibold">/100</span>
                          </span>
                        </div>
                      </div>

                      {/* Gauge */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted font-semibold">
                          <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                        </div>
                        <div className="h-2.5 bg-border rounded-full overflow-hidden relative">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(score, 100)}%`, background: barColor }}
                          />
                          {[25, 50, 75].map((p) => (
                            <div
                              key={p}
                              className="absolute top-0 bottom-0 w-px bg-surface"
                              style={{ left: `${p}%` }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Factors */}
                      <div className="space-y-2">
                        {factors.map((f) => (
                          <div key={f.label} className="flex items-center gap-3">
                            <span className="text-[11px] text-muted font-semibold w-28 shrink-0">
                              {f.label}
                            </span>
                            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: f.max > 0 ? `${Math.min((f.val / f.max) * 100, 100)}%` : "0%",
                                  background: barColor,
                                }}
                              />
                            </div>
                            <span className="font-mono text-[11px] text-muted w-10 text-right shrink-0">
                              {f.val}/{f.max}
                            </span>
                          </div>
                        ))}
                      </div>

                      {reason && (
                        <div className="pt-3 border-t border-border flex items-start gap-2">
                          <Zap className="w-3 h-3 text-status-warning-accent shrink-0 mt-0.5" />
                          <p className="text-xs text-muted italic leading-relaxed">{reason}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Location */}
                <div className="inset-panel p-4 text-sm">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">
                    Location
                  </span>
                  <p className="text-text flex items-start gap-1.5 font-medium leading-relaxed mt-1">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      {current.area}
                      {current.landmark && ` — near ${current.landmark}`}
                      {current.pinCode && ` (${current.pinCode})`}
                    </span>
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted">
                    <FileText className="w-4 h-4" />
                    <span className="font-bold uppercase text-[10px] tracking-wider">
                      Description
                    </span>
                  </div>
                  <div className="inset-panel p-4 text-text text-sm leading-relaxed max-h-40 overflow-y-auto">
                    {current.description}
                  </div>
                </div>

                {/* Evidence image */}
                {(current.imagePreview || current.imageFullUrl) && (
                  <div className="space-y-2">
                    <span className="font-bold uppercase text-[10px] text-muted tracking-wider block">
                      Uploaded Evidence
                    </span>
                    <div className="inset-panel p-2 overflow-hidden">
                      <img
                        src={current.imagePreview || current.imageFullUrl}
                        alt="Evidence"
                        className="max-h-52 w-full object-contain rounded-lg bg-surface border border-border"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-grow card flex items-center justify-center min-h-[300px]">
              <EmptyState
                icon={Search}
                title="Select a complaint"
                description="Choose a complaint from the list to view its details and timeline."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TrackComplaint;
