import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';

export const LoginChoice = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout 
      title="Access Control System" 
      subtitle="Select your portal entry below to verify your digital identity"
    >
      <div className="space-y-4">
        {/* Option 1 – Citizen Login Card */}
        <button
          onClick={() => navigate('/login/citizen')}
          className="w-full text-left p-5 rounded-2xl border border-white/5 bg-slate-900/50 hover:bg-slate-900/80 hover:border-sky-500/30 transition-all duration-300 group flex items-start gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 focus:ring-offset-slate-950"
          aria-label="Continue to Citizen Login"
        >
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl group-hover:scale-110 transition-transform duration-200 border border-sky-500/10">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">Citizen Login</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Login using your Aadhaar-linked mobile number to submit and track grievances.
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-black uppercase text-sky-400 tracking-wider">
              <span>Continue as Citizen</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </div>
          </div>
        </button>

        {/* Option 2 – Administrator Login Card */}
        <button
          onClick={() => navigate('/login/admin')}
          className="w-full text-left p-5 rounded-2xl border border-white/5 bg-slate-900/50 hover:bg-slate-900/80 hover:border-indigo-500/30 transition-all duration-300 group flex items-start gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-950"
          aria-label="Continue to Administrator Login"
        >
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform duration-200 border border-indigo-500/10">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">Administrator Login</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Authorized personnel only. Access system configuration, ticket routing and analytics reporting.
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-black uppercase text-indigo-400 tracking-wider">
              <span>Continue as Admin</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </div>
          </div>
        </button>
      </div>
    </AuthLayout>
  );
};

export default LoginChoice;
