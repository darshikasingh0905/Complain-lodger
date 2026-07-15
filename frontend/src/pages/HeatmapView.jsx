import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Map as MapIcon,
  Layers,
  Filter,
  RefreshCw,
  AlertCircle,
  Loader2,
  Sparkles,
  MapPin,
  Building2,
  Activity,
  ChevronDown,
  Info,
  X,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ─── Department colour config ─────────────────────────────────────────────────
const DEPT_COLORS = {
  Roads:            { hex: '#f97316', tailwind: 'bg-orange-500',  dot: 'bg-orange-400' },
  'Water Supply':   { hex: '#06b6d4', tailwind: 'bg-cyan-500',    dot: 'bg-cyan-400'   },
  Electricity:      { hex: '#eab308', tailwind: 'bg-yellow-500',  dot: 'bg-yellow-400' },
  Sanitation:       { hex: '#22c55e', tailwind: 'bg-emerald-500', dot: 'bg-emerald-400'},
  Drainage:         { hex: '#8b5cf6', tailwind: 'bg-violet-500',  dot: 'bg-violet-400' },
  'Street Lights':  { hex: '#f59e0b', tailwind: 'bg-amber-500',   dot: 'bg-amber-400'  },
  'Public Transport':{ hex: '#ec4899', tailwind: 'bg-pink-500',   dot: 'bg-pink-400'   },
  Other:            { hex: '#94a3b8', tailwind: 'bg-slate-400',   dot: 'bg-slate-400'  },
};

const PRIORITY_RADIUS = { High: 14, Medium: 10, Low: 7 };
const PRIORITY_OPACITY = { High: 0.82, Medium: 0.62, Low: 0.45 };

const DEPT_LIST = Object.keys(DEPT_COLORS);
const PRIORITY_LIST = ['High', 'Medium', 'Low'];
const STATUS_LIST   = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];

// ─── Auto-fit bounds helper ───────────────────────────────────────────────────
function AutoFitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);
    const bounds = [
      [Math.min(...lats) - 0.05, Math.min(...lngs) - 0.05],
      [Math.max(...lats) + 0.05, Math.max(...lngs) + 0.05],
    ];
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

