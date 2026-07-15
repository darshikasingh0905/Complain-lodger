import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';

const STATUS_OPTIONS = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];
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

  // Filters
  const [statusFilter, setStatusFilter]   = useState('All');
  const [deptFilter,   setDeptFilter]     = useState('All');
  const [regionSearch, setRegionSearch]   = useState('');

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
    const q           = regionSearch.toLowerCase();
    const regionMatch =
      !q ||
      (comp.area         && comp.area.toLowerCase().includes(q)) ||
      (comp.id           && comp.id.toLowerCase().includes(q)) ||
      (comp.citizenName  && comp.citizenName.toLowerCase().includes(q)) ||
      (comp.title        && comp.title.toLowerCase().includes(q));
    return statusMatch && deptMatch && regionMatch;
  });

  const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '');

  return (
    <div className="max-w-7xl mx-auto w-full px-4 pb-12 space-y-6">
      
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
          
          <div className="md:col-span-5 relative">
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

          <div className="md:col-span-3">
            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
              Classification Department
            </label>
            <div className="relative">
              <FolderDot className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-slate-500" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-205 focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-4">
            <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">
              Lifecycle Progress state
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
          
        </div>
      </div>

      {/* Main workspace */}
      {loadingComplaints && complaints.length === 0 ? (
        <div className="glass-panel p-20 rounded-3xl text-center border border-white/5">
          <Clock className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading complaints…</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
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
              Active List ({filteredComplaints.length})
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[600px] overflow-y-auto pr-1 text-left">
              {filteredComplaints.map((c) => {
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
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          c.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15' :
                          c.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                        }`}>
                          {c.priority}
                        </span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
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
                        selectedComplaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        selectedComplaint.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        selectedComplaint.status === 'Assigned' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          selectedComplaint.status === 'Resolved' ? 'bg-emerald-400' :
                          selectedComplaint.status === 'In Progress' ? 'bg-amber-400' :
                          selectedComplaint.status === 'Assigned' ? 'bg-sky-400' :
                          'bg-slate-500'
                        }`} />
                        {selectedComplaint.status}
                      </span>
                    </div>
                  </div>

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
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-sky-500/10 space-y-3 mt-4">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Department</span>
                        <span className="text-[11px] font-extrabold text-sky-400">{selectedComplaint.department}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Status</span>
                        <span className="text-[11px] font-bold text-slate-200">{selectedComplaint.status}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Priority</span>
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                          selectedComplaint.priority === 'High'   ? 'bg-rose-500/10 text-rose-400' :
                          selectedComplaint.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {selectedComplaint.priority}
                        </span>
                      </div>
                    </div>
                  </div>

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

    </div>
  );
}

export default AdminPanel;
