import React, { useState } from "react";
import {
  Search,
  Loader2,
  ScanSearch,
  AlertCircle,
  Image as ImageIcon,
  MapPin,
  Tag,
  Building2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { useComplaints } from "../../context/ComplaintContext";
import { EmptyState } from "../../components/ui/EmptyState";
import { PriorityBadge, SafetyBadge } from "../../components/ui/Badge";
import { isSafetyComplaint } from "../../constants";

// ─── Verdict config ───────────────────────────────────────────────────────────
const VERDICT_CONFIG = {
  MATCH: {
    label: "Evidence Match",
    icon: CheckCircle2,
    color: "text-status-success-text",
    accent: "text-status-success-accent",
    bg: "bg-status-success-bg",
    border: "border-status-success-border",
    bar: "bg-status-success-accent",
    badge: "badge-success",
    desc: "The image is consistent with the reported complaint.",
  },
  MISMATCH: {
    label: "Evidence Mismatch",
    icon: XCircle,
    color: "text-status-error-text",
    accent: "text-status-error-accent",
    bg: "bg-status-error-bg",
    border: "border-status-error-border",
    bar: "bg-status-error-accent",
    badge: "badge-error",
    desc: "The image does not match the complaint — possible fraudulent submission.",
  },
  UNCERTAIN: {
    label: "Uncertain",
    icon: HelpCircle,
    color: "text-status-warning-text",
    accent: "text-status-warning-accent",
    bg: "bg-status-warning-bg",
    border: "border-status-warning-border",
    bar: "bg-status-warning-accent",
    badge: "badge-warning",
    desc: "The image is ambiguous or the vision model is unavailable.",
  },
};

// ─── Confidence bar ───────────────────────────────────────────────────────────
function ConfidenceBar({ confidence, barClass }) {
  const pct = Math.round((confidence ?? 0) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5 text-muted">
        <span>Confidence</span>
        <span className="font-semibold text-text">{pct}%</span>
      </div>
      <div className="h-2 w-full bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EvidenceAnalyzer() {
  const { complaints, auditEvidence } = useComplaints();
  const [searchId, setSearchId] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [auditError, setAuditError] = useState("");
  const [auditResult, setAuditResult] = useState(null); // filled after audit

  // ── Find complaint by ID from context ───────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchId.trim().toUpperCase();
    if (!query) return;
    setLoadingSearch(true);
    setSearchError("");
    setComplaint(null);
    setAuditResult(null);
    setAuditError("");
    try {
      await new Promise((r) => setTimeout(r, 300));
      // Accept "CMP-0004", "0004" or plain "4"
      const digits = query.replace(/\D/g, "");
      const found = complaints.find(
        (c) =>
          String(c.id).toUpperCase() === query ||
          (digits && String(c.numericId ?? "") === String(parseInt(digits, 10))) ||
          (digits && String(c.id).replace(/\D/g, "") === digits.padStart(4, "0"))
      );
      if (!found) {
        setSearchError("Complaint not found. Please check the ID (e.g. CMP-0001 or 1).");
        return;
      }
      setComplaint(found);
      // Pre-fill audit result if already audited
      if (found.evidence_verdict) {
        setAuditResult({
          verdict: found.evidence_verdict,
          reason: found.evidence_reason,
          confidence: found.evidence_confidence ?? 0,
        });
      }
    } finally {
      setLoadingSearch(false);
    }
  };

  // ── Trigger evidence audit via context ──────────────────────────────────────
  const handleAudit = async () => {
    if (!complaint) return;
    setLoadingAudit(true);
    setAuditError("");
    setAuditResult(null);
    try {
      const updated = await auditEvidence(complaint.id);
      setComplaint(updated);
      setAuditResult({
        verdict: updated.evidence_verdict,
        reason: updated.evidence_reason,
        confidence: updated.evidence_confidence ?? 0,
      });
    } catch (err) {
      setAuditError(err.message || "Evidence analysis failed.");
    } finally {
      setLoadingAudit(false);
    }
  };

  // Resolve image: local data-URL preview (offline) or served upload (API)
  const imageUrl = complaint?.imagePreview || complaint?.imageFullUrl || null;

  const cfg = auditResult
    ? VERDICT_CONFIG[auditResult.verdict] ?? VERDICT_CONFIG.UNCERTAIN
    : null;

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* ── Page header ── */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          AI Vision Audit
        </div>
        <h1 className="text-3xl font-bold text-text tracking-tight">Evidence Analyzer</h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          Use multi-modal AI to verify whether a citizen's uploaded image is
          consistent with their reported complaint — detecting mismatches and
          potential fraud.
        </p>
      </div>

      {/* ── Search bar ── */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Complaint ID (e.g. CMP-0001)…"
            className="input pl-10 py-3 font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loadingSearch || !searchId.trim()}
          className="btn-primary px-5"
        >
          {loadingSearch ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Search
        </button>
      </form>

      {/* ── Search error ── */}
      {searchError && (
        <div className="alert-error text-sm items-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {searchError}
        </div>
      )}

      {/* ── Complaint card + audit ── */}
      {complaint && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          {/* ── Left: complaint details ── */}
          <div className="card space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted font-medium mb-0.5">Complaint ID</p>
                <p className="text-text font-bold text-2xl font-mono">#{complaint.id}</p>
              </div>
              <span className="flex items-center gap-1.5">
                {isSafetyComplaint(complaint) && <SafetyBadge compact />}
                {(complaint.priorityLevel || complaint.priority) && (
                  <PriorityBadge level={complaint.priorityLevel || complaint.priority} />
                )}
              </span>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-1.5">
                Description
              </p>
              <p className="text-text text-sm leading-relaxed line-clamp-4">
                {complaint.description}
              </p>
            </div>

            {/* Meta */}
            <div className="space-y-2">
              {complaint.department && (
                <div className="flex items-center gap-2 text-sm text-muted flex-wrap">
                  <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-text">{complaint.department}</span>
                  {complaint.category && <span className="text-muted">·</span>}
                  {complaint.category && (
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-muted" />
                      {complaint.category}
                    </span>
                  )}
                </div>
              )}
              {(complaint.area || complaint.address) && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="line-clamp-1">{complaint.area || complaint.address}</span>
                </div>
              )}
            </div>

            {/* AI summary */}
            {complaint.ai_summary && (
              <div className="bg-primary-light border border-primary/15 rounded-lg p-3">
                <p className="text-xs text-primary font-semibold mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Summary
                </p>
                <p className="text-text text-xs leading-relaxed">{complaint.ai_summary}</p>
              </div>
            )}
          </div>

          {/* ── Right: image + audit panel ── */}
          <div className="space-y-4">
            {/* Evidence image */}
            <div className="card !p-0 overflow-hidden">
              {imageUrl ? (
                <div className="relative group">
                  <img
                    src={imageUrl}
                    alt="Evidence"
                    className="w-full h-52 object-cover"
                    onError={(e) => {
                      e.target.parentElement.innerHTML =
                        "<div class=\"flex flex-col items-center justify-center h-52 text-muted gap-2\"><svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5'><rect width='18' height='18' x='3' y='3' rx='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></svg><p class='text-xs'>Image not accessible</p></div>";
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-surface border border-border text-xs text-muted px-3 py-1 rounded-full font-medium shadow-sm">
                    Evidence Image
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-52 text-muted gap-2">
                  <ImageIcon className="w-8 h-8" />
                  <p className="text-xs">No image attached to this complaint</p>
                </div>
              )}
            </div>

            {/* Audit button */}
            {(complaint.imagePreview || complaint.image_url) && (
              <button
                onClick={handleAudit}
                disabled={loadingAudit}
                className="btn-primary w-full py-3.5"
              >
                {loadingAudit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing with Vision AI…
                  </>
                ) : (
                  <>
                    <ScanSearch className="w-4 h-4" />
                    {auditResult ? "Re-run Evidence Audit" : "Run Evidence Audit"}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {/* Audit error */}
            {auditError && (
              <div className="alert-error text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{auditError}</span>
              </div>
            )}

            {/* ── Verdict panel ── */}
            {auditResult && cfg && (
              <div
                className={`${cfg.bg} ${cfg.border} border rounded-card p-5 space-y-4 animate-fade-in`}
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-surface border ${cfg.border}`}>
                    <cfg.icon className={`w-6 h-6 ${cfg.accent}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted font-medium">Audit Result</p>
                    <p className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</p>
                  </div>
                  <span className={`ml-auto ${cfg.badge}`}>{auditResult.verdict}</span>
                </div>

                {/* Reason */}
                <div className="p-3 rounded-lg bg-surface border border-border">
                  <p className="text-xs text-muted font-medium mb-1">AI Reasoning</p>
                  <p className="text-text text-sm leading-relaxed">{auditResult.reason}</p>
                </div>

                {/* Confidence */}
                <ConfidenceBar confidence={auditResult.confidence} barClass={cfg.bar} />

                <p className="text-xs text-muted">{cfg.desc}</p>

                {/* Fallback explainer: verdict came without a vision model */}
                {auditResult.verdict === "UNCERTAIN" &&
                  /unavailable|not found|missing/i.test(auditResult.reason || "") && (
                    <div className="alert-info !text-xs">
                      <span>
                        This is a fallback verdict — the Ollama vision model is not
                        running, so no real image analysis was performed. Start Ollama
                        and pull <code className="font-mono">llama3.2-vision</code>,
                        then re-run the audit for genuine verification.
                      </span>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!complaint && !searchError && (
        <div className="card">
          <EmptyState
            icon={ScanSearch}
            title="Search for a complaint"
            description="Enter a complaint ID above to load evidence details and run an AI audit."
          />
        </div>
      )}
    </div>
  );
}
