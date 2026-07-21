import React from "react";
import { ShieldCheck } from "lucide-react";

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 animate-fade-in">
      {/* Brand header */}
      <div className="text-center mb-8">
        <div className="inline-flex p-3.5 bg-primary rounded-2xl shadow-lift mb-4">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-text leading-tight">
          Samadhan <span className="text-primary font-extrabold">समाधान</span>
        </h1>
        <p className="text-[10px] text-primary font-bold tracking-widest uppercase mt-1">
          Ministry of Public Administration &amp; Grievances
        </p>
      </div>

      {/* Form card */}
      <div className="card sm:p-8">
        {title && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-text tracking-tight">
              {title}
            </h2>
            {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>

      {/* Trust footer */}
      <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-muted font-semibold uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <span>Secure Aadhaar &amp; Admin Session Encrypted</span>
      </div>
    </div>
  );
};

export default AuthLayout;
