import React, { useState, useMemo } from 'react';
import {
  Search,
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
  ClipboardList,
  PlusCircle
} from 'lucide-react';
import { useComplaints } from '../context/ComplaintContext';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const STATUS_STEPS = [
  { label: 'Submitted',   desc: 'Grievance received and registered.',         icon: CheckCircle2 },
  { label: 'Assigned',    desc: 'Assigned to the appropriate department.',     icon: Clock },
  { label: 'In Progress', desc: 'Crews dispatched to resolve the issue.',      icon: Wrench },
  { label: 'Resolved',    desc: 'Issue resolved and verified.',                icon: ThumbsUp },
];

const STATUS_LIST = STATUS_STEPS.map((s) => s.label);

const statusStyle = (status) => {
  if (status === 'Resolved')    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (status === 'In Progress') return 'bg-amber-500/10  text-amber-400  border-amber-500/20';
  if (status === 'Assigned')    return 'bg-sky-500/10    text-sky-400    border-sky-500/20';
  return 'bg-slate-800 text-slate-400 border-slate-700';
};

const dotStyle = (status) => {
  if (status === 'Resolved')    return 'bg-emerald-400';
  if (status === 'In Progress') return 'bg-amber-400';
  if (status === 'Assigned')    return 'bg-sky-400';
  return 'bg-slate-500';
};

