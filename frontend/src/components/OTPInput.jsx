import React, { useRef, useEffect } from 'react';

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
    if (e.key === 'Backspace') {
      const newValue = [...value];
      
      // If current box is empty, clear preceding and move focus back
      if (!value[index] && index > 0) {
        newValue[index - 1] = '';
        onChange(newValue);
        if (inputsRef.current[index - 1]) {
          inputsRef.current[index - 1].focus();
        }
      } else {
        // Clear current box
        newValue[index] = '';
        onChange(newValue);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return; // Only process numbers

    const digits = pastedData.slice(0, length).split('');
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
    <div className="flex justify-between items-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          type="text"
          ref={(el) => (inputsRef.current[idx] = el)}
          value={value[idx] || ''}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          maxLength={2}
          className="w-12 h-12 bg-slate-900/80 border border-slate-800 text-slate-100 rounded-xl text-center text-lg font-black focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-505/20 transition-all font-mono"
          aria-label={`OTP Character ${idx + 1}`}
        />
      ))}
    </div>
  );
};

export default OTPInput;
