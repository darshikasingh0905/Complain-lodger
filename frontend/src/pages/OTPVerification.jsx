import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { OTPInput } from '../components/OTPInput';
import useAuth from '../hooks/useAuth';

export const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOTP, sendOTP } = useAuth();

  // Retrieve incoming citizen details passed from CitizenLogin
  const { aadhaar, mobile } = location.state || {};

  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
  const [timeLeft, setTimeLeft] = useState(30);
  const [errorVal, setErrorVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // If no citizen details exist, redirect back to login
  useEffect(() => {
    if (!aadhaar || !mobile) {
      navigate('/login/citizen', { replace: true });
    }
  }, [aadhaar, mobile, navigate]);

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorVal('');

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setErrorVal('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);

    try {
      await verifyOTP(aadhaar, mobile, otpCode);
      // Navigation is handled inside AuthContext or router. 
      // Let's redirect to citizen dashboard `/dashboard`
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorVal(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    
    setErrorVal('');
    setResending(true);

    try {
      await sendOTP(aadhaar, mobile);
      setTimeLeft(30);
      setOtpDigits(Array(6).fill(''));
    } catch (err) {
      setErrorVal(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const redactMobile = (number) => {
    if (!number) return '';
    return `******${number.slice(-4)}`;
  };

  return (
    <AuthLayout
      title="OTP Verification"
      subtitle={`An SMS verification code has been dispatched to your Aadhaar-registered phone ${redactMobile(mobile)}`}
    >
      <form onSubmit={handleVerify} className="space-y-6">
        {errorVal && (
          <div className="p-3.5 rounded-xl border border-rose-500/15 bg-rose-500/5 text-rose-400 text-xs font-semibold flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorVal}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-center py-2">
            <OTPInput value={otpDigits} onChange={setOtpDigits} length={6} />
          </div>

          <div className="text-center">
            {timeLeft > 0 ? (
              <p className="text-xs text-slate-400 select-none">
                Resend OTP inside{' '}
                <span className="font-bold text-sky-400 font-mono">{timeLeft}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-xs text-sky-400 hover:text-sky-300 font-bold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resending...</span>
                  </>
                ) : (
                  'Resend Verification OTP'
                )}
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-sky-655 to-indigo-650 hover:from-sky-550 hover:to-indigo-550 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-sky-600/10 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-950 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying OTP Code...</span>
            </>
          ) : (
            'Verify OTP'
          )}
        </button>

        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 text-center text-[10px] text-slate-500 font-medium">
          Development Mock Code: <span className="font-bold text-sky-400/90 font-mono select-all">123456</span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/login/citizen')}
          className="w-full text-center text-xs text-slate-450 hover:text-white transition-colors block"
        >
          ← Use different details
        </button>
      </form>
    </AuthLayout>
  );
};

export default OTPVerification;
