"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Plus, ChevronRight as ChevronRightIcon } from "lucide-react";
import { useProjectsStore } from "@/stores/projects-store";
import { useProfileStore } from "@/stores/profile-store";
import { PriorityBadge } from "./utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatTaskId } from "@/utils/task-utils";

function getContrastYIQ(hexcolor: string) {
  if (!hexcolor) return "#334155";
  let hex = hexcolor.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return "#334155";
  }
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? "#1e293b" : "#ffffff";
}

const isCompleted = (status?: string) => {
  const s = status?.toLowerCase().trim() ?? "";
  return s === "done" || s === "completed" || s === "wont_do";
};

export function AssignedToMe() {
  const { myWork } = useProfileStore();
  const allProjects = useProjectsStore((s) => s.projects);
  const [filterType, setFilterType] = useState<"all" | "overdue" | "week" | "today">("all");

  const dynamicStatuses = useMemo(() => {
    const seen = new Set<string>();
    const statuses: { value: string; label: string; color: string; isFinal: boolean }[] = [];

    allProjects.forEach((p) => {
      (p.taskStatusConfig ?? []).forEach((s) => {
        if (!seen.has(s.value)) {
          seen.add(s.value);
          statuses.push({
            value: s.value,
            label: s.label,
            color: s.color,
            isFinal: s.isFinal ?? false,
          });
        }
      });
    });

    return statuses;
  }, [allProjects]);

  const myTasks = useMemo(() => {
    return (myWork?.tasks?.list || []).map((t) => ({
      ...t,
      name: t.title,
      endDate: t.endDate || t.dueDate,
    }));
  }, [myWork]);

  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    sevenDaysLater.setHours(23, 59, 59, 999);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    return myTasks.filter((t) => {
      if (filterType === "all") return true;

      const dateStr = t.endDate || t.dueDate;
      if (!dateStr) return false;

      const taskDate = new Date(dateStr);
      if (isNaN(taskDate.getTime())) return false;

      const isDone = isCompleted(t.status);

      if (filterType === "overdue") {
        return !isDone && taskDate < today;
      }
      if (filterType === "today") {
        return !isDone && taskDate >= today && taskDate <= endOfToday;
      }
      if (filterType === "week") {
        return !isDone && taskDate >= today && taskDate <= sevenDaysLater;
      }

      return true;
    });
  }, [myTasks, filterType]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "No date";
    try {
      return format(new Date(dateStr), "d MMM");
    } catch {
      return dateStr;
    }
  };

  if (myTasks.length === 0) {
    return (
      <div className="flex flex-col gap-3 h-full overflow-hidden">
        <h2 className="text-sm font-semibold tracking-tight shrink-0">Assigned to me</h2>
        <div className="rounded-xl border border-dashed p-8 text-center flex-1">
          <p className="text-xs text-muted-foreground">No tasks assigned to you yet.</p>
        </div>
      </div>
    );
  }

  // Exact header cell class from TaskTable (compact version)
  const headerCellCls = "!h-7 font-bold text-muted-foreground uppercase tracking-wider px-2 py-0 select-none text-center border-r border-border text-[10px]";
  const bodyCellCls = "!h-7 px-2 py-0 text-center border-r border-border text-xs";

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold tracking-tight">Assigned to me</h2>
          <Select value={filterType} onValueChange={(val) => setFilterType(val as any)}>
            <SelectTrigger className="h-7 w-[130px] text-[11px] font-medium bg-background">
              <SelectValue placeholder="Filter tasks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Tasks</SelectItem>
              <SelectItem value="overdue" className="text-xs">Overdue</SelectItem>
              <SelectItem value="today" className="text-xs">Due Today</SelectItem>
              <SelectItem value="week" className="text-xs">Due This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
          <Plus className="h-3.5 w-3.5" /> Add Task
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 pr-4 pb-4">
            <div className="overflow-hidden rounded-xl border bg-background shadow-none">
              <div className="overflow-x-auto w-full">
                <Table className="relative border-y border-border text-xs min-w-full">
                  <TableHeader>
                    <TableRow className="bg-card hover:bg-card border-b border-border">
                      <TableHead className="!h-9 px-3 py-0 text-left w-10 pl-4 border-r border-border" />
                      <TableHead className="!h-9 font-bold text-muted-foreground uppercase tracking-wider px-3 py-0 select-none text-center border-r border-border text-[10px] w-28">
                        ID
                      </TableHead>
                      <TableHead className="!h-9 font-bold text-muted-foreground uppercase tracking-wider px-3 py-0 select-none text-left border-r border-border text-[10px] max-w-0 w-full">
                        TASK
                      </TableHead>
                      <TableHead className={headerCellCls}>
                        <div className="flex items-center gap-1 justify-center">
                          DUE DATE <Info className="h-3 w-3 opacity-50" />
                        </div>
                      </TableHead>
                      <TableHead className={headerCellCls}>PRIORITY</TableHead>
                      <TableHead className={headerCellCls}>STATUS</TableHead>
                      <TableHead className="!h-9 px-3 py-0 text-center w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                          No tasks found matching this filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.map((item) => {
                        const project = allProjects.find((p) => p.id === item.projectId);
                        const projectSlug = project?.slug || "TASK";
                        const formattedId = formatTaskId(projectSlug, item.taskNumber);

                        const statusCfg = dynamicStatuses.find(
                          (s) => s.value.toLowerCase().trim() === (item.status ?? "").toLowerCase().trim()
                        );
                        const statusColor = statusCfg?.color || "#e2e8f0";
                        const statusLabel = statusCfg?.label || item.status || "To Do";

                        return (
                          <TableRow key={item.id} className="group bg-card hover:bg-card border-b border-border transition-colors">
                            <TableCell className="!h-9 px-3 py-0 text-left pl-4 border-r border-border w-10">
                              <Checkbox className="h-3.5 w-3.5 rounded" />
                            </TableCell>
                            <TableCell className="!h-9 px-3 py-0 text-center border-r border-border text-xs text-muted-foreground font-medium w-28">
                              {formattedId}
                            </TableCell>
                            <TableCell className="!h-7 px-2 py-0 text-left border-r border-border overflow-hidden max-w-0 w-full">
                              <div className="flex items-center gap-2 min-w-0">
                                <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="text-sm font-medium truncate">{item.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className={cn(bodyCellCls, "text-xs text-muted-foreground")}>
                              {formatDate(item.endDate)}
                            </TableCell>
                            <TableCell className={bodyCellCls}>
                              <PriorityBadge priority={item.priority || "medium"} />
                            </TableCell>
                            <TableCell className="!p-0.5 text-center min-w-[90px] border-r border-border" style={{ height: "1px" }}>
                              <div
                                className="w-full h-full flex items-center justify-center rounded-xs text-foreground text-[10px] font-bold transition-opacity hover:opacity-90 overflow-hidden px-2 py-0.5 shadow-xs uppercase tracking-wider"
                                style={{
                                  backgroundColor: statusColor,
                                  color: getContrastYIQ(statusColor),
                                }}
                              >
                                <span className="truncate w-full text-center">
                                  {statusLabel}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="!h-7 px-2 py-0 text-center w-10" />
                          </TableRow>
                        );
                      })
                    )}

                    <TableRow className="hover:bg-transparent">
                      <TableCell className="py-2 pl-4" colSpan={3}>
                        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                          <Plus className="h-3.5 w-3.5" /> Add Task
                        </button>
                      </TableCell>
                      <TableCell colSpan={4} />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}