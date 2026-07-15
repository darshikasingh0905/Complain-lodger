import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SubmitComplaint from './pages/SubmitComplaint';

// Temporary placeholder screens for future milestones to support routing links
function TrackPlaceholder() {
  return (
    <div className="glass-panel p-8 rounded-3xl text-center max-w-md mx-auto relative border border-white/5 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-2">Complaint Status Tracking</h2>
      <p className="text-slate-400 text-xs md:text-sm">
        Track complaint status by ID or Phone number. This system connects to models in Milestone 5.
      </p>
    </div>
  );
}

function AdminPlaceholder() {
  return (
    <div className="glass-panel p-8 rounded-3xl text-center max-w-md mx-auto relative border border-white/5 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-2">Government Admin Area</h2>
      <p className="text-slate-400 text-xs md:text-sm">
        Department dispatch and ticket resolution dashboard. This system connects to models in Milestone 6.
      </p>
    </div>
  );
}

function AnalyticsPlaceholder() {
  return (
    <div className="glass-panel p-8 rounded-3xl text-center max-w-md mx-auto relative border border-white/5 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-2">Predictive Analytics Dashboard</h2>
      <p className="text-slate-400 text-xs md:text-sm">
        Hotspot warning and spatial clustering charts. This system connects to models in Milestone 8 & 9.
      </p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 selection:bg-sky-500 selection:text-white p-4 md:p-8 relative overflow-x-hidden">
        {/* Background decorative styling */}
        <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[550px] h-[550px] rounded-full bg-indigo-600/5 blur-[130px] pointer-events-none" />

        <Navbar />

        {/* Routed container wrapper */}
        <main className="flex-grow flex items-center justify-center py-6 z-10">
          <Routes>
            <Route path="/" element={<SubmitComplaint />} />
            <Route path="/track" element={<TrackPlaceholder />} />
            <Route path="/admin" element={<AdminPlaceholder />} />
            <Route path="/analytics" element={<AnalyticsPlaceholder />} />
          </Routes>
        </main>

        <footer className="text-center text-xs text-slate-650 pt-8 mt-12 border-t border-slate-900">
          <p>© 2026 AI-Powered Grievance Lodging and Tracking System (Hackathon Ready)</p>
          <p className="text-slate-500 font-medium mt-1">Component Verification Stable</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
