import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, PlusCircle, Search, LayoutDashboard, ScanSearch, Map, LogOut, UserCheck } from 'lucide-react';
import useAuth from '../hooks/useAuth';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { isAuthenticated, userRole, userData, logout } = useAuth();

  // Define navigation items based on role
  let navItems = [];
  if (isAuthenticated) {
    if (userRole === 'citizen') {
      navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/', label: 'Lodge Grievance', icon: PlusCircle },
        { path: '/track', label: 'Track Status', icon: Search }
      ];
    } else if (userRole === 'admin') {
      navItems = [
        { path: '/admin', label: 'Admin Panel', icon: LayoutDashboard },
        { path: '/evidence', label: 'Evidence Audit', icon: ScanSearch },
        { path: '/map', label: 'Hotspot Map', icon: Map }
      ];
    }
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getLogoRedirect = () => {
    if (!isAuthenticated) return '/login';
    return userRole === 'admin' ? '/admin' : '/dashboard';
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 mb-8 max-w-7xl mx-auto w-full rounded-2xl shadow-xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to={getLogoRedirect()} className="flex items-center gap-3 group">
          <div className="p-2.5 bg-gradient-to-tr from-sky-500 to-indigo-650 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 block leading-tight">
              Grievance AI
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Smart Governance Portal
            </span>
          </div>
        </Link>

        {/* Navigation Action Links and Profile Pill */}
        <div className="flex flex-wrap items-center gap-3 justify-center">
          {isAuthenticated ? (
            <>
              {/* Dynamic Nav Items */}
              <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden md:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* User Session Pill & Logout Action */}
              <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded-xl border border-white/5">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 leading-none">Logged in</span>
                  <span className="text-xs font-bold text-slate-350 mt-0.5">{userData?.name || 'User'}</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-rose-500/10 text-slate-450 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            currentPath !== '/login' && (
              <Link
                to="/login"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-sky-600/10"
              >
                Sign In
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
