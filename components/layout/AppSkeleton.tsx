"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Theme-aware skeleton that's visible on both dark navy & white sidebar
const SidebarSkeleton = ({ className }: { className: string }) => (
  <div className={cn(
    "rounded animate-pulse",
    // Light mode: visible gray | Dark/Brand mode: white opacity
    "bg-black/10 dark:bg-white/20 [.brand_&]:bg-white/20",
    className
  )} />
);

const SidebarSeparator = () => (
  <div className="h-px w-full bg-black/10 dark:bg-white/15 [.brand_&]:bg-white/15 my-1" />
);

export function AppSkeleton() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">

      {/* ══ SIDEBAR ══ */}
      <div className="flex flex-col w-[210px] min-w-[210px] h-full bg-sidebar px-2 py-3 gap-1">

        {/* Logo + Workspace */}
        <div className="flex items-center gap-2 px-2 py-2 mb-1">
          <SidebarSkeleton className="h-7 w-7 rounded-md" />
          <div className="flex flex-col gap-1.5">
            <SidebarSkeleton className="h-3 w-24" />
            <SidebarSkeleton className="h-2.5 w-14 opacity-70" />
          </div>
          <SidebarSkeleton className="h-3 w-3 ml-auto" />
        </div>

        <SidebarSeparator />

        {/* Nav Items */}
        <div className="flex flex-col gap-0.5">
          {[
            { w: "w-16" },
            { w: "w-20" },
            { w: "w-10" },
            { w: "w-16", badge: true },
            { w: "w-10", chevron: true },
            { w: "w-20" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 px-2 py-[7px] rounded-md">
              <SidebarSkeleton className="h-4 w-4 rounded" />
              <SidebarSkeleton className={`h-2.5 ${item.w}`} />
              {item.badge && (
                <SidebarSkeleton className="h-4 w-7 ml-auto rounded-full" />
              )}
              {item.chevron && (
                <SidebarSkeleton className="h-3 w-3 ml-auto" />
              )}
            </div>
          ))}
        </div>

        <SidebarSeparator />

        {/* Favorites, Teams, Portfolio, Project */}
        {[
          { w: "w-16" },
          { w: "w-12" },
          { w: "w-16" },
          { w: "w-14" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 px-2 py-[7px]">
            <SidebarSkeleton className="h-4 w-4 rounded" />
            <SidebarSkeleton className={`h-2.5 ${item.w}`} />
            <SidebarSkeleton className="h-3 w-3 ml-auto rounded" />
          </div>
        ))}

        {/* Footer */}
        <div className="mt-auto flex flex-col gap-2 pt-3 border-t border-black/10 dark:border-white/15 [.brand_&]:border-white/15">
          {/* Trial row */}
          <div className="flex items-center gap-2 px-1">
            <SidebarSkeleton className="h-5 w-5 rounded-full" />
            <div className="flex flex-col gap-1">
              <SidebarSkeleton className="h-2.5 w-24" />
              <SidebarSkeleton className="h-2 w-14 opacity-70" />
            </div>
          </div>
          {/* Upgrade button */}
          <SidebarSkeleton className="h-8 w-full rounded-md" />
          {/* Invite + Help */}
          <div className="flex gap-2">
            <SidebarSkeleton className="h-8 flex-1 rounded-md" />
            <SidebarSkeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>

      {/* ══ RIGHT SIDE ══ */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center h-[52px] px-4 bg-header border-b border-black/10 dark:border-white/10 [.brand_&]:border-white/10 gap-3 shrink-0">
          <SidebarSkeleton className="h-6 w-6 rounded [.brand_&]:bg-white/20 dark:bg-white/20 bg-black/10" />
          <div className="flex-1 flex justify-center">
            <SidebarSkeleton className="h-8 w-72 rounded-md [.brand_&]:bg-white/15 dark:bg-white/15 bg-black/10" />
          </div>
          <div className="flex items-center gap-2">
            <SidebarSkeleton className="h-8 w-28 rounded-md [.brand_&]:bg-white/15 dark:bg-white/15 bg-black/10" />
            <SidebarSkeleton className="h-7 w-7 rounded-md [.brand_&]:bg-white/15 dark:bg-white/15 bg-black/10" />
            <SidebarSkeleton className="h-8 w-8 rounded-full [.brand_&]:bg-white/20 dark:bg-white/20 bg-black/10" />
          </div>
        </div>

        <div className="flex-1 bg-background" />
      </div>
    </div>
  );
}