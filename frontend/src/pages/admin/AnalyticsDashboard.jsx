import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Building,
  RefreshCw,
  Clock,
  MapPin,
  Flame,
  ShieldCheck,
  Zap,
  Loader2,
} from "lucide-react";

import { useComplaints } from "../../context/ComplaintContext";
import { getTrends } from "../../services/complaintService";
import useAuth from "../../hooks/useAuth";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { getDeptColor, PRIORITY_COLORS } from "../../constants";

const RISK_BADGES = {
  CRITICAL: { badge: "badge-error", pulse: "bg-status-error-accent", text: "Critical Surge Risk" },
  WARNING: { badge: "badge-warning", pulse: "bg-status-warning-accent", text: "Rising Strain" },
  STABLE: { badge: "badge-neutral", pulse: "bg-status-neutral-accent", text: "Stable Growth" },
};

export default function AnalyticsDashboard() {
  const { complaints, loadingComplaints, refreshComplaints } = useComplaints();
  const { userData, userRole } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [apiTrends, setApiTrends] = useState(null); // backend /trends payload (null = offline)
  const loading = loadingComplaints;

  // Backend analytics — scoped for department admins; null when API is offline
  const fetchTrends = useCallback(async () => {
    const scope =
      userRole === "admin" && userData?.adminRole === "department_admin"
        ? { role: "department_admin", department: userData?.department }
        : {};
    setApiTrends(await getTrends(scope));
  }, [userRole, userData?.adminRole, userData?.department]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshComplaints(), fetchTrends()]);
    } finally {
      setRefreshing(false);
    }
  };

  // ── Trend: complaints grouped by date (last 14 days) ───────────────────────
  const trendData = useMemo(() => {
    const days = 14;
    const counts = {};
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      counts[key] = 0;
    }
    complaints.forEach((c) => {
      const key = (c.submitted_at || c.createdAt || "").slice(0, 10);
      if (key in counts) counts[key] += 1;
    });
    return Object.entries(counts).map(([date, Complaints]) => ({
      date: date.slice(5), // MM-DD
      Complaints,
    }));
  }, [complaints]);

  // ── Departments bar chart data ──────────────────────────────────────────────
  const departmentsData = useMemo(() => {
    const counts = {};
    complaints.forEach((c) => {
      const dept = c.department || "Other";
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, Grievances]) => ({ name, Grievances }))
      .sort((a, b) => b.Grievances - a.Grievances);
  }, [complaints]);

  // ── Priority pie chart data ─────────────────────────────────────────────────
  const prioritiesData = useMemo(() => {
    const counts = {};
    complaints.forEach((c) => {
      const p = c.priorityLevel || c.priority || "Low";
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [complaints]);

  // ── Emerging hotspots (local fallback, normalized to the API shape) ────────
  const localHotspots = useMemo(() => {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    const recentCounts = {};
    const totalCounts = {};
    complaints.forEach((c) => {
      const dept = c.department || "Other";
      totalCounts[dept] = (totalCounts[dept] || 0) + 1;
      const ts = new Date(c.submitted_at || c.createdAt || 0).getTime();
      if (now - ts < week) recentCounts[dept] = (recentCounts[dept] || 0) + 1;
    });
    return Object.entries(totalCounts)
      .map(([dept, total], i) => {
        const recent = recentCounts[dept] || 0;
        const growth = total > 0 ? Math.round((recent / total) * 100) : 0;
        const risk = growth >= 60 ? "CRITICAL" : growth >= 30 ? "WARNING" : "STABLE";
        const forecast =
          risk === "CRITICAL"
            ? "High complaint velocity — dispatch recommended."
            : risk === "WARNING"
              ? "Spike in activity detected. Monitor closely."
              : "Normal consistent reports. No sudden spikes detected.";
        return {
          id: i + 1,
          department: dept,
          location: "General Zone",
          total,
          recent,
          surge_rate: growth,
          risk,
          forecast,
        };
      })
      .sort((a, b) => b.recent - a.recent)
      .slice(0, 4);
  }, [complaints]);

  // Prefer the backend's computed analytics; fall back to local derivations
  const finalTrend = apiTrends?.trend ?? trendData;
  const finalDepartments = apiTrends?.departments ?? departmentsData;
  const finalPriorities = (apiTrends?.priorities ?? prioritiesData).filter((p) => p.value > 0);
  const emergingHotspots = apiTrends?.emerging_hotspots ?? localHotspots;

  // Summary metrics
  const totalGrievances = complaints.length;

  const topDept = useMemo(() => {
    if (finalDepartments.length === 0) return { name: "N/A", count: 0 };
    const top = [...finalDepartments].sort((a, b) => b.Grievances - a.Grievances)[0];
    return { name: top.name, count: top.Grievances };
  }, [finalDepartments]);

  const criticalCount = useMemo(
    () => emergingHotspots.filter((h) => h.risk === "CRITICAL").length,
    [emergingHotspots]
  );

  const resolvedCount = useMemo(
    () => complaints.filter((c) => c.status === "Resolved").length,
    [complaints]
  );
  const resolvedRate =
    totalGrievances > 0 ? Math.round((resolvedCount / totalGrievances) * 100) : 0;

  const chartTooltipStyle = {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E3DA",
    borderRadius: "12px",
    color: "#1F2937",
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    boxShadow: "0 8px 24px rgba(31,41,55,.08)",
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* ── Page header ── */}
      <PageHeader
        eyebrow="Predictive Engine"
        icon={TrendingUp}
        title="Analytics Dashboard"
        description="Chronological analysis of lodging spikes and high-velocity infrastructure failure alerts."
        actions={
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="btn-secondary text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || refreshing ? "animate-spin" : ""}`} />
            Recalculate
          </button>
        }
      />

      {loading && complaints.length === 0 ? (
        <div className="card p-24 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted text-sm">
            Processing time-series records and predicting cluster velocity…
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Summary stat cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Grievances"
              value={totalGrievances}
              icon={TrendingUp}
              tone="primary"
              hint="Total reported citizen filings logged"
            />
            <StatCard
              label="Primary Peak"
              value={topDept.name}
              icon={Building}
              tone="warning"
              hint={`${topDept.count} reports listed in active logs`}
            />
            <StatCard
              label="Surge Warnings"
              value={criticalCount}
              icon={Flame}
              tone="error"
              hint="Critical hotspot grids requiring dispatch"
            />
            <StatCard
              label="Resolution Rate"
              value={`${resolvedRate}%`}
              icon={ShieldCheck}
              tone="success"
              hint={`${resolvedCount} of ${totalGrievances} complaints resolved`}
            />
          </div>

          {/* ── Charts grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AreaChart: chronological trend */}
            <div className="card lg:col-span-2 space-y-4">
              <div className="card-header mb-0 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-text">Incoming Grievance Load</h3>
                  <p className="text-xs text-muted">
                    Daily complaint counts over the past 14 days.
                  </p>
                </div>
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={finalTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#006D5B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#006D5B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DA" vertical={false} />
                    <XAxis dataKey="date" stroke="#6B7280" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6B7280" fontSize={10} tickLine={false} allowDecimals={false} />
                    <ChartTooltip contentStyle={chartTooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey={apiTrends ? "Grievances" : "Complaints"}
                      stroke="#006D5B"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#gradientTrend)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PieChart: priority distribution */}
            <div className="card space-y-4">
              <div className="card-header mb-0 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-text">Priority Distribution</h3>
                  <p className="text-xs text-muted">
                    Priorities classified by the AI parser.
                  </p>
                </div>
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="h-64 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={finalPriorities}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {finalPriorities.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PRIORITY_COLORS[entry.name] || "#8A897F"}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 w-full mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {finalPriorities.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PRIORITY_COLORS[entry.name] || "#8A897F" }}
                      />
                      <span>
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                  {finalPriorities.length === 0 && (
                    <div className="text-muted normal-case">No active priorities parsed</div>
                  )}
                </div>
              </div>
            </div>

            {/* BarChart: department breakdown */}
            <div className="card lg:col-span-3 space-y-4">
              <div className="card-header mb-0 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-text">Departmental Pressure</h3>
                  <p className="text-xs text-muted">
                    Comparison of complaint frequency per service department.
                  </p>
                </div>
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={finalDepartments} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DA" vertical={false} />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#6B7280" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                    <ChartTooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(0,109,91,0.05)" }} />
                    <Bar dataKey="Grievances" radius={[6, 6, 0, 0]}>
                      {finalDepartments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getDeptColor(entry.name)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Emerging hotspots ── */}
          <div className="card space-y-5">
            <div className="card-header mb-0">
              <div>
                <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-status-error-accent" />
                  Surge Alerts &amp; Predictive Hotspots
                </h3>
                <p className="text-xs text-muted mt-1">
                  Departments with the highest complaint velocity over the past 7 days.
                  Early warnings signal failure probability before systemic breakdown.
                </p>
              </div>
              <span className="badge-primary shrink-0">Auto Refresh</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergingHotspots.map((hot) => {
                const b = RISK_BADGES[hot.risk] || RISK_BADGES.STABLE;
                const rate = Math.round(hot.surge_rate ?? 0);
                return (
                  <div
                    key={`${hot.department}-${hot.location}-${hot.id}`}
                    className="p-4 rounded-card inset-panel flex flex-col justify-between gap-3 text-sm"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">
                          Hotspot Zone
                        </span>
                        <h4 className="font-bold text-text">{hot.department}</h4>
                      </div>

                      <span className={`${b.badge} shrink-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${b.pulse} ${hot.risk !== "STABLE" ? "animate-pulse" : ""}`} />
                        {b.text}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 bg-surface p-2.5 rounded-lg border border-border">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-text text-xs font-medium leading-relaxed">
                        {hot.location && hot.location !== "General Zone" ? `${hot.location} — ` : ""}
                        {hot.recent} new report{hot.recent === 1 ? "" : "s"} recently
                        · {hot.total} total on record
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-border pt-2.5">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wide">
                        <span className="text-muted">Surge Velocity</span>
                        <span
                          className={
                            hot.risk === "CRITICAL"
                              ? "text-status-error-text"
                              : hot.risk === "WARNING"
                                ? "text-status-warning-text"
                                : "text-muted"
                          }
                        >
                          {rate}% acceleration
                        </span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            hot.risk === "CRITICAL"
                              ? "bg-status-error-accent"
                              : hot.risk === "WARNING"
                                ? "bg-status-warning-accent"
                                : "bg-status-neutral-accent"
                          }`}
                          style={{ width: `${Math.min(rate, 100)}%` }}
                        />
                      </div>
                      {hot.forecast && (
                        <p className="text-[11px] text-muted italic leading-relaxed pt-0.5">
                          "{hot.forecast}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {emergingHotspots.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted flex flex-col items-center justify-center gap-2">
                  <ShieldCheck className="w-8 h-8 text-muted" />
                  <p className="font-bold uppercase tracking-wider text-xs">
                    All Infrastructure Grids Secured
                  </p>
                  <p className="text-xs mt-0.5 max-w-[325px]">
                    No emergent surges have triggered the risk classifiers. All
                    departments operating within stable historical boundaries.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
