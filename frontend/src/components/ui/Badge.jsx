import React from "react";
import { HeartHandshake } from "lucide-react";
import { STATUS_BADGE, PRIORITY_BADGE } from "../../constants";
import { useLanguage } from "../../context/LanguageContext";

/**
 * Translate an enumerable value (status/priority) via the current language,
 * keeping the canonical English value as the fallback. Used so badges render
 * localized text everywhere without every call site touching i18n.
 */
const useEnumLabel = () => {
  const { t } = useLanguage();
  return (prefix, value) => {
    if (!value) return value;
    const key = `${prefix}.${value}`;
    const translated = t(key);
    return translated === key ? value : translated; // fall back to raw value
  };
};

/** Generic pill badge. `variant` maps to badge-* classes in index.css. */
export function Badge({ variant = "neutral", children, className = "" }) {
  return <span className={`badge-${variant} ${className}`}>{children}</span>;
}

/** Complaint status pill with the correct semantic color (localized label). */
export function StatusBadge({ status, className = "" }) {
  const label = useEnumLabel();
  const cls = STATUS_BADGE[status] || "badge-neutral";
  return <span className={`${cls} ${className}`}>{status ? label("st", status) : "—"}</span>;
}

/** Priority pill; accepts an optional numeric score to show alongside (localized). */
export function PriorityBadge({ level, score = null, className = "" }) {
  const label = useEnumLabel();
  const lvl = level || "Medium";
  const cls = PRIORITY_BADGE[lvl] || "badge-neutral";
  return (
    <span className={`${cls} ${className}`}>
      {label("pr", lvl)}
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
  const { t } = useLanguage();
  const label = t("nav.safety") !== "nav.safety" ? t("nav.safety") : "Safety";
  return (
    <span className={`badge-safety ${compact ? "!text-[10px] !px-2" : ""} ${className}`}>
      <HeartHandshake className="w-3 h-3" />
      {label}
    </span>
  );
}

export default Badge;
