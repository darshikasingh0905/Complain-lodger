import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  Search,
  LayoutDashboard,
  ScanSearch,
  Map,
  BarChart3,
  LogOut,
  UserCheck,
  Building2,
  Users,
  Settings,
  HeartHandshake,
  Trophy,
  Globe,
} from "lucide-react";

import useAuth from "../../hooks/useAuth";
import { useSafetyMode } from "../../context/SafetyModeContext";
import { useLanguage } from "../../context/LanguageContext";
import NotificationBell from "./NotificationBell";

// Labels are i18n keys — resolved through t() at render time.
const CITIZEN_NAV = [
  { path: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { path: "/", label: "nav.lodge", icon: PlusCircle },
  { path: "/track", label: "nav.track", icon: Search },
  { path: "/safety", label: "nav.safety", icon: ShieldAlert },
  { path: "/scoreboard", label: "nav.scoreboard", icon: Trophy },
];

const ADMIN_NAV = [
  { path: "/admin", label: "Admin Panel", icon: LayoutDashboard },
  { path: "/evidence", label: "Evidence Audit", icon: ScanSearch },
  { path: "/map", label: "Hotspot Map", icon: Map },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
];

// Super admins additionally manage departments, users and system settings
const SUPER_ADMIN_NAV = [
  ...ADMIN_NAV,
  { path: "/departments", label: "Departments", icon: Building2 },
  { path: "/users", label: "Users", icon: Users },
  { path: "/settings", label: "Settings", icon: Settings },
];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, userData, logout } = useAuth();
  const { safetyMode, toggleSafetyMode } = useSafetyMode();
  const { language, setLanguage, t, LANGUAGES } = useLanguage();

  const currentPath = location.pathname;

  const navItems = !isAuthenticated
    ? []
    : userRole === "admin"
      ? userData?.adminRole === "department_admin"
        ? ADMIN_NAV
        : SUPER_ADMIN_NAV
      : CITIZEN_NAV;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const logoTarget = !isAuthenticated
    ? "/login"
    : userRole === "admin"
      ? "/admin"
      : "/dashboard";

  return (
    <nav className="h-16 bg-surface border-b border-border sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-10">
      {/* Logo */}
      <Link to={logoTarget} className="flex items-center gap-3">
        <div className="icon-chip border border-primary/10">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <div className="hidden sm:block">
          <div className="text-base font-bold text-text leading-tight">
            {t("nav.portal")}
          </div>
          <div className="text-[10px] uppercase tracking-wider font-medium text-muted">
            {t("nav.tagline")}
          </div>
        </div>
      </Link>

      {/* Navigation + user */}
      <div className="flex items-center gap-3">
        {/* Site language picker — a government portal must not assume English */}
        <label
          className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2 py-1.5 cursor-pointer"
          title="Change website language"
        >
          <Globe className="w-4 h-4 text-primary shrink-0" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Website language"
            className="bg-transparent text-xs font-semibold text-text outline-none cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        {isAuthenticated ? (
          <>
            <div className="hidden md:flex items-center gap-1 bg-surfaceSoft border border-border p-1 rounded-lg">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary text-white"
                        : "text-muted hover:text-primary hover:bg-primary-light"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t(item.label) !== item.label ? t(item.label) : item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Women Safety Mode toggle — on the SAFETY report form (switch
                modes mid-report) and anywhere the mode is on so it can be
                turned off. Hidden on /safety: that page has its own switch. */}
            {userRole === "citizen" &&
              currentPath !== "/safety" &&
              (currentPath === "/safety/report" || safetyMode) && (
              <button
                onClick={toggleSafetyMode}
                role="switch"
                aria-checked={safetyMode}
                data-tour="safety-toggle"
                title={
                  safetyMode
                    ? "Women Safety Mode is ON — safety complaints are prioritized"
                    : "Turn on Women Safety Mode"
                }
                className={`flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-full border text-xs font-semibold transition-all duration-300 ${
                  safetyMode
                    ? "bg-primary text-white border-primary shadow-lift"
                    : "bg-surface text-muted border-border hover:text-primary hover:border-primary/40"
                }`}
              >
                <HeartHandshake className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t("nav.womenSafety")}</span>
                <span
                  className={`w-8 h-4.5 h-[18px] rounded-full relative transition-colors duration-300 ${
                    safetyMode ? "bg-white/30" : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute top-[2px] w-3.5 h-3.5 rounded-full bg-white shadow transition-all duration-300 ${
                      safetyMode ? "left-[18px]" : "left-[2px]"
                    }`}
                  />
                </span>
              </button>
            )}

            <NotificationBell />

            {/* User chip */}
            <div className="flex items-center gap-3 bg-surface border border-border px-3 py-1.5 rounded-lg">
              <div className="hidden lg:block text-right">
                <div className="text-[10px] text-muted uppercase font-semibold">
                  {userRole === "admin" && userData?.adminRole === "department_admin"
                    ? userData?.department || "Dept. Admin"
                    : t("nav.signedIn")}
                </div>
                <div className="text-xs font-semibold text-text">
                  {userData?.name || "User"}
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-primary" />
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-md text-muted transition-colors hover:text-status-error-text hover:bg-status-error-bg"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Public accountability scoreboard — visible without login */}
            {currentPath !== "/scoreboard" && (
              <Link to="/scoreboard" className="btn-ghost !px-3 text-xs">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">{t("nav.scoreboard")}</span>
              </Link>
            )}
            {currentPath !== "/login" && (
              <Link to="/login" className="btn-primary">
                {t("nav.signin")}
              </Link>
            )}
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
