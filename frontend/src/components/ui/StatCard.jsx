import React from "react";

/**
 * Dashboard metric tile: label, big number, icon chip.
 * `tone` picks the icon chip + number color: primary | success | warning | error | info | neutral
 */
const TONES = {
  primary: { chip: "bg-primary-light", icon: "text-primary", value: "text-text" },
  success: { chip: "bg-status-success-bg", icon: "text-status-success-accent", value: "text-status-success-text" },
  warning: { chip: "bg-status-warning-bg", icon: "text-status-warning-accent", value: "text-status-warning-text" },
  error: { chip: "bg-status-error-bg", icon: "text-status-error-accent", value: "text-status-error-text" },
  info: { chip: "bg-status-info-bg", icon: "text-status-info-accent", value: "text-status-info-text" },
  neutral: { chip: "bg-status-neutral-bg", icon: "text-status-neutral-accent", value: "text-text" },
};

export function StatCard({ label, value, icon: Icon, tone = "primary", hint = null }) {
  const t = TONES[tone] || TONES.primary;
  return (
    <div className="card">
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h2 className={`text-3xl font-bold ${t.value}`}>{value}</h2>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl ${t.chip} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${t.icon}`} />
          </div>
        )}
      </div>
      {hint && <p className="text-xs text-muted mt-2">{hint}</p>}
    </div>
  );
}

export default StatCard;
