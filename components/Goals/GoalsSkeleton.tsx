import { Skeleton } from "@/components/ui/skeleton"

export function GoalsSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Favourites Section */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-40 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Recents Section */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-40 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2">
        {["All Goals", "My Goals", "Organization", "Team", "Private"].map((tab) => (
          <Skeleton key={tab} className="h-5 w-20" />
        ))}
      </div>

      {/* Table rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>

    </div>
  )
}



// import { Skeleton } from "@/components/ui/skeleton"

// // ── Single Card Skeleton ──
// function CardSkeleton() {
//   return (
//     <div className="rounded-xl border border-border bg-card w-44 shrink-0 overflow-hidden">
//       {/* Colored top bar */}
//       <div className="h-14 bg-muted w-full" />

//       {/* Bottom content */}
//       <div className="p-3 space-y-2">
//         <Skeleton className="h-3.5 w-28" />
//         <div className="flex items-center gap-1.5">
//           <Skeleton className="h-4 w-4 rounded-full" />
//           <Skeleton className="h-3 w-16" />
//         </div>
//       </div>
//     </div>
//   )
// }

// // ── Section with Cards Skeleton ──
// function SectionSkeleton() {
//   return (
//     <div className="space-y-3">
//       {/* Section title */}
//       <div className="flex items-center justify-between">
//         <Skeleton className="h-4 w-24" />
//         <Skeleton className="h-4 w-12" />
//       </div>

//       {/* Cards row */}
//       <div className="flex gap-3">
//         {Array.from({ length: 5 }).map((_, i) => (
//           <CardSkeleton key={i} />
//         ))}
//       </div>
//     </div>
//   )
// }

// // ── Table Row Skeleton ──
// function TableRowSkeleton() {
//   return (
//     <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 px-4 py-3 border-b border-border/40 items-center">
//       {/* Goal name */}
//       <div className="flex items-center gap-2">
//         <Skeleton className="h-5 w-5 rounded shrink-0" />
//         <Skeleton className="h-3.5 w-36" />
//       </div>
//       {/* Type */}
//       <Skeleton className="h-5 w-16 rounded-full" />
//       {/* Date viewed */}
//       <Skeleton className="h-3.5 w-14" />
//       {/* Date updated */}
//       <Skeleton className="h-3.5 w-14" />
//       {/* Avatar */}
//       <Skeleton className="h-6 w-6 rounded-full" />
//     </div>
//   )
// }

// // ── Main Skeleton ──
// export function GoalsSkeleton() {
//   return (
//     <div className="flex flex-col gap-8 p-6 w-full">

//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <Skeleton className="h-6 w-14" />
//         <Skeleton className="h-9 w-36 rounded-lg" />
//       </div>

//       {/* Favourites */}
//       <SectionSkeleton />

//       {/* Recents */}
//       <SectionSkeleton />

//       {/* Divider */}
//       <div className="border-t border-border/40" />

//       {/* Tabs */}
//       <div className="flex items-center gap-6">
//         {[72, 60, 96, 72, 52].map((w, i) => (
//           <Skeleton key={i} className="h-4 rounded-full" style={{ width: w }} />
//         ))}
//       </div>

//       {/* Table Header */}
//       <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 px-4">
//         {["w-20", "w-10", "w-20", "w-20", "w-12"].map((w, i) => (
//           <Skeleton key={i} className={`h-3 ${w}`} />
//         ))}
//       </div>

//       {/* Table Rows */}
//       <div className="-mt-4">
//         {Array.from({ length: 7 }).map((_, i) => (
//           <TableRowSkeleton key={i} />
//         ))}
//       </div>

//     </div>
//   )
// }