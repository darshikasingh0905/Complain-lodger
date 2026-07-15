import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import useAuth from '../hooks/useAuth';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorVal, setErrorVal] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorVal('');

    if (!username.trim() || !password.trim()) {
      setErrorVal('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      await login(username, password);
      // Admin dashboard is `/admin` URL, redirect there on successful sign-in
      navigate('/admin', { replace: true });
    } catch (err) {
      setErrorVal(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('System Administrator recovery keys are managed in system settings. Default account credentials on local simulation: admin / admin123.');
  };

  return (
    <AuthLayout
      title="Administrator Login"
      subtitle="Verification panel for authorized municipal personnel only"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorVal && (
          <div className="p-3.5 rounded-xl border border-rose-500/15 bg-rose-500/5 text-rose-455 text-xs font-semibold flex items-center gap-2 text-left text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorVal}</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
            Admin Username
          </label>
          <div className="relative">
            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full bg-slate-900/60 border border-slate-805 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-105 placeholder-slate-650 focus:outline-none focus:border-sky-505 transition-colors font-medium"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Passcode
            </label>
            <a
              href="#"
              onClick={handleForgotPassword}
              className="text-[10px] text-sky-400 hover:text-sky-350 font-bold transition-colors"
            >
              Forgot Password?
            </a>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/60 border border-slate-805 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors font-mono"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-505 hover:text-slate-300 transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Remember Me toggle check */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember-me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 bg-slate-909 border-slate-805 rounded focus:ring-sky-500 rounded-md cursor-pointer accent-sky-500"
          />
          <label htmlFor="remember-me" className="text-xs text-slate-400 select-none cursor-pointer">
            Remember my session
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-sky-650 to-indigo-650 hover:from-sky-550 hover:to-indigo-550 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying authorization...</span>
            </>
          ) : (
            'Login as Admin'
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full text-center text-xs text-slate-450 hover:text-white transition-colors pt-2 block"
        >
          ← Back to selection
        </button>
      </form>
    </AuthLayout>
  );
};

export default AdminLogin;
