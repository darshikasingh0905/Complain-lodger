import React, { useState, useMemo, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Layers,
  Filter,
  RefreshCw,
  Loader2,
  Sparkles,
  MapPin,
  Building2,
  Activity,
  ChevronDown,
  Info,
  X,
} from "lucide-react";
import { useComplaints } from "../../context/ComplaintContext";
import useAuth from "../../hooks/useAuth";
import { StatusBadge, PriorityBadge } from "../../components/ui/Badge";
import { getDeptColor, STATUS_OPTIONS } from "../../constants";

const PRIORITY_RADIUS = { Critical: 16, High: 14, Medium: 10, Low: 7 };
const PRIORITY_OPACITY = { Critical: 0.9, High: 0.82, Medium: 0.62, Low: 0.45 };

const PRIORITY_LIST = ["Critical", "High", "Medium", "Low"];

// ─── Auto-fit bounds helper ───────────────────────────────────────────────────
function AutoFitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    const bounds = [
      [Math.min(...lats) - 0.05, Math.min(...lngs) - 0.05],
      [Math.max(...lats) + 0.05, Math.max(...lngs) + 0.05],
    ];
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

// ─── Dept dot ─────────────────────────────────────────────────────────────────
function DeptDot({ dept }) {
  const hex = getDeptColor(dept);
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{ background: hex }}
    />
  );
}

