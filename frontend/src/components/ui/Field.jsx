import React from "react";
import { AlertCircle } from "lucide-react";

/** Inline field-level validation message. */
export function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-[11px] text-status-error-text font-medium flex items-center gap-1 mt-1">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {message}
    </p>
  );
}

/**
 * Labelled form field wrapper with optional leading icon, error and hint.
 * Renders whatever control is passed as children (input / textarea / select).
 */
export function Field({ label, required = false, optional = false, icon: Icon, error, hint, counter, children }) {
  return (
    <div>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-status-error-accent ml-0.5">*</span>}
          {optional && <span className="text-muted font-normal normal-case ml-1">(optional)</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-3 w-4 h-4 text-muted pointer-events-none" />
        )}
        {children}
      </div>
      <div className="flex justify-between items-start gap-2">
        <FieldError message={error} />
        {hint && !error && <span className="hint">{hint}</span>}
        {counter && <span className="text-[10px] text-muted mt-1 ml-auto shrink-0">{counter}</span>}
      </div>
    </div>
  );
}

export default Field;
