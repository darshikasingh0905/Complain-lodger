import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ComplaintProvider } from "./context/ComplaintContext";
import { SafetyModeProvider } from "./context/SafetyModeContext";
import { LanguageProvider } from "./context/LanguageContext";
import RoleGuard from "./components/guards/RoleGuard";
import SuperAdminGuard from "./components/guards/SuperAdminGuard";

// Layout
import Navbar from "./components/layout/Navbar";
import OfflineBanner from "./components/layout/OfflineBanner";
import CitizenTour from "./components/tour/CitizenTour";
import ChatbotWidget from "./components/chat/ChatbotWidget";

// Public / auth pages
import LoginChoice from "./pages/auth/LoginChoice";
import Scoreboard from "./pages/public/Scoreboard";
import CitizenLogin from "./pages/auth/CitizenLogin";
import AdminLogin from "./pages/auth/AdminLogin";
import OTPVerification from "./pages/auth/OTPVerification";

// Citizen pages
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import SubmitComplaint from "./pages/citizen/SubmitComplaint";
import TrackComplaint from "./pages/citizen/TrackComplaint";
import SafetyPage from "./pages/citizen/SafetyPage";

// Admin pages
import AdminPanel from "./pages/admin/AdminPanel";
import EvidenceAnalyzer from "./pages/admin/EvidenceAnalyzer";
import HeatmapView from "./pages/admin/HeatmapView";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import DepartmentsPage from "./pages/admin/DepartmentsPage";
import UsersPage from "./pages/admin/UsersPage";
import SettingsPage from "./pages/admin/SettingsPage";

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
      <SafetyModeProvider>
      <ComplaintProvider>
        <Router>
          <div className="min-h-screen bg-background flex flex-col text-text">
            <Navbar />
            <OfflineBanner />
            <CitizenTour />
            <ChatbotWidget />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
              <Routes>
                {/* Public / auth routes */}
                <Route path="/scoreboard" element={<Scoreboard />} />
                <Route path="/login" element={<LoginChoice />} />
                <Route path="/login/citizen" element={<CitizenLogin />} />
                <Route path="/login/admin" element={<AdminLogin />} />
                <Route path="/login/verify-otp" element={<OTPVerification />} />

                {/* Citizen routes */}
                <Route
                  path="/"
                  element={
                    <RoleGuard allowedRoles={["citizen"]}>
                      <SubmitComplaint />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <RoleGuard allowedRoles={["citizen"]}>
                      <CitizenDashboard />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/track"
                  element={
                    <RoleGuard allowedRoles={["citizen"]}>
                      <TrackComplaint />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/safety"
                  element={
                    <RoleGuard allowedRoles={["citizen"]}>
                      <SafetyPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/safety/report"
                  element={
                    <RoleGuard allowedRoles={["citizen"]}>
                      <SubmitComplaint safetyForm />
                    </RoleGuard>
                  }
                />

                {/* Admin routes */}
                <Route
                  path="/admin"
                  element={
                    <RoleGuard allowedRoles={["admin"]}>
                      <AdminPanel />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/evidence"
                  element={
                    <RoleGuard allowedRoles={["admin"]}>
                      <EvidenceAnalyzer />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/map"
                  element={
                    <RoleGuard allowedRoles={["admin"]}>
                      <HeatmapView />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <RoleGuard allowedRoles={["admin"]}>
                      <AnalyticsDashboard />
                    </RoleGuard>
                  }
                />

                {/* Super-admin-only routes */}
                <Route
                  path="/departments"
                  element={
                    <RoleGuard allowedRoles={["admin"]}>
                      <SuperAdminGuard>
                        <DepartmentsPage />
                      </SuperAdminGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <RoleGuard allowedRoles={["admin"]}>
                      <SuperAdminGuard>
                        <UsersPage />
                      </SuperAdminGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <RoleGuard allowedRoles={["admin"]}>
                      <SuperAdminGuard>
                        <SettingsPage />
                      </SuperAdminGuard>
                    </RoleGuard>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </main>

            <footer className="text-center text-xs text-muted py-6 border-t border-border bg-surface">
              <p>© 2026 Samadhan · Grievance Lodging & Tracking System</p>
              <p className="font-medium mt-1">Smart Governance · Secure by Design</p>
            </footer>
          </div>
        </Router>
      </ComplaintProvider>
      </SafetyModeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
