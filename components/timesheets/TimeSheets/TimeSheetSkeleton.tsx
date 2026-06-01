"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function TimesheetSkeleton() {
  return (
    <div className="space-y-4 px-6 py-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Table header */}
      <div className="grid grid-cols-8 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>

      {/* Table rows */}
      {[...Array(5)].map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-8 gap-4 items-center"
        >
          {[...Array(8)].map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className="h-5 w-full rounded-md"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
