import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [regionSearch, setRegionSearch] = useState('');

  // Action Loading States
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reclassifying, setReclassifying] = useState(false);
  const [auditingEvidence, setAuditingEvidence] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Fetch all complaints on load
  const fetchComplaints = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await axios.get(`${apiUrl}/complaints/`);
      setComplaints(response.data);
      
      // Auto-select first complaint if none is selected
      if (response.data && response.data.length > 0) {
        // If there's an existing selectedComplaint, try keeping it selected
        setSelectedComplaint((prev) => {
          if (prev) {
            const updatedPrev = response.data.find(c => c.id === prev.id);
            return updatedPrev || response.data[0];
          }
          return response.data[0];
        });
      } else {
        setSelectedComplaint(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to retrieve grievances from the server database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Update Status Action
  const handleStatusChange = async (cid, newStatus) => {
    setUpdatingStatus(true);
    setActionSuccess(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await axios.patch(`${apiUrl}/complaints/${cid}/status`, { status: newStatus });
      
      // Replace target in local lists
      setComplaints(prev => prev.map(c => c.id === cid ? response.data : c));
      setSelectedComplaint(response.data);
      setActionSuccess("Ticket status updated successfully!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to update complaint status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Re-run AI Classification
  const handleAIReclassify = async (cid) => {
    setReclassifying(true);
    setActionSuccess(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await axios.post(`${apiUrl}/complaints/${cid}/classify`);
      
      // Update local lists
      setComplaints(prev => prev.map(c => c.id === cid ? response.data : c));
      setSelectedComplaint(response.data);
      setActionSuccess("AI route optimization refreshed!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "AI Reclassification pipeline failed.");
    } finally {
      setReclassifying(false);
    }
  };

  // Evidence Audit Action
  const handleEvidenceAudit = async (cid) => {
    setAuditingEvidence(true);
    setActionSuccess(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await axios.post(`${apiUrl}/complaints/${cid}/analyze-evidence`);
      setComplaints(prev => prev.map(c => c.id === cid ? response.data : c));
      setSelectedComplaint(response.data);
      const v = response.data.evidence_verdict;
      setActionSuccess(
        v === 'MATCH' ? '✅ Evidence verified — image matches the complaint.' :
        v === 'MISMATCH' ? '⚠️ Mismatch detected — image may not relate to reported issue.' :
        '❓ Audit complete — verdict is uncertain.'
      );
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Evidence audit failed. Vision model may be unavailable.');
    } finally {
      setAuditingEvidence(false);
    }
  };

  // Metrics Count
  const metrics = {
    total: complaints.length,
    submitted: complaints.filter(c => c.status === 'Submitted').length,
    assigned: complaints.filter(c => c.status === 'Assigned').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
  };

  // Filter complaints list
  const filteredComplaints = complaints.filter((comp) => {
    const statusMatch = statusFilter === 'All' || comp.status === statusFilter;
    const deptMatch = deptFilter === 'All' || comp.department === deptFilter;
    
    const searchVal = regionSearch.toLowerCase();
    const regionMatch = 
      !regionSearch ||
      (comp.address && comp.address.toLowerCase().includes(searchVal)) ||
      (comp.id && comp.id.toString() === searchVal) ||
      (comp.citizen_name && comp.citizen_name.toLowerCase().includes(searchVal));

    return statusMatch && deptMatch && regionMatch;
  });

  const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '');

  return (
    <div className="max-w-7xl mx-auto w-full px-4 pb-12 space-y-6">
      
      {/* Metrics Summary Columns */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 ml-0">
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
            <p className="text-slate-450 text-xs mt-0.5">
              Review filed public grievances, check AI-routing outputs, verify coordinates, and dispatch work crew states.
            </p>
          </div>
          <button 
            onClick={fetchComplaints}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-805 hover:bg-slate-800 disabled:opacity-50 text-slate-350 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
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

      {/* Main Workspace split panel */}
      {loading && complaints.length === 0 ? (
        <div className="glass-panel p-20 rounded-3xl text-center border border-white/5 relative">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Querying ticket database records...</p>
        </div>
      ) : errorMsg ? (
        <div className="glass-panel p-12 rounded-3xl text-center border border-rose-500/10 bg-rose-500/5 text-rose-400 flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm font-semibold">{errorMsg}</p>
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
                      <span className="font-mono font-bold text-sky-400 text-xs">#{c.id}</span>
                      
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
                    <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed h-8">{c.description}</p>
                    
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-900/60 mt-2 text-[9px] text-slate-500 font-semibold">
                      <span>{c.citizen_name || 'Anonymous'}</span>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
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
                      <span className="text-xl font-mono font-black text-sky-400">#{selectedComplaint.id}</span>
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
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block">Citizen Contacts</span>
                      <p className="text-slate-105 font-bold flex items-center gap-1.5 text-slate-200">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {selectedComplaint.citizen_name || 'Anonymous Submission'}
                      </p>
                      {selectedComplaint.citizen_phone && (
                        <p className="text-slate-450 flex items-center gap-1.5 text-slate-400 font-mono mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {selectedComplaint.citizen_phone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block">Grievance Date</span>
                      <p className="text-slate-105 font-bold flex items-center gap-1.5 text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(selectedComplaint.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-slate-550 block">
                        Last sync: {new Date(selectedComplaint.updated_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Inspected Landmark Area */}
                  <div className="space-y-1 bg-slate-900/40 p-4 rounded-xl border border-white/5 text-xs mt-4">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Inspected Area</span>
                    <p className="text-slate-200 flex items-start gap-1.5 font-medium leading-relaxed">
                      <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      {selectedComplaint.address || 'Address not listed (Geo coordinates supplied)'}
                    </p>
                    {(selectedComplaint.latitude || selectedComplaint.longitude) && (
                      <p className="text-[10px] text-slate-500 font-mono pl-5 mt-1">
                        GPS: {selectedComplaint.latitude || '0.00'}, {selectedComplaint.longitude || '0.00'}
                      </p>
                    )}
                  </div>

                  {/* AI Details Card block */}
                  <div className="bg-slate-900/60 p-4.5 rounded-2xl border border-sky-500/10 space-y-3 mt-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <Activity className="w-4 h-4 text-sky-450 text-sky-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-350">
                        Auto-routing & AI parameter checks
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Department</span>
                        <span className="text-[11px] font-extrabold text-sky-400">{selectedComplaint.department}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Category</span>
                        <span className="text-[11px] font-bold text-slate-200">{selectedComplaint.category || 'Infrastructure'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">AI Priority</span>
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                          selectedComplaint.priority === 'High' ? 'bg-rose-500/10 text-rose-400' :
                          selectedComplaint.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {selectedComplaint.priority}
                        </span>
                      </div>
                    </div>

                    {selectedComplaint.ai_summary && (
                      <div className="pt-2.5 border-t border-white/5">
                        <span className="text-[9px] text-slate-650 font-bold uppercase block mb-1">AI Generated Summary</span>
                        <p className="text-xs text-slate-400 leading-relaxed italic">"{selectedComplaint.ai_summary}"</p>
                      </div>
                    )}
                  </div>

                  {/* User Description Text block */}
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

                {/* Evidence Image + Audit Result */}
                {selectedComplaint.image_url && (
                  <div className="space-y-2 text-xs pt-4 border-t border-slate-900/60 mt-4">
                    <span className="font-extrabold uppercase text-[9px] text-slate-500 tracking-wider block">Uploaded Evidence Image</span>
                    <div className="relative border border-slate-909 bg-slate-950 p-2 rounded-xl group overflow-hidden max-w-md">
                      <img 
                        src={`${backendUrl}/${selectedComplaint.image_url}`} 
                        alt="Complaint Evidence File" 
                        className="max-h-40 w-full object-contain rounded-lg bg-slate-900 border border-white/5 transition-transform duration-300 group-hover:scale-[1.01]"
                      />
                    </div>

                    {/* Evidence Verdict Badge */}
                    {selectedComplaint.evidence_verdict && (
                      <div className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs ${
                        selectedComplaint.evidence_verdict === 'MATCH'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                          : selectedComplaint.evidence_verdict === 'MISMATCH'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                      }`}>
                        {selectedComplaint.evidence_verdict === 'MATCH' ? <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" /> :
                         selectedComplaint.evidence_verdict === 'MISMATCH' ? <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" /> :
                         <ShieldQuestion className="w-4 h-4 shrink-0 mt-0.5" />}
                        <div>
                          <p className="font-bold text-[10px] uppercase tracking-wider">
                            Evidence {selectedComplaint.evidence_verdict}
                            {selectedComplaint.evidence_confidence != null && (
                              <span className="ml-2 font-normal normal-case opacity-70">
                                ({Math.round(selectedComplaint.evidence_confidence * 100)}% confidence)
                              </span>
                            )}
                          </p>
                          {selectedComplaint.evidence_reason && (
                            <p className="mt-0.5 opacity-80 leading-relaxed">{selectedComplaint.evidence_reason}</p>
                          )}
                        </div>
                      </div>
                    )}
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
                    {selectedComplaint.image_url && (
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
