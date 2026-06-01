"use client";

import { use, useEffect, useState } from "react";
import { useProjectsStore } from "@/stores/projects-store";
import { useTasksStore } from "@/stores/tasks-store";
import { Loader } from "@/components/Loader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CyclesHeader } from "@/components/projects/cycles/CyclesHeader";
import { CycleConfigSettings } from "@/components/projects/cycles/CycleConfigSettings";
import { CycleOverview } from "@/components/projects/cycles/CycleOverview/CycleOverview";
import { Button } from "@/components/ui/button";
import {
    LayoutGrid,
    List,
    Calendar as CalendarIcon,
    Table,
    Home,
    Settings,
    Users,
    ChevronRight,
    Target
} from "lucide-react";
import { format } from "date-fns";

export default function CycleDetailPage({
    params,
}: {
    params: Promise<{ id: string; cycleId: string }>;
}) {
    const { id: projectId, cycleId } = use(params);
    const {
        projects,
        fetchProjectById,
        fetchCycles,
        fetchCycleConfig
    } = useProjectsStore();
    const { tasks, fetchTasks } = useTasksStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const project = projects.find((p) => p.id === projectId);
    const cycle = project?.cycles?.find((c) => c.id === cycleId);
    const hasConfig = (project?.parallelCycleConfigs || []).some(cfg => cfg && cfg.id !== null);

    const cycleTasks = tasks.filter(t =>
        t.projectId === projectId &&
        (t.cycleId === cycleId || t.cycle?.id === cycleId)
    );
    const isEmpty = cycleTasks.length === 0;

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await fetchProjectById(projectId);
            await Promise.all([
                fetchCycles(projectId),
                fetchCycleConfig(projectId),
                fetchTasks(projectId)
            ]);
            setIsLoading(false);
        };
        loadData();
    }, [projectId, fetchProjectById, fetchCycles, fetchCycleConfig, fetchTasks]);

    if (isLoading || !project || !cycle) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader message="Loading cycle details..." size="md" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white">
            {/* Consistent Header Section */}
            <div className="flex-none">
                <div className="w-full border-b">
                    <Breadcrumbs />
                </div>
                <CyclesHeader
                    project={project}
                    hasConfig={hasConfig}
                    onConfigClick={() => setIsConfigOpen(true)}
                />
            </div>

            {/* Main Content Area - Modularized */}
            <div className="flex-1 overflow-hidden bg-white">
                <CycleOverview
                    isEmpty={isEmpty}
                    tasks={cycleTasks}
                    project={project}
                    cycleId={cycleId}
                />
            </div>

            {/* Config Settings Modal */}
            <CycleConfigSettings
                projectId={projectId}
                isOpen={isConfigOpen}
                onOpenChange={setIsConfigOpen}
            />
        </div>
    );
}
