"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useProjectsStore, TailoredView } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useTasksStore } from "@/stores/tasks-store";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProjectHeader } from "@/components/projects/project-header";
import { Loader } from "@/components/Loader";

// Import view components
import { ListView } from "@/components/projects/views/list-view/ListView";
import KanbanView from "@/components/projects/views/kanban-view/KanbanView";
import { CalendarView } from "@/components/projects/views/calendar-view/CalendarView";
import { GanttView } from "@/components/projects/views/gantt-view/GanttView";

export default function TailoredViewPage({
    params,
}: {
    params: Promise<{ id: string; viewId: string }>;
}) {
    const { id: projectId, viewId } = use(params);
    const {
        projects,
        fetchProjectById,
        tailoredViews,
        fetchViews
    } = useProjectsStore();
    const { workspaceMembers } = useWorkspaceStore();
    const { fetchTasks } = useTasksStore();

    const [isReady, setIsReady] = useState(false);

    // Group action handlers
    const collapseAllGroupsRef = useRef<(() => void) | null>(null);
    const expandAllGroupsRef = useRef<(() => void) | null>(null);
    const toggleHideEmptyGroupsRef = useRef<(() => void) | null>(null);

    const [groupsInfo, setGroupsInfo] = useState({
        collapsed: 0,
        total: 0,
        allCollapsed: false,
        hideEmptyGroups: false,
    });

    const exportCSVRef = useRef<(() => void) | null>(null);
    const exportExcelRef = useRef<(() => void) | null>(null);
    const printTasksRef = useRef<(() => void) | null>(null);

    const handleRegisterCollapseHandlers = useCallback((
        collapse: () => void,
        expand: () => void,
        toggleHideEmpty: () => void,
        info: { collapsed: number; total: number; allCollapsed: boolean; hideEmptyGroups: boolean }
    ) => {
        collapseAllGroupsRef.current = collapse;
        expandAllGroupsRef.current = expand;
        toggleHideEmptyGroupsRef.current = toggleHideEmpty;
        setGroupsInfo(info);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setIsReady(false);
            await fetchProjectById(projectId);
            await fetchViews(projectId);
            await fetchTasks(projectId);
            setIsReady(true);
        };
        loadData();
    }, [projectId, fetchProjectById, fetchViews, fetchTasks]);

    const project = projects.find((p) => p.id === projectId);
    const view = tailoredViews.find((v) => v.id === viewId);

    if (!isReady) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader message="Loading view..." size="md" />
            </div>
        );
    }

    if (!project || !view) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">View not found</h2>
                    <p className="text-muted-foreground">
                        The view you're looking for doesn't exist or you don't have access.
                    </p>
                </div>
            </div>
        );
    }

    const renderViewContent = () => {
        const filters = view.filters?.children || [];
        const groupBy = view.groupBy;

        switch (view.type) {
            case "list":
            case "listTree":
                return (
                    <ListView 
                        projectId={projectId}
                        initialGroupBy={groupBy}
                        initialFilters={filters as any}
                        onRegisterCollapseHandlers={handleRegisterCollapseHandlers}
                        onRegisterExportHandlers={(csvFn, jsonFn, printFn) => {
                            exportCSVRef.current = csvFn;
                            exportExcelRef.current = jsonFn;
                            printTasksRef.current = printFn;
                        }}
                    />
                );
            case "kanban":
                return <KanbanView projectId={projectId} initialGroupBy={groupBy} initialFilters={filters as any} />;
            case "calendar":
                return <CalendarView projectId={projectId} />;
            case "gantt":
                return <GanttView projectId={projectId} initialFilters={filters as any} />;
            default:
                return (
                    <div className="p-8 text-center">
                        <h3 className="text-lg font-semibold mb-2">{view.name} View</h3>
                        <p className="text-muted-foreground">View type "{view.type}" is not yet supported for tailored views.</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <div className="flex-none">
                <div className="w-full">
                    <Breadcrumbs />
                </div>
                <ProjectHeader
                    projectName={project.name}
                    status={
                        ["completed", "active", "planning", "on-hold", "archived"].includes(project.status as string)
                            ? project.status as any
                            : "active"
                    }
                    projectId={projectId}
                    onCollapseAllGroups={collapseAllGroupsRef.current}
                    onExpandAllGroups={expandAllGroupsRef.current}
                    onToggleHideEmptyGroups={toggleHideEmptyGroupsRef.current}
                    collapsedGroupsCount={groupsInfo.collapsed}
                    totalGroupsCount={groupsInfo.total}
                    allGroupsCollapsed={groupsInfo.allCollapsed}
                    hideEmptyGroups={groupsInfo.hideEmptyGroups}
                    onExportCSV={exportCSVRef.current}
                    onExportExcel={exportExcelRef.current}
                    onPrint={printTasksRef.current}
                />
            </div>

            <div className="h-full flex-1 overflow-hidden">
                {renderViewContent()}
            </div>
        </div>
    );
}
