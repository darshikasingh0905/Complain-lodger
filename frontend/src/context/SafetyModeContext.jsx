import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import useAuth from "../hooks/useAuth";

/**
 * Women Safety Mode — the product's USP.
 *
 * When a citizen switches it on:
 *  - the whole app re-themes from teal-green to pink (CSS variables),
 *  - safety quick-report categories + helplines appear on the submit form,
 *  - women-safety complaints receive a dedicated +15 priority boost
 *    (enforced by the backend priority engine and mirrored offline).
 *
 * The preference persists per browser. Admin sessions always stay on the
 * default government theme.
 */

const KEY = "women_safety_mode";

const SafetyModeContext = createContext(null);

export const SafetyModeProvider = ({ children }) => {
  const { userRole, isAuthenticated } = useAuth();
  const [safetyMode, setSafetyMode] = useState(
    () => localStorage.getItem(KEY) === "1"
  );

  // Apply/remove the pink theme — ONLY for a signed-in citizen. Admins and
  // logged-out visitors (login pages, public scoreboard) always see the
  // standard government theme.
  useEffect(() => {
    const enabled = safetyMode && isAuthenticated && userRole === "citizen";
    document.documentElement.classList.toggle("theme-safety", enabled);
    return () => document.documentElement.classList.remove("theme-safety");
  }, [safetyMode, userRole, isAuthenticated]);

  // Women Safety Mode is a per-session choice: logging out switches the
  // portal back to green and clears the persisted flag.
  useEffect(() => {
    if (!isAuthenticated && safetyMode) {
      setSafetyMode(false);
      localStorage.setItem(KEY, "0");
    }
  }, [isAuthenticated, safetyMode]);

  const toggleSafetyMode = useCallback(() => {
    setSafetyMode((prev) => {
      const next = !prev;
      localStorage.setItem(KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <SafetyModeContext.Provider value={{ safetyMode, toggleSafetyMode }}>
      {children}
    </SafetyModeContext.Provider>
  );
};

export const useSafetyMode = () => {
  const ctx = useContext(SafetyModeContext);
  if (!ctx) throw new Error("useSafetyMode must be used inside <SafetyModeProvider>");
  return ctx;
};

export default SafetyModeContext;
