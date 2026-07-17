import React, { useEffect, useState } from "react";
import { useComplaints } from "../../context/ComplaintContext";
import useAuth from "../../hooks/useAuth";
import useDebounced from "../../hooks/useDebounced";
import ConfirmModal from "../../components/ui/ConfirmModal";
import ResolveProofModal from "../../components/ui/ResolveProofModal";
import { StatusBadge, PriorityBadge, SafetyBadge } from "../../components/ui/Badge";
import { StatCard } from "../../components/ui/StatCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { SkeletonWorkspace } from "../../components/ui/Skeleton";
import {
  STATUS_OPTIONS,
  PRIORITY_LEVELS,
  PRIORITY_COLORS,
  SAFETY_PINK,
  isSafetyComplaint,
} from "../../constants";
import { formatDate, formatDateTime } from "../../utils/format";

import {
  LayoutDashboard,
  Search,
  FolderDot,
  Activity,
  MapPin,
  User,
  Phone,
  Calendar,
  FileText,
  CheckCircle,
  CheckCircle2,
  FileQuestion,
  Loader2,
  ShieldAlert,
  UserCog,
  Star,
  Sparkles,
  Image as ImageIcon,
  ClipboardList,
} from "lucide-react";

// Filterable statuses include the citizen-confirmed "Closed" state
const STATUS_FILTERS = [...STATUS_OPTIONS, "Closed"];

// Detail panel tabs
const DETAIL_TABS = [
  { key: "overview", label: "Overview", icon: ClipboardList },
  { key: "ai", label: "AI Analysis", icon: Sparkles },
  { key: "evidence", label: "Evidence", icon: ImageIcon },
];

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

