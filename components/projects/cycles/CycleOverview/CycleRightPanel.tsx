"use client";

import React, { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserCircle2, Tag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProjectsStore } from "@/stores/projects-store";
import { Task } from "@/types/task.types";
import { Project } from "@/stores/projects-store";

interface CycleRightPanelProps {
    isEmpty: boolean;
    project: Project;
    tasks: Task[];
}

export function CycleRightPanel({ isEmpty, project, tasks }: CycleRightPanelProps) {
    const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace);
    const fetchWorkspaceMembers = useWorkspaceStore(state => state.fetchWorkspaceMembers);
    const fetchLabels = useWorkspaceStore(state => state.fetchLabels);
    const getMembersByProject = useProjectsStore(state => state.getMembersByProject);

    useEffect(() => {
        if (currentWorkspace?.id) {
            fetchWorkspaceMembers(currentWorkspace.id);
            fetchLabels(currentWorkspace.id);
        }
    }, [currentWorkspace?.id, fetchWorkspaceMembers, fetchLabels]);

    const projectMembers = getMembersByProject(project?.id || "");
    const workspaceLabels = currentWorkspace?.labels || [];

    const getTaskLabelIds = (task: Task): string[] => {
        const labelIds = task.labelIds || [];
        const idsFromLabels = (task.labels || [])
            .map(l => (typeof l === 'object' && l !== null) ? (l as any).id : l)
            .filter(Boolean);
        return Array.from(new Set([...labelIds, ...idsFromLabels]));
    };

    const isTaskCompleted = (task: Task) => {
        if (task.completed === true) return true;
        const finalStatuses = project?.taskStatusConfig
            ?.filter(s => s.isFinal)
            ?.map(s => s.value.toLowerCase().trim()) ?? ["done", "completed"];
        return finalStatuses.includes(task.status?.toLowerCase().trim() ?? "");
    };

    const hexToRgba = (hex: string, alpha: number) => {
        if (!hex) return `rgba(0, 0, 0, ${alpha})`;
        let cleanHex = hex.replace("#", "");
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split("").map(char => char + char).join("");
        }
        if (cleanHex.length !== 6) {
            return hex;
        }
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const activeMembers = projectMembers.filter((member) =>
        tasks.some((t) => t.assignee === member.userId)
    );
    const activeLabels = workspaceLabels.filter((label) =>
        tasks.some((t) => getTaskLabelIds(t).includes(label.id))
    );

    return (
        <div className="w-[360px] flex-none bg-white border-l border-gray-200 flex flex-col p-4 space-y-4">
            <Tabs defaultValue="assignees" className="w-full flex flex-col flex-1">
                <TabsList className="w-full grid grid-cols-2 bg-[#F2F4F7] h-9 p-1 rounded-lg">
                    <TabsTrigger
                        value="assignees"
                        className="text-xs font-semibold rounded-md transition-all
                            data-[state=active]:bg-[#001F3F] data-[state=active]:text-white data-[state=active]:shadow-sm
                            data-[state=inactive]:text-gray-500 data-[state=inactive]:bg-transparent"
                    >
                        Assignees
                    </TabsTrigger>
                    <TabsTrigger
                        value="labels"
                        className="text-xs font-semibold rounded-md transition-all
                            data-[state=active]:bg-[#001F3F] data-[state=active]:text-white data-[state=active]:shadow-sm
                            data-[state=inactive]:text-gray-500 data-[state=inactive]:bg-transparent"
                    >
                        Labels
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="assignees" className="flex-1 flex flex-col pt-0 overflow-hidden">
                    {isEmpty || activeMembers.length === 0 ? (
                        <div className="flex-1 w-full flex items-center justify-center">
                            <div className="w-40 h-40 border border-gray-100 rounded-3xl flex items-center justify-center bg-white shadow-gray-400">
                                <UserCircle2 className="h-16 w-16 text-gray-200" strokeWidth={1} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 w-full overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                            {activeMembers.map((member) => {
                                const memberTasks = tasks.filter(t => t.assignee === member.userId);
                                const totalCount = memberTasks.length;
                                const completedCount = memberTasks.filter(isTaskCompleted).length;
                                const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                                return (
                                    <div
                                        key={member.userId}
                                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-gray-100">
                                                <AvatarImage src={member.avatar || ""} alt={member.name} />
                                                <AvatarFallback className="text-xs bg-slate-100 text-slate-600 font-bold">
                                                    {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{member.name}</div>
                                                <div className="text-xs text-gray-400 font-medium">
                                                    {totalCount} {totalCount === 1 ? "Task" : "Tasks"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 w-24">
                                            <span className="text-xs text-gray-400 font-medium">{progress}%</span>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${progress}%`,
                                                        backgroundColor: "#001F3F"
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="labels" className="flex-1 flex flex-col pt-0 overflow-hidden">
                    {isEmpty || activeLabels.length === 0 ? (
                        <div className="flex-1 w-full flex items-center justify-center">
                            <div className="w-40 h-40 border border-gray-100 rounded-3xl flex items-center justify-center bg-white shadow-gray-400">
                                <Tag className="h-16 w-16 text-gray-200" strokeWidth={1} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 w-full overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                            {activeLabels.map((label) => {
                                const labelTasks = tasks.filter(t => getTaskLabelIds(t).includes(label.id));
                                const totalCount = labelTasks.length;
                                const completedCount = labelTasks.filter(isTaskCompleted).length;
                                const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                                const lightBg = hexToRgba(label.color, 0.1);
                                const borderTint = hexToRgba(label.color, 0.2);

                                return (
                                    <div
                                        key={label.id}
                                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 border-l-[4px] bg-white shadow-sm hover:shadow-md transition-all duration-200"
                                        style={{ borderLeftColor: label.color || "#cbd5e1" }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center border"
                                                style={{
                                                    backgroundColor: lightBg,
                                                    borderColor: borderTint,
                                                    }}
                                            >
                                                <Tag
                                                    className="h-4 w-4"
                                                    style={{ color: label.color || "#64748b" }}
                                                />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{label.name}</div>
                                                <div className="text-xs text-gray-400 font-medium">
                                                    {totalCount} {totalCount === 1 ? "Task" : "Tasks"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 w-24">
                                            <span className="text-xs text-gray-400 font-medium">{progress}%</span>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${progress}%`,
                                                        backgroundColor: label.color || "#001F3F"
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
