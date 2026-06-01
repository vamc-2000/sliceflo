
"use client";

import { useMemo, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { useProjectsStore } from "@/stores/projects-store";
import { useProfileStore } from "@/stores/profile-store";

export function WorkloadPieChart() {
  const projects = useProjectsStore((s) => s.projects);
  const { myWork } = useProfileStore();
  const [viewMode, setViewMode] = useState<"status" | "type">("status");

  const myTasks = useMemo(() => {
    return myWork?.tasks?.list || [];
  }, [myWork]);

  const normalize = (s: string) => (s || "").toLowerCase().replace(/[_-]/g, ' ');

  const dynamicStatuses = useMemo(() => {
    const allConfigs = projects.flatMap(p => p.taskStatusConfig || []);
    const uniqueMap: Record<string, { label: string; color: string; value: string }> = {};

    allConfigs.forEach(config => {
      if (!uniqueMap[config.value]) {
        uniqueMap[config.value] = {
          label: config.label,
          color: config.color,
          value: config.value
        };
      }
    });

    if (Object.keys(uniqueMap).length === 0) {
      return [
        { label: "Not started", color: "#94a3b8", value: "not_started" },
        { label: "Working on", color: "#3b82f6", value: "working_on" },
        { label: "Completed", color: "#22c55e", value: "completed" },
      ];
    }

    return Object.values(uniqueMap);
  }, [projects]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    dynamicStatuses.forEach(s => counts[s.value] = 0);

    myTasks.forEach(t => {
      const taskStatus = normalize(t.status || "");

      const match = dynamicStatuses.find(s =>
        normalize(s.value) === taskStatus ||
        normalize(s.label) === taskStatus
      );

      if (match) {
        counts[match.value]++;
      } else {

        const fallback = dynamicStatuses.find(s => {
          const val = normalize(s.value);
          const lab = normalize(s.label);
          if (taskStatus.includes('progress') || taskStatus.includes('working')) {
            return val.includes('progress') || val.includes('working');
          }
          if (taskStatus.includes('todo') || taskStatus.includes('backlog')) {
            return val.includes('todo') || val.includes('backlog') || val.includes('start');
          }
          if (taskStatus.includes('done') || taskStatus.includes('complete')) {
            return val.includes('done') || val.includes('complete');
          }
          return false;
        });

        if (fallback) {
          counts[fallback.value]++;
        } else {
          const first = dynamicStatuses[0];
          if (first) counts[first.value]++;
        }
      }
    });
    return counts;
  }, [myTasks, dynamicStatuses]);

  const workloadData = dynamicStatuses.map(s => ({
    label: s.label,
    value: s.value,
    count: statusCounts[s.value],
    color: s.color
  }));

  const total = myTasks.length;
  const completedCount = workloadData
    .filter(s => normalize(s.value).includes('complete') || normalize(s.value).includes('done'))
    .reduce((acc, s) => acc + s.count, 0);

  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const highestStatus = [...workloadData].sort((a, b) => b.count - a.count)[0];

  const taskTypeColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e", "#06b6d4", "#ec4899", "#8b5cf6"];

  const taskTypeData = useMemo(() => {
    const apiTypes = myWork?.taskTypes || [];
    return apiTypes.map((t, idx) => ({
      taskType: t.taskType,
      count: t.count,
      percentage: t.percentage,
      color: taskTypeColors[idx % taskTypeColors.length],
    }));
  }, [myWork]);

  const taskTypesTotal = useMemo(() => {
    return taskTypeData.reduce((acc, t) => acc + t.count, 0);
  }, [taskTypeData]);

  const highestType = useMemo(() => {
    return [...taskTypeData].sort((a, b) => b.count - a.count)[0];
  }, [taskTypeData]);

  const chartData = useMemo(() => {
    if (viewMode === "status") {
      return total === 0
        ? dynamicStatuses.map((s) => ({ name: s.label, value: 1, color: s.color }))
        : workloadData.filter((s) => s.count > 0).map((s) => ({ name: s.label, value: s.count, color: s.color }));
    } else {
      return taskTypesTotal === 0
        ? [{ name: "No tasks", value: 1, color: "#94a3b8" }]
        : taskTypeData.filter((t) => t.count > 0).map((t) => ({ name: t.taskType, value: t.count, color: t.color }));
    }
  }, [viewMode, total, workloadData, dynamicStatuses, taskTypeData, taskTypesTotal]);

  return (
    <Card className="rounded-2xl border bg-background shadow-none mt-1">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">Workload Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {viewMode === "status" ? "Dynamic status overview across all projects" : "Task type breakdown and percentages"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-muted p-0.5 rounded-lg border">
              <button
                onClick={() => setViewMode("status")}
                className={cn(
                  "text-xs px-3 py-1 rounded-md font-medium transition-all",
                  viewMode === "status"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Status
              </button>
              <button
                onClick={() => setViewMode("type")}
                className={cn(
                  "text-xs px-3 py-1 rounded-md font-medium transition-all",
                  viewMode === "type"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Task Type
              </button>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium shrink-0">
              {viewMode === "status" ? total : taskTypesTotal} Total Tasks
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="flex flex-col gap-3 w-full lg:w-1/2">
            {viewMode === "status" ? (
              total > 0 && highestStatus && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: highestStatus.color }} />
                  <p className="text-xs text-muted-foreground">
                    Highest: <span className="font-semibold text-foreground">{highestStatus.label}</span>
                    {' — '}<span className="font-semibold text-foreground">{highestStatus.count} tasks</span>
                  </p>
                </div>
              )
            ) : (
              taskTypesTotal > 0 && highestType && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: highestType.color }} />
                  <p className="text-xs text-muted-foreground">
                    Highest: <span className="font-semibold text-foreground capitalize">{highestType.taskType}</span>
                    {' — '}<span className="font-semibold text-foreground">{highestType.count} tasks</span>
                  </p>
                </div>
              )
            )}

            <div className="grid grid-cols-1 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
              {viewMode === "status" ? (
                workloadData.map((s) => {
                  const percent = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <div key={s.value} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-xs font-medium flex-1 truncate">{s.label}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white shrink-0" style={{ backgroundColor: s.color }}>
                        {s.count}
                      </span>
                      <div className="relative w-20 h-5 rounded-md bg-muted overflow-hidden shrink-0">
                        <div className="absolute inset-y-0 left-0 rounded-md transition-all duration-700" style={{ width: `${percent}%`, backgroundColor: s.color, opacity: 0.25 }} />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">{percent}%</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                taskTypeData.map((t) => (
                  <div key={t.taskType} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-xs font-medium flex-1 truncate capitalize">{t.taskType}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white shrink-0" style={{ backgroundColor: t.color }}>
                      {t.count}
                    </span>
                    <div className="relative w-20 h-5 rounded-md bg-muted overflow-hidden shrink-0">
                      <div className="absolute inset-y-0 left-0 rounded-md transition-all duration-700" style={{ width: `${t.percentage}%`, backgroundColor: t.color, opacity: 0.25 }} />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">{t.percentage}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col items-center gap-4">
            <div className="relative w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={72} outerRadius={108} paddingAngle={4} cornerRadius={6} dataKey="value" startAngle={90} endAngle={-270}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#94a3b8'} stroke="none" opacity={(viewMode === "status" ? total : taskTypesTotal) === 0 ? 0.25 : 1} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '13px' }} formatter={(value: number, name: string) => [`${value} tasks`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold leading-none">
                  {viewMode === "status" ? total : taskTypesTotal}
                </span>
                <span className="text-xs text-muted-foreground mt-1.5">Total Tasks</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              {viewMode === "status" ? (
                workloadData.slice(0, 6).map((s) => (
                  <div key={s.value} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                ))
              ) : (
                taskTypeData.slice(0, 6).map((t) => (
                  <div key={t.taskType} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-xs text-muted-foreground capitalize">{t.taskType}</span>
                  </div>
                ))
              )}
              {viewMode === "status" ? (
                workloadData.length > 6 && <span className="text-xs text-muted-foreground">+{workloadData.length - 6} more</span>
              ) : (
                taskTypeData.length > 6 && <span className="text-xs text-muted-foreground">+{taskTypeData.length - 6} more</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
