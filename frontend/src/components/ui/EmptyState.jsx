import React from "react";

/** Empty / no-results placeholder used inside cards and panels. */
export function EmptyState({ icon: Icon, title, description, action = null }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-12 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-surfaceSoft border border-border flex items-center justify-center">
          <Icon className="w-6 h-6 text-muted" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-semibold text-text">{title}</h3>
        {description && (
          <p className="text-sm text-muted max-w-xs mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export default EmptyState;
