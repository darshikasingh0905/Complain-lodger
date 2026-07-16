import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  LogOut,
  PlusCircle,
  Search,
  BadgeInfo,
  BarChart2,
  ChevronRight,
  Sparkles,
  Shield,
} from "lucide-react";

import useAuth from "../../hooks/useAuth";
import { useComplaints } from "../../context/ComplaintContext";
import { useLanguage } from "../../context/LanguageContext";
import { StatusBadge, PriorityBadge, SafetyBadge } from "../../components/ui/Badge";
import { isSafetyComplaint, SAFETY_PINK } from "../../constants";
import { maskAadhaar } from "../../utils/format";

export const CitizenDashboard = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const { complaints } = useComplaints();
  const { t } = useLanguage();

  // API records link ownership by phone; offline records by Aadhaar.
  const myMobile = userData?.mobile || "";
  const myAadhaar = userData?.aadhaar || "";

  // Only ACTIVE complaints on the dashboard — resolved/closed ones live on
  // the Track page (where resolution confirmation also happens).
  const recentComplaints = useMemo(
    () =>
      complaints
        .filter(
          (c) =>
            ((myMobile && c.citizenPhone === myMobile) ||
              (myAadhaar && c.citizenId === myAadhaar)) &&
            !["Resolved", "Closed"].includes(c.status)
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3),
    [complaints, myMobile, myAadhaar]
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Welcome */}
      <section className="card flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {t("dash.welcome")} {userData?.name || "Citizen"}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("dash.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new Event("start-citizen-tour"))}
            className="btn-secondary"
            title="Replay the getting-started tour"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            {t("dash.tour")}
          </button>
          <button onClick={handleLogout} className="btn-danger">
            <LogOut className="w-4 h-4" />
            {t("dash.signout")}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <section className="card space-y-5">
          <div className="card-header mb-0">
            <h2 className="font-semibold text-text">{t("dash.profile")}</h2>
            <span className="badge-primary">{t("dash.verified")}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="icon-chip">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted">{t("dash.name")}</p>
              <p className="font-semibold text-text">{userData?.name}</p>
            </div>
          </div>

          <div className="inset-panel p-4 space-y-3">
            <div>
              <p className="text-xs text-muted">{t("dash.aadhaar")}</p>
              <p className="font-mono text-sm font-medium text-text">
                {maskAadhaar(userData?.aadhaar)}
              </p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted">{t("dash.mobile")}</p>
              <p className="font-mono text-sm font-medium text-text">
                +91 {userData?.mobile}
              </p>
            </div>
          </div>

          <div className="alert-success text-xs items-center">
            <BadgeInfo className="w-4 h-4 shrink-0" />
            {t("dash.ekyc")}
          </div>
        </section>

        {/* Quick actions */}
        <section className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
          <button
            onClick={() => navigate("/")}
            data-tour="lodge-card"
            className="card card-hover text-left group flex flex-col justify-between min-h-[170px]"
          >
            <div className="icon-chip w-12 h-12">
              <PlusCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="mt-6 font-semibold text-text group-hover:text-primary transition-colors">
                {t("dash.lodgeCard")}
              </h3>
              <p className="text-sm text-muted mt-2">{t("dash.lodgeCardDesc")}</p>
              <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-primary">
                {t("dash.openForm")}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </button>

          <button
            onClick={() => navigate("/safety")}
            data-tour="safety-card"
            className="card card-hover text-left group flex flex-col justify-between min-h-[170px]"
          >
            <div className="w-12 h-12 rounded-lg bg-status-error-bg flex items-center justify-center">
              <Shield className="w-6 h-6 text-status-error-accent" />
            </div>
            <div>
              <h3 className="mt-6 font-semibold text-text group-hover:text-primary transition-colors">
                {t("dash.safetyCard")}
              </h3>
              <p className="text-sm text-muted mt-2">{t("dash.safetyCardDesc")}</p>
              <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-primary">
                {t("dash.openSafety")}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </button>
        </section>
      </div>

      {/* Recent complaints */}
      {recentComplaints.length > 0 && (
        <section className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-text">{t("dash.recent")}</h2>
            </div>
            <button
              onClick={() => navigate("/track")}
              className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
            >
              {t("dash.viewAll")}
            </button>
          </div>

          <div className="space-y-3">
            {recentComplaints.map((c) => {
              const safety = isSafetyComplaint(c);
              return (
                <button
                  key={c.id}
                  onClick={() => navigate("/track")}
                  style={safety ? { borderLeft: `3px solid ${SAFETY_PINK}` } : undefined}
                  className="w-full flex items-center justify-between gap-4 p-4 rounded-lg inset-panel
                    hover:border-primary/40 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-primary font-semibold">{c.id}</p>
                    <p className="font-medium text-text truncate">
                      {c.title || c.description?.slice(0, 50)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {safety && <SafetyBadge compact />}
                    <PriorityBadge level={c.priorityLevel || c.priority} />
                    <StatusBadge status={c.status} />
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default CitizenDashboard;
