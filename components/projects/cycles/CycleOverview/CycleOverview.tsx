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
    return (
        <div data-testid="cycle-overview-container" className="flex-1 flex overflow-hidden h-full">
            {/* Left Side: Dashboard */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
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
