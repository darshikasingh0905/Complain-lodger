import React from "react";

/** Bare shimmer block — size it with className (h-*, w-*). */
export const Skeleton = ({ className = "" }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

/** Placeholder for a complaint-style list card. */
export const SkeletonListItem = () => (
  <div className="rounded-card border border-border bg-surface p-4 space-y-3">
    <div className="flex justify-between items-start">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-20 !rounded-full" />
    </div>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="flex justify-between pt-2 border-t border-border">
      <Skeleton className="h-5 w-16 !rounded-full" />
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

/** Placeholder for a stat/detail card. */
export const SkeletonCard = ({ lines = 3 }) => (
  <div className="card space-y-3">
    <Skeleton className="h-5 w-1/3" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-3 ${i % 2 ? "w-2/3" : "w-full"}`} />
    ))}
  </div>
);

/** Full list + detail workspace placeholder (admin panel / track page). */
export const SkeletonWorkspace = () => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div className="lg:col-span-4 space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
    <div className="lg:col-span-8 space-y-6">
      <SkeletonCard lines={5} />
      <SkeletonCard lines={4} />
    </div>
  </div>
);

export default Skeleton;
