import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Settings as SettingsIcon,
  Server,
  Database,
  Cpu,
  Timer,
  SlidersHorizontal,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useComplaints } from "../../context/ComplaintContext";
import { API_URL } from "../../services/complaintService";
import { SLA_LIMITS, PRIORITY_WEIGHTS, PRIORITY_BADGE } from "../../constants";

const humanHours = (h) => (h % 24 === 0 && h >= 24 ? `${h / 24} day${h > 24 ? "s" : ""}` : `${h} hours`);

function StatusRow({ label, ok, detail, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="w-4 h-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text">{label}</p>
          {detail && <p className="text-xs text-muted truncate">{detail}</p>}
        </div>
      </div>
      <span className={ok ? "badge-success shrink-0" : "badge-error shrink-0"}>
        {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {ok ? "Online" : "Offline"}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const { apiOnline, refreshComplaints } = useComplaints();
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const fetchHealth = async () => {
    setChecking(true);
    try {
      const res = await axios.get(`${API_URL}/health`, { timeout: 4000 });
      setHealth(res.data);
    } catch {
      setHealth(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleResetLocal = async () => {
    // Clears only the client-side demo cache — server data is untouched.
    localStorage.removeItem("complaints");
    setConfirmReset(false);
    setResetDone(true);
    await refreshComplaints();
    setTimeout(() => setResetDone(false), 3500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        eyebrow="Administration"
        icon={SettingsIcon}
        title="System Settings"
        description="Live service status, SLA thresholds and the priority engine configuration powering automatic routing."
        actions={
          <button onClick={fetchHealth} disabled={checking} className="btn-secondary text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
            Re-check Status
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Service status ── */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                Service Status
              </h2>
              <p className="section-description">Live health of connected services.</p>
            </div>
          </div>

          <StatusRow
            label="FastAPI Backend"
            ok={!!health}
            detail={API_URL}
            icon={Server}
          />
          <StatusRow
            label="Database"
            ok={health?.database === "connected"}
            detail={
              health?.database === "connected"
                ? "Connected (MySQL or SQLite fallback)"
                : health?.database_error || "Unreachable — client runs in local demo mode"
            }
            icon={Database}
          />
          <StatusRow
            label="Ollama AI Engine"
            ok={false /* reported informationally; falls back to keyword classifier */}
            detail={
              health
                ? `${health.environment?.ollama_api_url} · model: ${health.environment?.ollama_model}`
                : "Unknown — backend offline"
            }
            icon={Cpu}
          />
          <p className="text-[11px] text-muted mt-3 leading-relaxed">
            When Ollama is offline, classification and evidence audits use the
            deterministic keyword fallback — the pipeline never blocks. When the
            backend is offline, the client switches to local demo mode
            {apiOnline === false ? " (currently active)" : ""}.
          </p>
        </section>

        {/* ── SLA thresholds ── */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                SLA Resolution Thresholds
              </h2>
              <p className="section-description">
                Tickets exceeding these limits are auto-escalated (+20 priority
                boost, supervisor alert).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(SLA_LIMITS).map(([level, hours]) => (
              <div
                key={level}
                className="flex items-center justify-between inset-panel px-4 py-3"
              >
                <span className={PRIORITY_BADGE[level] || "badge-neutral"}>{level}</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-text">{humanHours(hours)}</p>
                  <p className="text-[10px] text-muted uppercase font-semibold">
                    {hours}h limit
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted mt-4 flex items-start gap-1.5 leading-relaxed">
            <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5 text-status-warning-accent" />
            The SLA evaluator runs on every data read — breaches trigger citizen
            and supervisor notifications automatically.
          </p>
        </section>
      </div>

      {/* ── Priority engine weights ── */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
              Priority Engine Weights
            </h2>
            <p className="section-description">
              The multi-factor formula scoring every complaint 0–100. Weights
              mirror the backend engine.
            </p>
          </div>
          <span className="badge-primary">100 pts max</span>
        </div>

        <div className="space-y-4">
          {PRIORITY_WEIGHTS.map((w) => (
            <div key={w.label}>
              <div className="flex justify-between items-baseline mb-1.5 gap-3">
                <span className="text-sm font-medium text-text">{w.label}</span>
                <span className="text-xs text-muted shrink-0">
                  <span className="font-mono font-bold text-primary">{w.max}</span> pts max
                </span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(w.max / 30) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-muted mt-1">{w.desc}</p>
            </div>
          ))}
          <div className="inset-panel px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-text">SLA Escalation Boost</span>
            <span className="badge-error">+20 pts on breach</span>
          </div>
        </div>
      </section>

      {/* ── Data management ── */}
      <section className="card border-status-error-border/60">
        <div className="card-header">
          <div>
            <h2 className="section-title text-status-error-text">Data Management</h2>
            <p className="section-description">
              Maintenance actions for the local demo environment.
            </p>
          </div>
        </div>

        {resetDone && (
          <div className="alert-success mb-4 items-center text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Local demo cache cleared and data re-fetched.
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-text">Clear local demo cache</p>
            <p className="text-xs text-muted mt-0.5 max-w-md">
              Removes the browser's offline complaint cache and re-fetches from
              the API. Server-side records are never touched.
            </p>
          </div>
          <button onClick={() => setConfirmReset(true)} className="btn-danger shrink-0">
            <Trash2 className="w-4 h-4" />
            Clear Cache
          </button>
        </div>
      </section>

      <ConfirmModal
        open={confirmReset}
        title="Clear local demo cache?"
        message="This removes the offline complaint cache stored in this browser and reloads data from the API. Server records are not affected."
        onConfirm={handleResetLocal}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
