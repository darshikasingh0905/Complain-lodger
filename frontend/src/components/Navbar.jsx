import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, PlusCircle, Search, LayoutDashboard, BarChart3, ScanSearch, Map } from 'lucide-react';

function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/', label: 'Lodge Complaint', icon: PlusCircle },
    { path: '/track', label: 'Track Status', icon: Search },
    { path: '/admin', label: 'Admin Panel', icon: LayoutDashboard },
    { path: '/evidence', label: 'Evidence Audit', icon: ScanSearch },
    { path: '/map', label: 'Hotspot Map', icon: Map },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 mb-8 max-w-7xl mx-auto w-full rounded-2xl shadow-xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2.5 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200">
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

        {/* Action Link Lists */}
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
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-650/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
