import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useComplaints } from '../context/ComplaintContext';
import {
  LayoutDashboard,
  Search,
  Filter,
  MapPin,
  User,
  Phone,
  Calendar,
  Activity,
  CheckCircle2,
  Clock,
  Wrench,
  ThumbsUp,
  AlertCircle,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  FolderDot,
  FileQuestion,
  HelpCircle,
  CheckCircle,
  ScanSearch,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Loader2,
  BarChart2,
  Zap,
  Star
} from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';
import Heatmap from './admin/Heatmap';

const STATUS_OPTIONS = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
const DEPARTMENTS = [
  'Roads',
  'Water Supply',
  'Electricity',
  'Sanitation',
  'Drainage',
  'Street Lights',
  'Public Transport',
  'Other'
];

function AdminPanel() {
  const { complaints, loadingComplaints, updateStatus, reclassifyComplaint, auditEvidence } = useComplaints();
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const location = useLocation();
  const searchParams = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialTab = searchParams.get('tab') || 'complaints';
  const [activeTab, setActiveTab] = useState(initialTab);

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['complaints', 'analytics', 'heatmap'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Filters
  const [statusFilter, setStatusFilter]   = useState('All');
  const [deptFilter,   setDeptFilter]     = useState('All');
  const [regionSearch, setRegionSearch]   = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy]               = useState('Newest');

  // Action states
  const [updatingStatus,  setUpdatingStatus]  = useState(false);
  const [reclassifying,   setReclassifying]   = useState(false);
  const [auditingEvidence,setAuditingEvidence]= useState(false);
  const [actionSuccess,   setActionSuccess]   = useState(null);

  // Auto-select first complaint when list loads/changes
  React.useEffect(() => {
    if (!selectedComplaint && complaints.length > 0) {
      setSelectedComplaint(complaints[0]);
    }
    // Keep selectedComplaint in sync when data changes
    if (selectedComplaint) {
      const updated = complaints.find((c) => c.id === selectedComplaint.id);
      if (updated) setSelectedComplaint(updated);
    }
  }, [complaints]);

  // Update Status Action (local — no backend needed)
  const handleStatusChange = async (id, newStatus) => {
    setUpdatingStatus(true);
    setActionSuccess(null);
    try {
      await updateStatus(id, newStatus);
      setActionSuccess('Ticket status updated successfully!');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update complaint status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Re-run AI Classification
  const handleAIReclassify = async (cid) => {
    setReclassifying(true);
    setActionSuccess(null);
    try {
      const updated = await reclassifyComplaint(cid);
      setSelectedComplaint(updated);
      setActionSuccess("AI route optimization refreshed!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      alert(err.message || "AI Reclassification pipeline failed.");
    } finally {
      setReclassifying(false);
    }
  };

  // Evidence Audit Action
  const handleEvidenceAudit = async (cid) => {
    setAuditingEvidence(true);
    setActionSuccess(null);
    try {
      const updated = await auditEvidence(cid);
      setSelectedComplaint(updated);
      const v = updated.evidence_verdict;
      setActionSuccess(
        v === 'MATCH' ? '✅ Evidence verified — image matches the complaint.' :
        v === 'MISMATCH' ? '⚠️ Mismatch detected — image may not relate to reported issue.' :
        '❓ Audit complete — verdict is uncertain.'
      );
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      alert(err.message || 'Evidence audit failed.');
    } finally {
      setAuditingEvidence(false);
    }
  };

  // Metrics
  const metrics = {
    total:      complaints.length,
    submitted:  complaints.filter((c) => c.status === 'Submitted').length,
    assigned:   complaints.filter((c) => c.status === 'Assigned').length,
    inProgress: complaints.filter((c) => c.status === 'In Progress').length,
    resolved:   complaints.filter((c) => c.status === 'Resolved').length,
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((comp) => {
    const statusMatch = statusFilter === 'All' || comp.status === statusFilter;
    const deptMatch   = deptFilter   === 'All' || comp.department === deptFilter;
    const priorityMatch = priorityFilter === 'All' || comp.priorityLevel === priorityFilter || comp.priority === priorityFilter;
    const q           = regionSearch.toLowerCase();
    const regionMatch =
      !q ||
      (comp.area         && comp.area.toLowerCase().includes(q)) ||
      (comp.id           && String(comp.id).toLowerCase().includes(q)) ||
      (comp.citizenName  && comp.citizenName.toLowerCase().includes(q)) ||
      (comp.title        && comp.title.toLowerCase().includes(q));
    return statusMatch && deptMatch && priorityMatch && regionMatch;
  });

  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    if (sortBy === 'PriorityScore') {
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    }
    const dateA = new Date(a.createdAt || a.submitted_at || 0).getTime();
    const dateB = new Date(b.createdAt || b.submitted_at || 0).getTime();
    return dateB - dateA;
  });

  const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '');

  return (
    <div className="max-w-7xl mx-auto w-full px-4 pb-12 space-y-6">
      
      {/* Admin Tab Bar */}
      <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 w-fit">
        {[
          { id: 'complaints', label: 'Grievance List', icon: FileText },
          { id: 'analytics', label: 'Predictive Analytics', icon: BarChart2 },
          { id: 'heatmap', label: 'Hotspot Heatmap', icon: MapPin }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'complaints' && (
        <>
          {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500" />
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Total Grievances</span>
          <span className="text-2xl font-black text-white font-mono block mt-1">{metrics.total}</span>
        </div>
        
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-550" />
          <span className="text-[10px] text-slate-550 font-extrabold uppercase tracking-wider block">Submitted</span>
          <span className="text-2xl font-black text-slate-300 font-mono block mt-1">{metrics.submitted}</span>
        </div>
        
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
          <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider block">Assigned Dispatch</span>
          <span className="text-2xl font-black text-white font-mono block mt-1">{metrics.assigned}</span>
        </div>
        
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider block">In Progress</span>
          <span className="text-2xl font-black text-white font-mono block mt-1">{metrics.inProgress}</span>
        </div>
        
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 text-left relative overflow-hidden col-span-2 md:col-span-1">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">Resolved Tickets</span>
          <span className="text-2xl font-black text-white font-mono block mt-1">{metrics.resolved}</span>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
          <div className="text-left">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-sky-400" />
              Administrative Dashboard
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Review, filter, and manage all filed grievances. Update status to track resolution progress.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-left">
          
          <div className="md:col-span-4 relative">
            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
              Search Region, Landmark, Name, or ID
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-slate-500" />
              <input
                type="text"
                value={regionSearch}
                onChange={(e) => setRegionSearch(e.target.value)}
                placeholder="Sector 15, Rohan, ID #3..."
                className="w-full bg-slate-905 bg-slate-900/60 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
              Department
            </label>
            <div className="relative">
              <FolderDot className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-slate-500" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-205 focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="All">All</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
              Status State
            </label>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-205 focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="All">All States</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
              Priority Filter
            </label>
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-slate-500" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-205 focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
              Sort Order
            </label>
            <div className="relative">
              <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-205 focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="Newest">Newest First</option>
                <option value="PriorityScore">Highest Priority</option>
              </select>
            </div>
          </div>
          
        </div>
      </div>

      {/* Main workspace */}
      {loadingComplaints && complaints.length === 0 ? (
        <div className="glass-panel p-20 rounded-3xl text-center border border-white/5">
          <Clock className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading complaints…</p>
        </div>
      ) : sortedComplaints.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center border border-white/5 max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center mx-auto text-slate-500">
            <FileQuestion className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">No matching grievances</h3>
            <p className="text-slate-450 text-xs mt-1.5 leading-relaxed max-w-[280px] mx-auto">
              We couldn't resolve any registered tickets matching the selected filter criteria. Try adjusting filters or resetting.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Master Panel list: Left */}
          <div className="w-full lg:w-96 shrink-0 space-y-3">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 text-left px-1">
              Active List ({sortedComplaints.length})
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[600px] overflow-y-auto pr-1 text-left">
              {sortedComplaints.map((c) => {
                const isSelected = selectedComplaint && selectedComplaint.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedComplaint(c);
                      setActionSuccess(null);
                    }}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-sky-500/40 shadow-lg shadow-sky-500/5'
                        : 'bg-slate-900/40 border-white/5 hover:border-slate-800 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1 pb-1">
                      <span className="font-mono font-bold text-sky-400 text-xs">{c.id}</span>
                      
                      <div className="flex items-center gap-1.5">
                        {c.is_escalated && (
                          <span className="bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-rose-500 uppercase tracking-wider animate-pulse">
                            Escalated
                          </span>
                        )}
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                          c.priorityLevel === 'Critical' || c.priority === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/15' :
                          c.priorityLevel === 'High' || c.priority === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/15' :
                          c.priorityLevel === 'Medium' || c.priority === 'Medium' ? 'bg-blue-500/10 text-blue-400 border-blue-500/15' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                        }`}>
                          {c.priorityLevel || c.priority || 'Medium'} ({c.priorityScore || 0})
                        </span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          c.status === 'Closed' ? 'bg-emerald-950/40 text-emerald-500 border border-emerald-500/20 font-bold' :
                          c.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                          c.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
                          c.status === 'Assigned' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/15' :
                          'bg-slate-800 text-slate-400 border border-white/5'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-350 font-bold uppercase tracking-wider mt-1">{c.department}</p>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed h-8">{c.title || c.description}</p>
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-900/60 mt-2 text-[9px] text-slate-500 font-semibold">
                      <span>{c.citizenName || 'Anonymous'}</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details & Actions Workspace Panel: Right */}
          {selectedComplaint && (
            <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              
              {/* Detail Profile Panel */}
              <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-xl border border-white/5 md:col-span-8 text-left space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Reference Ticket</span>
                    <span className="text-xl font-mono font-black text-sky-400">{selectedComplaint.id}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                        selectedComplaint.status === 'Closed' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/25' :
                        selectedComplaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        selectedComplaint.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        selectedComplaint.status === 'Assigned' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          selectedComplaint.status === 'Closed' ? 'bg-emerald-400' :
                          selectedComplaint.status === 'Resolved' ? 'bg-emerald-400' :
                          selectedComplaint.status === 'In Progress' ? 'bg-amber-400' :
                          selectedComplaint.status === 'Assigned' ? 'bg-sky-400' :
                          'bg-slate-500'
                        }`} />
                        {selectedComplaint.status}
                      </span>
                    </div>
                  </div>

                  {/* SLA Escalation alert banner */}
                  {selectedComplaint.is_escalated && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 flex items-start gap-3 mt-4 text-left">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold uppercase tracking-wide">SLA Breached - Grievance Escalated</h4>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          This complaint has breached its standard SLA response duration. A priority points boost (+20 pts) has been applied automatically, and a supervisor review warning has been generated.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Citizen Contact Details row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-6">
                    <div className="space-y-1 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block">Citizen</span>
                      <p className="font-bold flex items-center gap-1.5 text-slate-200">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {selectedComplaint.citizenName || 'Anonymous'}
                      </p>
                      {selectedComplaint.citizenPhone && (
                        <p className="flex items-center gap-1.5 text-slate-400 font-mono mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {selectedComplaint.citizenPhone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block">Filed On</span>
                      <p className="font-bold flex items-center gap-1.5 text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-slate-500 block">
                        Updated: {new Date(selectedComplaint.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-1 bg-slate-900/40 p-4 rounded-xl border border-white/5 text-xs mt-4">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Location</span>
                    <p className="text-slate-200 flex items-start gap-1.5 font-medium leading-relaxed">
                      <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      {selectedComplaint.area || 'Area not specified'}
                      {selectedComplaint.landmark && ` — near ${selectedComplaint.landmark}`}
                      {selectedComplaint.pinCode  && ` (${selectedComplaint.pinCode})`}
                    </p>
                  </div>

                  {/* Department / Category / Priority block */}
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-sky-500/10 space-y-4 mt-4 text-xs">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">Department</span>
                        <span className="text-xs font-black text-sky-400">{selectedComplaint.department || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">Category</span>
                        <span className="text-xs font-semibold text-slate-200">{selectedComplaint.category || 'General'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">AI Severity</span>
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-black rounded-lg uppercase border ${
                          selectedComplaint.ai_severity === 'Critical' ? 'bg-red-950/40 text-red-400 border-red-500/30' :
                          selectedComplaint.ai_severity === 'Major'    ? 'bg-orange-950/40 text-orange-400 border-orange-500/30' :
                          selectedComplaint.ai_severity === 'Moderate' ? 'bg-yellow-950/40 text-yellow-400 border-yellow-500/30' :
                          'bg-slate-900 text-slate-400 border-slate-700'
                        }`}>
                          {selectedComplaint.ai_severity || 'Moderate'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">AI Confidence</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                (selectedComplaint.ai_confidence ?? 0) >= 0.8 ? 'bg-emerald-400' :
                                (selectedComplaint.ai_confidence ?? 0) >= 0.5 ? 'bg-amber-400' :
                                'bg-rose-400'
                              }`}
                              style={{ width: `${Math.round((selectedComplaint.ai_confidence ?? 0) * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-black text-slate-400">
                            {selectedComplaint.ai_confidence != null 
                              ? `${Math.round(selectedComplaint.ai_confidence * 100)}%` 
                              : '0%'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedComplaint.ai_keywords && (
                      <div className="pt-3 border-t border-white/5">
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1.5">AI Keywords</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(selectedComplaint.ai_keywords) 
                            ? selectedComplaint.ai_keywords 
                            : (selectedComplaint.ai_keywords || '').split(',').map(s => s.trim()).filter(Boolean)
                          ).map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-950 border border-white/5 text-[9px] text-slate-400 rounded-md font-medium">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedComplaint.ai_reason && (
                      <div className="pt-3 border-t border-white/5">
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">AI Routing Reason</span>
                        <p className="text-[11px] text-slate-400 italic leading-relaxed">
                          "{selectedComplaint.ai_reason}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── Priority Intelligence Panel ─────────────────────── */}
                  {(() => {
                    const score  = selectedComplaint.priorityScore  ?? 0;
                    const level  = selectedComplaint.priorityLevel  || selectedComplaint.priority || 'Medium';
                    const bd     = selectedComplaint.priorityBreakdown || {};
                    const reason = selectedComplaint.priorityReason  || selectedComplaint.ai_reason || null;

                    const levelColor = {
                      Critical: { bar: 'bg-red-500',    badge: 'bg-red-500/10 text-red-400 border-red-500/25',    gauge: 'from-red-600 to-red-400'    },
                      High:     { bar: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/25', gauge: 'from-orange-600 to-orange-400' },
                      Medium:   { bar: 'bg-blue-500',   badge: 'bg-blue-500/10 text-blue-400 border-blue-500/25',  gauge: 'from-blue-600 to-blue-400'   },
                      Low:      { bar: 'bg-emerald-500',badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', gauge: 'from-emerald-600 to-emerald-400' },
                    }[level] || { bar: 'bg-slate-500', badge: 'bg-slate-800 text-slate-400 border-slate-700', gauge: 'from-slate-600 to-slate-400' };

                    const factors = [
                      { label: 'Safety Risk',       val: bd.safetyRisk    ?? 0, max: 30 },
                      { label: 'Public Impact',     val: bd.publicImpact  ?? 0, max: 20 },
                      { label: 'Essential Service', val: bd.essentialService ?? 0, max: 20 },
                      { label: 'Urgency',           val: bd.urgency       ?? 0, max: 10 },
                      { label: 'Duplicates',        val: bd.duplicates    ?? 0, max: 10 },
                      { label: 'Location',          val: bd.location      ?? 0, max: 5  },
                      { label: 'Time Pending',      val: bd.timePending   ?? 0, max: 5  },
                    ];

                    return (
                      <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-white/5 rounded-2xl p-4 mt-4 space-y-4">
                        {/* Header row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-sky-400" />
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Priority Intelligence</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${levelColor.badge}`}>{level}</span>
                            <span className="font-mono font-black text-white text-sm">{score}<span className="text-slate-600 text-[10px] font-semibold">/100</span></span>
                          </div>
                        </div>

                        {/* Score gauge bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-slate-600 font-semibold">
                            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                          </div>
                          <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${levelColor.gauge} transition-all duration-700`}
                              style={{ width: `${Math.min(score, 100)}%` }}
                            />
                            {[25,50,75].map(p => (
                              <div key={p} className="absolute top-0 bottom-0 w-px bg-slate-800" style={{ left: `${p}%` }} />
                            ))}
                          </div>
                        </div>

                        {/* Breakdown factors */}
                        <div className="space-y-2 pt-1">
                          {factors.map((f) => (
                            <div key={f.label} className="flex items-center gap-3">
                              <span className="text-[9px] text-slate-500 font-semibold w-32 shrink-0 truncate">{f.label}</span>
                              <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${levelColor.bar}`}
                                  style={{ width: f.max > 0 ? `${Math.min((f.val / f.max) * 100, 100)}%` : '0%' }}
                                />
                              </div>
                              <span className="font-mono text-[9px] text-slate-400 w-10 text-right shrink-0">{f.val}/{f.max}</span>
                            </div>
                          ))}
                        </div>

                        {/* Reason */}
                        {reason && (
                          <div className="pt-3 border-t border-white/5 flex items-start gap-2">
                            <Zap className="w-3 h-3 text-yellow-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-slate-400 leading-relaxed italic">{reason}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Description */}
                  <div className="space-y-2 text-xs mt-4">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="font-extrabold uppercase text-[9px] tracking-wider">Citizen description</span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-slate-350 leading-relaxed max-h-32 overflow-y-auto">
                      {selectedComplaint.description}
                    </div>
                  </div>

                  {/* Closed Feedback Display */}
                  {selectedComplaint.status === 'Closed' && selectedComplaint.rating && (
                    <div className="bg-slate-950 border border-emerald-500/10 rounded-xl p-4 text-xs space-y-2 mt-4 text-left">
                      <span className="text-[9px] text-emerald-450 font-bold uppercase tracking-wider block border-b border-emerald-500/10 pb-1">
                        Citizen Feedback & Satisfaction Review
                      </span>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-slate-400">Rating:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= selectedComplaint.rating
                                  ? 'text-amber-450 fill-amber-450'
                                  : 'text-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {selectedComplaint.feedback && (
                        <p className="text-slate-300 italic mt-1 leading-relaxed">
                          "{selectedComplaint.feedback}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Evidence image (data-URL stored on submission) */}
                {selectedComplaint.imagePreview && (
                  <div className="space-y-2 text-xs pt-4 border-t border-slate-900/60 mt-4">
                    <span className="font-extrabold uppercase text-[9px] text-slate-500 tracking-wider block">Uploaded Evidence</span>
                    <div className="relative border border-slate-900 bg-slate-950 p-2 rounded-xl overflow-hidden group max-w-md">
                      <img
                        src={selectedComplaint.imagePreview}
                        alt="Evidence"
                        className="max-h-40 w-full object-contain rounded-lg bg-slate-900 border border-white/5 transition-transform duration-300 group-hover:scale-[1.01]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Operations Controller Panel: Right */}
              <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 md:col-span-4 text-left space-y-6 flex flex-col justify-between h-auto">
                <div className="space-y-6 w-full">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                      Work Dispatch Controller
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      Update execution steps manually, route categories, or trigger automated classification audits.
                    </p>
                  </div>

                  {actionSuccess && (
                    <div className="p-3 rounded-xl border border-emerald-500/15 bg-emerald-555/5 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      {actionSuccess}
                    </div>
                  )}

                  {/* Status Dropdown Controller */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                      Modify Progress status
                    </label>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {STATUS_OPTIONS.map((opt) => {
                        const isCurrent =selectedComplaint.status === opt;
                        return (
                          <button
                            key={opt}
                            disabled={updatingStatus}
                            onClick={() => handleStatusChange(selectedComplaint.id, opt)}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left cursor-pointer transition-all border flex items-center justify-between ${
                              isCurrent
                                ? 'bg-sky-655 bg-sky-600/15 text-sky-400 border-sky-500/35 shadow shadow-sky-500/5'
                                : 'bg-slate-900/40 text-slate-400 border-white/5 hover:border-slate-800 hover:text-white'
                            }`}
                          >
                            <span>{opt}</span>
                            {isCurrent && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Run AI routing again */}
                  <div className="pt-6 border-t border-white/10 space-y-3.5">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        AI Automation Operations
                      </h4>
                      <p className="text-[10px] text-slate-650 leading-relaxed">
                        Refreshes routing departments and categories according to local models prompts analysis.
                      </p>
                    </div>

                    <button
                      disabled={reclassifying}
                      onClick={() => handleAIReclassify(selectedComplaint.id)}
                      className="w-full py-3 bg-slate-900 border border-slate-805 hover:bg-slate-800 shadow-md text-sky-400 hover:text-sky-305 disabled:opacity-50 text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${reclassifying ? 'animate-spin' : ''}`} />
                      {reclassifying ? 'Reclassifying...' : 'Re-run AI Routing'}
                    </button>

                    {/* Evidence Audit Button */}
                    {(selectedComplaint.imagePreview || selectedComplaint.image_url) && (
                      <button
                        id={`admin-audit-evidence-btn-${selectedComplaint.id}`}
                        disabled={auditingEvidence}
                        onClick={() => handleEvidenceAudit(selectedComplaint.id)}
                        className="w-full py-3 bg-purple-900/30 border border-purple-500/20 hover:bg-purple-900/50 hover:border-purple-500/40 shadow-md text-purple-400 hover:text-purple-300 disabled:opacity-50 text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {auditingEvidence ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing Image...</>
                        ) : (
                          <><ScanSearch className="w-3.5 h-3.5" />
                          {selectedComplaint.evidence_verdict ? 'Re-audit Evidence' : 'Audit Evidence Image'}</>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-[9px] text-slate-600 uppercase font-black text-center pt-6 border-t border-slate-900 mt-6 select-none leading-relaxed">
                  System Dispatch verify ok<br />
                  <span className="text-[8px] text-slate-500 font-medium">Terminal synchronization stable</span>
                </div>
              </div>

            </div>
          )}

        </div>
      )}
        </>
      )}

      {activeTab === 'analytics' && <AnalyticsDashboard />}

      {activeTab === 'heatmap' && <Heatmap />}

    </div>
  );
}

export default AdminPanel;