// ─── Stats sidebar bar ────────────────────────────────────────────────────────
function StatBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-1.5 text-text font-medium">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
          {label}
        </span>
        <span className="text-muted font-mono">{count}</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HeatmapView() {
  const { complaints, loadingComplaints, refreshComplaints } = useComplaints();
  const { userData } = useAuth();
  const isDeptAdmin = userData?.adminRole === "department_admin";
  const [selectedPin, setSelectedPin] = useState(null);

  // Filters
  const [deptFilter, setDeptFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showHeat, setShowHeat] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Derive geolocated points from context complaints
  const allPoints = useMemo(
    () => complaints.filter((c) => c.latitude != null && c.longitude != null),
    [complaints]
  );

  const loading = loadingComplaints;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshComplaints();
    } finally {
      setRefreshing(false);
    }
  };

  // ── Filter points ────────────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      allPoints.filter((p) => {
        const priority = p.priorityLevel || p.priority;
        if (deptFilter !== "All" && p.department !== deptFilter) return false;
        if (priorityFilter !== "All" && priority !== priorityFilter) return false;
        if (statusFilter !== "All" && p.status !== statusFilter) return false;
        return true;
      }),
    [allPoints, deptFilter, priorityFilter, statusFilter]
  );

  // ── Stats by dept ────────────────────────────────────────────────────────────
  const deptStats = useMemo(() => {
    const counts = {};
    filtered.forEach((p) => {
      const d = p.department || "Other";
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  // Departments actually present in the data (for filter + sidebar)
  const deptList = useMemo(
    () => [...new Set(allPoints.map((p) => p.department || "Other"))].sort(),
    [allPoints]
  );

  // Default India center if no data yet
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Geospatial Analysis
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-text tracking-tight">
            Grievance Hotspot Map
          </h1>
          <p className="text-muted text-sm mt-1">
            Coordinate-based density visualization of civic complaints —{" "}
            {filtered.length} pins loaded
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Heat / Pin toggle */}
          <button
            onClick={() => setShowHeat((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
              showHeat
                ? "bg-primary-light border-primary/30 text-primary"
                : "bg-surface border-border text-muted hover:text-text"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showHeat ? "Density Mode" : "Pin Mode"}
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="btn-secondary !px-3 !py-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className={`grid grid-cols-1 gap-3 ${isDeptAdmin ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {[
          // Department filter is hidden for department admins — their pins are
          // already scoped server-side to a single department.
          ...(isDeptAdmin
            ? []
            : [{ label: "Department", value: deptFilter, setter: setDeptFilter, options: ["All", ...deptList] }]),
          { label: "Priority", value: priorityFilter, setter: setPriorityFilter, options: ["All", ...PRIORITY_LIST] },
          { label: "Status", value: statusFilter, setter: setStatusFilter, options: ["All", ...STATUS_OPTIONS] },
        ].map(({ label, value, setter, options }) => (
          <div key={label}>
            <span className="label">{label}</span>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
              <select
                value={value}
                onChange={(e) => {
                  setter(e.target.value);
                  setSelectedPin(null);
                }}
                className="input pl-9 pr-9 text-xs appearance-none cursor-pointer"
              >
                {options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Main layout: map + sidebar ── */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* ── Map ── */}
        <div className="flex-1 min-h-[520px] rounded-card overflow-hidden border border-border bg-surface shadow-card relative">
          {loading && allPoints.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface gap-3 z-10">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted text-sm">Loading map data…</p>
            </div>
          ) : (
            <MapContainer
              center={defaultCenter}
              zoom={defaultZoom}
              style={{ height: "100%", width: "100%", minHeight: "520px" }}
              scrollWheelZoom={true}
            >
              {/* Light tile layer to match the theme */}
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />

              {/* Auto-fit bounds when data loads */}
              {filtered.length > 0 && <AutoFitBounds points={filtered} />}

              {/* Render each complaint as a circle marker */}
              {filtered.map((point) => {
                const hex = getDeptColor(point.department);
                const priority = point.priorityLevel || point.priority;
                const radius = showHeat
                  ? (PRIORITY_RADIUS[priority] || 9) * 1.6 // bigger in heat mode
                  : PRIORITY_RADIUS[priority] || 9;
                // Keep colors clearly visible on the light basemap in BOTH modes:
                // density mode spreads bigger, softer discs but never below 0.5 fill.
                const baseOpacity = PRIORITY_OPACITY[priority] || 0.6;
                const fillOpacity = showHeat
                  ? Math.max(0.5, baseOpacity * 0.75)
                  : Math.max(0.75, baseOpacity);
                const isSelected = selectedPin?.id === point.id;

                return (
                  <CircleMarker
                    key={point.id}
                    center={[point.latitude, point.longitude]}
                    radius={isSelected ? radius + 5 : radius}
                    pathOptions={{
                      color: isSelected ? "#1F2937" : hex,
                      fillColor: hex,
                      fillOpacity,
                      weight: isSelected ? 3 : 1.5,
                      opacity: isSelected ? 1 : 0.85,
                    }}
                    eventHandlers={{
                      click: () => setSelectedPin(point),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                      <div className="text-xs font-medium">
                        <strong>#{point.id}</strong> · {point.department}
                        <br />
                        <span className="opacity-70">{priority} priority</span>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}

          {/* No coordinates notice */}
          {!loading && allPoints.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/95 gap-3 z-10">
              <MapPin className="w-10 h-10 text-muted" />
              <p className="text-text text-sm font-medium">No geolocated complaints yet</p>
              <p className="text-muted text-xs max-w-xs text-center">
                Submit complaints with GPS coordinates to see them appear on this map.
              </p>
            </div>
          )}

          {/* Filtered-out notice */}
          {!loading && allPoints.length > 0 && filtered.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/95 gap-3 z-10">
              <Filter className="w-8 h-8 text-muted" />
              <p className="text-muted text-sm">No complaints match the current filters</p>
            </div>
          )}

          {/* Mode badge */}
          <div className="absolute top-3 left-3 z-[400] bg-surface border border-border text-xs font-medium text-text px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
            <Layers className="w-3 h-3" />
            {showHeat ? "Density Heatmap" : "Individual Pins"}
          </div>

          {/* Pin count badge */}
          <div className="absolute top-3 right-3 z-[400] bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm font-mono">
            {filtered.length} complaints
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
          {/* Selected pin card */}
          {selectedPin ? (
            <div className="card !p-4 space-y-3 relative">
              <button
                onClick={() => setSelectedPin(null)}
                className="absolute top-3 right-3 text-muted hover:text-text transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  Selected Complaint
                </p>
                <p className="font-mono font-bold text-primary text-lg">#{selectedPin.id}</p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <DeptDot dept={selectedPin.department} />
                  <span className="text-text font-semibold">{selectedPin.department}</span>
                  {selectedPin.category && (
                    <span className="text-muted">· {selectedPin.category}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <PriorityBadge level={selectedPin.priorityLevel || selectedPin.priority} />
                  <StatusBadge status={selectedPin.status} />
                </div>

                {(selectedPin.area || selectedPin.address) && (
                  <div className="flex items-start gap-1.5 text-muted">
                    <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
                    <span className="line-clamp-2">
                      {selectedPin.area || selectedPin.address}
                    </span>
                  </div>
                )}

                <div className="inset-panel p-2.5 mt-1">
                  <p className="text-text text-xs leading-relaxed line-clamp-4">
                    {selectedPin.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-muted font-mono text-[10px]">
                  <Activity className="w-3 h-3" />
                  {selectedPin.latitude?.toFixed(5)}, {selectedPin.longitude?.toFixed(5)}
                </div>
              </div>
            </div>
          ) : (
            <div className="card !p-4 flex flex-col items-center justify-center gap-2 min-h-[120px]">
              <Info className="w-6 h-6 text-muted" />
              <p className="text-muted text-xs text-center">
                Click any map pin to view complaint details
              </p>
            </div>
          )}

          {/* Department stats */}
          <div className="card !p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2.5">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-text uppercase tracking-wider">
                By Department
              </span>
            </div>
            {deptList.map((dept) => (
              <StatBar
                key={dept}
                label={dept}
                count={deptStats[dept] || 0}
                total={filtered.length}
                color={getDeptColor(dept)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="text-muted text-xs">No data matching filters</p>
            )}
          </div>

          {/* Priority legend */}
          <div className="card !p-4 space-y-2.5">
            <div className="flex items-center gap-2 border-b border-border pb-2.5">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-text uppercase tracking-wider">
                Pin Size = Priority
              </span>
            </div>
            {[
              { label: "Critical", color: "#DC2626", size: 16 },
              { label: "High", color: "#EA8A3E", size: 14 },
              { label: "Medium", color: "#3B82F6", size: 10 },
              { label: "Low", color: "#22C55E", size: 7 },
            ].map(({ label, color, size }) => (
              <div key={label} className="flex items-center gap-2.5 text-xs text-muted">
                <span className="flex items-center justify-center w-6">
                  <span
                    className="rounded-full inline-block"
                    style={{ width: size, height: size, background: color, opacity: 0.8 }}
                  />
                </span>
                <span>{label} Priority</span>
                <span className="ml-auto text-[10px]">
                  {filtered.filter((p) => (p.priorityLevel || p.priority) === label).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