// ─── Dept badge ───────────────────────────────────────────────────────────────
function DeptDot({ dept }) {
  const cfg = DEPT_COLORS[dept] || DEPT_COLORS.Other;
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`}
    />
  );
}

// ─── Stats sidebar card ───────────────────────────────────────────────────────
function StatBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="flex items-center gap-1.5 text-slate-300 font-medium">
          <span className={`w-2 h-2 rounded-full shrink-0`} style={{ background: color }} />
          {label}
        </span>
        <span className="text-slate-400 font-mono">{count}</span>
      </div>
      <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HeatmapView() {
  const [allPoints, setAllPoints]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [selectedPin, setSelectedPin] = useState(null);

  // Filters
  const [deptFilter, setDeptFilter]       = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter]   = useState('All');
  const [showHeat, setShowHeat]           = useState(true);  // heat vs pin mode

  // ── Fetch map data ──────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/complaints/map-data`);
      setAllPoints(res.data);
    } catch (err) {
      setError('Failed to load map data. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Filter points ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => allPoints.filter(p => {
    if (deptFilter     !== 'All' && p.department !== deptFilter)   return false;
    if (priorityFilter !== 'All' && p.priority   !== priorityFilter) return false;
    if (statusFilter   !== 'All' && p.status     !== statusFilter)  return false;
    return true;
  }), [allPoints, deptFilter, priorityFilter, statusFilter]);

  // ── Stats by dept ───────────────────────────────────────────────────────────
  const deptStats = useMemo(() => {
    const counts = {};
    filtered.forEach(p => {
      const d = p.department || 'Other';
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  // Default India center if no data yet
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom   = 5;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 md:px-4 py-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Geospatial Analysis
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Grievance Hotspot Map
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Coordinate-based density visualization of civic complaints — {filtered.length} pins loaded
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Heat / Pin toggle */}
          <button
            id="map-mode-toggle"
            onClick={() => setShowHeat(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all duration-200 ${
              showHeat
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showHeat ? 'Density Mode' : 'Pin Mode'}
          </button>

          <button
            id="map-refresh-btn"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white hover:border-slate-600 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Department', value: deptFilter, setter: setDeptFilter, options: ['All', ...DEPT_LIST] },
          { label: 'Priority',   value: priorityFilter, setter: setPriorityFilter, options: ['All', ...PRIORITY_LIST] },
          { label: 'Status',     value: statusFilter,   setter: setStatusFilter,   options: ['All', ...STATUS_LIST]   },
        ].map(({ label, value, setter, options }) => (
          <div key={label} className="relative">
            <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">{label}</span>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <select
                value={value}
                onChange={e => { setter(e.target.value); setSelectedPin(null); }}
                className="w-full bg-slate-900/70 border border-slate-700 focus:border-sky-500 text-slate-200 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none transition appearance-none cursor-pointer"
              >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Layout: Map + Sidebar ── */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* ── Map ── */}
        <div className="flex-1 min-h-[520px] rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl relative">
          {loading && allPoints.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 gap-3 z-10">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-slate-400 text-sm">Loading map data…</p>
            </div>
          ) : (
            <MapContainer
              center={defaultCenter}
              zoom={defaultZoom}
              style={{ height: '100%', width: '100%', minHeight: '520px' }}
              scrollWheelZoom={true}
            >
              {/* Dark tile layer from CartoDB */}
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {/* Auto-fit bounds when data loads */}
              {filtered.length > 0 && <AutoFitBounds points={filtered} />}

              {/* Render each complaint as a circle marker */}
              {filtered.map(point => {
                const cfg = DEPT_COLORS[point.department] || DEPT_COLORS.Other;
                const radius = showHeat
                  ? (PRIORITY_RADIUS[point.priority] || 9) * 1.6   // bigger in heat mode
                  : (PRIORITY_RADIUS[point.priority] || 9);
                const fillOpacity = showHeat
                  ? (PRIORITY_OPACITY[point.priority] || 0.55) * 0.6 // more transparent in heat
                  : (PRIORITY_OPACITY[point.priority] || 0.55);
                const isSelected = selectedPin?.id === point.id;

                return (
                  <CircleMarker
                    key={point.id}
                    center={[point.latitude, point.longitude]}
                    radius={isSelected ? radius + 5 : radius}
                    pathOptions={{
                      color: isSelected ? '#ffffff' : cfg.hex,
                      fillColor: cfg.hex,
                      fillOpacity,
                      weight: isSelected ? 2.5 : (showHeat ? 0 : 1),
                      opacity: showHeat ? 0 : 0.9,
                    }}
                    eventHandlers={{
                      click: () => setSelectedPin(point),
                    }}
                  >
                    <Tooltip
                      direction="top"
                      offset={[0, -8]}
                      opacity={1}
                      className="leaflet-tooltip-dark"
                    >
                      <div className="text-xs font-medium">
                        <strong>#{point.id}</strong> · {point.department}
                        <br />
                        <span className="opacity-70">{point.priority} priority</span>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}

          {/* No coordinates notice overlay */}
          {!loading && allPoints.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 gap-3 z-10 rounded-2xl">
              <MapPin className="w-10 h-10 text-slate-600" />
              <p className="text-slate-400 text-sm font-medium">No geolocated complaints yet</p>
              <p className="text-slate-600 text-xs max-w-xs text-center">
                Submit complaints with GPS coordinates to see them appear on this map.
              </p>
            </div>
          )}

          {/* Filtered-out notice */}
          {!loading && allPoints.length > 0 && filtered.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 gap-3 z-10 rounded-2xl">
              <Filter className="w-8 h-8 text-slate-500" />
              <p className="text-slate-400 text-sm">No complaints match the current filters</p>
            </div>
          )}

          {/* Mode badge overlay */}
          <div className="absolute top-3 left-3 z-[400] bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-xs font-semibold text-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <Layers className="w-3 h-3" />
            {showHeat ? 'Density Heatmap' : 'Individual Pins'}
          </div>

          {/* Pin count badge */}
          <div className="absolute top-3 right-3 z-[400] bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-xs font-bold font-mono text-sky-400 px-2.5 py-1 rounded-lg">
            {filtered.length} complaints
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">

          {/* Selected pin card */}
          {selectedPin ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-3 relative">
              <button
                onClick={() => setSelectedPin(null)}
                className="absolute top-3 right-3 text-slate-500 hover:text-white transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Selected Complaint</p>
                <p className="font-mono font-black text-sky-400 text-lg">#{selectedPin.id}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <DeptDot dept={selectedPin.department} />
                  <span className="text-slate-300 font-semibold">{selectedPin.department}</span>
                  {selectedPin.category && (
                    <span className="text-slate-500">· {selectedPin.category}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                    selectedPin.priority === 'High'   ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    selectedPin.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {selectedPin.priority}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                    selectedPin.status === 'Resolved'    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    selectedPin.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    selectedPin.status === 'Assigned'    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                                                           'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {selectedPin.status}
                  </span>
                </div>

                {selectedPin.address && (
                  <div className="flex items-start gap-1.5 text-slate-400">
                    <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-rose-400" />
                    <span className="line-clamp-2">{selectedPin.address}</span>
                  </div>
                )}

                <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800 mt-1">
                  <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-4">{selectedPin.description}</p>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px]">
                  <Activity className="w-3 h-3" />
                  {selectedPin.latitude?.toFixed(5)}, {selectedPin.longitude?.toFixed(5)}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-h-[120px]">
              <Info className="w-6 h-6 text-slate-600" />
              <p className="text-slate-500 text-xs text-center">Click any map pin to view complaint details</p>
            </div>
          )}

          {/* Department stats */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-700/50 pb-2.5">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">By Department</span>
            </div>
            {Object.entries(DEPT_COLORS).map(([dept, cfg]) => {
              const count = deptStats[dept] || 0;
              if (allPoints.length > 0 && count === 0) return null;
              return (
                <StatBar
                  key={dept}
                  label={dept}
                  count={count}
                  total={filtered.length}
                  color={cfg.hex}
                />
              );
            })}
            {filtered.length === 0 && (
              <p className="text-slate-600 text-xs">No data matching filters</p>
            )}
          </div>

          {/* Priority legend */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 border-b border-slate-700/50 pb-2.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Pin Size = Priority</span>
            </div>
            {[
              { label: 'High',   color: '#ef4444', size: 14 },
              { label: 'Medium', color: '#f59e0b', size: 10 },
              { label: 'Low',    color: '#22c55e', size: 7  },
            ].map(({ label, color, size }) => (
              <div key={label} className="flex items-center gap-2.5 text-xs text-slate-400">
                <span className="flex items-center justify-center w-6">
                  <span
                    className="rounded-full inline-block"
                    style={{ width: size, height: size, background: color, opacity: 0.8 }}
                  />
                </span>
                <span>{label} Priority</span>
                <span className="ml-auto text-slate-600 text-[10px]">
                  {filtered.filter(p => p.priority === label).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
