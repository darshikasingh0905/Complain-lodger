import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { getAuthToken } from '../services/tokenStore';
import { initLocalStorageData } from '../utils/localStorageHelpers';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'citizen' | 'admin' | null
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize demo accounts and restore login session on launch.
  // Async: seeding hashes the demo admin password before storing it.
  useEffect(() => {
    (async () => {
      await initLocalStorageData();
      const session = authService.getCurrentUser();
      if (session && session.isAuthenticated) {
        // JWT guard: a restored session without a token must be re-validated.
        // Citizens get a silent re-issue; if the backend rejects it (or the
        // user is an admin, who must re-enter a password) the session is
        // dropped and the route guards redirect to /login.
        if (!getAuthToken()) {
          const result = await authService.refreshToken(session);
          if (result === "invalid") {
            await authService.logout();
            setLoading(false);
            return;
          }
          // "ok" → token restored · "offline" → keep session in fallback mode
        }
        setIsAuthenticated(true);
        setUserRole(session.role);
        setUserData(session.user);
      }
      setLoading(false);
    })();
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
    return session;
  };

  // Logout method
  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUserRole(null);
    setUserData(null);
  };

  const valObject = {
    isAuthenticated,
    userRole,
    userData,
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
