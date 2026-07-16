import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { initLocalStorageData } from '../utils/localStorageHelpers';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'citizen' | 'admin' | null
  const [userData, setUserData] = useState(null);
  const [adminRole, setAdminRole] = useState(null); // 'super_admin' | 'department_admin' | null
  const [adminDepartment, setAdminDepartment] = useState(null); // e.g. 'Roads', 'Electricity', ...
  const [loading, setLoading] = useState(true);

  // Initialize demo accounts and restore login session on launch
  useEffect(() => {
    initLocalStorageData();
    const session = authService.getCurrentUser();
    if (session && session.isAuthenticated) {
      setIsAuthenticated(true);
      setUserRole(session.role);
      setUserData(session.user);
      if (session.role === 'admin') {
        setAdminRole(session.adminRole || session.user?.adminRole || 'super_admin');
        setAdminDepartment(session.adminDepartment || session.user?.adminDepartment || null);
      }
    }
    setLoading(false);
  }, []);

  // Citizen OTP Request
  const sendOTP = async (aadhaar, mobile) => {
    return await authService.sendOTP(aadhaar, mobile);
  };

  // Citizen OTP confirmation
  const verifyOTP = async (aadhaar, mobile, otp) => {
    const session = await authService.verifyOTP(aadhaar, mobile, otp);
    setIsAuthenticated(true);
    setUserRole(session.role);
    setUserData(session.user);
    return session;
  };

  // Admin login flow
  const login = async (username, password) => {
    const session = await authService.adminLogin(username, password);
    setIsAuthenticated(true);
    setUserRole(session.role);
    setUserData(session.user);
    setAdminRole(session.adminRole || 'super_admin');
    setAdminDepartment(session.adminDepartment || null);
    return session;
  };

  // Logout method
  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUserRole(null);
    setUserData(null);
    setAdminRole(null);
    setAdminDepartment(null);
  };

  const valObject = {
    isAuthenticated,
    userRole,
    userData,
    adminRole,
    adminDepartment,
    loading,
    login,
    logout,
    sendOTP,
    verifyOTP
  };

  return (
    <AuthContext.Provider value={valObject}>
      {children}
    </AuthContext.Provider>
  );
};
