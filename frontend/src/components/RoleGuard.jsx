import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export const RoleGuard = ({ children, allowedRoles }) => {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full text-slate-400">
        <svg className="animate-spin h-8 w-8 text-sky-500 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs uppercase tracking-wider font-semibold">Validating Permissions...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // If Admin attempts citizen routes, redirect to Admin panel
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    // If Citizen attempts admin routes, redirect to Citizen dashboard
    if (userRole === 'citizen') {
      return <Navigate to="/dashboard" replace />;
    }
    // Fallback redirect
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RoleGuard;
