import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Shield, ArrowRight } from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";

const OPTIONS = [
  {
    to: "/login/citizen",
    icon: User,
    title: "Citizen Login",
    description:
      "Login using your Aadhaar-linked mobile number to submit and track grievances.",
    cta: "Continue as Citizen",
  },
  {
    to: "/login/admin",
    icon: Shield,
    title: "Administrator Login",
    description:
      "Authorized personnel only. Access ticket routing, evidence audits and analytics.",
    cta: "Continue as Admin",
  },
];

export const LoginChoice = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Welcome"
      subtitle="Select your portal below to verify your identity"
    >
      <div className="space-y-4">
        {OPTIONS.map(({ to, icon: Icon, title, description, cta }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            aria-label={cta}
            className="w-full text-left p-5 rounded-card border border-border bg-surface
              hover:border-primary/40 hover:bg-primary-light/40 hover:shadow-lift
              transition-all duration-200 group flex items-start gap-4 cursor-pointer"
          >
            <div className="icon-chip w-12 h-12 group-hover:scale-105 transition-transform duration-200">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-grow">
              <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {description}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase text-primary tracking-wider">
                <span>{cta}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </AuthLayout>
  );
};

export default LoginChoice;
