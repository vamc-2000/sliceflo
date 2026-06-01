"use client";

import React, { useState, useMemo } from "react";
import { useProjectsStore } from "@/stores/projects-store";
import { CycleCard } from "./CycleCard";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calendar,
  MoreHorizontal,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isWithinInterval, isPast, isFuture } from "date-fns";
import { Button } from "@/components/ui/button";

interface CycleListProps {
  projectId: string;
}

interface CoolingPeriod {
  id: string;
  isCoolingPeriod: true;
  name: string;
  startDate: string;
  endDate: string;
}

export function CycleList({ projectId }: CycleListProps) {
  const { projects, deleteCycle } = useProjectsStore();

  const project = projects.find(p => p.id === projectId);
  const cycles = project?.cycles || [];

  const [expandedGroups, setExpandedGroups] = useState({
    active: true,
    upcoming: true,
    completed: false
  });

  // Helper to normalize dates to midnight for robust gap calculation
  const getMidnight = (d: Date) => {
    const res = new Date(d);
    res.setHours(0, 0, 0, 0);
    return res;
  };

  // Calculate cooling periods as gaps between chronologically sorted cycles
  const coolingPeriods = useMemo(() => {
    if (cycles.length < 2) return [];

    // Sort cycles ascending chronologically
    const sorted = [...cycles].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const periods: CoolingPeriod[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const currentCycle = sorted[i];
      const nextCycle = sorted[i + 1];

      const currentEnd = getMidnight(new Date(currentCycle.endDate));
      const nextStart = getMidnight(new Date(nextCycle.startDate));

      // Gap exists if nextStart is at least 2 days after currentEnd
      const diffMs = nextStart.getTime() - currentEnd.getTime();
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

      if (diffDays > 1) {
        const gapStart = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
        const gapEnd = new Date(nextStart.getTime() - 24 * 60 * 60 * 1000);
        periods.push({
          id: `cooling-${currentCycle.id}-${nextCycle.id}`,
          isCoolingPeriod: true,
          name: "Cooling Period",
          startDate: gapStart.toISOString(),
          endDate: gapEnd.toISOString()
        });
      }
    }

    return periods;
  }, [cycles]);

  // Upcoming cycles sorted ascending
  const upcomingCycles = useMemo(() => {
    return cycles
      .filter(c => isFuture(new Date(c.startDate)))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [cycles]);

  // Active cycles
  const activeCycles = useMemo(() => {
    const now = new Date();
    return cycles.filter(c =>
      isWithinInterval(now, { start: new Date(c.startDate), end: new Date(c.endDate) })
    );
  }, [cycles]);

  // Combine completed cycles and completed cooling periods, sorted descending chronologically
  const completedItems = useMemo(() => {
    const compCycles = cycles.filter(c => isPast(new Date(c.endDate)));
    const compCooling = coolingPeriods.filter(p => isPast(new Date(p.endDate)));

    return [...compCycles, ...compCooling].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [cycles, coolingPeriods]);

  // Standalone active or upcoming cooling period (between latest active/completed and future cycles)
  const activeCoolingPeriod = useMemo(() => {
    const activeOrUpcoming = coolingPeriods.filter(p => !isPast(new Date(p.endDate)));
    if (activeOrUpcoming.length === 0) return null;
    return activeOrUpcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
  }, [coolingPeriods]);

  const toggleGroup = (group: keyof typeof expandedGroups) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const renderGroup = (
    type: "active" | "upcoming" | "completed",
    label: string,
    icon: React.ReactNode,
    items: any[],
    theme: {
      border: string,
      bg: string,
      iconBg: string,
      iconColor: string,
      timeline: string,
      text: string,
      accent: string,
      connector: string
    }
  ) => {
    const isExpanded = expandedGroups[type];

    // Count actual cycles (excluding cooling periods)
    const cyclesCount = items.filter(item => !item.isCoolingPeriod).length;

    return (
      <div className={cn("relative mb-4 last:mb-0")}>
        <div className={cn(
          "relative rounded-2xl border border-gray-200 bg-white shadow-sm border-l-4 overflow-hidden transition-all",
          theme.accent
        )}>
          {/* Group Header */}
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
            onClick={() => toggleGroup(type)}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm", theme.iconBg)}>
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: cn("h-5 w-5", theme.iconColor) })}
              </div>
              <div>
                <h2 className={cn("text-sm font-semibold tracking-tight", theme.text === "text-gray-400" ? "text-gray-500" : theme.text)}>{label}</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {type === "active" && items.length > 0 && (
                <>
                  <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-500">
                      {format(new Date(items[0].startDate), "MMM d")} - {format(new Date(items[0].endDate), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
                    <Link2 className="h-3 w-3 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-500">
                      {items[0].taskCount || 0} tasks
                    </span>
                  </div>
                </>
              )}

              {type !== "active" && cyclesCount > 0 && (
                <div className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-500">
                  {cyclesCount}
                </div>
              )}
              <button className="text-gray-300 hover:text-gray-600 transition-colors">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {/* Items List Inside the Card */}
          {isExpanded && (
            <div className="px-3 pb-3 space-y-2">
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="w-full">
                    {item.isCoolingPeriod ? (
                      <div className="flex items-center justify-between p-1.5 rounded-lg border border-gray-200 bg-[#F1F3F5] transition-all">
                        <div className="flex items-center gap-3 flex-1 pl-2">
                          <h3 className="text-xs font-semibold text-gray-500 tracking-tight">
                            Cooling Period
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-200/60 shadow-sm">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-500">
                              {format(new Date(item.startDate), "MMM d")} - {format(new Date(item.endDate), "MMM d, yyyy")}
                            </span>
                          </div>
                          <Button variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <CycleCard
                        cycle={item}
                        type={type}
                        hideBadges={type === "active"}
                        onEdit={(c) => console.log("Edit", c)}
                        onDelete={(id) => deleteCycle(projectId, id)}
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className="py-10 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm italic bg-gray-50/50">
                  No {type} cycles found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* ── 1. Upcoming cycle ──────────────────────── */}
      {renderGroup(
        "upcoming",
        "Upcoming cycle",
        <RefreshCw />,
        upcomingCycles,
        {
          border: "border-slate-100",
          bg: "bg-white",
          iconBg: "bg-slate-50 border-slate-200",
          iconColor: "text-slate-400",
          timeline: "bg-slate-400",
          text: "text-gray-400",
          accent: "border-l-slate-300",
          connector: "bg-slate-100"
        }
      )}

      {/* ── Standalone Cooling Period Card ─────────── */}
      {activeCoolingPeriod && (
        <div className="relative mb-4 rounded-lg border border-gray-200 border-l-4 border-l-slate-300 bg-[#F8F9FA] p-1.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 pl-2">
            <h3 className="text-sm font-semibold text-gray-500 tracking-tight">
              Cooling period
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500">
                {format(new Date(activeCoolingPeriod.startDate), "MMM d")} - {format(new Date(activeCoolingPeriod.endDate), "MMM d, yyyy")}
              </span>
            </div>
            <Button variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── 2. Active cycle ────────────────────────── */}
      {renderGroup(
        "active",
        "Active cycle",
        <RefreshCw />,
        activeCycles,
        {
          border: "border-slate-100",
          bg: "bg-white",
          iconBg: "bg-slate-50 border-slate-200",
          iconColor: "text-[#001F3F]",
          timeline: "bg-[#001F3F]",
          text: "text-[#001F3F]",
          accent: "border-l-[#001F3F]",
          connector: "bg-slate-100"
        }
      )}

      {/* ── 3. Completed cycle ─────────────────────── */}
      {renderGroup(
        "completed",
        "Completed cycle",
        <RefreshCw />,
        completedItems,
        {
          border: "border-green-100",
          bg: "bg-white",
          iconBg: "bg-emerald-50 border-emerald-100",
          iconColor: "text-[#10B981]",
          timeline: "bg-[#10B981]",
          text: "text-[#10B981]",
          accent: "border-l-[#10B981]",
          connector: "bg-emerald-100"
        }
      )}
    </div>
  );
}
