"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProfileStore } from "@/stores/profile-store";
import { StatusBadge } from "./utils";
import { ALL_PORTFOLIO_FIELDS } from "@/components/portfolios/views/list-view/common/PortfolioFieldVisibilityPopup";

const RECENT_PROJECT_FIELDS = ALL_PORTFOLIO_FIELDS.filter(f => f.id !== "members" && f.id !== "viewers");

const PAGE_SIZE = 8;

// Format date nicely
function formatDate(date: string | null | undefined) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function RecentProjectsTable() {
  const { projects: storeProjects } = useProjectsStore();
  const { myWork } = useProfileStore();
  const { currentWorkspace, workspaceMembers, fetchWorkspaceMembers } = useWorkspaceStore();
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(RECENT_PROJECT_FIELDS.map(f => f.id)));

  useEffect(() => {
    if (currentWorkspace?.id && workspaceMembers.length === 0) {
      fetchWorkspaceMembers(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, workspaceMembers.length, fetchWorkspaceMembers]);

  const projects = useMemo(() => {
    return myWork?.projects || [];
  }, [myWork]);

  const tasks = useMemo(() => {
    return myWork?.tasks?.list || [];
  }, [myWork]);

  const dynamicProjectPriorities = useMemo(() => {
    const seen = new Set<string>();
    const priorities: { value: string; label: string; color: string; order?: number }[] = [];

    storeProjects.forEach((p) => {
      (p.projectPriorityConfig ?? []).forEach((pr) => {
        if (!seen.has(pr.value)) {
          seen.add(pr.value);
          priorities.push({
            value: pr.value,
            label: pr.label,
            color: pr.color,
            order: pr.order,
          });
        }
      });
    });

    return priorities;
  }, [storeProjects]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const isAllSelected = pageData.length > 0 && pageData.every((p) => selected.has(p.id!));

  const toggleAll = () => {
    const next = new Set(selected);
    if (isAllSelected) pageData.forEach((p) => next.delete(p.id!));
    else pageData.forEach((p) => next.add(p.id!));
    setSelected(next);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleCol = (col: string) => {
    const field = RECENT_PROJECT_FIELDS.find(f => f.id === col);
    if (field?.required) return;

    const next = new Set(visibleCols);
    next.has(col) ? next.delete(col) : next.add(col);
    setVisibleCols(next);
  };

  // Calculate real progress per project from tasks
  const getProgress = (projectId: string, project: any) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;

    const fullProject = storeProjects.find((sp) => sp.id === projectId);
    const finalStatuses = new Set(
      fullProject?.taskStatusConfig?.filter((s) => s.isFinal).map((s) => s.value.toLowerCase().trim()) ?? ["done", "completed"]
    );
    const done = projectTasks.filter((t) =>
      finalStatuses.has(t.status?.toLowerCase().trim() ?? "") || (t as any).completed === true
    ).length;

    return Math.round((done / projectTasks.length) * 100);
  };

  return (
    <Card className="rounded-2xl border bg-background shadow-none" data-testid="recent-projects-card">
      <CardContent className="p-5">
        <p className="text-sm font-bold mb-4" data-testid="recent-projects-title">Recent Projects</p>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <Input
            placeholder="Filter projects..."
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(0); }}
            className="h-9 w-[280px] text-sm"
            data-testid="recent-projects-filter-input"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-1.5 text-sm font-medium" data-testid="recent-projects-columns-trigger">
                Columns <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {RECENT_PROJECT_FIELDS.map((field) => (
                <DropdownMenuCheckboxItem
                  key={field.id}
                  checked={visibleCols.has(field.id)}
                  onCheckedChange={() => toggleCol(field.id)}
                  disabled={field.required}
                  className="text-sm"
                  data-testid={`recent-projects-column-checkbox-${field.id}`}
                >
                  {field.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden">
          <Table data-testid="recent-projects-table">
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20">
                <TableHead className="w-12 pl-4 h-8 py-0.5 align-middle">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} className="h-4 w-4" data-testid="recent-projects-checkbox-select-all" />
                </TableHead>
                {RECENT_PROJECT_FIELDS.map(field =>
                  visibleCols.has(field.id) && (
                    <TableHead key={field.id} className="text-xs font-semibold text-muted-foreground whitespace-nowrap h-8 py-0.5 align-middle">
                      {field.label}
                    </TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleCols.size + 1} className="text-center text-xs text-muted-foreground py-10">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                pageData.map((p) => {
                  const isSelected = selected.has(p.id!);
                  const progress = getProgress(p.id!, p);

                  return (
                    <TableRow
                      key={p.id}
                      className={cn("hover:bg-muted/40 transition-colors", isSelected && "bg-muted/30")}
                      data-testid={`recent-projects-row-${p.id}`}
                    >
                      {/* Checkbox */}
                      <TableCell className="pl-4 py-1 h-9 align-middle">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(p.id!)} className="h-4 w-4" data-testid={`recent-projects-checkbox-row-${p.id}`} />
                      </TableCell>

                      {RECENT_PROJECT_FIELDS.map(field => {
                        if (!visibleCols.has(field.id)) return null;

                        switch (field.id) {
                          case "id":
                            return (
                              <TableCell key={field.id} className="py-1 h-9 align-middle">
                                <span className="text-xs text-muted-foreground font-mono">{(p.slug || p.id?.slice(-6).toUpperCase()) ?? "—"}</span>
                              </TableCell>
                            );
                          case "name":
                            return (
                              <TableCell key={field.id} className="py-1 h-9 align-middle">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: p.color ?? "#6B7280" }}
                                  />
                                  <span className="text-sm font-medium whitespace-nowrap">{p.name}</span>
                                </div>
                              </TableCell>
                            );
                          case "phase":
                            return (
                              <TableCell key={field.id} className="py-1 h-9 align-middle">
                                <span className="text-xs capitalize text-muted-foreground">{p.state || p.phase || "—"}</span>
                              </TableCell>
                            );
                          case "status":
                            return (
                              <TableCell key={field.id} className="py-1 h-9 align-middle">
                                <StatusBadge status={p.status ?? "active"} />
                              </TableCell>
                            );
                          case "leader": {
                            const leaderUser = workspaceMembers.find(m => m.userId === p.ownerId);
                            const displayName = leaderUser?.name || "Unassigned";
                            const initials = displayName ? displayName[0].toUpperCase() : "U";
                            const avatarUrl = leaderUser?.avatar || leaderUser?.profilePicture;
                            return (
                              <TableCell key={field.id} className="py-1 h-9 align-middle">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-5 h-5">
                                    {avatarUrl && (
                                      <AvatarImage
                                        src={avatarUrl.startsWith('http') ? avatarUrl : `${process.env.NEXT_PUBLIC_S3_BASE_URL || ''}/${avatarUrl}`}
                                        alt={displayName}
                                      />
                                    )}
                                    <AvatarFallback className="bg-slate-100 text-slate-700 text-[10px] font-bold">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {displayName}
                                  </span>
                                </div>
                              </TableCell>
                            );
                          }
                         
                          case "priority": {
                            const priorityVal = p.priority || "medium";
                            const fullProject = storeProjects.find((sp) => sp.id === p.id);

                            const priorityCfg = (fullProject?.projectPriorityConfig ?? []).find(
                              (pr: any) => pr.value.toLowerCase().trim() === priorityVal.toLowerCase().trim() ||
                                            pr.label.toLowerCase().trim() === priorityVal.toLowerCase().trim()
                            ) || dynamicProjectPriorities.find(
                              (pr) => pr.value.toLowerCase().trim() === priorityVal.toLowerCase().trim() ||
                                      pr.label.toLowerCase().trim() === priorityVal.toLowerCase().trim()
                            );

                            let priorityColor = priorityCfg?.color;
                            let priorityLabel = priorityCfg?.label || priorityVal;

                            if (!priorityColor) {
                              if (priorityVal.toLowerCase() === "high") {
                                priorityColor = "#EF4444";
                              } else if (priorityVal.toLowerCase() === "medium") {
                                priorityColor = "#F59E0B";
                              } else if (priorityVal.toLowerCase() === "low") {
                                priorityColor = "#10B981";
                              } else {
                                priorityColor = "#6B7280";
                              }
                            }

                            const isPriorityHex = priorityColor.startsWith("#");

                            return (
                              <TableCell key={field.id} className="py-1 h-9 align-middle">
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border"
                                  style={{
                                    borderColor: isPriorityHex ? `${priorityColor}40` : "currentColor",
                                    backgroundColor: isPriorityHex ? `${priorityColor}15` : "transparent",
                                    color: priorityColor,
                                  }}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priorityColor }} />
                                  {priorityLabel}
                                </span>
                              </TableCell>
                            );
                          }
                          case "startDate":
                            return (
                              <TableCell key={field.id} className="text-xs text-muted-foreground py-1 h-9 align-middle whitespace-nowrap">
                                {formatDate(p.startDate)}
                              </TableCell>
                            );
                          case "endDate":
                            return (
                              <TableCell key={field.id} className="text-xs text-muted-foreground py-1 h-9 align-middle whitespace-nowrap">
                                {formatDate(p.endDate)}
                              </TableCell>
                            );
                          case "progress":
                            return (
                              <TableCell key={field.id} className="py-1 h-9 align-middle">
                                <div className="flex items-center gap-2.5">
                                  <Progress value={progress} className="h-1.5 w-28" />
                                  <span className="text-xs text-muted-foreground w-8">
                                    {progress}%
                                  </span>
                                </div>
                              </TableCell>
                            );
                          default:
                            return null;
                        }
                      })}

                    
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4" data-testid="recent-projects-pagination">
          <span className="text-xs text-muted-foreground">
            {selected.size} of {filtered.length} row(s) selected.
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} data-testid="recent-projects-page-prev">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} data-testid="recent-projects-page-next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}