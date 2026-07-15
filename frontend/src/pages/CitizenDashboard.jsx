import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, PlusCircle, Search, ShieldAlert, BadgeInfo } from 'lucide-react';
import useAuth from '../hooks/useAuth';

export const CitizenDashboard = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const maskAadhaar = (aadhaar) => {
    if (!aadhaar) return '';
    return `XXXX XXXX ${aadhaar.slice(-4)}`;
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 pb-12 space-y-6 text-left animate-fade-in">
      {/* Welcome Heading Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-xl border border-white/5 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-sky-500 to-indigo-650" />
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Welcome Back, {userData?.name || 'Citizen'}!</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Access secure citizen portals to file, track, or audit grievances.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900/80 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 rounded-xl text-xs font-bold uppercase transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Citizen Profile Details info */}
        <div className="glass-panel p-6 rounded-3xl shadow-lg border border-white/5 bg-slate-900/20 space-y-4 md:col-span-1">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">
            Verified Profile Card
          </h3>
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/15">
                <User className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">ID Name</span>
                <span className="font-bold text-slate-200 text-sm">{userData?.name}</span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-2">
              <div>
                <span className="text-[9px] text-slate-550 font-bold block uppercase">UIDAI Aadhaar Number</span>
                <span className="font-mono font-semibold text-slate-350">{maskAadhaar(userData?.aadhaar)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[9px] text-slate-550 font-bold block uppercase">Registered Mobile</span>
                <span className="font-mono font-semibold text-slate-350">+91 {userData?.mobile}</span>
              </div>
            </div>

            <div className="flex items-start gap-1.5 p-2 bg-emerald-500/5 text-emerald-450 border border-emerald-500/10 rounded-lg text-[10px] text-emerald-400 font-bold leading-normal">
              <BadgeInfo className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Aadhaar Identity successfully verified via E-KYC node.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action portals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
          {/* Card 1: Lodge Complaint UI */}
          <button
            onClick={() => navigate('/')}
            className="glass-panel p-6 rounded-3xl hover:bg-slate-900/40 text-left border border-white/5 hover:border-sky-500/30 transition-all duration-300 group flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 focus:ring-offset-slate-950 min-h-[180px]"
          >
            <div className="p-3.5 bg-sky-500/10 text-sky-400 border border-sky-500/10 rounded-2xl w-fit group-hover:scale-105 transition-transform duration-200">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">Lodge Complaint</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Submit an public issue. Upload photos or locations for real-time AI-routing.
              </p>
              <span className="mt-3.5 inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-sky-400 tracking-wider">
                <span>Open Form</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </div>
          </button>

          {/* Card 2: Track Status UI */}
          <button
            onClick={() => navigate('/track')}
            className="glass-panel p-6 rounded-3xl hover:bg-slate-900/40 text-left border border-white/5 hover:border-indigo-500/30 transition-all duration-300 group flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-950 min-h-[180px]"
          >
            <div className="p-3.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 rounded-2xl w-fit group-hover:scale-105 transition-transform duration-200">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">Track Greevance</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Inspect filed tickets. View AI classification summaries and real-time crew statuses.
              </p>
              <span className="mt-3.5 inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                <span>View Statuses</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
