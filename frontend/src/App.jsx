import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Database, Cpu, RefreshCw, ShieldCheck } from 'lucide-react';

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await axios.get(`${apiUrl}/health`);
      setHealth(response.data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to reach API server');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 selection:bg-sky-500 selection:text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full z-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl shadow-lg shadow-sky-500/15">
            <ShieldCheck className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Grievance AI Portal
            </h1>
            <p className="text-xs text-slate-450 font-medium">Citizen Lodging & Tracking System</p>
          </div>
        </div>
        <div className="flex items-center gap-3 font-semibold text-xs tracking-wider uppercase text-slate-400">
          <span className="px-3 py-1 rounded-md bg-slate-900 border border-slate-800">
            Milestone 1 Verification
          </span>
        </div>
      </header>

      {/* Main Panel */}
      <main className="max-w-4xl mx-auto w-full flex-grow flex flex-col justify-center items-center gap-8 py-8 z-10">
        <div className="glass-panel w-full p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-400/5 rounded-bl-[100px] border-l border-b border-white/5" />
          
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
              System Health & Connectivity Check
            </h2>
            <p className="text-slate-455 text-sm max-w-xl">
              Verifying active connections across the entire project stack: React Frontend, FastAPI Service layer, and local MySQL databases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {/* Frontend Status */}
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">React Client</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Online
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <Activity className="w-6 h-6 text-sky-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Vite Server Dev</h3>
                  <p className="text-xs text-slate-400">Config: PORT 5173</p>
                </div>
              </div>
            </div>

            {/* Backend & DB Status */}
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-medium">FastAPI & MySQL</span>
                {loading ? (
                  <span className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking
                  </span>
                ) : error ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-450 border border-rose-500/20">
                    Offline
                  </span>
                ) : health?.database === 'connected' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Connected
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    DB Error
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <Database className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {loading ? 'Verifying...' : error ? 'Database Offline' : 'MySQL Database'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-[250px] truncate">
                    {loading ? 'Analyzing status...' : error ? error : `Active Schema: ${health?.database === 'connected' ? 'grievance_system' : 'Not Connected'}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Settings Box */}
          <div className="glass-card p-6 rounded-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <Cpu className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Ollama Integration URL</h4>
                <p className="text-xs text-slate-400">
                  {loading ? 'Checking config...' : error ? 'Unknown' : health?.environment?.ollama_api_url}
                </p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <span className="text-xs text-slate-400 block mb-0.5">Assigned Target LLM</span>
              <span className="text-sm font-mono font-medium text-slate-200">
                {loading ? 'Checking model...' : error ? 'llama3.2' : health?.environment?.ollama_model}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-700/50 text-white rounded-xl font-medium text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-950 shadow-lg shadow-sky-600/10 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full z-10 text-center text-xs text-slate-500 border-t border-slate-800/50 pt-6 mt-8 flex flex-col sm:flex-row justify-between gap-3">
        <p>© 2026 AI-Powered Grievance Lodging and Tracking System (Hackathon Ready)</p>
        <p className="text-slate-450 font-medium">Fully Functional Milestone 1</p>
      </footer>
    </div>
  );
}

export default App;
//
