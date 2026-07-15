import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, KeyRound, AlertCircle, RefreshCw } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import useAuth from '../hooks/useAuth';

export const CitizenLogin = () => {
  const navigate = useNavigate();
  const { sendOTP } = useAuth();

  const [rawAadhaar, setRawAadhaar] = useState('');
  const [mobile, setMobile] = useState('');
  const [errorVal, setErrorVal] = useState('');
  const [loading, setLoading] = useState(false);

  // Keyboard navigation & masking display
  const handleAadhaarKeyDown = (e) => {
    const allowedKeys = ['Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Delete', 'Control', 'Meta', 'c', 'v', 'a'];
    // Allow copy, paste, select all shortcuts
    if (allowedKeys.includes(e.key) || ((e.ctrlKey || e.metaKey) && ['c', 'v', 'a'].includes(e.key.toLowerCase()))) {
      return;
    }
    
    if (e.key === 'Backspace') {
      setRawAadhaar((prev) => prev.slice(0, -1));
      e.preventDefault();
    } else if (/^\d$/.test(e.key)) {
      if (rawAadhaar.length < 12) {
        setRawAadhaar((prev) => prev + e.key);
      }
      e.preventDefault();
    } else {
      e.preventDefault();
    }
  };

  const handleAadhaarPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const digits = text.replace(/\D/g, '').slice(0, 12 - rawAadhaar.length);
    setRawAadhaar((prev) => prev + digits);
  };

  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(val);
  };

  const getMaskedDisplay = (raw) => {
    let display = '';
    for (let i = 0; i < raw.length; i++) {
      if (i < 8) {
        display += 'X';
      } else {
        display += raw[i];
      }
      if ((i === 3 || i === 7) && i < raw.length - 1) {
        display += ' ';
      }
    }
    return display;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorVal('');

    if (rawAadhaar.length !== 12) {
      setErrorVal('Aadhaar number must be exactly 12 digits.');
      return;
    }

    if (mobile.length !== 10) {
      setErrorVal('Mobile number must be exactly 10 digits.');
      return;
    }

    setLoading(true);

    try {
      await sendOTP(rawAadhaar, mobile);
      // Navigate to OTP page passing state
      navigate('/login/verify-otp', {
        state: { aadhaar: rawAadhaar, mobile }
      });
    } catch (err) {
      setErrorVal(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Citizen Authentication"
      subtitle="Verify your identity using your secure Aadhaar card details"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorVal && (
          <div className="p-3.5 rounded-xl border border-rose-500/15 bg-rose-500/5 text-rose-450 text-xs font-semibold flex items-center gap-2 text-left text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorVal}</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 label-for-aadhaar">
            Aadhaar Number
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              id="aadhaar-input"
              value={getMaskedDisplay(rawAadhaar)}
              onKeyDown={handleAadhaarKeyDown}
              onPaste={handleAadhaarPaste}
              placeholder="XXXX XXXX 1234"
              className="w-full bg-slate-900/60 border border-slate-805 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors tracking-widest font-mono"
              aria-labelledby="aadhaar-input-label"
              autoComplete="off"
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Enter 12 digits. Spacing and masking format automatically.
          </span>
        </div>

        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
            Registered Mobile Number
          </label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={mobile}
              onChange={handleMobileChange}
              placeholder="9876543210"
              className="w-full bg-slate-900/60 border border-slate-820 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-105 placeholder-slate-650 focus:outline-none focus:border-sky-500 transition-colors tracking-wider font-mono"
              maxLength={10}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Enter 10-digit mobile number linked with your Aadhaar.
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-sky-650 to-indigo-650 hover:from-sky-550 hover:to-indigo-550 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-sky-600/10 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-950 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Sending OTP...</span>
            </>
          ) : (
            'Send OTP'
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

export default CitizenLogin;
