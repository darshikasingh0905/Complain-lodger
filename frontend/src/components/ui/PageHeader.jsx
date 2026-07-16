import React from "react";

/**
 * Standard page heading: optional eyebrow pill, title, description,
 * and a right-aligned actions slot.
 */
export function PageHeader({ eyebrow, icon: Icon, title, description, actions = null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold mb-3">
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-text">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export default PageHeader;
