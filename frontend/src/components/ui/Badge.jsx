import React from "react";
import { STATUS_BADGE, PRIORITY_BADGE } from "../../constants";

/** Generic pill badge. `variant` maps to badge-* classes in index.css. */
export function Badge({ variant = "neutral", children, className = "" }) {
  return <span className={`badge-${variant} ${className}`}>{children}</span>;
}

/** Complaint status pill with the correct semantic color. */
export function StatusBadge({ status, className = "" }) {
  const cls = STATUS_BADGE[status] || "badge-neutral";
  return <span className={`${cls} ${className}`}>{status || "Unknown"}</span>;
}

/** Priority pill; accepts an optional numeric score to show alongside. */
export function PriorityBadge({ level, score = null, className = "" }) {
  const lvl = level || "Medium";
  const cls = PRIORITY_BADGE[lvl] || "badge-neutral";
  return (
    <span className={`${cls} ${className}`}>
      {lvl}
      {score !== null && score !== undefined && (
        <span className="opacity-70 font-mono">· {score}</span>
      )}
    </span>
  );
}

export default Badge;