function AdminPanel() {
  const {
    complaints,
    loadingComplaints,
    updateStatus,
    resolveWithProof,
  } = useComplaints();

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [regionSearch, setRegionSearch] = useState("");
  const debouncedRegion = useDebounced(regionSearch, 250);
  const [sortBy, setSortBy] = useState("Newest");

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [actionSuccess, setActionSuccess] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
  const [proofModalOpen, setProofModalOpen] = useState(false);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [detailTab, setDetailTab] = useState("overview");

  const { userData } = useAuth();
  const isDeptAdmin = userData?.adminRole === "department_admin";

  // ── Keep selected complaint in sync with the store ─────────────────────────
  useEffect(() => {
    if (!selectedComplaint && complaints.length > 0) {
      setSelectedComplaint(complaints[0]);
      return;
    }

    if (selectedComplaint) {
      const updatedComplaint = complaints.find((c) => c.id === selectedComplaint.id);
      if (updatedComplaint) {
        setSelectedComplaint(updatedComplaint);
      } else {
        // Selection no longer exists in the (possibly re-scoped) list —
        // e.g. after switching to a department-admin account.
        setSelectedComplaint(complaints[0] || null);
      }
    }
  }, [complaints]);

  useEffect(() => {
    if (!selectedComplaint) return;
    const idx = sortedComplaints.findIndex((c) => c.id === selectedComplaint.id);
    if (idx >= 0) setSelectedIndex(idx);
  }, [selectedComplaint]);

  // ── Status update ──────────────────────────────────────────────────────────
  const performStatusUpdate = async (id, newStatus) => {
    setUpdatingStatus(true);
    setActionSuccess(null);

    try {
      await updateStatus(id, newStatus);
      setActionSuccess("Complaint status updated successfully.");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Unable to update complaint status.");
    } finally {
      setUpdatingStatus(false);
      setPendingStatusUpdate(null);
      setConfirmOpen(false);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    // Resolving requires photo proof + AI fix verification (closed loop)
    if (newStatus === "Resolved") {
      setProofModalOpen(true);
      return;
    }
    performStatusUpdate(id, newStatus);
  };

  // Called by the proof modal: uploads the fix photo + runs the vision audit
  const handleResolveWithProof = async (id, file, force) => {
    const updated = await resolveWithProof(id, file, force);
    setSelectedComplaint(updated);
    if (updated.status === "Resolved") {
      setActionSuccess("Fix verified by AI — complaint resolved and citizen notified.");
      setTimeout(() => setActionSuccess(null), 4000);
    }
    return updated;
  };

  // Departments actually present in the data — the AI classifier emits
  // full names ("Water Supply Department"), so a static list never matches.
  const departmentOptions = [
    ...new Set(complaints.map((c) => c.department).filter(Boolean)),
  ].sort();

  // ── Metrics ────────────────────────────────────────────────────────────────
  const metrics = {
    total: complaints.length,
    submitted: complaints.filter((c) => c.status === "Submitted").length,
    assigned: complaints.filter((c) => c.status === "Assigned").length,
    inProgress: complaints.filter((c) => c.status === "In Progress").length,
    resolved: complaints.filter((c) => c.status === "Resolved" || c.status === "Closed").length,
    escalated: complaints.filter((c) => c.is_escalated).length,
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredComplaints = complaints.filter((complaint) => {
    const statusMatch = statusFilter === "All" || complaint.status === statusFilter;
    const departmentMatch = deptFilter === "All" || complaint.department === deptFilter;
    const priorityMatch =
      priorityFilter === "All" ||
      complaint.priorityLevel === priorityFilter ||
      complaint.priority === priorityFilter;

    const query = debouncedRegion.toLowerCase();
    const searchMatch =
      !query ||
      complaint.area?.toLowerCase().includes(query) ||
      complaint.title?.toLowerCase().includes(query) ||
      complaint.citizenName?.toLowerCase().includes(query) ||
      String(complaint.id).toLowerCase().includes(query);

    return statusMatch && departmentMatch && priorityMatch && searchMatch;
  });

  // ── Sorting ────────────────────────────────────────────────────────────────
  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    if (sortBy === "PriorityScore") {
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // ── Keyboard navigation for the complaint list ─────────────────────────────
  const handleListKey = (e) => {
    if (!sortedComplaints.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(selectedIndex + 1, sortedComplaints.length - 1);
      setSelectedIndex(next);
      setSelectedComplaint(sortedComplaints[next]);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(selectedIndex - 1, 0);
      setSelectedIndex(prev);
      setSelectedComplaint(sortedComplaints[prev]);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      setSelectedComplaint(sortedComplaints[selectedIndex]);
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* ── Page header ── */}
      <PageHeader
        eyebrow="Administration"
        icon={LayoutDashboard}
        title="Grievance Management Dashboard"
        description="Review citizen complaints, assign departments, monitor AI recommendations, and track grievance resolution from a centralized administrative workspace."
        actions={
          <div className="card !p-3.5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
              {initialsOf(userData?.name)}
            </div>
            <div>
              <p className="text-sm font-bold text-text leading-tight">
                {userData?.name || "Administrator"}
              </p>
              <span className={`${isDeptAdmin ? "badge-info" : "badge-primary"} !text-[10px] mt-1`}>
                {isDeptAdmin ? userData?.department : "Super Administrator"}
              </span>
            </div>
          </div>
        }
      />

      {/* ── Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-5">
        <StatCard label="Total Complaints" value={metrics.total} icon={LayoutDashboard} tone="primary" />
        <StatCard label="Submitted" value={metrics.submitted} icon={FileText} tone="info" />
        <StatCard label="Assigned" value={metrics.assigned} icon={FolderDot} tone="primary" />
        <StatCard label="In Progress" value={metrics.inProgress} icon={Activity} tone="warning" />
        <StatCard label="Escalated" value={metrics.escalated} icon={ShieldAlert} tone="error" />
        <StatCard label="Resolved" value={metrics.resolved} icon={CheckCircle} tone="success" />
      </div>

      {/* ── Filter toolbar ── */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="section-title">Complaint Filters</h2>
            <p className="section-description">
              Search and filter complaints before reviewing or taking action.
            </p>
          </div>
          <button
            onClick={() => {
              setStatusFilter("All");
              setDeptFilter("All");
              setPriorityFilter("All");
              setRegionSearch("");
            }}
            className="btn-secondary !px-3 !py-1.5 text-xs"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search */}
          <div className={isDeptAdmin ? "md:col-span-6" : "md:col-span-4"}>
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search by ID, citizen, location…"
                value={regionSearch}
                onChange={(e) => setRegionSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Department — hidden for department admins: their data is already
              scoped server-side to a single department */}
          {!isDeptAdmin && (
            <div className="md:col-span-2">
              <label className="label">Department</label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="input cursor-pointer"
              >
                <option value="All">All</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status */}
          <div className="md:col-span-2">
            <label className="label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input cursor-pointer"
            >
              <option value="All">All</option>
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="md:col-span-2">
            <label className="label">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input cursor-pointer"
            >
              <option value="All">All</option>
              {PRIORITY_LEVELS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="md:col-span-2">
            <label className="label">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input cursor-pointer"
            >
              <option value="Newest">Newest First</option>
              <option value="PriorityScore">Highest Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Main workspace ── */}
      {loadingComplaints && complaints.length === 0 ? (
        <SkeletonWorkspace />
      ) : sortedComplaints.length === 0 ? (
        <div className="card max-w-xl mx-auto">
          <EmptyState
            icon={FileQuestion}
            title="No complaints found"
            description="No grievance matches the selected filters. Try changing the filters or search keywords."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── Complaint list ── */}
          <div className="lg:col-span-4">
            <div className="card h-full">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="section-title">Complaints</h2>
                  <p className="text-sm text-muted">{sortedComplaints.length} records</p>
                </div>
              </div>

              <div
                className="space-y-3 max-h-[700px] overflow-y-auto pr-1"
                tabIndex={0}
                onKeyDown={handleListKey}
              >
                {sortedComplaints.map((complaint, idx) => {
                  const selected =
                    selectedComplaint?.id === complaint.id || selectedIndex === idx;
                  const safety = isSafetyComplaint(complaint);

                  return (
                    <button
                      key={complaint.id}
                      onClick={() => {
                        setSelectedComplaint(complaint);
                        setSelectedIndex(idx);
                        setActionSuccess(null);
                      }}
                      style={safety ? { borderLeft: `3px solid ${SAFETY_PINK}` } : undefined}
                      className={`w-full text-left rounded-card border p-4 transition-all ${
                        selected
                          ? "border-primary bg-primary-light"
                          : "bg-surface border-border hover:border-primary/40"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-semibold text-primary font-mono text-sm">
                            #{complaint.id}
                          </p>
                          <p className="mt-1 text-sm text-muted">{complaint.department}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {safety && <SafetyBadge compact />}
                          {complaint.is_escalated && (
                            <span className="badge-error !px-2 !text-[10px]">
                              <ShieldAlert className="w-3 h-3" />
                              SLA
                            </span>
                          )}
                          <StatusBadge status={complaint.status} />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="mt-3 font-semibold text-text line-clamp-2 text-sm">
                        {complaint.title || complaint.description}
                      </h3>

                      {/* Citizen + location */}
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                        <User className="w-3.5 h-3.5" />
                        {complaint.citizenName || "Anonymous"}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                        <MapPin className="w-3.5 h-3.5" />
                        {complaint.area || "Location unavailable"}
                      </div>

                      {/* Footer */}
                      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                        <PriorityBadge
                          level={complaint.priorityLevel || complaint.priority}
                        />
                        <span className="text-xs text-muted">
                          {formatDate(complaint.createdAt)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Details + actions ── */}
          {selectedComplaint && (
            <>
              <div className="lg:col-span-5">
                <div className="card">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
                    <div>
                      <p className="text-sm text-muted">Complaint Reference</p>
                      <h2 className="mt-1 text-2xl font-semibold text-primary font-mono">
                        #{selectedComplaint.id}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isSafetyComplaint(selectedComplaint) && (
                        <SafetyBadge className="!px-3 !py-1.5 !text-sm" />
                      )}
                      {selectedComplaint.is_escalated && (
                        <span className="badge-error !px-3 !py-1.5 !text-sm">
                          <ShieldAlert className="w-4 h-4" />
                          SLA Escalated
                        </span>
                      )}
                      <StatusBadge status={selectedComplaint.status} className="!px-4 !py-1.5 !text-sm" />
                    </div>
                  </div>

                  {/* Citizen rating (after Closed confirmation) */}
                  {selectedComplaint.rating != null && (
                    <div className="mt-5 rounded-card border border-status-success-border bg-status-success-bg p-4 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-status-success-text">
                          Citizen confirmed resolution
                        </h4>
                        {selectedComplaint.feedback && (
                          <p className="text-xs text-status-success-text/80 italic mt-1">
                            "{selectedComplaint.feedback}"
                          </p>
                        )}
                      </div>
                      <span className="flex items-center gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-4 h-4 ${
                              n <= selectedComplaint.rating
                                ? "text-status-warning-accent fill-status-warning-accent"
                                : "text-border"
                            }`}
                            fill={n <= selectedComplaint.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </span>
                    </div>
                  )}

                  {/* Detail tabs */}
                  <div className="flex items-center gap-1 bg-surfaceSoft border border-border p-1 rounded-lg mt-5 w-fit">
                    {DETAIL_TABS.map((t) => {
                      const Icon = t.icon;
                      const active = detailTab === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setDetailTab(t.key)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                            active
                              ? "bg-primary text-white"
                              : "text-muted hover:text-primary hover:bg-primary-light"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* ── Tab: Overview ── */}
                  {detailTab === "overview" && (
                    <>
                  {/* Citizen + timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                    <div className="inset-panel p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-text">Citizen Information</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted">Name</p>
                          <p className="font-medium text-text">
                            {selectedComplaint.citizenName || "Anonymous"}
                          </p>
                        </div>
                        {selectedComplaint.citizenPhone && (
                          <div>
                            <p className="text-xs text-muted">Phone Number</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="w-4 h-4 text-primary" />
                              <span className="text-text font-mono text-sm">
                                {selectedComplaint.citizenPhone}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="inset-panel p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-text">Complaint Timeline</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted">Submitted On</p>
                          <p className="text-text font-medium">
                            {formatDate(selectedComplaint.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">Last Updated</p>
                          <p className="text-text font-medium">
                            {formatDateTime(selectedComplaint.updatedAt)}
                          </p>
                        </div>
                        {selectedComplaint.assigned_officer && (
                          <div>
                            <p className="text-xs text-muted">Assigned Officer</p>
                            <p className="text-text font-medium flex items-center gap-1.5">
                              <UserCog className="w-4 h-4 text-primary" />
                              {selectedComplaint.assigned_officer}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="mt-5 inset-panel p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-text">Complaint Location</h3>
                    </div>
                    <p className="leading-7 text-text text-sm">
                      {selectedComplaint.area || "Location unavailable"}
                      {selectedComplaint.landmark && ` • Near ${selectedComplaint.landmark}`}
                      {selectedComplaint.pinCode && ` • ${selectedComplaint.pinCode}`}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="mt-5 inset-panel p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-text">Complaint Description</h3>
                    </div>
                    <p className="leading-7 text-text whitespace-pre-wrap text-sm">
                      {selectedComplaint.description || "No description provided."}
                    </p>
                  </div>
                    </>
                  )}

                  {/* ── Tab: AI Analysis ── */}
                  {detailTab === "ai" && (
                    <div className="mt-6 space-y-5">
                  <div>
                    <h3 className="section-title">Classification Summary</h3>
                    <p className="section-description">
                      AI-generated routing and complaint classification.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="inset-panel p-4">
                      <p className="text-xs text-muted">Department</p>
                      <h4 className="mt-1.5 text-base font-semibold text-primary">
                        {selectedComplaint.department || "Unassigned"}
                      </h4>
                    </div>

                    <div className="inset-panel p-4">
                      <p className="text-xs text-muted">Category</p>
                      <h4 className="mt-1.5 text-base font-semibold text-text">
                        {selectedComplaint.category || "General"}
                      </h4>
                    </div>

                    <div className="inset-panel p-4">
                      <p className="text-xs text-muted mb-2">AI Severity</p>
                      <span
                        className={
                          selectedComplaint.ai_severity === "Critical"
                            ? "badge-error"
                            : selectedComplaint.ai_severity === "Major"
                              ? "badge-warning"
                              : selectedComplaint.ai_severity === "Moderate"
                                ? "badge-info"
                                : "badge-neutral"
                        }
                      >
                        {selectedComplaint.ai_severity || "Moderate"}
                      </span>
                    </div>

                    <div className="inset-panel p-4">
                      <div className="flex justify-between items-center mb-2.5">
                        <p className="text-xs text-muted">AI Confidence</p>
                        <span className="font-semibold text-primary text-sm">
                          {selectedComplaint.ai_confidence != null
                            ? `${Math.round(selectedComplaint.ai_confidence * 100)}%`
                            : "0%"}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.round((selectedComplaint.ai_confidence || 0) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI keywords */}
                  {selectedComplaint.ai_keywords && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-text mb-3">AI Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(selectedComplaint.ai_keywords)
                          ? selectedComplaint.ai_keywords
                          : selectedComplaint.ai_keywords
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean)
                        ).map((keyword, index) => (
                          <span key={index} className="badge-primary">
                            #{keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI routing explanation */}
                  {selectedComplaint.ai_reason && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-text mb-3">
                        AI Routing Explanation
                      </h4>
                      <div className="inset-panel p-4">
                        <p className="leading-7 text-muted text-sm">
                          {selectedComplaint.ai_reason}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Priority assessment */}
                {(() => {
                  const score = selectedComplaint.priorityScore ?? 0;
                  const level =
                    selectedComplaint.priorityLevel ||
                    selectedComplaint.priority ||
                    "Medium";
                  const breakdown = selectedComplaint.priorityBreakdown || {};
                  const reason =
                    selectedComplaint.priorityReason || selectedComplaint.ai_reason;
                  const barColor = PRIORITY_COLORS[level] || "#8A897F";

                  const factors = [
                    { label: "Safety Risk", value: breakdown.safetyRisk ?? 0, max: 30 },
                    { label: "Public Impact", value: breakdown.publicImpact ?? 0, max: 20 },
                    { label: "Essential Service", value: breakdown.essentialService ?? 0, max: 20 },
                    { label: "Urgency", value: breakdown.urgency ?? 0, max: 10 },
                    { label: "Duplicate Reports", value: breakdown.duplicates ?? 0, max: 10 },
                    { label: "Location", value: breakdown.location ?? 0, max: 5 },
                    { label: "Time Pending", value: breakdown.timePending ?? 0, max: 5 },
                    ...(breakdown.womenSafety > 0
                      ? [{ label: "Safety Boost", value: breakdown.womenSafety, max: 15 }]
                      : []),
                  ];

                  return (
                    <div className="border-t border-border pt-5">
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div>
                          <h3 className="section-title">Priority Assessment</h3>
                          <p className="section-description">
                            AI-generated priority analysis based on severity, urgency and
                            public impact.
                          </p>
                        </div>
                        <PriorityBadge level={level} />
                      </div>

                      {/* Overall score */}
                      <div className="inset-panel p-5">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-text font-medium text-sm">
                            Overall Priority Score
                          </span>
                          <span className="text-3xl font-bold text-primary">
                            {score}
                            <span className="text-lg text-muted">/100</span>
                          </span>
                        </div>
                        <div className="h-3 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(score, 100)}%`, background: barColor }}
                          />
                        </div>
                      </div>

                      {/* Factors */}
                      <div className="mt-6 space-y-4">
                        <h4 className="text-sm font-semibold text-text">Scoring Factors</h4>
                        {factors.map((factor) => (
                          <div key={factor.label}>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-sm text-text">{factor.label}</span>
                              <span className="text-sm text-muted font-mono">
                                {factor.value} / {factor.max}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-border overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min((factor.value / factor.max) * 100, 100)}%`,
                                  background: barColor,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Justification */}
                      {reason && (
                        <div className="mt-6 border-t border-border pt-5">
                          <h4 className="text-sm font-semibold text-text mb-3">
                            Priority Justification
                          </h4>
                          <div className="inset-panel p-4">
                            <p className="text-muted leading-7 text-sm">{reason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                    </div>
                  )}

                  {/* ── Tab: Evidence ── */}
                  {detailTab === "evidence" && (
                    <div className="mt-6 space-y-5">
                      {selectedComplaint.imagePreview || selectedComplaint.imageFullUrl ? (
                        <>
                          <div>
                            <h3 className="section-title">Uploaded Evidence</h3>
                            <p className="section-description">
                              Supporting image submitted by the citizen.
                            </p>
                          </div>
                          <div className="inset-panel p-4">
                            <img
                              src={selectedComplaint.imagePreview || selectedComplaint.imageFullUrl}
                              alt="Complaint Evidence"
                              className="w-full max-h-[420px] object-contain rounded-lg bg-surface border border-border"
                            />
                          </div>
                        </>
                      ) : (
                        <EmptyState
                          icon={ImageIcon}
                          title="No evidence attached"
                          description="The citizen did not upload an image for this complaint."
                        />
                      )}

                      {/* Fix proof (closed-loop resolution audit) */}
                      {selectedComplaint.fixImageFullUrl && (
                        <div className="inset-panel p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-text">
                              Fix Proof — Before / After AI Audit
                            </h4>
                            {selectedComplaint.fix_verdict && (
                              <span
                                className={
                                  selectedComplaint.fix_verdict === "FIXED"
                                    ? "badge-success"
                                    : selectedComplaint.fix_verdict === "NOT_FIXED"
                                      ? "badge-error"
                                      : "badge-warning"
                                }
                              >
                                {selectedComplaint.fix_verdict}
                                {selectedComplaint.fix_confidence != null &&
                                  ` · ${Math.round(selectedComplaint.fix_confidence * 100)}%`}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[10px] text-muted font-bold uppercase mb-1">Before</p>
                              {selectedComplaint.imagePreview || selectedComplaint.imageFullUrl ? (
                                <img
                                  src={selectedComplaint.imagePreview || selectedComplaint.imageFullUrl}
                                  alt="Before"
                                  className="w-full h-36 object-cover rounded-lg border border-border bg-surface"
                                />
                              ) : (
                                <div className="w-full h-36 rounded-lg border border-dashed border-border flex items-center justify-center text-[11px] text-muted">
                                  No before photo
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] text-muted font-bold uppercase mb-1">After (fix)</p>
                              <img
                                src={selectedComplaint.fixImageFullUrl}
                                alt="After fix"
                                className="w-full h-36 object-cover rounded-lg border border-border bg-surface"
                              />
                            </div>
                          </div>
                          {selectedComplaint.fix_reason && (
                            <p className="text-xs text-muted italic leading-relaxed">
                              "{selectedComplaint.fix_reason}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Action panel ── */}
              <div className="lg:col-span-3">
                <div className="card sticky top-24">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-text">Complaint Actions</h2>
                    <p className="mt-1.5 text-sm text-muted">
                      Update progress and resolve with AI-verified photo proof.
                    </p>
                  </div>

                  {/* Success alert */}
                  {actionSuccess && (
                    <div className="alert-success mb-6 items-center">
                      <CheckCircle className="w-5 h-5 text-status-success-accent shrink-0" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  {/* Status update */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-text text-sm">Update Status</h3>
                    {STATUS_OPTIONS.map((status) => {
                      const active = selectedComplaint.status === status;
                      return (
                        <button
                          key={status}
                          disabled={updatingStatus}
                          onClick={() => handleStatusChange(selectedComplaint.id, status)}
                          className={`w-full rounded-lg border px-4 py-3 text-left transition-colors flex items-center justify-between disabled:opacity-50 ${
                            active
                              ? "bg-primary text-white border-primary"
                              : "bg-surface border-border text-text hover:bg-primary-light hover:border-primary/40"
                          }`}
                        >
                          <span className="font-medium text-sm">{status}</span>
                          {active && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="mt-8 pt-5 border-t border-border text-center text-xs text-muted space-y-1">
                    <p>Smart Governance System</p>
                    <p>Administrative Operations Console</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Resolve confirmation (legacy — non-Resolved transitions only) */}
      <ConfirmModal
        open={confirmOpen}
        title="Update status?"
        message="This will update the complaint status and notify the citizen."
        onConfirm={() =>
          pendingStatusUpdate &&
          performStatusUpdate(pendingStatusUpdate.id, pendingStatusUpdate.newStatus)
        }
        onCancel={() => {
          setConfirmOpen(false);
          setPendingStatusUpdate(null);
        }}
      />

      {/* Closed-loop resolution: fix photo + AI before/after verification */}
      <ResolveProofModal
        open={proofModalOpen}
        complaint={selectedComplaint}
        onResolve={handleResolveWithProof}
        onClose={() => setProofModalOpen(false)}
      />
    </div>
  );
}

export default AdminPanel;
