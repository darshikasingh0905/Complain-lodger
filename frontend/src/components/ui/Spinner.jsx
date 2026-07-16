import React from "react";
import { ShieldCheck } from "lucide-react";

/**
 * Branded loading state: the portal shield inside a spinning primary ring.
 */
export function Spinner({ label = "Loading…", className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-16 text-muted ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-[3px] border-primary/15 border-t-primary animate-spin" />
        <ShieldCheck className="absolute inset-0 m-auto w-5 h-5 text-primary" />
      </div>
      {label && (
        <span className="text-xs uppercase tracking-wider font-semibold">
          {label}
        </span>
      )}
    </div>
  );
}

export default Spinner;
