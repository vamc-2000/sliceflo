"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";
import { PriorityDot } from "@/components/Dashboard/mywork/utils";
import { Project } from "@/stores/projects-store";
import { User } from "@/types/auth.types";
import { Task } from "@/types/task.types";
import { Team } from "@/types/teams.types";
import { Goal } from "@/types/goal.types";
import { useMailStore } from "@/stores/mailbox-store";
import { useProfileStore } from "@/stores/profile-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import dayjs from "dayjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AchievementChart = dynamic(() => import("@/components/charts").then(m => ({ default: m.AchievementChart })), { ssr: false });

interface StatsOverviewProps {
  projects: Project[];
  tasks: Task[];
  teams?: Team[];
  goals?: Goal[];
  user: User | null;
  className?: string;
  title?: string;
}

export function StatsOverview({ projects, tasks, teams = [], goals = [], user, className, title = "Achievement" }: StatsOverviewProps) {
  const [selectedAchievementYear, setSelectedAchievementYear] = useState<string>("All");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const { emails, fetchEmails } = useMailStore();
  const profileUser = useProfileStore((state) => state.user);
  const myWork = useProfileStore((state) => state.myWork);
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);

  useEffect(() => {
    fetchEmails({ limit: 100, offset: 0 }); // Increased limit to find mentions
  }, [fetchEmails]);

  const mentions = useMemo(() => {
    if (myWork?.mentions?.list) {
      return myWork.mentions.list.slice(0, 5);
    }
    if (!emails) return [];
    const currentUserId = String(profileUser?._id || profileUser?.id || user?.id || "");
    if (!currentUserId) return [];

    // Get IDs of teams the user belongs to
    const myTeamIds = teams.filter(team =>
      team.teamMembers?.some(m => String(m.userId || m.id) === currentUserId) ||
      team.members?.some(m => String(m.userId || m.id) === currentUserId)
    ).map(t => String(t.id));

    return emails.filter((email) => {
      // 1. Check user-specific mention IDs
      const mentionedUserIds = [
        ...(email.mentionedUserIds ?? []),
        ...(email.eventData?.mentionedUserIds ?? []),
        ...(email.eventData?.updatedFields?.mentionedUserIds ?? []),
        ...(email.eventData?.mentions ?? [])
      ].map(id => String(id));

      // 2. Check team-specific mention IDs
      const mentionedTeamIds = [
        ...((email as any).mentionedTeamIds ?? []),
        ...(email.eventData?.mentionedTeamIds ?? []),
        ...(email.eventData?.updatedFields?.mentionedTeamIds ?? [])
      ].map(id => String(id));

      const isIdMatch = mentionedUserIds.includes(currentUserId);
      const isTeamMatch = mentionedTeamIds.some((tid: string) => myTeamIds.includes(tid)) ||
        (email.eventData?.teamId && myTeamIds.includes(String(email.eventData.teamId))) ||
        (email.eventData?.team?.id && myTeamIds.includes(String(email.eventData.team.id)));

      const isSubjectMatch = email.subject?.toLowerCase().includes("mentioned") ||
        email.subject?.toLowerCase().includes("mention");
      const isMentionType = email.eventType?.toLowerCase().includes("mention");

      // Also catch if the body mentions the name (fallback)
      const nameMatch = profileUser?.name || user?.name;
      const isBodyMatch = nameMatch && email.body?.toLowerCase().includes(`@${nameMatch.toLowerCase()}`);

      return isIdMatch || isTeamMatch || isSubjectMatch || isBodyMatch || isMentionType;
    }).slice(0, 5); // Show top 5 mentions
  }, [emails, profileUser, user, teams, myWork]);

  const allEnrichedProjects = useMemo(() => {
    const propProjectsMap = new Map(projects.map(p => [p.id, p]));
    const merged = [...projects];

    (myWork?.projects || []).forEach(p => {
      if (!propProjectsMap.has(p.id)) {
        merged.push({
          id: p.id,
          name: p.name,
          workspaceId: p.workspaceId,
        } as any);
      }
    });
    return merged;
  }, [projects, myWork]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    tasks.forEach((t) => {
      if (t.createdAt) {
        years.add(new Date(t.createdAt).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [tasks]);

  const achievementChartData = useMemo(() => {
    const finalStatuses = new Set<string>();
    allEnrichedProjects.forEach((p) => {
      p.taskStatusConfig?.forEach((s) => {
        if (s.isFinal) finalStatuses.add(s.value.toLowerCase());
      });
    });

    const myDoneTasks = tasks.filter((t) => {
      const isAssignedToMe = t.assignee === user?.id || (typeof t.assignee === "object" && (t.assignee as any)?.id === user?.id) || (t as any).assigneeId === user?.id;
      const isDone = finalStatuses.has(t.status?.toLowerCase().trim() ?? "") || t.completed === true || ["done", "completed", "wont_do"].includes(t.status?.toLowerCase().trim() ?? "");
      return isAssignedToMe && isDone;
    });

    if (selectedAchievementYear === "All") {
      const currentYear = new Date().getFullYear();
      const yearMap: Record<string, { tasks: number }> = {
        [(currentYear - 2).toString()]: { tasks: 0 },
        [(currentYear - 1).toString()]: { tasks: 0 },
        [currentYear.toString()]: { tasks: 0 },
      };

      myDoneTasks.forEach((t) => {
        if (!t.createdAt) return;
        const year = new Date(t.createdAt).getFullYear().toString();
        if (!yearMap[year]) yearMap[year] = { tasks: 0 };
        yearMap[year].tasks += 1;
      });

      return Object.keys(yearMap).sort().map((y) => ({
        year: y,
        tasks: yearMap[y].tasks,
      }));
    } else {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthMap: Record<string, { tasks: number }> = {};
      months.forEach((m) => (monthMap[m] = { tasks: 0 }));

      myDoneTasks.forEach((t) => {
        if (!t.createdAt) return;
        const d = new Date(t.createdAt);
        if (d.getFullYear().toString() === selectedAchievementYear) {
          const month = d.toLocaleDateString("en-US", { month: "short" });
          if (monthMap[month]) monthMap[month].tasks += 1;
        }
      });
      return months.map((m) => ({
        year: m,
        tasks: monthMap[m].tasks,
      }));
    }
  }, [allEnrichedProjects, tasks, user?.id, selectedAchievementYear]);

  const selectedMonthProjects = useMemo(() => {
    if (!selectedMonth) return [];

    const finalStatuses = new Set<string>();
    allEnrichedProjects.forEach((p) => {
      p.taskStatusConfig?.forEach((s) => {
        if (s.isFinal) finalStatuses.add(s.value.toLowerCase());
      });
    });

    const tasksInMonth = tasks.filter((t) => {
      if (!t.createdAt || !t.projectId) return false;
      const d = new Date(t.createdAt);
      const isDone = finalStatuses.has(t.status?.toLowerCase().trim() ?? "") || t.completed === true || ["done", "completed", "wont_do"].includes(t.status?.toLowerCase().trim() ?? "");
      const isAssignedToMe = t.assignee === user?.id || (typeof t.assignee === "object" && (t.assignee as any)?.id === user?.id) || (t as any).assigneeId === user?.id;
      if (!isDone || !isAssignedToMe) return false;

      if (selectedAchievementYear === "All") {
        return d.getFullYear().toString() === selectedMonth;
      } else {
        const month = d.toLocaleDateString("en-US", { month: "short" });
        return month === selectedMonth && d.getFullYear().toString() === selectedAchievementYear;
      }
    });

    const projectIds = new Set(tasksInMonth.map(t => t.projectId));
    return allEnrichedProjects.filter(p => p.id && projectIds.has(p.id));
  }, [selectedMonth, allEnrichedProjects, tasks, user?.id, selectedAchievementYear]);

  return (
    <div className={`grid grid-cols-12 gap-4 ${className}`}>
      {/* Mentions Card */}
      <Card className="col-span-4 rounded-2xl border bg-background shadow-none">
        <CardContent className="p-5">
          <p className="text-sm font-bold mb-4">Mentions</p>
          <div className="flex flex-col gap-3">
            {mentions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-xs text-muted-foreground">No recent mentions found.</p>
              </div>
            ) : (
              mentions.map((m) => (
                <div key={m.id || m._id} className="flex flex-col gap-1.5 rounded-xl border p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={m.updatedBy?.profilePicture ?? ""} />
                        <AvatarFallback className="text-[8px]">{m.updatedBy?.name?.[0] ?? "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] font-medium truncate max-w-[120px]">
                        {m.updatedBy?.name ?? "Unknown"}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {dayjs(m.createdAt).format("DD MMM")}
                    </span>
                  </div>
                  <p className="text-xs font-medium line-clamp-2">{m.subject}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-blue-50 text-blue-600 border-none">
                      {m.eventType?.replace("MENTION", "").replace("_", " ") || "Mention"}
                    </Badge>
                    {(() => {
                      // Lookup logic for source name
                      const projectId = m.eventData?.project?.id || m.eventData?.projectId;
                      const goalId = m.eventData?.goal?.id || m.eventData?.goalId;
                      const teamId = m.eventData?.team?.id || m.eventData?.teamId;

                      const projectName = allEnrichedProjects.find(p => p.id === projectId)?.name;
                      const goalName = goals.find(g => g.id === goalId)?.title;
                      const teamName = teams.find(t => t.id === teamId)?.name;

                      const sourceName = projectName || goalName || teamName || m.eventData?.project?.name || m.eventData?.goal?.title || m.eventData?.team?.name;

                      return sourceName ? (
                        <span className="text-[9px] text-muted-foreground truncate">
                          in {sourceName}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
              ))
            )}
            {mentions.length > 0 && (
              <button className="text-center text-xs text-blue-500 hover:underline pt-1">
                View all mentions
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Card */}
      <Card className="col-span-8 rounded-2xl border bg-background shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold">{title}</p>
            <Select value={selectedAchievementYear} onValueChange={setSelectedAchievementYear}>
              <SelectTrigger className="w-[100px] h-7 text-xs">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Years</SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[11px] text-muted-foreground mb-5 leading-relaxed">
            Projects with completed tasks each {selectedAchievementYear === "All" ? "year" : "month"}. Click a bar to see details.
          </p>

          <AchievementChart data={achievementChartData} onBarClick={(label) => setSelectedMonth(label)} />

          {selectedMonth && (
            <div
              className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
              onClick={() => setSelectedMonth(null)}
            >
              <div
                className="bg-background rounded-2xl border shadow-lg p-6 w-[400px] max-h-[500px] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold">Projects in {selectedMonth}</p>
                  <button onClick={() => setSelectedMonth(null)} className="text-xs text-muted-foreground hover:text-foreground">
                    ✕ Close
                  </button>
                </div>
                {selectedMonthProjects.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No projects with completed tasks this period.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedMonthProjects.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-xl border p-3">
                        <div>
                          <p className="text-xs font-medium">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Status: {p.status ?? "Active"}
                          </p>
                        </div>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                          style={{
                            backgroundColor:
                              p.status === "active" ? "#10B981" :
                                p.status === "on_hold" ? "#6B7280" :
                                  p.status === "at_risk" ? "#F59E0B" :
                                    p.status === "off_track" ? "#EF4444" : "#3B82F6"
                          }}
                        >
                          {p.status ?? "active"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-center text-[11px] text-muted-foreground mt-2">
            {selectedAchievementYear === "All" ? "Lifetime Progress" : `Progress in ${selectedAchievementYear}`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
