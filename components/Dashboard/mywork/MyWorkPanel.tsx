"use client";

import { useState, useMemo } from "react";
import { useProjectsStore } from "@/stores/projects-store";
import { useProfileStore } from "@/stores/profile-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart2,
  Briefcase,
  Calendar,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MyWorkPanel() {
  const projects = useProjectsStore((s) => s.projects);
  const { myWork } = useProfileStore();
  const [activeTab, setActiveTab] = useState<"priority" | "project" | "timeline">("priority");

  const myTasks = useMemo(() => {
    return myWork?.tasks?.list || [];
  }, [myWork]);

  // Statistics
  const total = myTasks.length;

  const completedTasks = useMemo(() => {
    return myTasks.filter((t) => {
      const status = t.status?.toLowerCase().trim() ?? "";
      return status === "done" || status === "completed" || status === "wont_do";
    });
  }, [myTasks]);

  const activeCount = total - completedTasks.length;

  const urgentTasks = useMemo(() => {
    return myTasks.filter((t) => {
      const status = t.status?.toLowerCase().trim() ?? "";
      const isDone = status === "done" || status === "completed" || status === "wont_do";
      return !isDone && t.priority?.toLowerCase() === "high";
    });
  }, [myTasks]);

  const dueSoonTasks = useMemo(() => {
    return myTasks.filter((t) => {
      const status = t.status?.toLowerCase().trim() ?? "";
      const isDone = status === "done" || status === "completed" || status === "wont_do";
      if (isDone || !t.endDate && !t.dueDate) return false;

      const dateStr = t.endDate || t.dueDate;
      if (!dateStr) return false;

      try {
        const dueDate = new Date(dateStr);
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3; // due in next 3 days
      } catch {
        return false;
      }
    });
  }, [myTasks]);

  const completionRate = total > 0 ? Math.round((completedTasks.length / total) * 100) : 0;

  // Breakdown by Priority
  const priorityBreakdown = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0, none: 0 };
    myTasks.forEach((t) => {
      const status = t.status?.toLowerCase().trim() ?? "";
      const isDone = status === "done" || status === "completed" || status === "wont_do";
      if (isDone) return; // Only map active tasks

      const prio = t.priority?.toLowerCase().trim() ?? "none";
      if (prio === "high") counts.high++;
      else if (prio === "medium") counts.medium++;
      else if (prio === "low") counts.low++;
      else counts.none++;
    });
    return counts;
  }, [myTasks]);

  // Breakdown by Project
  const projectBreakdown = useMemo(() => {
    const counts: Record<string, { id: string; name: string; active: number; completed: number; total: number; color: string }> = {};

    myTasks.forEach((t) => {
      if (!t.projectId) return;

      const status = t.status?.toLowerCase().trim() ?? "";
      const isDone = status === "done" || status === "completed" || status === "wont_do";

      if (!counts[t.projectId]) {
        const proj = projects.find((p) => p.id === t.projectId);
        counts[t.projectId] = {
          id: t.projectId,
          name: t.projectName || proj?.name || "Other",
          active: 0,
          completed: 0,
          total: 0,
          color: proj?.color || "#6b7280"
        };
      }

      counts[t.projectId].total++;
      if (isDone) counts[t.projectId].completed++;
      else counts[t.projectId].active++;
    });

    return Object.values(counts).sort((a, b) => b.active - a.active);
  }, [myTasks, projects]);

  // SVG Circular Gauge Calculations
  const radius = 38;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-bold tracking-tight" data-testid="mywork-panel-title">Workload Analytics</h2>
          <p className="text-[11px] text-muted-foreground">Real-time status of your assigned tasks</p>
        </div>
        <div className="flex items-center gap-1 text-[11px] bg-muted/50 px-2 py-0.5 rounded-md border text-muted-foreground font-medium" data-testid="mywork-panel-workload-badge">
          <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
          Active Workload
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col gap-4">
        {/* Row 1: Completion Ring & Metrics Summary */}
        <div className="grid grid-cols-[110px_1fr] gap-4 p-3.5 rounded-xl border bg-muted/20 shrink-0" data-testid="mywork-panel-summary-card">
          {/* Progress Circular Gauge */}
          <div className="flex flex-col items-center justify-center relative" data-testid="mywork-panel-circular-progress">
            <svg width="90" height="90" className="-rotate-90">
              {/* Background Ring */}
              <circle
                cx="45"
                cy="45"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                className="text-muted/30"
              />
              {/* Foreground Animated Gauge */}
              <circle
                cx="45"
                cy="45"
                r={radius}
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-bold text-foreground leading-none">{completionRate}%</span>
              <span className="text-[9px] text-muted-foreground font-medium mt-0.5">Done</span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 align-middle">
            {/* Active Tasks Card */}
            <div className="flex flex-col justify-center p-2 rounded-lg bg-background border hover:border-blue-500/30 transition-colors" data-testid="mywork-panel-active-stats">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                <Clock className="h-3 w-3 text-blue-500 shrink-0" />
                <span>Active</span>
              </div>
              <span className="text-lg font-bold text-foreground mt-1 leading-none">
                {activeCount}
              </span>
              <span className="text-[8px] text-muted-foreground mt-0.5">pending</span>
            </div>

            {/* Urgent Card */}
            <div className="flex flex-col justify-center p-2 rounded-lg bg-background border hover:border-red-500/30 transition-colors" data-testid="mywork-panel-urgent-stats">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                <span>Urgent</span>
              </div>
              <span className="text-lg font-bold text-red-600 mt-1 leading-none">
                {urgentTasks.length}
              </span>
              <span className="text-[8px] text-muted-foreground mt-0.5">high priority</span>
            </div>

            {/* Due Soon Card */}
            <div className="flex flex-col justify-center p-2 rounded-lg bg-background border hover:border-amber-500/30 transition-colors" data-testid="mywork-panel-due-soon-stats">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                <Calendar className="h-3 w-3 text-amber-500 shrink-0" />
                <span>Due 3d</span>
              </div>
              <span className="text-lg font-bold text-amber-600 mt-1 leading-none">
                {dueSoonTasks.length}
              </span>
              <span className="text-[8px] text-muted-foreground mt-0.5">action needed</span>
            </div>
          </div>
        </div>

        {/* Row 2: Breakdown Tabs & Visuals */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="w-full h-full flex flex-col min-h-0"
          >
            <TabsList className="h-8 p-0.5 bg-muted/40 rounded-lg flex shrink-0 border border-border/50" data-testid="mywork-panel-tabs-list">
              <TabsTrigger
                value="priority"
                className="text-[10px] py-1 rounded-md flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium"
                data-testid="mywork-panel-tab-priority"
              >
                <BarChart2 className="h-3 w-3 mr-1" />
                Priority Load
              </TabsTrigger>
              <TabsTrigger
                value="project"
                className="text-[10px] py-1 rounded-md flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium"
                data-testid="mywork-panel-tab-project"
              >
                <Briefcase className="h-3 w-3 mr-1" />
                By Project
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-3">
              <ScrollArea className="h-full">
                {/* Priority Breakdown View */}
                <TabsContent value="priority" className="mt-0 h-full">
                  <div className="space-y-3.5 pr-2">
                    {/* High Priority Tracker */}
                    <div className="space-y-1" data-testid="mywork-panel-priority-high">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          High Priority
                        </span>
                        <span className="text-muted-foreground font-medium">
                          {priorityBreakdown.high} tasks
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${activeCount > 0 ? (priorityBreakdown.high / activeCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Medium Priority Tracker */}
                    <div className="space-y-1" data-testid="mywork-panel-priority-medium">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Medium Priority
                        </span>
                        <span className="text-muted-foreground font-medium">
                          {priorityBreakdown.medium} tasks
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${activeCount > 0 ? (priorityBreakdown.medium / activeCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Low Priority Tracker */}
                    <div className="space-y-1" data-testid="mywork-panel-priority-low">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Low Priority
                        </span>
                        <span className="text-muted-foreground font-medium">
                          {priorityBreakdown.low} tasks
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${activeCount > 0 ? (priorityBreakdown.low / activeCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* No Priority Tracker */}
                    <div className="space-y-1" data-testid="mywork-panel-priority-none">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          No Priority
                        </span>
                        <span className="text-muted-foreground font-medium">
                          {priorityBreakdown.none} tasks
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-slate-400 to-slate-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${activeCount > 0 ? (priorityBreakdown.none / activeCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Project Workload View */}
                <TabsContent value="project" className="mt-0 h-full">
                  <div className="space-y-3.5 pr-2">
                    {projectBreakdown.length === 0 ? (
                      <div className="py-8 text-center border border-dashed rounded-xl">
                        <p className="text-xs text-muted-foreground">No tasks linked to projects.</p>
                      </div>
                    ) : (
                      projectBreakdown.map((item) => {
                        const projPercent = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;

                        return (
                          <div key={item.id} className="space-y-1 bg-background border p-2.5 rounded-xl hover:shadow-xs transition-shadow" data-testid={`mywork-panel-project-card-${item.id}`}>
                            <div className="flex items-center justify-between text-[11px] font-medium">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: item.color }} />
                                <span className="text-foreground font-semibold truncate max-w-[160px]">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                                <span className="text-blue-500 font-semibold">{item.active} active</span>
                                <span>/</span>
                                <span>{item.total} total</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${projPercent}%`,
                                    backgroundColor: item.color,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground w-8 shrink-0 text-right">
                                {projPercent}%
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}