import React, { useState, useMemo, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Import icons
import {
  Flame,
  Map as MapIcon,
  SlidersHorizontal,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Sparkles,
  MapPin,
  TrendingUp,
  Building,
  CheckCircle,
  BarChart2,
  Zap,
  ShieldCheck,
  Info
} from 'lucide-react';

import { useComplaints } from '../../context/ComplaintContext';

// Fix for default Leaflet marker icons in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Configure colors and actions for departments
const DEPT_COLORS = {
  'Roads and Drainage': { hex: '#f97316', tailwind: 'bg-orange-500' },
  'Water Supply Department': { hex: '#06b6d4', tailwind: 'bg-cyan-500' },
  'Electricity Department': { hex: '#eab308', tailwind: 'bg-yellow-500' },
  'Solid Waste Management': { hex: '#22c55e', tailwind: 'bg-emerald-500' },
  'Public Health': { hex: '#a855f7', tailwind: 'bg-purple-500' },
  'Traffic Police': { hex: '#3b82f6', tailwind: 'bg-blue-500' },
  'Fire Department': { hex: '#ef4444', tailwind: 'bg-red-500' },
  Other: { hex: '#94a3b8', tailwind: 'bg-slate-400' }
};

const ACTION_LOOKUP = {
  'Roads and Drainage': 'Assign additional Road Maintenance and drainage crews to clear water logging.',
  'Water Supply Department': 'Deploy pipeline repair technicians and verify water pressure valves.',
  'Electricity Department': 'Dispatch power engineers to secure transformer safety and check grids.',
  'Solid Waste Management': 'Deploy municipal sanitation collection vehicles and clear public dump bins.',
  'Public Health': 'Coordinate vector control spray and inspect standing water sites.',
  'Traffic Police': 'Deploy traffic control officers to optimize traffic flow.',
  Other: 'Dispatch standard field inspection officers to assess the report.'
};

// Auto-fit bounds component helper
function AutoFitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    const bounds = [
      [Math.min(...lats) - 0.02, Math.min(...lngs) - 0.02],
      [Math.max(...lats) + 0.02, Math.max(...lngs) + 0.02],
    ];
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [points, map]);
  return null;
}

// React-Leaflet Heat Layer component using L.heatLayer
function HeatLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    const heatLayer = L.heatLayer(points, {
      radius: 30,
      blur: 20,
      maxZoom: 18,
      gradient: {
        0.2: 'blue',
        0.5: 'yellow',
        0.8: 'orange',
        1.0: 'red'
      }
    });

    heatLayer.addTo(map);

    return () => {
      if (map && heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points]);

  return null;
}

// Extract clean neighborhood name from address string
const getNeighborhood = (areaStr) => {
  if (!areaStr) return "General Zone";
  let part = areaStr.split(',')[0].trim();
  part = part.replace(/(Bus Stand|Metro Station|Railway Station|Airport|Opposite|Near|Behind|Inside|Outside)/gi, '').trim();
  return part || "General Zone";
};