function TrackComplaint() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { complaints, loadingComplaints } = useComplaints();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // All complaints belonging to this citizen
  const myCitizenId = userData?.aadhaar || '';
  const myComplaints = useMemo(
    () => complaints.filter((c) => c.citizenId === myCitizenId),
    [complaints, myCitizenId]
  );

  // Filter by search text (ID or area)
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return myComplaints;
    return myComplaints.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        (c.area && c.area.toLowerCase().includes(q)) ||
        (c.title && c.title.toLowerCase().includes(q))
    );
  }, [myComplaints, searchQuery]);

  // Timeline step
  const activeStepIdx = (status) => {
    const idx = STATUS_LIST.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  // When citizen clicks a card from list, show details
  const current = selectedComplaint
    ? complaints.find((c) => c.id === selectedComplaint.id) || selectedComplaint
    : null;

  const activeIdx = current ? activeStepIdx(current.status) : 0;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 pb-12 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-xl relative border border-white/5">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-600" />

        <div className="mb-5 text-left">
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-sky-400" />
            Track My Grievances
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            All your submitted complaints are listed below. Click a complaint to see the full timeline.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 text-slate-500 z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Complaint ID, title, or area…"
            className="w-full bg-slate-900/60 border border-slate-800 focus:border-sky-500 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loadingComplaints && (
        <div className="glass-panel p-16 rounded-3xl text-center border border-white/5">
          <Clock className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading your complaints…</p>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {!loadingComplaints && myComplaints.length === 0 && (
        <div className="glass-panel p-12 rounded-3xl text-center border border-white/5 space-y-4 max-w-sm mx-auto">
          <div className="w-12 h-12 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center mx-auto text-slate-500">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">No complaints yet</h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-[250px] mx-auto">
              You have not submitted any grievances. Lodge a complaint to get started.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Lodge a Complaint
          </button>
        </div>
      )}

      {/* ── No search results ──────────────────────────────────────────── */}
      {!loadingComplaints && myComplaints.length > 0 && filtered.length === 0 && (
        <div className="glass-panel p-10 rounded-3xl text-center border border-white/5 max-w-sm mx-auto">
          <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-xs">No complaints match your search.</p>
        </div>
      )}

      {/* ── Complaint List + Detail ────────────────────────────────────── */}
      {!loadingComplaints && filtered.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left: complaint card list */}
          <div className="w-full lg:w-80 shrink-0 space-y-3">
            <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-1">
              Your Complaints ({filtered.length})
            </h3>
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map((c) => {
                const isSelected = current?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedComplaint(c)}
                    className={`w-full p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 border-sky-500/40 shadow-md shadow-sky-500/5'
                        : 'bg-slate-900/40 border-white/5 hover:border-slate-800 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono font-bold text-sky-400 text-xs shrink-0">{c.id}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${statusStyle(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-semibold line-clamp-1">{c.title}</p>
                    <p className="text-[10px] text-slate-500">{c.area}</p>
                    <span className="text-[9px] text-slate-600 font-bold border-t border-slate-900 pt-2 mt-1 block">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: detail view */}
          {current ? (
            <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

              {/* Timeline */}
              <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-lg border border-white/5 md:col-span-5 text-left h-full">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-6 border-b border-white/5 pb-2">
                  Resolution Timeline
                </h3>
                <div className="relative pl-1.5 space-y-6 before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-900">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= activeIdx;
                    const isActive    = idx === activeIdx;
                    const StepIcon    = step.icon;
                    return (
                      <div key={step.label} className="flex gap-4 items-start relative pl-1.5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border z-10 transition-all duration-300 ${
                          isCompleted
                            ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20'
                            : 'bg-slate-950 border-slate-900 text-slate-600'
                        } ${isActive ? 'animate-pulse ring-4 ring-sky-500/20' : ''}`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-grow pt-1.5 select-none">
                          <h4 className={`text-xs md:text-sm font-bold uppercase transition-colors ${
                            isCompleted ? (isActive ? 'text-sky-400' : 'text-white') : 'text-slate-600'
                          }`}>
                            {step.label}
                          </h4>
                          <p className={`text-[11px] md:text-xs mt-0.5 ${isCompleted ? 'text-slate-400' : 'text-slate-700'}`}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detail panel */}
              <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-lg border border-white/5 md:col-span-7 text-left space-y-5 h-full">

                {/* Header row */}
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Reference Ticket</span>
                    <span className="text-xl font-mono font-black text-sky-400">{current.id}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase border ${statusStyle(current.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotStyle(current.status)}`} />
                    {current.status}
                  </span>
                </div>

                {/* Complaint title */}
                <div className="bg-slate-900/40 px-4 py-3 rounded-xl border border-white/5 text-xs">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block mb-1">Complaint Title</span>
                  <p className="text-slate-200 font-semibold">{current.title}</p>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block">Citizen</span>
                    <p className="text-slate-200 font-bold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {current.citizenName || 'Anonymous'}
                    </p>
                    {current.citizenPhone && (
                      <p className="text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {current.citizenPhone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block">Filed On</span>
                    <p className="text-slate-200 font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(current.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      Updated: {new Date(current.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* AI Classification Summary */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-sky-500/10 space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Assigned Department</span>
                      <span className="text-[11px] font-black text-sky-400">{current.department || 'Other'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Category</span>
                      <span className="text-[11px] font-bold text-slate-200">{current.category || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">Assessed Priority</span>
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                        current.priority === 'High'   ? 'bg-rose-500/10 text-rose-400' :
                        current.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {current.priority || 'Medium'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase mb-0.5">AI Severity</span>
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                        current.ai_severity === 'Critical' ? 'bg-rose-950/40 text-rose-400 border border-rose-500/10' :
                        current.ai_severity === 'Major'    ? 'bg-orange-950/40 text-orange-400 border border-orange-500/10' :
                        'bg-slate-900 text-slate-400'
                      }`}>
                        {current.ai_severity || 'Moderate'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-bold uppercase">AI Routing Confidence</span>
                      <span className="font-mono text-slate-350 font-black">
                        {current.ai_confidence != null 
                          ? `${Math.round(current.ai_confidence * 100)}%` 
                          : '0%'}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          (current.ai_confidence ?? 0) >= 0.8 ? 'bg-emerald-400' :
                          (current.ai_confidence ?? 0) >= 0.5 ? 'bg-amber-400' :
                          'bg-rose-400'
                        }`}
                        style={{ width: `${Math.round((current.ai_confidence ?? 0) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {current.ai_keywords && (
                    <div className="pt-2 border-t border-white/5">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(current.ai_keywords) 
                          ? current.ai_keywords 
                          : (current.ai_keywords || '').split(',').map(s => s.trim()).filter(Boolean)
                        ).map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-950 text-[9px] text-slate-400 rounded-md font-medium border border-white/5">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {current.ai_reason && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] text-slate-500 italic">
                        Classification audit log: "{current.ai_reason}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Area */}
                <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 text-xs">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Location</span>
                  <p className="text-slate-200 flex items-start gap-1.5 font-medium leading-relaxed mt-1">
                    <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    {current.area}
                    {current.landmark && ` — near ${current.landmark}`}
                    {current.pinCode  && ` (${current.pinCode})`}
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="font-extrabold uppercase text-[9px] tracking-wider">Description</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
                    {current.description}
                  </div>
                </div>

                {/* Evidence image (data-URL stored on submission) */}
                {current.imagePreview && (
                  <div className="space-y-2 text-xs">
                    <span className="font-extrabold uppercase text-[9px] text-slate-500 tracking-wider block">
                      Uploaded Evidence
                    </span>
                    <div className="relative border border-slate-900 bg-slate-950 p-2 rounded-xl overflow-hidden group">
                      <img
                        src={current.imagePreview}
                        alt="Evidence"
                        className="max-h-52 w-full object-contain rounded-lg bg-slate-900 border border-white/5 transition-transform duration-300 group-hover:scale-[1.01]"
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            /* Prompt to select from list */
            <div className="flex-grow glass-panel p-12 rounded-3xl text-center border border-white/5 flex items-center justify-center">
              <div className="space-y-2">
                <Search className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-500 text-sm">Select a complaint from the list to view details.</p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default TrackComplaint;
