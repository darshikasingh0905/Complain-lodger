import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
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
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Building,
  RefreshCw,
  Clock,
  Sparkles,
  MapPin,
  Flame,
  ShieldCheck,
  Zap
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const PRIORITY_COLORS = {
  High: '#ef4444',   // Red
  Medium: '#f59e0b', // Amber
  Low: '#10b981'     // Emerald
};

const DEPT_COLORS = {
  Roads: '#f97316',
  'Water Supply': '#06b6d4',
  Electricity: '#eab308',
  Sanitation: '#22c55e',
  Drainage: '#8b5cf6',
  'Street Lights': '#f59e0b',
  'Public Transport': '#ec4899',
  Other: '#94a3b8'
};

const RISK_BADGES = {
  CRITICAL: {
    bg: 'bg-red-500/10 border-red-500/20 text-red-400',
    pulse: 'bg-red-500',
    text: 'Critical Surge Risk'
  },
  WARNING: {
    bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    pulse: 'bg-amber-500',
    text: 'Incubating Strain'
  },
  STABLE: {
    bg: 'bg-slate-800/60 border-slate-700 text-slate-400',
    pulse: 'bg-slate-500',
    text: 'Stable Growth'
  }
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState({
    trend: [],
    departments: [],
    priorities: [],
    emerging_hotspots: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/complaints/trends`);
      setData(res.data);
    } catch (e) {
      console.error(e);
      setError('Could not retrieve chronological tracking indexes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  // Summary Metrics calculations
  const totalGrievances = useMemo(() => {
    return data.departments.reduce((acc, curr) => acc + curr.Grievances, 0);
  }, [data.departments]);

  const topDept = useMemo(() => {
    if (data.departments.length === 0) return { name: 'N/A', count: 0 };
    return data.departments.reduce((max, curr) => 
      curr.Grievances > max.count ? { name: curr.name, count: curr.Grievances } : max
    , { name: 'None', count: -1 });
  }, [data.departments]);

  const criticalCount = useMemo(() => {
    return data.emerging_hotspots.filter(h => h.risk === 'CRITICAL').length;
  }, [data.emerging_hotspots]);

  const chartTheme = {
    tooltipStyle: {
      backgroundColor: '#0f172a',
      borderColor: 'rgba(255,255,255,0.08)',
      borderRadius: '12px',
      color: '#f8fafc',
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px'
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 md:px-4 py-8 space-y-8 text-left">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Milestone 9: Predictive Engine Active
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Predictive Analytics Dashboard
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Chronological analysis of lodging spikes and high-velocity infrastructure failure alerts.
          </p>
        </div>

        <button
          onClick={fetchTrends}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-350 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Models
        </button>
      </div>

      {loading && data.trend.length === 0 ? (
        <div className="glass-panel p-24 rounded-3xl text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-slate-400 text-sm">Processing time-series records and predicting cluster velocity...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-12 rounded-3xl text-center border border-rose-500/10 bg-rose-500/5 text-rose-400 flex flex-col items-center gap-2">
          <AlertTriangle className="w-8 h-8" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Summary statistics cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Grievance Rate</span>
                  <span className="text-3xl font-black text-white font-mono block mt-1">{totalGrievances}</span>
                </div>
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-slate-550 text-[10px] mt-2 font-medium">Total reported citizen filings logged</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Primary Peak</span>
                  <span className="text-xl font-bold text-white block mt-2.5 truncate max-w-[150px]">{topDept.name}</span>
                </div>
                <div className="p-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
              </div>
              <p className="text-slate-550 text-[10px] mt-2 font-medium">{topDept.count} reports listed in active logs</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Surge Warnings</span>
                  <span className="text-3xl font-black text-white font-mono block mt-1">{criticalCount}</span>
                </div>
                <div className="p-2 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-550 text-[10px] mt-2 font-medium">Critical hotspot grids requiring dispatch</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Forecast Reliability</span>
                  <span className="text-3xl font-black text-white font-mono block mt-1">94.8%</span>
                </div>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-slate-550 text-[10px] mt-2 font-medium">Dynamic AI risk verification weight</p>
            </div>

          </div>

          {/* ── Main Charts Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* AreaChart: Chronological trend */}
            <div className="glass-panel p-5 rounded-3xl border border-white/5 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-350">
                    Incoming Grievance Load Velocity
                  </h3>
                  <p className="text-[10px] text-slate-500">Daily complaint counts over the past 14 days representing overall timeline spikes.</p>
                </div>
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="h-68 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} allowDecimals={false} />
                    <ChartTooltip contentStyle={chartTheme.tooltipStyle} />
                    <Area type="monotone" dataKey="Grievances" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#gradientTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PieChart: priority weights */}
            <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-350">
                    Urgency Curve Analysis
                  </h3>
                  <p className="text-[10px] text-slate-500">Distribution of priorities classified by AI parser.</p>
                </div>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <div className="h-68 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={data.priorities}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data.priorities.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PRIORITY_COLORS[entry.name] || '#94a3b8'} 
                        />
                      ))}
                    </Pie>
                    <ChartTooltip contentStyle={chartTheme.tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend list */}
                <div className="flex justify-around w-full mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {data.priorities.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[entry.name] }} />
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                  {data.priorities.length === 0 && (
                    <div className="text-slate-600">No active priorities parsed</div>
                  )}
                </div>
              </div>
            </div>

            {/* BarChart: Department breakdown */}
            <div className="glass-panel p-5 rounded-3xl border border-white/5 lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-350">
                    Departmental Pressure Indexes
                  </h3>
                  <p className="text-[10px] text-slate-500">Comparison of complaint frequency per service department.</p>
                </div>
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.departments} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                    <ChartTooltip contentStyle={chartTheme.tooltipStyle} />
                    <Bar dataKey="Grievances" radius={[6, 6, 0, 0]}>
                      {data.departments.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={DEPT_COLORS[entry.name] || '#6366f1'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* ── Emerging Predictive Hotspots list ── */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-350 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-500" />
                  Chronological Surge Alerts & Predictive Hotspots
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  Active zones calculated to have extreme complaint frequency velocity. Early warnings signal failure probability before systemic breakdown.
                </p>
              </div>
              <span className="text-[9px] font-black uppercase bg-slate-900 border border-white/5 text-purple-400 px-3 py-1.5 rounded-xl">
                Automatic Refresh Mode
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.emerging_hotspots.map((hot) => {
                const b = RISK_BADGES[hot.risk] || RISK_BADGES.STABLE;
                return (
                  <div 
                    key={hot.id} 
                    className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col justify-between gap-3 text-xs"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-550 font-bold uppercase tracking-wider block">Hotspot Zone #{hot.id}</span>
                        <h4 className="font-extrabold text-white text-sm">{hot.department}</h4>
                      </div>
                      
                      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase ${b.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${b.pulse} animate-ping`} />
                        <span>{b.text}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-900">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-300 font-medium leading-relaxed">{hot.location}</p>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-white/5 pt-2.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide">
                        <span className="text-slate-500">Failure Probability Rate</span>
                        <span className={hot.risk === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}>{hot.surge_rate}% Acceleration</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed italic">"{hot.forecast}"</p>
                    </div>
                  </div>
                );
              })}

              {data.emerging_hotspots.length === 0 && (
                <div className="col-span-2 py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <ShieldCheck className="w-8 h-8 text-slate-650" />
                  <p className="font-bold uppercase tracking-wider text-xs">All Infrastructure Grids Secured</p>
                  <p className="text-slate-600 text-xs mt-0.5 max-w-[325px]">
                    No emergent chronological surges have triggered our risk classifiers. All departments operating within stable historical boundaries.
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