export default function Heatmap() {
  const { complaints, loadingComplaints, refreshComplaints } = useComplaints();
  const [selectedPin, setSelectedPin] = useState(null);

  // Filter States
  const [deptFilter, setDeptFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Extract complaints with coordinates
  const allGeocoded = useMemo(() => {
    return complaints.filter(c => c.latitude != null && c.longitude != null);
  }, [complaints]);

  // Unique Departments and Categories for filters
  const uniqueDepts = useMemo(() => {
    const depts = new Set(allGeocoded.map(c => c.department).filter(Boolean));
    return ['All', ...Array.from(depts)];
  }, [allGeocoded]);

  const uniqueCats = useMemo(() => {
    const cats = new Set(allGeocoded.map(c => c.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [allGeocoded]);

  // Filter the geocoded list
  const filtered = useMemo(() => {
    return allGeocoded.filter(c => {
      if (deptFilter !== 'All' && c.department !== deptFilter) return false;
      if (catFilter !== 'All' && c.category !== catFilter) return false;
      if (priorityFilter !== 'All' && c.priorityLevel !== priorityFilter && c.priority !== priorityFilter) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      return true;
    });
  }, [allGeocoded, deptFilter, catFilter, priorityFilter, statusFilter]);

  // Create heatPoints array of [lat, lng, intensity]
  const heatPoints = useMemo(() => {
    return filtered.map(c => [
      c.latitude, 
      c.longitude, 
      c.priorityLevel === 'Critical' ? 1.0 : c.priorityLevel === 'High' ? 0.8 : c.priorityLevel === 'Medium' ? 0.5 : 0.2
    ]);
  }, [filtered]);

  // Analytics Calculations
  const analytics = useMemo(() => {
    const total = filtered.length;
    if (total === 0) {
      return {
        total: 0,
        highestArea: 'N/A',
        mostCommonCategory: 'N/A',
        avgPriority: 'N/A',
        criticalCount: 0,
        resolvedPct: 0
      };
    }

    // Highest Density Area
    const areas = {};
    filtered.forEach(c => {
      const area = getNeighborhood(c.area);
      areas[area] = (areas[area] || 0) + 1;
    });
    const highestArea = Object.keys(areas).sort((a, b) => areas[b] - areas[a])[0] || 'N/A';

    // Most Common Category
    const categories = {};
    filtered.forEach(c => {
      const cat = c.category || 'Other';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    const mostCommonCategory = Object.keys(categories).sort((a, b) => categories[b] - categories[a])[0] || 'N/A';

    // Average Priority
    const avgScore = Math.round(filtered.reduce((sum, c) => sum + (c.priorityScore || 0), 0) / total);
    let avgPriority = 'Medium';
    if (avgScore >= 81) avgPriority = 'Critical';
    else if (avgScore >= 61) avgPriority = 'High';
    else if (avgScore >= 31) avgPriority = 'Medium';
    else avgPriority = 'Low';

    const criticalCount = filtered.filter(c => c.priorityLevel === 'Critical' || c.priority === 'Critical').length;

    const resolved = filtered.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
    const resolvedPct = Math.round((resolved / total) * 100);

    return {
      total,
      highestArea,
      mostCommonCategory,
      avgPriority: `${avgPriority} (${avgScore}/100)`,
      criticalCount,
      resolvedPct
    };
  }, [filtered]);

  // Hotspot Summary Cards (Top 3 areas by count)
  const hotspotCards = useMemo(() => {
    const areaGroups = {};
    filtered.forEach(c => {
      const neighborhood = getNeighborhood(c.area);
      if (!areaGroups[neighborhood]) {
        areaGroups[neighborhood] = {
          name: neighborhood,
          count: 0,
          categories: {}
        };
      }
      areaGroups[neighborhood].count += 1;
      const cat = c.category || 'General';
      areaGroups[neighborhood].categories[cat] = (areaGroups[neighborhood].categories[cat] || 0) + 1;
    });

    const sortedAreas = Object.values(areaGroups)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return sortedAreas.map(area => {
      let dominantCategory = 'General';
      let maxCatCount = 0;
      Object.entries(area.categories).forEach(([cat, count]) => {
        if (count > maxCatCount) {
          maxCatCount = count;
          dominantCategory = cat;
        }
      });
      return {
        name: area.name,
        count: area.count,
        dominantCategory
      };
    });
  }, [filtered]);

  // AI Insights Panel Calculations
  const aiInsights = useMemo(() => {
    if (filtered.length === 0) {
      return [
        {
          id: 1,
          title: "Nominal System Status",
          description: "All municipal grids are reporting zero active anomalies under current filters.",
          action: "Continue routine administrative monitoring."
        }
      ];
    }

    const insights = [];

    // Top Category
    const catCounts = {};
    filtered.forEach(c => {
      catCounts[c.category] = (catCounts[c.category] || 0) + 1;
    });
    const topCategory = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a])[0];

    // Top Area for this category
    const areaCounts = {};
    filtered.filter(c => c.category === topCategory).forEach(c => {
      const nh = getNeighborhood(c.area);
      areaCounts[nh] = (areaCounts[nh] || 0) + 1;
    });
    const topArea = Object.keys(areaCounts).sort((a, b) => areaCounts[b] - areaCounts[a])[0] || "General Zone";

    // Average Priority Level
    const matches = filtered.filter(c => c.category === topCategory && getNeighborhood(c.area) === topArea);
    const avgScore = matches.reduce((sum, c) => sum + (c.priorityScore || 50), 0) / matches.length;
    let avgLevel = 'Medium';
    if (avgScore >= 81) avgLevel = 'Critical';
    else if (avgScore >= 61) avgLevel = 'High';
    else if (avgScore >= 31) avgLevel = 'Medium';
    else avgLevel = 'Low';

    const dept = matches[0]?.department || 'Other';
    const actionText = ACTION_LOOKUP[dept] || ACTION_LOOKUP.Other;

    insights.push({
      id: 1,
      title: `Cluster Concentration in ${topArea}`,
      description: `Highest concentration of ${topCategory} complaints detected around ${topArea}.`,
      priority: avgLevel,
      action: actionText
    });

    // Unresolved surge check
    const unresolved = filtered.filter(c => ['Submitted', 'Assigned', 'In Progress'].includes(c.status));
    if (unresolved.length > 0) {
      const areaUnresolved = {};
      unresolved.forEach(c => {
        const nh = getNeighborhood(c.area);
        areaUnresolved[nh] = (areaUnresolved[nh] || 0) + 1;
      });
      const topUnresolvedArea = Object.keys(areaUnresolved).sort((a, b) => areaUnresolved[b] - areaUnresolved[a])[0];
      const unresolvedCount = areaUnresolved[topUnresolvedArea];
      
      const primaryCat = unresolved.filter(c => getNeighborhood(c.area) === topUnresolvedArea)[0]?.category || "General";

      let suggestedAction = "Consider immediate deployment.";
      if (primaryCat.toLowerCase().includes('garbage') || primaryCat.toLowerCase().includes('waste')) {
        suggestedAction = "Consider immediate sanitation deployment and waste cleanup.";
      } else if (primaryCat.toLowerCase().includes('water') || primaryCat.toLowerCase().includes('leak')) {
        suggestedAction = "Coordinate pipeline repairs and check pressure control valves.";
      } else if (primaryCat.toLowerCase().includes('road') || primaryCat.toLowerCase().includes('pothole')) {
        suggestedAction = "Dispatch road maintenance patching crews.";
      }

      insights.push({
        id: 2,
        title: `Surging Pending Tickets: ${topUnresolvedArea}`,
        description: `${primaryCat} complaints are increasing in ${topUnresolvedArea}. Most complaints are still unresolved (${unresolvedCount} pending).`,
        action: suggestedAction
      });
    }

    return insights;
  }, [filtered]);

  // Marker icon creator based on priority
  const getMarkerIcon = (priority) => {
    const color = {
      Critical: '#ef4444',
      High: '#f97316',
      Medium: '#3b82f6',
      Low: '#10b981'
    }[priority] || '#3b82f6';

    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px ${color}; cursor: pointer;"></div>`,
      className: 'custom-map-marker',
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  const defaultCenter = [18.5204, 73.8567]; // Center of Pune, Maharashtra
  const defaultZoom = 12;

  return (
    <div className="w-full space-y-6 text-left">
      
      {/* ── Analytics Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Total Complaints", val: analytics.total, color: "bg-sky-500", desc: "Geocoded reports" },
          { label: "Highest Density Area", val: analytics.highestArea, color: "bg-rose-500", desc: "Top hotspot zone", isText: true },
          { label: "Most Common Category", val: analytics.mostCommonCategory, color: "bg-amber-500", desc: "Primary complaint type", isText: true },
          { label: "Average Priority", val: analytics.avgPriority, color: "bg-indigo-500", desc: "Priority breakdown", isText: true },
          { label: "Critical Complaints", val: analytics.criticalCount, color: "bg-red-500", desc: "Immediate action required" },
          { label: "Resolved / Closed %", val: `${analytics.resolvedPct}%`, color: "bg-emerald-500", desc: "Resolution SLA percentage" }
        ].map((card, idx) => (
          <div key={idx} className="glass-panel p-4.5 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
            <div className={`absolute top-0 left-0 w-1 h-full ${card.color}`} />
            <div>
              <span className="text-[9px] text-slate-550 font-extrabold uppercase tracking-wider block">{card.label}</span>
              <span className={`font-black text-white block mt-1 tracking-tight ${card.isText ? 'text-xs truncate max-w-full' : 'text-xl font-mono'}`}>
                {card.val}
              </span>
            </div>
            <p className="text-[9px] text-slate-500 mt-2 font-medium">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Hotspot Summary Cards ── */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-1">
          🔥 Highest Complaint Hotspots
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hotspotCards.map((card, idx) => (
            <div key={idx} className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-rose-450 font-bold uppercase tracking-wider block">
                  #{idx + 1} {card.name}
                </span>
                <span className="text-white text-xs font-semibold block">{card.dominantCategory}</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-white font-mono">{card.count}</span>
                <span className="text-[9px] text-slate-500 block uppercase tracking-wide">Complaints</span>
              </div>
            </div>
          ))}
          {hotspotCards.length === 0 && (
            <div className="col-span-3 py-6 glass-panel text-center text-xs text-slate-555">
              No complaint hotspots computed under current filters.
            </div>
          )}
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
          <SlidersHorizontal className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-350 uppercase tracking-wider">Heatmap Filters</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Category', value: catFilter, setter: setCatFilter, options: uniqueCats },
            { label: 'Department', value: deptFilter, setter: setDeptFilter, options: uniqueDepts },
            { label: 'Priority', value: priorityFilter, setter: setPriorityFilter, options: ['All', 'Critical', 'High', 'Medium', 'Low'] },
            { label: 'Status', value: statusFilter, setter: setStatusFilter, options: ['All', 'Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'] }
          ].map(({ label, value, setter, options }) => (
            <div key={label} className="relative">
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-555 mb-1">{label}</span>
              <select
                value={value}
                onChange={e => { setter(e.target.value); setSelectedPin(null); }}
                className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 text-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none transition appearance-none cursor-pointer"
              >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Map + Insights Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Interactive Map */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="min-h-[500px] rounded-3xl overflow-hidden border border-white/5 relative shadow-xl">
            {loadingComplaints && allGeocoded.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-3 z-30">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="text-slate-400 text-sm">Synchronizing geospatial complaints data...</p>
              </div>
            ) : (
              <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                style={{ height: '100%', width: '100%', minHeight: '500px' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Auto fit map bounds when filters update */}
                {filtered.length > 0 && (
                  <AutoFitBounds points={filtered.map(c => [c.latitude, c.longitude])} />
                )}

                {/* Heat layer density rendering */}
                {heatPoints.length > 0 && <HeatLayer points={heatPoints} />}

                {/* Render interactive complaint marker dots */}
                {filtered.map(c => (
                  <Marker
                    key={c.id}
                    position={[c.latitude, c.longitude]}
                    icon={getMarkerIcon(c.priorityLevel || c.priority)}
                    eventHandlers={{
                      click: () => setSelectedPin(c),
                    }}
                  >
                    <Popup className="leaflet-popup-dark">
                      <div className="text-xs space-y-1.5 p-1">
                        <div className="flex justify-between items-center border-b border-white/10 pb-1">
                          <span className="font-mono font-bold text-sky-400">#{c.id}</span>
                          <span className={`text-[8px] font-black uppercase px-1 rounded ${
                            c.priorityLevel === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                            c.priorityLevel === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                            c.priorityLevel === 'Medium' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {c.priorityLevel || c.priority}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-300 font-bold">Category:</span>
                          <span className="truncate">{c.category || 'General'}</span>

                          <span className="font-semibold text-slate-300 font-bold">Dept:</span>
                          <span className="truncate">{c.department || 'Other'}</span>

                          <span className="font-semibold text-slate-300 font-bold">Status:</span>
                          <span className="truncate">{c.status}</span>

                          <span className="font-semibold text-slate-300 font-bold">Date:</span>
                          <span>{new Date(c.createdAt || c.submitted_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}

            {/* Empty State Overlay */}
            {!loadingComplaints && filtered.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 gap-3 z-10">
                <MapPin className="w-10 h-10 text-slate-600" />
                <p className="text-slate-400 text-sm font-semibold">No complaints found</p>
                <p className="text-slate-500 text-xs text-center max-w-[280px]">
                  No complaints match the current filter metrics. Try resetting or adjusting the dropdown filters.
                </p>
              </div>
            )}

            {/* Mode badge overlay */}
            <div className="absolute top-3 left-3 z-[400] bg-slate-950/80 backdrop-blur border border-white/10 text-[9px] font-extrabold uppercase text-slate-350 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
              <MapIcon className="w-3 h-3 text-sky-400" />
              Density Heatmap Active
            </div>

            {/* Pin count badge */}
            <div className="absolute top-3 right-3 z-[400] bg-slate-950/80 backdrop-blur border border-white/10 text-xs font-bold font-mono text-sky-400 px-2.5 py-1 rounded-lg shadow-md">
              {filtered.length} points
            </div>
            
            {/* Heatmap Legend */}
            <div className="absolute bottom-3 left-3 z-[400] bg-slate-950/85 backdrop-blur border border-white/10 p-3 rounded-xl shadow-lg space-y-1.5 text-xs text-left">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block border-b border-white/5 pb-1">
                Complaint Density
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-400 font-semibold">
                <div className="flex items-center gap-1.5">🔵 Low</div>
                <div className="flex items-center gap-1.5">🟢 Moderate</div>
                <div className="flex items-center gap-1.5">🟡 High</div>
                <div className="flex items-center gap-1.5">🟠 Very High</div>
                <div className="flex items-center gap-1.5 text-rose-400">🔴 Critical</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: AI Insights Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col gap-4 flex-grow text-left">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
              <Sparkles className="w-4 h-4 text-purple-450" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">AI Insights Engine</span>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {aiInsights.map((ins, i) => (
                <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 space-y-3.5">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-extrabold text-white text-xs leading-snug">{ins.title}</h4>
                    {ins.priority && (
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${
                        ins.priority === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/25' :
                        ins.priority === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/25' :
                        ins.priority === 'Medium' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      }`}>
                        {ins.priority} Priority
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">{ins.description}</p>
                  <div className="pt-2.5 border-t border-white/5 flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-yellow-450 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] text-slate-550 font-extrabold uppercase tracking-wide block">Action Suggestion</span>
                      <p className="text-[10px] text-slate-300 leading-normal mt-0.5">{ins.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto border-t border-slate-900 pt-4 text-center">
              <span className="text-[9px] text-slate-600 uppercase font-black tracking-wide block">
                Spatial Clustering Active
              </span>
              <span className="text-[8px] text-slate-700 font-medium block mt-0.5">
                Calculations optimized for Demonstration
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
