import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ComplaintProvider } from './context/ComplaintContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';

// Components
import Navbar from './components/Navbar';

// Public/Auth Pages
import LoginChoice from './pages/LoginChoice';
import CitizenLogin from './pages/CitizenLogin';
import AdminLogin from './pages/AdminLogin';
import OTPVerification from './pages/OTPVerification';

// Protected Pages (Citizen)
import CitizenDashboard from './pages/CitizenDashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import TrackComplaint from './pages/TrackComplaint';

// Protected Pages (Admin)
import AdminPanel from './pages/AdminPanel';
import EvidenceAnalyzer from './pages/EvidenceAnalyzer';
import HeatmapView from './pages/HeatmapView';

function App() {
  return (
    <AuthProvider>
      <ComplaintProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 selection:bg-sky-500 selection:text-white p-4 md:p-8 relative overflow-x-hidden">
          {/* Background decorative styling */}
          <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[550px] h-[550px] rounded-full bg-indigo-600/5 blur-[130px] pointer-events-none" />

          <Navbar />

          {/* Routed container wrapper */}
          <main className="flex-grow flex items-start justify-center py-6 z-10 w-full">
            <Routes>
              {/* Public/Auth Routes */}
              <Route path="/login" element={<LoginChoice />} />
              <Route path="/login/citizen" element={<CitizenLogin />} />
              <Route path="/login/admin" element={<AdminLogin />} />
              <Route path="/login/verify-otp" element={<OTPVerification />} />

              {/* Protected Citizen Routes */}
              <Route
                path="/"
                element={
                  <RoleGuard allowedRoles={['citizen']}>
                    <SubmitComplaint />
                  </RoleGuard>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RoleGuard allowedRoles={['citizen']}>
                    <CitizenDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/track"
                element={
                  <RoleGuard allowedRoles={['citizen']}>
                    <TrackComplaint />
                  </RoleGuard>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminPanel />
                  </RoleGuard>
                }
              />
              <Route
                path="/evidence"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <EvidenceAnalyzer />
                  </RoleGuard>
                }
              />
              <Route
                path="/map"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <HeatmapView />
                  </RoleGuard>
                }
              />


              {/* Fallback to login choice */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>

          <footer className="text-center text-xs text-slate-700 pt-8 mt-12 border-t border-slate-900">
            <p>© 2026 Grievance Lodging and Tracking System (Hackathon Ready)</p>
            <p className="text-slate-500 font-medium mt-1">Component Verification Stable</p>
          </footer>
        </div>
      </Router>
      </ComplaintProvider>
    </AuthProvider>
  );
}

export default App;
