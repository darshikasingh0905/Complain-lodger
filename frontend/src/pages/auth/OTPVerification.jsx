import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { OTPInput } from "../../components/ui/OTPInput";
import { redactMobile } from "../../utils/format";
import { authService } from "../../services/authService";
import useAuth from "../../hooks/useAuth";

export const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOTP, sendOTP } = useAuth();

  // Citizen details passed from CitizenLogin
  const { aadhaar, mobile } = location.state || {};

  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(30);
  const [errorVal, setErrorVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // If no citizen details exist, redirect back to login
  useEffect(() => {
    if (!aadhaar || !mobile) {
      navigate("/login/citizen", { replace: true });
    }
  }, [aadhaar, mobile, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorVal("");

    const otpCode = otpDigits.join("");
    if (otpCode.length !== 6) {
      setErrorVal("Please enter the full 6-digit OTP code.");
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(aadhaar, mobile, otpCode);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErrorVal(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;

    setErrorVal("");
    setResending(true);
    try {
      await sendOTP(aadhaar, mobile);
      setTimeLeft(30);
      setOtpDigits(Array(6).fill(""));
    } catch (err) {
      setErrorVal(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="OTP Verification"
      subtitle={`An SMS verification code has been sent to your Aadhaar-registered phone ${redactMobile(mobile)}`}
    >
      <form onSubmit={handleVerify} className="space-y-6">
        {errorVal && (
          <div className="alert-error text-xs" role="alert">
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
              <p className="text-xs text-muted select-none">
                Resend OTP in{" "}
                <span className="font-bold text-primary font-mono">{timeLeft}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-xs text-primary hover:text-primary-hover font-bold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resending…</span>
                  </>
                ) : (
                  "Resend Verification OTP"
                )}
              </button>
            )}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying OTP…</span>
            </>
          ) : (
            "Verify OTP"
          )}
        </button>

        {/* DEV ONLY — the generated OTP is surfaced because there is no real
            SMS delivery locally. Stripped from production builds. */}
        {import.meta.env.DEV && authService.getDevOtp() && (
          <div className="inset-panel p-3 text-center text-[11px] text-muted font-medium">
            Development OTP (no SMS in local mode):{" "}
            <span className="font-bold text-primary font-mono select-all">
              {authService.getDevOtp()}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/login/citizen")}
          className="w-full text-center text-xs text-muted hover:text-primary transition-colors"
        >
          ← Use different details
        </button>
      </form>
    </AuthLayout>
  );
};

export default OTPVerification;
