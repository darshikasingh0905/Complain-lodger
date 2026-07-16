import React, { useMemo } from "react";
import {
  Building2,
  Mail,
  Phone,
  ShieldAlert,
  Activity,
  CheckCircle,
  Inbox,
} from "lucide-react";
import { useComplaints } from "../../context/ComplaintContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { getDeptColor, DEPT_REGISTRY } from "../../constants";

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function DepartmentsPage() {
  const { complaints, loadingComplaints } = useComplaints();

  // One card per department: registry entries + any department present in data
  const departments = useMemo(() => {
    const names = new Set([
      ...Object.keys(DEPT_REGISTRY).filter((d) => d !== "Other"),
      ...complaints.map((c) => c.department || "Other"),
    ]);

    return [...names]
      .map((name) => {
        const records = complaints.filter((c) => (c.department || "Other") === name);
        const resolved = records.filter(
          (c) => c.status === "Resolved" || c.status === "Closed"
        ).length;
        const open = records.length - resolved;
        const escalated = records.filter((c) => c.is_escalated).length;
        const avgScore =
          records.length > 0
            ? Math.round(records.reduce((s, c) => s + (c.priorityScore || 0), 0) / records.length)
            : 0;
        const resolvedPct = records.length > 0 ? Math.round((resolved / records.length) * 100) : 0;
        const registry = DEPT_REGISTRY[name] || DEPT_REGISTRY.Other;

        return { name, registry, total: records.length, open, resolved, escalated, avgScore, resolvedPct };
      })
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [complaints]);

  return (
    <div className="w-full space-y-8 animate-fade-in">
      <PageHeader
        eyebrow="Administration"
        icon={Building2}
        title="Municipal Departments"
        description="Directory of service departments, their leads, and live grievance workload derived from the complaint register."
      />

      {loadingComplaints ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} lines={4} />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="card max-w-xl mx-auto">
          <EmptyState
            icon={Inbox}
            title="No departments yet"
            description="Departments appear here once complaints are classified."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {departments.map((d) => {
            const color = getDeptColor(d.name);
            return (
              <div key={d.name} className="card flex flex-col gap-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <h2 className="font-semibold text-text leading-snug">{d.name}</h2>
                  </div>
                  {d.escalated > 0 && (
                    <span className="badge-error shrink-0">
                      <ShieldAlert className="w-3 h-3" />
                      {d.escalated} SLA
                    </span>
                  )}
                </div>

                {/* Department lead */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: color }}
                  >
                    {initialsOf(d.registry.lead)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-text text-sm truncate">{d.registry.lead}</p>
                    <p className="text-xs text-muted">{d.registry.title}</p>
                  </div>
                </div>

                <div className="inset-panel p-3 space-y-1.5 text-xs">
                  <p className="text-muted flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-primary" />
                    {d.registry.email}
                  </p>
                  <p className="text-muted flex items-center gap-2 font-mono">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-primary" />
                    {d.registry.phone}
                  </p>
                </div>

                {/* Workload stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="inset-panel py-2.5">
                    <p className="text-lg font-bold text-text">{d.total}</p>
                    <p className="text-[10px] text-muted uppercase font-semibold">Total</p>
                  </div>
                  <div className="inset-panel py-2.5">
                    <p className="text-lg font-bold text-status-warning-text">{d.open}</p>
                    <p className="text-[10px] text-muted uppercase font-semibold">Open</p>
                  </div>
                  <div className="inset-panel py-2.5">
                    <p className="text-lg font-bold text-status-success-text">{d.resolved}</p>
                    <p className="text-[10px] text-muted uppercase font-semibold">Resolved</p>
                  </div>
                </div>

                {/* Resolution progress */}
                <div className="mt-auto space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-muted uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Resolution Rate
                    </span>
                    <span className="text-text">{d.resolvedPct}%</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${d.resolvedPct}%`, background: color }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted pt-0.5">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Avg. priority score
                    </span>
                    <span className="font-mono font-semibold text-text">{d.avgScore}/100</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
