// app/project/[id]/page.tsx

"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useProjectsStore, View } from "@/stores/projects-store";
import { ProjectHeader } from "@/components/projects/project-header";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

// Import view components
import ProjectOverview from '@/components/projects/views/ProjectOverview/ProjectOverview'
import { ListView } from "@/components/projects/views/list-view/ListView";
import KanbanView from "@/components/projects/views/kanban-view/KanbanView";
import { CalendarView } from "@/components/projects/views/calendar-view/CalendarView";
import { GanttView } from "@/components/projects/views/gantt-view/GanttView";
import AttachmentView from '@/components/projects/views/attachment-view/AttachmentView'
import DiscussionPage from "@/components/disucssions/DiscussionPage";
import { LinkedDocumentsView } from "@/components/projects/LinkedDocumentsView";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useGoalsStore } from "@/stores/goals-store";
import { Loader } from '@/components/Loader';
// import { useTasksStore } from "@/stores/tasks-store";

export default function ProjectDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const {
        fetchViews,
        fetchProjectById,
        projects,
        activeViewIds,
        customViews,
        fetchCycles
    } = useProjectsStore();
    const searchParams = useSearchParams();
    const activeViewFromQuery = searchParams.get('view');
    // const { fetchTasks } = useTasksStore()
    const { workspaceMembers, currentWorkspace } = useWorkspaceStore();
    const { fetchGoals } = useGoalsStore();

    // ── Group action handlers ──────────────────────────────────────────────
    // Store callbacks as refs — never triggers re-render when ListView registers them
    const collapseAllGroupsRef = useRef<(() => void) | null>(null);
    const expandAllGroupsRef = useRef<(() => void) | null>(null);
    const toggleHideEmptyGroupsRef = useRef<(() => void) | null>(null);
    const prevIdRef = useRef<string | null>(null);


    // Only the derived info values need to be state (they drive UI labels in ProjectHeader)
    const [groupsInfo, setGroupsInfo] = useState({
        collapsed: 0,
        total: 0,
        allCollapsed: false,
        hideEmptyGroups: false,
    });

    // ── Export handlers ────────────────────────────────────────────────────
    const exportCSVRef = useRef<(() => void) | null>(null);
    const exportExcelRef = useRef<(() => void) | null>(null);
    const printTasksRef = useRef<(() => void) | null>(null);

    const [overviewActiveTab, setOverviewActiveTab] = useState<string>('properties');

    const [isProjectReady, setIsProjectReady] = useState(false);


    // Receives stable function references from ListView — store in refs (no re-render)
    // Only setGroupsInfo triggers a re-render, which is safe here (it's not during render)
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
        // Only re-fetch project data when the project id actually changes,
        // not on every view switch (activeViewFromQuery change).
        if (prevIdRef.current !== id) {
            prevIdRef.current = id;
            const loadProjectData = async () => {
                setIsProjectReady(false);
                await fetchProjectById(id);
                await fetchViews(id);
                await fetchCycles(id);
                setIsProjectReady(true);
            };
            loadProjectData();
        }

        // Always sync the active view from the URL param — no loading state involved.
        if (activeViewFromQuery) {
            const store = useProjectsStore.getState();
            store.setActiveView(id, activeViewFromQuery);

            // Auto-register known custom view types in store if not present
            const customViewTypes = ['attachments', 'discussions', 'notes'];
            if (customViewTypes.includes(activeViewFromQuery)) {
                const exists = store.customViews.some(
                    v => v.projectId === id && v.id === activeViewFromQuery
                );
                if (!exists) {
                    const iconNames: Record<string, string> = {
                        attachments: 'Paperclip',
                        discussions: 'MessageSquare',
                        notes: 'StickyNote'
                    };
                    const displayNames: Record<string, string> = {
                        attachments: 'Attachments',
                        discussions: 'Discussions',
                        notes: 'Notes'
                    };
                    store.addView({
                        id: activeViewFromQuery,
                        name: displayNames[activeViewFromQuery],
                        type: activeViewFromQuery as any,
                        projectId: id,
                        category: "custom",
                        isDefault: false,
                        icon: iconNames[activeViewFromQuery],
                    });
                }
            }
        }
    }, [id, activeViewFromQuery]);


    useEffect(() => {
        if (currentWorkspace?.id) {
            fetchGoals(currentWorkspace.id);
        }
    }, [currentWorkspace?.id]);

    const project = projects.find((p) => p.id === id);

    const viewerIds = project?.viewers ?? [];          // string[]
    const memberIds = project?.members?.map((m) => m.userId) ?? [];

    const allowedIds = Array.from(new Set([...viewerIds, ...memberIds]));

    const mentionableMembers = workspaceMembers
        .filter((wm) => allowedIds.includes(wm.userId))
        .map((wm) => ({
            id: wm.userId,
            name: wm.name,
            profilePictureUrl: wm.profilePicture ?? undefined,
        }));

    if (!project) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Project not found</h2>
                    <p className="text-muted-foreground">
                        The project you're looking for doesn't exist.
                    </p>
                </div>
            </div>
        );
    }

    // Get active view for this project 
    const activeViewId = activeViewIds[id] || "overview";

    // Check if it's a custom view
    const customView: View | undefined = customViews.find(
        (view) => view.projectId === id && view.id === activeViewId
    );

    const handleActivityLogClick = () => {
        setOverviewActiveTab('activity')         // set tab first
        useProjectsStore.getState().setActiveView(id, 'overview')  // then switch to overview view
    }

    // Render appropriate component based on active view
    const renderViewContent = () => {
        if (customView && 'type' in customView && 'name' in customView) {
            switch (customView.type) {
                case 'attachments':
                    return <AttachmentView />;
                case 'discussions':
                    return <DiscussionPage entityType="project" entityId={id} mentionableMembers={mentionableMembers} />;
                case 'notes':
                    return <LinkedDocumentsView projectId={id} />;
                default:
                    return (
                        <div className="p-8 text-center">
                            <h3 className="text-lg font-semibold mb-2">{customView.name} View</h3>
                            <p className="text-muted-foreground">Custom view component coming soon...</p>
                        </div>
                    );
            }
        }

        // Render default view components
        switch (activeViewId) {
            case "overview":
                return <ProjectOverview
                    project={project}
                    activeTab={overviewActiveTab}
                    onTabChange={setOverviewActiveTab}
                />;
            case "list":
                return <ListView projectId={id}
                    onRegisterCollapseHandlers={handleRegisterCollapseHandlers}
                    onRegisterExportHandlers={(csvFn, jsonFn, printFn) => {
                        exportCSVRef.current = csvFn;
                        exportExcelRef.current = jsonFn;
                        printTasksRef.current = printFn;
                    }}
                />;
            case "kanban":
                return <KanbanView projectId={id} />;
            case "calendar":
                return <CalendarView projectId={id} />;
            case "gantt":
                return <GanttView projectId={id} />;
            default:
                return <ProjectOverview
                    project={project}
                    activeTab={overviewActiveTab}
                    onTabChange={setOverviewActiveTab}
                />;
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Fixed Header Section - No scrolling */}
            <div className="flex-none">
                <div className="w-full">
                    <Breadcrumbs data-testid="project-breadcrumbs" />
                </div>
                <ProjectHeader
                    data-testid="project-header"
                    projectName={project.name}
                    status={
                        ["completed", "active", "planning", "on-hold", "archived"].includes(project.status as string)
                            ? project.status as "completed" | "active" | "planning" | "on-hold" | "archived"
                            : "active"
                    }
                    projectId={id}
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
                    onActivityLogClick={handleActivityLogClick}
                />
            </div>

            {/* Content Area - Let child components handle their own scrolling */}
            <div className="h-full flex-1 overflow-hidden" data-testid="scrollable-content-area">
                {!isProjectReady ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader message="Loading project..." size="md" />
                    </div>
                ) : (
                    renderViewContent()
                )}
            </div>
        </div>
    );
}