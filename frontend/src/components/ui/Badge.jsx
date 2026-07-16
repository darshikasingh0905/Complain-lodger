import React from "react";
import { HeartHandshake } from "lucide-react";
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

/**
 * Pink "Safety" pill — the safety identity badge shown next to any complaint
 * flagged as a safety report (see isSafetyComplaint in constants). Always
 * pink, in every theme, so safety reports stand out in mixed lists.
 */
export function SafetyBadge({ className = "", compact = false }) {
  return (
    <span className={`badge-safety ${compact ? "!text-[10px] !px-2" : ""} ${className}`}>
      <HeartHandshake className="w-3 h-3" />
      Safety
    </span>
  );
}

export default Badge;
