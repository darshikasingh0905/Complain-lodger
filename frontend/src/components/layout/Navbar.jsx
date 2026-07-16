import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
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
} from "lucide-react";

import useAuth from "../../hooks/useAuth";
import NotificationBell from "./NotificationBell";

const CITIZEN_NAV = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/", label: "Lodge Grievance", icon: PlusCircle },
  { path: "/track", label: "Track Status", icon: Search },
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
            Grievance Portal
          </div>
          <div className="text-[10px] uppercase tracking-wider font-medium text-muted">
            Smart Governance System
          </div>
        </div>
      </Link>

      {/* Navigation + user */}
      <div className="flex items-center gap-3">
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
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <NotificationBell />

            {/* User chip */}
            <div className="flex items-center gap-3 bg-surface border border-border px-3 py-1.5 rounded-lg">
              <div className="hidden lg:block text-right">
                <div className="text-[10px] text-muted uppercase font-semibold">
                  {userRole === "admin" && userData?.adminRole === "department_admin"
                    ? userData?.department || "Dept. Admin"
                    : "Signed in"}
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
          currentPath !== "/login" && (
            <Link to="/login" className="btn-primary">
              Sign In
            </Link>
          )
        )}
      </div>
    </nav>
  );
}

export default Navbar;
