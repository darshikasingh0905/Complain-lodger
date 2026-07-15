import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SubmitComplaint from './pages/SubmitComplaint';
import TrackComplaint from './pages/TrackComplaint';
import AdminPanel from './pages/AdminPanel';
import EvidenceAnalyzer from './pages/EvidenceAnalyzer';
import HeatmapView from './pages/HeatmapView';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 selection:bg-sky-500 selection:text-white p-4 md:p-8 relative overflow-x-hidden">
        {/* Background decorative styling */}
        <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[550px] h-[550px] rounded-full bg-indigo-600/5 blur-[130px] pointer-events-none" />

        <Navbar />

        {/* Routed container wrapper */}
        <main className="flex-grow flex items-start justify-center py-6 z-10 w-full">
          <Routes>
            <Route path="/" element={<SubmitComplaint />} />
            <Route path="/track" element={<TrackComplaint />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/evidence" element={<EvidenceAnalyzer />} />
            <Route path="/map" element={<HeatmapView />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
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
