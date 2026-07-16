import React, { useEffect, useState } from "react";
import {
  Trophy,
  Star,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Building2,
  BarChart3,
} from "lucide-react";
import { getScoreboard } from "../../services/complaintService";
import { getDeptColor } from "../../constants";
import { StatCard } from "../../components/ui/StatCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { SkeletonCard } from "../../components/ui/Skeleton";

/**
 * PUBLIC accountability scoreboard (USP) — no login required.
 *
 * Ranks every department by real performance: resolution rate, average fix
 * time, SLA compliance and citizen star ratings. Composite score formula
 * mirrors the backend: 50% resolution rate + 30% SLA compliance + 20%
 * citizen satisfaction. Gamified shame keeps departments honest.
 */

const MEDALS = ["🥇", "🥈", "🥉"];

const GRADE_STYLE = {
  "A+": "badge-success",
  A: "badge-success",
  B: "badge-info",
  C: "badge-warning",
  D: "badge-error",
};

const fmtHours = (h) => {
  if (h == null) return "—";
  if (h < 48) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
};

export default function Scoreboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setData(await getScoreboard());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const departments = data?.departments || [];
  const overall = data?.overall;

  return (
    <div className="w-full pb-12 space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Public Transparency"
        icon={Trophy}
        title="Department Accountability Scoreboard"
        description="Live, public rankings of every department — resolution speed, SLA compliance and citizen satisfaction. No login needed. Accountability, gamified."
        actions={
          <button onClick={load} disabled={loading} className="btn-secondary !py-2 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      {/* AI summary banner */}
      {data?.ai_summary && (
        <div className="card !py-4 flex items-start gap-3 border-primary/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <div className="icon-chip w-9 h-9 shrink-0">
            <Sparkles className="w-[18px] h-[18px] text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
              AI City Performance Summary
            </p>
            <p className="text-sm text-text font-medium mt-0.5 leading-relaxed">
              {data.ai_summary}
            </p>
          </div>
        </div>
      )}

      {/* Overall metrics */}
      {overall && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Complaints" value={overall.total} icon={BarChart3} tone="primary" />
          <StatCard
            label="Resolution Rate"
            value={`${overall.resolution_rate}%`}
            icon={CheckCircle2}
            tone="success"
          />
          <StatCard
            label="SLA Breaches"
            value={`${overall.sla_breach_pct}%`}
            icon={ShieldAlert}
            tone={overall.sla_breach_pct > 25 ? "error" : "warning"}
          />
          <StatCard
            label="Citizen Rating"
            value={overall.avg_rating != null ? `${overall.avg_rating} ★` : "—"}
            icon={Star}
            tone="info"
          />
        </div>
      )}

      {/* Rankings */}
      {loading && !data ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {departments.map((d) => {
            const medal = d.rank <= 3 ? MEDALS[d.rank - 1] : null;
            const color = getDeptColor(d.department);
            return (
              <div
                key={d.department}
                className="card !p-5 card-hover"
                style={{ borderLeft: `4px solid ${color}` }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Identity */}
                  <div className="flex items-center gap-3 min-w-0 md:w-72">
                    <span className="text-xl font-bold text-muted w-9 text-center shrink-0">
                      {medal || `#${d.rank}`}
                    </span>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${color}22` }}
                    >
                      <Building2 className="w-[18px] h-[18px]" style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-text text-sm truncate">{d.department}</p>
                      <p className="text-[11px] text-muted">
                        {d.total} complaint{d.total !== 1 ? "s" : ""} · {d.open} open
                      </p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-4 flex-1">
                    <div>
                      <p className="text-[10px] text-muted font-bold uppercase">Resolved</p>
                      <p className="text-sm font-bold text-text">{d.resolution_rate}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted font-bold uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Avg Fix
                      </p>
                      <p className="text-sm font-bold text-text">
                        {fmtHours(d.avg_resolution_hours)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted font-bold uppercase">SLA Breach</p>
                      <p
                        className={`text-sm font-bold ${
                          d.sla_breach_pct > 25 ? "text-status-error-text" : "text-text"
                        }`}
                      >
                        {d.sla_breach_pct}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted font-bold uppercase">Rating</p>
                      <p className="text-sm font-bold text-text">
                        {d.avg_rating != null ? (
                          <>
                            {d.avg_rating}
                            <Star className="w-3.5 h-3.5 inline ml-0.5 -mt-0.5 text-status-warning-accent fill-status-warning-accent" />
                          </>
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Score + grade */}
                  <div className="flex items-center gap-3 md:w-44 shrink-0">
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] text-muted font-bold uppercase">Score</span>
                        <span className="font-mono font-bold text-text text-sm">{d.score}</span>
                      </div>
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(d.score, 100)}%`, background: color }}
                        />
                      </div>
                    </div>
                    <span className={`${GRADE_STYLE[d.grade] || "badge-neutral"} !text-sm !px-3 font-bold`}>
                      {d.grade}
                    </span>
                  </div>
                </div>

                {d.insight && (
                  <p className="text-xs text-muted italic mt-3 pt-3 border-t border-border">
                    {d.insight}
                  </p>
                )}
              </div>
            );
          })}

          {departments.length === 0 && (
            <div className="card text-center py-12 text-muted text-sm">
              No complaint data yet — the scoreboard fills in as citizens lodge grievances.
            </div>
          )}
        </div>
      )}

      <p className="text-center text-[11px] text-muted">
        Score = 50% resolution rate + 30% SLA compliance + 20% citizen satisfaction ·
        Updated {data?.generated_at ? new Date(data.generated_at).toLocaleString() : "…"}
      </p>
    </div>
  );
}
