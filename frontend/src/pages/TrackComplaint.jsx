import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  MapPin, 
  User, 
  Phone, 
  Calendar, 
  Activity, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  ThumbsUp, 
  AlertCircle,
  FileText
} from 'lucide-react';

const STATUS_STEPS = [
  { label: 'Submitted', desc: 'Grievance received and registered.', icon: CheckCircle2 },
  { label: 'Assigned', desc: 'Assigned to the appropriate department.', icon: Clock },
  { label: 'In Progress', desc: 'Crews dispatched to resolve the issue.', icon: Wrench },
  { label: 'Resolved', desc: 'Issue resolved and verified.', icon: ThumbsUp }
];

function TrackComplaint() {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');

  const [searchQuery, setSearchQuery] = useState(idParam || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const performSearch = async (query) => {
    if (!query.trim()) {
      setErrorMsg("Please enter a Complaint Reference ID or Phone number.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setComplaints([]);
    setSelectedComplaint(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await axios.get(`${apiUrl}/complaints/track/${query}`);
      
      if (response.data && response.data.length > 0) {
        setComplaints(response.data);
        setSelectedComplaint(response.data[0]);
      } else {
        setErrorMsg("No matching grievances found.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "No grievances found matching query.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idParam) {
      performSearch(idParam);
    }
  }, [idParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  // Find active step index based on status field
  const getActiveStepIndex = (status) => {
    const statuses = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];
    const idx = statuses.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  const activeStepIdx = selectedComplaint ? getActiveStepIndex(selectedComplaint.status) : 0;
  const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '');

  return (
    <div className="max-w-5xl mx-auto w-full px-4 pb-12 space-y-6">
      
      {/* Search Module Glass Panel */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-xl relative border border-white/5">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-600" />
        
        <div className="mb-6 text-left">
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-sky-400" />
            Track Grievance progress
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Lookup filed tickets instantly with your Complaint Reference ID (e.g. #2) or registered Citizen Phone.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 z-10 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Complaint ID (e.g. 3) or Phone Number (e.g. 9876543210)"
              className="w-full bg-slate-900/60 border border-slate-800 focus:border-sky-500 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-sky-600 to-indigo-650 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all shadow-md shadow-sky-600/10 cursor-pointer"
          >
            {loading ? 'Searching...' : 'Search Ticket'}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl border border-rose-500/15 bg-rose-500/5 text-rose-400 text-xs font-semibold flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}
      </div>

      {selectedComplaint && (
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Master view: Left list when querying phone numbers */}
          {complaints.length > 1 && (
            <div className="w-full lg:w-80 shrink-0 space-y-3">
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 text-left px-1">
                Resolved Matches ({complaints.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {complaints.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedComplaint(c)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      selectedComplaint.id === c.id
                        ? 'bg-slate-900 border-sky-500/40 shadow-md shadow-sky-500/5'
                        : 'bg-slate-900/40 border-white/5 hover:border-slate-800 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1 pb-1">
                      <span className="font-mono font-bold text-sky-400 text-sm">#{c.id}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        c.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                        c.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
                        c.status === 'Assigned' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/15' :
                        'bg-slate-805 text-slate-400 border border-white/5'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.department}</p>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed h-8">{c.description}</p>
                    <span className="text-[9px] text-slate-600 font-bold block pt-3 border-t border-slate-900 mt-2">
                      Filed: {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Detailed view: Grievance Tracking Workspace */}
          <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Timeline Column */}
            <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-lg border border-white/5 md:col-span-5 text-left h-full">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-6 border-b border-white/5 pb-2">
                Resolution timeline
              </h3>

              {/* Progress timeline SVG + Nodes layout */}
              <div className="relative pl-1.5 space-y-6 before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-900">
                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= activeStepIdx;
                  const isActive = idx === activeStepIdx;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.label} className="flex gap-4 items-start relative pl-1.5">
                      {/* Connection point circles */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border z-10 transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-550/20' 
                          : 'bg-slate-950 border-slate-900 text-slate-600'
                      } ${isActive ? 'animate-pulse ring-4 ring-sky-550/20' : ''}`}>
                        <StepIcon className="w-4.5 h-4.5" />
                      </div>
                      
                      {/* Description side */}
                      <div className="flex-grow pt-1.5 select-none">
                        <h4 className={`text-xs md:text-sm font-bold uppercase transition-colors ${
                          isCompleted ? (isActive ? 'text-sky-400' : 'text-white') : 'text-slate-600'
                        }`}>
                          {step.label}
                        </h4>
                        <p className={`text-[11px] md:text-xs mt-0.5 transition-colors ${
                          isCompleted ? 'text-slate-400' : 'text-slate-700'
                        }`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ticket details right-hand profile column */}
            <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-lg border border-white/5 md:col-span-7 text-left space-y-6 h-full">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Reference Ticket</span>
                  <span className="text-xl font-mono font-black text-sky-400">#{selectedComplaint.id}</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase border ${
                  selectedComplaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  selectedComplaint.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  selectedComplaint.status === 'Assigned' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    selectedComplaint.status === 'Resolved' ? 'bg-emerald-400' :
                    selectedComplaint.status === 'In Progress' ? 'bg-amber-400' :
                    selectedComplaint.status === 'Assigned' ? 'bg-sky-400' :
                    'bg-slate-500'
                  }`} />
                  {selectedComplaint.status}
                </span>
              </div>

              {/* Data Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                  <p className="text-xs text-slate-500 block">
                    Last sync: {new Date(selectedComplaint.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Physical Location */}
              <div className="space-y-1 bg-slate-900/40 p-4 rounded-xl border border-white/5 text-xs text-left">
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
              <div className="bg-slate-900/60 p-4.5 rounded-2xl border border-sky-500/10 space-y-3">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Activity className="w-4 h-4 text-sky-400" />
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
                    <span className="text-[11px] font-bold text-slate-200">{selectedComplaint.category || 'Environmental'}</span>
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
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[9px] text-slate-650 font-bold uppercase block mb-1">AI Generated Summary</span>
                    <p className="text-xs text-slate-400 italic">"{selectedComplaint.ai_summary}"</p>
                  </div>
                )}
              </div>

              {/* User Description Text block */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="font-extrabold uppercase text-[9px] tracking-wider">Citizen description</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
                  {selectedComplaint.description}
                </div>
              </div>

              {/* Uploaded Evidence Image */}
              {selectedComplaint.image_url && (
                <div className="space-y-2 text-xs">
                  <span className="font-extrabold uppercase text-[9px] text-slate-500 tracking-wider block">Uploaded Evidence Image</span>
                  <div className="relative border border-slate-900 bg-slate-950 p-2 rounded-xl group overflow-hidden">
                    <img 
                      src={`${backendUrl}/${selectedComplaint.image_url}`} 
                      alt="Complaint Evidence File" 
                      className="max-h-60 w-full object-contain rounded-lg bg-slate-900 border border-white/5 transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
      
      {/* Empty State visual */}
      {!selectedComplaint && !loading && (
        <div className="glass-panel p-12 rounded-3xl text-center border border-white/5 relative shadow-xl space-y-4 max-w-sm mx-auto">
          <div className="w-12 h-12 bg-slate-900 text-slate-500 border border-white/5 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">No active tracking session</h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-[250px] mx-auto">
              Please query a Complaint Reference ID or Phone number above to search active tickets.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default TrackComplaint;
