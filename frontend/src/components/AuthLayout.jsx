import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 animate-fade-in">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex p-3.5 bg-gradient-to-tr from-sky-500 to-indigo-650 rounded-2xl shadow-xl shadow-sky-500/10 mb-4 hover:scale-105 transition-transform duration-200">
          <ShieldCheck className="w-8 h-8 text-white animate-pulse" />
        </div>
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-205 to-slate-400 leading-tight">
          Grievance Portal
        </h1>
        <p className="text-[10px] text-sky-400 font-extrabold tracking-widest uppercase mt-1">
          Ministry of Public Administration & Grievances
        </p>
      </div>

      {/* Main Glassmorphism Form container */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl relative border border-white/5 bg-slate-900/40 backdrop-blur-xl">
        {/* Accent Top Bar */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-650 rounded-t-3xl" />
        
        {title && (
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1 pb-4 border-b border-white/5">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {children}
      </div>

      {/* Trust Badging Footer */}
      <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Secure Aadhaar & Admin Session Encrypted</span>
      </div>
    </div>
  );
};

export default AuthLayout;
