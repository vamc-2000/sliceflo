"use client";

import React from "react";
import { CycleProgressCard } from "./CycleProgressCard";
import { CycleBurndownCard } from "./CycleBurndownCard";
import { CyclePriorityTasks } from "./CyclePriorityTasks";
import { CycleRightPanel } from "./CycleRightPanel";
import { Task } from "@/types/task.types";
import { Project } from "@/stores/projects-store";

interface CycleOverviewProps {
    isEmpty: boolean;
    tasks: Task[];
    project: Project;
    cycleId?: string;
}

export function CycleOverview({ isEmpty, tasks, project, cycleId }: CycleOverviewProps) {
    const isTaskCompleted = (task: Task) => {
        if (task.completed === true) return true;
        const finalStatuses = project?.taskStatusConfig
            ?.filter(s => s.isFinal)
            ?.map(s => s.value.toLowerCase().trim()) ?? ["done", "completed"];
        return finalStatuses.includes(task.status?.toLowerCase().trim() ?? "");
    };

    const isTaskStarted = (task: Task) => {
        const status = task.status?.toLowerCase().trim() ?? "";
        if (isTaskCompleted(task)) return false;
        
        const inactiveStatuses = ["backlog", "unstarted", "todo", "planned", "canceled"];
        if (inactiveStatuses.includes(status)) return false;
        
        return true;
    };

    const scopeCount = tasks.length;
    const startedCount = tasks.filter(isTaskStarted).length;
    const completedCount = tasks.filter(isTaskCompleted).length;

    return (
        <div data-testid="cycle-overview-container" className="flex-1 flex overflow-hidden h-full">
            {/* Left Side: Dashboard */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Summary Metrics Row */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/40 border border-border/60 rounded-lg px-4 py-2 flex items-center justify-between shadow-sm">
                        <span className="text-xs font-semibold text-muted-foreground tracking-tight">Scope</span>
                        <span className="text-xs font-bold text-foreground">{scopeCount}</span>
                    </div>
                    <div className="bg-muted/40 border border-border/60 rounded-lg px-4 py-2 flex items-center justify-between shadow-sm">
                        <span className="text-xs font-semibold text-muted-foreground tracking-tight">Started</span>
                        <span className="text-xs font-bold text-foreground">{startedCount}</span>
                    </div>
                    <div className="bg-muted/40 border border-border/60 rounded-lg px-4 py-2 flex items-center justify-between shadow-sm">
                        <span className="text-xs font-semibold text-muted-foreground tracking-tight">Completed</span>
                        <span className="text-xs font-bold text-foreground">{completedCount}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <CycleProgressCard
                        isEmpty={isEmpty}
                        tasks={tasks}
                        project={project}
                    />
                    <CycleBurndownCard
                        isEmpty={isEmpty}
                        tasks={tasks}
                        project={project}
                    />
                </div>
                <CyclePriorityTasks
                    isEmpty={isEmpty}
                    projectId={project.id || ""}
                    tasks={tasks}
                    cycleId={cycleId}
                />
            </div>

            {/* Right Side: Right Panel */}
            <CycleRightPanel
                isEmpty={isEmpty}
                project={project}
                tasks={tasks}
            />
        </div>
    );
}
