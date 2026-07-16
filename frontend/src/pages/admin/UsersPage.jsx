import React, { useEffect, useMemo, useState } from "react";
import {
  Users as UsersIcon,
  ShieldCheck,
  UserCog,
  User,
  Phone,
  Building2,
  Inbox,
} from "lucide-react";
import { useComplaints } from "../../context/ComplaintContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { getLocalStorageAdmins } from "../../utils/localStorageHelpers";
import { formatDate } from "../../utils/format";

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Avatar = ({ name, className = "bg-primary" }) => (
  <div
    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${className}`}
  >
    {initialsOf(name)}
  </div>
);

export default function UsersPage() {
  const { complaints } = useComplaints();
  const [admins, setAdmins] = useState([]);

  // Admin accounts from the auth store (never exposes password hashes)
  useEffect(() => {
    const records = getLocalStorageAdmins() || [];
    setAdmins(
      records.map((a) => ({
        username: a.username,
        name: a.name,
        role: a.role || "super_admin",
        department: a.department || null,
      }))
    );
  }, []);

  // Field officers derived from complaint assignments
  const officers = useMemo(() => {
    const map = {};
    complaints.forEach((c) => {
      const name = c.assigned_officer;
      if (!name) return;
      if (!map[name]) map[name] = { name, assigned: 0, open: 0, escalated: 0 };
      map[name].assigned += 1;
      if (c.status !== "Resolved" && c.status !== "Closed") map[name].open += 1;
      if (c.is_escalated) map[name].escalated += 1;
    });
    return Object.values(map).sort((a, b) => b.assigned - a.assigned);
  }, [complaints]);

  // Registered citizens derived from the complaint register
  const citizens = useMemo(() => {
    const map = {};
    complaints.forEach((c) => {
      const key = c.citizenPhone || c.citizenName;
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          name: c.citizenName || "Anonymous",
          phone: c.citizenPhone || "—",
          complaints: 0,
          lastActivity: c.updatedAt || c.createdAt,
        };
      }
      map[key].complaints += 1;
      const ts = c.updatedAt || c.createdAt;
      if (ts && ts > map[key].lastActivity) map[key].lastActivity = ts;
    });
    return Object.values(map).sort((a, b) => b.complaints - a.complaints);
  }, [complaints]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        eyebrow="Administration"
        icon={UsersIcon}
        title="Registered Users"
        description="Administrator accounts, field officers and citizens registered through the grievance system."
      />

      {/* ── Administrators ── */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Administrators
            </h2>
            <p className="section-description">
              Portal accounts with management access. Department admins see only
              their department's records.
            </p>
          </div>
          <span className="badge-primary">{admins.length} accounts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {admins.map((a) => (
            <div key={a.username} className="inset-panel p-4 flex items-center gap-3">
              <Avatar name={a.name} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text text-sm truncate">{a.name}</p>
                <p className="text-xs text-muted font-mono">@{a.username}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={a.role === "super_admin" ? "badge-primary" : "badge-info"}>
                  {a.role === "super_admin" ? "Super Admin" : "Dept. Admin"}
                </span>
                {a.department && (
                  <p className="text-[10px] text-muted mt-1.5 flex items-center gap-1 justify-end">
                    <Building2 className="w-3 h-3" />
                    {a.department}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Field Officers ── */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              Field Officers
            </h2>
            <p className="section-description">
              Inspectors currently assigned to grievance tickets.
            </p>
          </div>
          <span className="badge-primary">{officers.length} active</span>
        </div>

        {officers.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No assignments yet"
            description="Officers appear here once complaints are assigned."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officers.map((o) => (
              <div key={o.name} className="inset-panel p-4 flex items-center gap-3">
                <Avatar name={o.name} className="bg-status-info-accent" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text text-sm truncate">{o.name}</p>
                  <p className="text-xs text-muted">Municipal Field Inspector</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-center">
                  <div className="px-2.5">
                    <p className="text-base font-bold text-text">{o.assigned}</p>
                    <p className="text-[10px] text-muted uppercase font-semibold">Tickets</p>
                  </div>
                  <div className="px-2.5 border-l border-border">
                    <p className="text-base font-bold text-status-warning-text">{o.open}</p>
                    <p className="text-[10px] text-muted uppercase font-semibold">Open</p>
                  </div>
                  {o.escalated > 0 && (
                    <div className="px-2.5 border-l border-border">
                      <p className="text-base font-bold text-status-error-text">{o.escalated}</p>
                      <p className="text-[10px] text-muted uppercase font-semibold">SLA</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Citizens ── */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Registered Citizens
            </h2>
            <p className="section-description">
              Citizens who have lodged grievances, with activity summary.
            </p>
          </div>
          <span className="badge-primary">{citizens.length} citizens</span>
        </div>

        {citizens.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No citizens yet"
            description="Citizens appear here after their first complaint."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted">Citizen</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted">Mobile</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted text-center">Complaints</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted text-right">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {citizens.map((c) => (
                  <tr key={c.phone + c.name} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} className="bg-status-success-accent !w-8 !h-8 !text-[10px]" />
                        <span className="font-medium text-text">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-muted text-xs">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        {c.phone !== "—" ? `+91 ${c.phone}` : "—"}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="badge-neutral font-mono">{c.complaints}</span>
                    </td>
                    <td className="py-3 text-right text-muted text-xs">
                      {formatDate(c.lastActivity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
