import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

/**
 * Restricts a route to super admins. Department admins are sent back to
 * their (already scoped) admin panel. Compose inside a RoleGuard["admin"].
 */
export const SuperAdminGuard = ({ children }) => {
  const { userData } = useAuth();

  if (userData?.adminRole === "department_admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default SuperAdminGuard;
