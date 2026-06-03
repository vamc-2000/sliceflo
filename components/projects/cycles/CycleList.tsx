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
          "relative rounded-2xl border border-border bg-card shadow-sm border-l-4 overflow-hidden transition-all",
          theme.accent
        )}>
          {/* Group Header */}
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => toggleGroup(type)}
            data-testid={`cycle-list-group-toggle-${type}`}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm", theme.iconBg)}>
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: cn("h-5 w-5", theme.iconColor) })}
              </div>
              <div>
                <h2 className={cn("text-sm font-semibold tracking-tight", theme.text === "text-gray-400" ? "text-muted-foreground" : theme.text)}>{label}</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {type === "active" && items.length > 0 && (
                <>
                  <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-border shadow-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {format(new Date(items[0].startDate), "MMM d")} - {format(new Date(items[0].endDate), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-border shadow-sm">
                    <Link2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {items[0].taskCount || 0} tasks
                    </span>
                  </div>
                </>
              )}

              {type !== "active" && cyclesCount > 0 && (
                <div className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-[10px] font-bold text-muted-foreground">
                  {cyclesCount}
                </div>
              )}
              <button className="text-muted-foreground/60 hover:text-foreground transition-colors" data-testid={`cycle-list-group-arrow-${type}`}>
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
                      <div className="flex items-center justify-between p-1.5 rounded-lg border border-border bg-muted/60 transition-all">
                        <div className="flex items-center gap-3 flex-1 pl-2">
                          <h3 className="text-xs font-semibold text-muted-foreground tracking-tight">
                            Cooling Period
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-border shadow-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {format(new Date(item.startDate), "MMM d")} - {format(new Date(item.endDate), "MMM d, yyyy")}
                            </span>
                          </div>
                          <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" data-testid={`cycle-list-cooling-menu-${item.id}`}>
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
                <div className="py-10 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground text-sm italic bg-muted/20">
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
          border: "border-border",
          bg: "bg-card",
          iconBg: "bg-muted border-border",
          iconColor: "text-muted-foreground/60",
          timeline: "bg-muted-foreground/40",
          text: "text-muted-foreground",
          accent: "border-l-muted-foreground/30",
          connector: "bg-muted"
        }
      )}

      {/* ── Standalone Cooling Period Card ─────────── */}
      {activeCoolingPeriod && (
        <div className="relative mb-4 rounded-lg border border-border border-l-4 border-l-muted-foreground/30 bg-muted/30 p-1.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 pl-2">
            <h3 className="text-sm font-semibold text-muted-foreground tracking-tight">
              Cooling period
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-border shadow-sm">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground">
                {format(new Date(activeCoolingPeriod.startDate), "MMM d")} - {format(new Date(activeCoolingPeriod.endDate), "MMM d, yyyy")}
              </span>
            </div>
            <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" data-testid="cycle-list-active-cooling-menu">
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
          border: "border-border",
          bg: "bg-card",
          iconBg: "bg-primary/10 border-primary/20",
          iconColor: "text-primary",
          timeline: "bg-primary",
          text: "text-primary",
          accent: "border-l-primary",
          connector: "bg-muted"
        }
      )}

      {/* ── 3. Completed cycle ─────────────────────── */}
      {renderGroup(
        "completed",
        "Completed cycle",
        <RefreshCw />,
        completedItems,
        {
          border: "border-emerald-500/20",
          bg: "bg-card",
          iconBg: "bg-emerald-500/10 border-emerald-500/20",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          timeline: "bg-emerald-500",
          text: "text-emerald-600 dark:text-emerald-400",
          accent: "border-l-emerald-500",
          connector: "bg-emerald-500/20"
        }
      )}
    </div>
  );
}
