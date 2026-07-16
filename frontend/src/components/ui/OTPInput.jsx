import React, { useRef, useEffect } from "react";

export const OTPInput = ({ value, onChange, length = 6 }) => {
  const inputsRef = useRef([]);

  // Focus the first box on load
  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const val = e.target.value;

    // Only accept numbers
    if (val && !/^\d+$/.test(val)) {
      return;
    }

    const newValue = [...value];
    // Keep only the last character for single input box
    newValue[index] = val.slice(-1);
    onChange(newValue);

    // Auto-focus next box
    if (val && index < length - 1 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newValue = [...value];

      // If current box is empty, clear preceding and move focus back
      if (!value[index] && index > 0) {
        newValue[index - 1] = "";
        onChange(newValue);
        if (inputsRef.current[index - 1]) {
          inputsRef.current[index - 1].focus();
        }
      } else {
        // Clear current box
        newValue[index] = "";
        onChange(newValue);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedData)) return; // Only process numbers

    const digits = pastedData.slice(0, length).split("");
    const newValue = [...value];

    for (let i = 0; i < length; i++) {
      if (digits[i]) {
        newValue[i] = digits[i];
      }
    }
    onChange(newValue);

    // Focus last filled box or final box
    const focusIndex = Math.min(digits.length, length - 1);
    if (inputsRef.current[focusIndex]) {
      inputsRef.current[focusIndex].focus();
    }
  };

  return (
    <div
      className="flex justify-between items-center gap-2 sm:gap-3"
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          type="text"
          inputMode="numeric"
          ref={(el) => (inputsRef.current[idx] = el)}
          value={value[idx] || ""}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          maxLength={1}
          className="w-12 h-12 bg-surface border border-border text-text rounded-xl text-center
            text-lg font-bold font-mono transition-colors
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          aria-label={`OTP digit ${idx + 1}`}
        />
      ))}
    </div>
  );
};

export default OTPInput;
