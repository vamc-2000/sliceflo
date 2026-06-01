"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useDraftsStore } from "@/stores/drafts-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { DraftTaskTable } from "@/components/drafts/DraftTaskTable";
import { DraftHeader } from "@/components/drafts/DraftHeader";
import { toast } from "@/components/ui/sonner";
import { QuickDraftCreation } from "@/components/drafts/QuickDraftCreation";
import ConfirmationModal from "@/components/ConfirmationModal";
// import { DraftDetailView } from "@/components/drafts/DraftDetailView";
// import { DraftResponse } from "@/lib/api/drafts-api";

export default function DraftsPage() {
  const { drafts, fetchDrafts, saveDraft, deleteDraft, isLoading } = useDraftsStore();
  const { projects } = useProjectsStore();
  const { workspaceMembers, currentWorkspace, fetchWorkspaceMembers } = useWorkspaceStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{
    project?: string;
    assignee?: string;
    priority?: string;
  }>({});
  const [isQuickDraftOpen, setIsQuickDraftOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Fetch drafts and workspace members
  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchDrafts(currentWorkspace.id);
      fetchWorkspaceMembers(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchDrafts, fetchWorkspaceMembers]);

  const filteredTasks = useMemo(() => {
    let result = drafts;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((draft) => {
        return (
          draft.title?.toLowerCase().includes(query) ||
          draft.description?.toLowerCase().includes(query)
        );
      });
    }

    // Project filter (if workspaceId matches a project in projects store)
    if (activeFilters.project) {
      result = result.filter((draft) => {
        const projectName = projects.find(p => p.id === draft.workspaceId)?.name || draft.workspaceId;
        return projectName === activeFilters.project;
      });
    }

    // Assignee filter
    if (activeFilters.assignee) {
      result = result.filter((draft) => {
        const assigneeName = workspaceMembers.find(m => m.userId === draft.assigneeId)?.name || "Unassigned";
        return assigneeName === activeFilters.assignee;
      });
    }

    // Priority filter
    if (activeFilters.priority) {
      result = result.filter((draft) => draft.priority === activeFilters.priority);
    }

    return result;
  }, [drafts, searchQuery, activeFilters, projects, workspaceMembers]);

  const filterData = useMemo(() => {
    // Unique projects from draft tasks
    const workspaceIds = new Set(drafts.map(t => t.workspaceId).filter(Boolean));
    const uniqueProjects = Array.from(workspaceIds).map(id => {
      const p = projects.find(proj => proj.id === id);
      return { id: id as string, name: p?.name || id as string };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Unique assignees from draft tasks
    const assigneeIds = new Set(drafts.map(t => t.assigneeId).filter(Boolean));
    const uniqueAssignees = Array.from(assigneeIds).map(id => {
      const m = workspaceMembers.find(mem => mem.userId === id);
      return {
        id: id as string,
        name: m?.name || "Unassigned",
        avatar: m?.profilePicture || undefined
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Unique priorities from draft tasks
    const uniquePriorities = Array.from(new Set(drafts.map(t => t.priority).filter(Boolean))) as string[];

    return {
      projects: uniqueProjects,
      assignees: uniqueAssignees,
      priorities: uniquePriorities
    };
  }, [drafts, projects, workspaceMembers]);

  const handleFilterChange = (type: 'project' | 'assignee' | 'priority', value: string | undefined) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  const handleCreateDraft = async (draftData: any) => {
    const workspaceId = currentWorkspace?.id;
    if (!workspaceId) return;
    try {
      await saveDraft({
        title: draftData.name,
        description: draftData.description,
        taskType: 'task',
        workspaceId,
        projectId: draftData.projectId,
        startDate: draftData.startDate?.toISOString(),
        dueDate: draftData.endDate?.toISOString(),
        assigneeId: draftData.assignee,
        priority: draftData.priority,
        status: draftData.status,
      });
      toast('success', { title: "New draft created!" });
      setIsQuickDraftOpen(false);
    } catch (error) {
      console.error("Failed to create draft:", error);
      toast('error', { title: "Failed to create draft" });
    }
  };

  const handleBulkDelete = async () => {
    const workspaceId = currentWorkspace?.id;
    if (!workspaceId) return;
    const ids = Array.from(selectedTaskIds);
    const count = ids.length;

    try {
      await Promise.all(ids.map(id => deleteDraft(id, workspaceId)));
      setSelectedTaskIds(new Set());
      setIsBulkDeleteConfirmOpen(false);
      toast('success', { title: `${count} drafts deleted` });
    } catch (error) {
      console.error("Failed to delete drafts:", error);
      toast('error', { title: "Failed to delete drafts" });
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Fixed Header Section - No scrolling */}
      <div className="flex-none">
        <DraftHeader
          onSearchChange={setSearchQuery}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          activeFilters={activeFilters}
          filterData={filterData}
          onDraftTask={() => setIsQuickDraftOpen(true)}
          selectedCount={selectedTaskIds.size}
          onDeleteClick={() => setIsBulkDeleteConfirmOpen(true)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-x-auto p-4">
        {isLoading && drafts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <DraftTaskTable
            tasks={filteredTasks as any}
            onDraftTask={() => setIsQuickDraftOpen(true)}
            selectedTaskIds={selectedTaskIds}
            setSelectedTaskIds={setSelectedTaskIds}
            groupColor="#6B7280"
          />
        )}
      </div>

      {isQuickDraftOpen && (
        <QuickDraftCreation
          open={isQuickDraftOpen}
          onClose={() => setIsQuickDraftOpen(false)}
          selectedDate={new Date()}
          onCreateDraft={handleCreateDraft}
        />
      )}
      {isBulkDeleteConfirmOpen && (
        <ConfirmationModal
          open={isBulkDeleteConfirmOpen}
          onClose={() => setIsBulkDeleteConfirmOpen(false)}
          title="Delete Selected Drafts"
          description={`Are you sure you want to delete ${selectedTaskIds.size} selected draft tasks? This action cannot be undone.`}
          confirmLabel="Delete All"
          onConfirm={handleBulkDelete}
        />
      )}
    </div>
  );
}
