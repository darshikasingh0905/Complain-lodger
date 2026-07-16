import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, AlertCircle, RefreshCw } from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Field } from "../../components/ui/Field";
import useAuth from "../../hooks/useAuth";

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorVal, setErrorVal] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorVal("");

    if (!username.trim() || !password.trim()) {
      setErrorVal("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setErrorVal(err.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  const [showRecoveryInfo, setShowRecoveryInfo] = useState(false);

  // Never reveal credentials — direct the user to the proper recovery channel.
  const handleForgotPassword = (e) => {
    e.preventDefault();
    setShowRecoveryInfo(true);
  };

  return (
    <AuthLayout
      title="Administrator Login"
      subtitle="Restricted panel for authorized municipal personnel only"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorVal && (
          <div className="alert-error text-xs" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorVal}</span>
          </div>
        )}

        {showRecoveryInfo && (
          <div className="alert-info text-xs" role="status">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Password resets are handled by your department's system
              administrator. Contact the IT helpdesk to recover access.
            </span>
          </div>
        )}

        <Field label="Admin Username" icon={Shield}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            className="input pl-11"
            required
          />
        </Field>

        <div>
          <div className="flex justify-between items-center">
            <label className="label">Passcode</label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[11px] text-primary hover:text-primary-hover font-semibold transition-colors mb-1.5"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input pr-11 font-mono"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember-me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-border cursor-pointer accent-primary"
          />
          <label htmlFor="remember-me" className="text-xs text-muted select-none cursor-pointer">
            Remember my session
          </label>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying authorization…</span>
            </>
          ) : (
            "Login as Admin"
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full text-center text-xs text-muted hover:text-primary transition-colors pt-1"
        >
          ← Back to selection
        </button>
      </form>
    </AuthLayout>
  );
};

export default AdminLogin;
