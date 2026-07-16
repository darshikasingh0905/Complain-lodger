import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Phone, AlertCircle, RefreshCw } from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Field } from "../../components/ui/Field";
import useAuth from "../../hooks/useAuth";

export const CitizenLogin = () => {
  const navigate = useNavigate();
  const { sendOTP } = useAuth();

  const [rawAadhaar, setRawAadhaar] = useState("");
  const [mobile, setMobile] = useState("");
  const [errorVal, setErrorVal] = useState("");
  const [loading, setLoading] = useState(false);

  // Keyboard navigation & masking display
  const handleAadhaarKeyDown = (e) => {
    const allowedKeys = ["Tab", "Enter", "ArrowLeft", "ArrowRight", "Delete", "Control", "Meta"];
    // Allow copy, paste, select all shortcuts
    if (
      allowedKeys.includes(e.key) ||
      ((e.ctrlKey || e.metaKey) && ["c", "v", "a"].includes(e.key.toLowerCase()))
    ) {
      return;
    }

    if (e.key === "Backspace") {
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
    const text = e.clipboardData.getData("text");
    const digits = text.replace(/\D/g, "").slice(0, 12 - rawAadhaar.length);
    setRawAadhaar((prev) => prev + digits);
  };

  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobile(val);
  };

  // Mask first 8 digits, group as XXXX XXXX 1234
  const getMaskedDisplay = (raw) => {
    let display = "";
    for (let i = 0; i < raw.length; i++) {
      display += i < 8 ? "X" : raw[i];
      if ((i === 3 || i === 7) && i < raw.length - 1) {
        display += " ";
      }
    }
    return display;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorVal("");

    if (rawAadhaar.length !== 12) {
      setErrorVal("Aadhaar number must be exactly 12 digits.");
      return;
    }
    if (mobile.length !== 10) {
      setErrorVal("Mobile number must be exactly 10 digits.");
      return;
    }

    setLoading(true);
    try {
      await sendOTP(rawAadhaar, mobile);
      navigate("/login/verify-otp", {
        state: { aadhaar: rawAadhaar, mobile },
      });
    } catch (err) {
      setErrorVal(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Citizen Authentication"
      subtitle="Verify your identity using your Aadhaar card details"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorVal && (
          <div className="alert-error text-xs" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorVal}</span>
          </div>
        )}

        <Field
          label="Aadhaar Number"
          icon={CreditCard}
          hint="Enter 12 digits — masked and spaced automatically."
        >
          <input
            type="text"
            value={getMaskedDisplay(rawAadhaar)}
            onChange={() => {}} // input is fully managed via onKeyDown/onPaste
            onKeyDown={handleAadhaarKeyDown}
            onPaste={handleAadhaarPaste}
            placeholder="XXXX XXXX 1234"
            className="input pl-11 tracking-widest font-mono"
            autoComplete="off"
          />
        </Field>

        <Field
          label="Registered Mobile Number"
          icon={Phone}
          hint="10-digit mobile number linked with your Aadhaar."
        >
          <input
            type="tel"
            value={mobile}
            onChange={handleMobileChange}
            placeholder="9876543210"
            className="input pl-11 tracking-wider font-mono"
            maxLength={10}
          />
        </Field>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Sending OTP…</span>
            </>
          ) : (
            "Send OTP"
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

export default CitizenLogin;
