import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Spinner from "../ui/Spinner";

export const RoleGuard = ({ children, allowedRoles }) => {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return <Spinner label="Validating permissions…" className="min-h-[400px]" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Send each role to its own home instead of an error page
    if (userRole === "admin") return <Navigate to="/admin" replace />;
    if (userRole === "citizen") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RoleGuard;
