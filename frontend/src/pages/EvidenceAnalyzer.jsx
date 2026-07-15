import React, { useState } from 'react';
import {
  ShieldCheck, ShieldAlert, ShieldQuestion,
  Search, Loader2, ScanSearch, AlertCircle,
  Image as ImageIcon, MapPin, Tag, Building2,
  ChevronRight, Sparkles, CheckCircle2, XCircle, HelpCircle
} from 'lucide-react';
import { useComplaints } from '../context/ComplaintContext';

// ─── Verdict Config ───────────────────────────────────────────────────────────
const VERDICT_CONFIG = {
  MATCH: {
    label: 'Evidence Match',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    desc: 'The image is consistent with the reported complaint.',
  },
  MISMATCH: {
    label: 'Evidence Mismatch',
    icon: XCircle,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    glow: 'shadow-rose-500/20',
    bar: 'bg-rose-500',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    desc: 'The image does not match the complaint — possible fraudulent submission.',
  },
  UNCERTAIN: {
    label: 'Uncertain',
    icon: HelpCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
    bar: 'bg-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    desc: 'The image is ambiguous or the vision model is unavailable.',
  },
};

// ─── Priority colours ─────────────────────────────────────────────────────────
const PRIORITY_COLOR = {
  High: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

// ─── Confidence Bar ───────────────────────────────────────────────────────────
function ConfidenceBar({ confidence, barClass }) {
  const pct = Math.round((confidence ?? 0) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5 text-slate-400">
        <span>Confidence</span>
        <span className="font-semibold text-white">{pct}%</span>
      </div>
      <div className="h-2 w-full bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EvidenceAnalyzer() {
  const { complaints, auditEvidence } = useComplaints();
  const [searchId, setSearchId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [auditError, setAuditError] = useState('');
  const [auditResult, setAuditResult] = useState(null); // filled after audit

  // ── Find complaint by ID from context ────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchId.trim().toUpperCase();
    if (!query) return;
    setLoadingSearch(true);
    setSearchError('');
    setComplaint(null);
    setAuditResult(null);
    setAuditError('');
    try {
      await new Promise((r) => setTimeout(r, 300));
      const found = complaints.find((c) => c.id.toUpperCase() === query);
      if (!found) {
        setSearchError('Complaint not found. Please check the ID (e.g. CMP-0001).');
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

  // ── Trigger evidence audit via context ───────────────────────────────────
  const handleAudit = async () => {
    if (!complaint) return;
    setLoadingAudit(true);
    setAuditError('');
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
      setAuditError(err.message || 'Evidence analysis failed.');
    } finally {
      setLoadingAudit(false);
    }
  };

  // Resolve image: prefer local data-URL preview, fall back to nothing
  const imageUrl = complaint?.imagePreview || null;

  const cfg = auditResult ? VERDICT_CONFIG[auditResult.verdict] ?? VERDICT_CONFIG.UNCERTAIN : null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* ── Page Header ── */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          AI Vision Audit
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Evidence Analyzer
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Use multi-modal AI to verify whether a citizen's uploaded image is consistent
          with their reported complaint — detecting mismatches and potential fraud.
        </p>
      </div>

      {/* ── Search Bar ── */}
      <form
        onSubmit={handleSearch}
        className="flex gap-2"
        id="evidence-search-form"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="evidence-complaint-id-input"
            type="number"
            min="1"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Complaint ID…"
            className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
          />
        </div>
        <button
          id="evidence-search-btn"
          type="submit"
          disabled={loadingSearch || !searchId.trim()}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl text-sm transition-all duration-200"
        >
          {loadingSearch ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Search
        </button>
      </form>

      {/* ── Search Error ── */}
      {searchError && (
        <div className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {searchError}
        </div>
      )}

      {/* ── Complaint Card + Audit ── */}
      {complaint && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">

          {/* ── Left: Complaint Details ── */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-0.5">Complaint ID</p>
                <p className="text-white font-bold text-2xl">#{complaint.id}</p>
              </div>
              {complaint.priority && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    PRIORITY_COLOR[complaint.priority] || 'text-slate-400 bg-slate-700 border-slate-600'
                  }`}
                >
                  {complaint.priority}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1.5">Description</p>
              <p className="text-slate-200 text-sm leading-relaxed line-clamp-4">{complaint.description}</p>
            </div>

            {/* Meta */}
            <div className="space-y-2">
              {complaint.department && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-slate-300">{complaint.department}</span>
                  {complaint.category && (
                    <span className="text-slate-600">·</span>
                  )}
                  {complaint.category && (
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-indigo-400" />
                      {complaint.category}
                    </span>
                  )}
                </div>
              )}
              {complaint.address && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="line-clamp-1">{complaint.address}</span>
                </div>
              )}
            </div>

            {/* AI Summary */}
            {complaint.ai_summary && (
              <div className="bg-sky-500/5 border border-sky-500/15 rounded-xl p-3">
                <p className="text-xs text-sky-400 font-semibold mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Summary
                </p>
                <p className="text-slate-300 text-xs leading-relaxed">{complaint.ai_summary}</p>
              </div>
            )}
          </div>

          {/* ── Right: Image + Audit Panel ── */}
          <div className="space-y-4">

            {/* Evidence Image */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
              {imageUrl ? (
                <div className="relative group">
                  <img
                    src={imageUrl}
                    alt="Evidence"
                    className="w-full h-52 object-cover"
                    onError={(e) => {
                      e.target.parentElement.innerHTML =
                        '<div class="flex flex-col items-center justify-center h-52 text-slate-600 gap-2"><svg xmlns=\'http://www.w3.org/2000/svg\' class=\'w-8 h-8\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.5\'><rect width=\'18\' height=\'18\' x=\'3\' y=\'3\' rx=\'2\'/><circle cx=\'9\' cy=\'9\' r=\'2\'/><path d=\'m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\'/></svg><p class=\'text-xs\'>Image not accessible</p></div>';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="absolute top-2 right-2 bg-slate-900/70 backdrop-blur-sm text-xs text-slate-300 px-2 py-0.5 rounded-md font-medium">
                    Evidence Image
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-52 text-slate-600 gap-2">
                  <ImageIcon className="w-8 h-8" />
                  <p className="text-xs">No image attached to this complaint</p>
                </div>
              )}
            </div>

            {/* Audit Button */}
            {complaint.image_url && (
              <button
                id="run-evidence-audit-btn"
                onClick={handleAudit}
                disabled={loadingAudit}
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-purple-900/30"
              >
                {loadingAudit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing with Vision AI…
                  </>
                ) : (
                  <>
                    <ScanSearch className="w-4 h-4" />
                    {auditResult ? 'Re-run Evidence Audit' : 'Run Evidence Audit'}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {/* Audit Error */}
            {auditError && (
              <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{auditError}</span>
              </div>
            )}

            {/* ── Verdict Panel ── */}
            {auditResult && cfg && (
              <div
                className={`${cfg.bg} ${cfg.border} border rounded-2xl p-5 space-y-4 shadow-lg ${cfg.glow} animate-fade-in`}
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${cfg.bg} border ${cfg.border}`}>
                    <cfg.icon className={`w-6 h-6 ${cfg.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Audit Result</p>
                    <p className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</p>
                  </div>
                  <span
                    className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}
                  >
                    {auditResult.verdict}
                  </span>
                </div>

                {/* Reason */}
                <div className={`p-3 rounded-lg bg-slate-900/40`}>
                  <p className="text-xs text-slate-500 font-medium mb-1">AI Reasoning</p>
                  <p className="text-slate-200 text-sm leading-relaxed">{auditResult.reason}</p>
                </div>

                {/* Confidence Bar */}
                <ConfidenceBar confidence={auditResult.confidence} barClass={cfg.bar} />

                {/* Description */}
                <p className="text-xs text-slate-500">{cfg.desc}</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!complaint && !searchError && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center">
            <ScanSearch className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <p className="text-slate-400 font-medium">Search for a complaint</p>
            <p className="text-slate-600 text-sm mt-1">
              Enter a complaint ID above to load evidence details and run an AI audit.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
