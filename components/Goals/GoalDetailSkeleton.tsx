import { Skeleton } from "@/components/ui/skeleton"

export function GoalDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6 w-full">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-12" />
        <Skeleton className="h-3.5 w-3" />
        <Skeleton className="h-3.5 w-24" />
      </div>

      {/* ── 3 Column Grid ── */}
      <div className="grid grid-cols-[220px_1fr_200px] gap-6 mt-2">

        {/* ── Col 1: Goals Report ── */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24" />

          {/* Progress circle */}
          <div className="flex justify-center">
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>

          {/* Progress filter bars */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>

        {/* ── Col 2: Main Content ── */}
        <div className="flex flex-col gap-5">

          {/* Goal header — title + actions */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-64" />           {/* Goal title */}
              <Skeleton className="h-3.5 w-32" />         {/* Created on date */}
            </div>
            {/* Right: avatar + star + more */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-7 w-7 rounded" />
              <Skeleton className="h-7 w-7 rounded" />
              <Skeleton className="h-7 w-7 rounded" />
            </div>
          </div>

          {/* Rich text editor area */}
          <div className="flex flex-col gap-2 border border-border rounded-lg p-4 min-h-[160px]">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-3.5 w-4/6" />
            <Skeleton className="h-3.5 w-3/6 mt-2" />
          </div>

          {/* Assigned members row */}
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-7 rounded-full" />
            ))}
            <Skeleton className="h-7 w-7 rounded-full" />  {/* + add button */}
          </div>

          {/* Targets section */}
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border border-border rounded-lg p-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Col 3: Steps & Deadline ── */}
        <div className="flex flex-col gap-4">

          {/* Steps list */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full shrink-0" />
              <Skeleton className="h-3.5 w-36" />
            </div>
          ))}

          {/* End date chip */}
          <div className="mt-4 border border-border rounded-lg p-3">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

      </div>
    </div>
  )
}