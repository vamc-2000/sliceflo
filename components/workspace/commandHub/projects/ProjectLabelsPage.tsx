"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, Tag, Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { LabelPicker } from "@/components/shared/labels/LabelPicker";
import { LabelBadge } from "@/components/shared/labels/LabelBadge";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectLabelsPageProps {
  projectId: string;
}

const ProjectLabelsPage = ({ projectId }: ProjectLabelsPageProps) => {
  const { projects, updateProjectLabels, isLoading: isProjectLoading } = useProjectsStore();
  const { currentWorkspace } = useWorkspaceStore();

  const project = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId]
  );

  // We lookup full label objects from the workspace store based on project.labelIds
  // or fallback to project.labels if labelIds is not present yet
  const assignedLabels = useMemo(() => {
    const workspaceLabels = currentWorkspace?.labels || [];
    const projectLabelIds = project?.labelIds || project?.labels?.map(l => l.id) || [];

    return workspaceLabels.filter(label => projectLabelIds.includes(label.id));
  }, [project, currentWorkspace]);

  const handleSelectLabel = async (labelId: string) => {
    console.log("label id", labelId)
    if (!projectId) return;
    const currentIds = assignedLabels.map((l) => l.id);
    console.log("current ids", currentIds)
    if (!currentIds.includes(labelId)) {
      const newLabelIds = [...currentIds, labelId];
      console.log("new label ids", newLabelIds)
      await updateProjectLabels(projectId, newLabelIds);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    if (!projectId) return;
    const newLabelIds = assignedLabels
      .filter((l) => l.id !== labelId)
      .map((l) => l.id);
    await updateProjectLabels(projectId, newLabelIds);
  };

  if (isProjectLoading && !project) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
              Labels
            </h2>
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              Manage labels specifically for this project context.
            </p>
          </div>
        </div>

        <LabelPicker
          selectedLabelIds={assignedLabels.map((l) => l.id)}
          onSelect={handleSelectLabel}
          onRemove={handleRemoveLabel}
        >
          <Button
            className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 text-[12px] h-8 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Label
          </Button>
        </LabelPicker>
      </div>

      {/* Labels List Style like Workspace Page */}
      <div className="space-y-2">
        {assignedLabels.length > 0 ? (
          assignedLabels.map((label) => (
            <div
              key={label.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-[13px] font-medium text-gray-900 dark:text-white">
                  {label.name}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    <Ellipsis className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem
                    onClick={() => handleRemoveLabel(label.id)}
                    className="text-red-600 focus:text-red-600 text-[12px]"
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 border border-dashed rounded-lg">
            <Tag className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-[13px]">
              No labels assigned to this project yet.
            </p>
            <p className="text-gray-400 text-[11px] mt-1">
              Click "Add Label" to categorize your project.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-md text-blue-800">
        <Plus className="w-3.5 h-3.5" />
        <p className="text-[11px] font-medium">
          Note: Labels added here are available workspace-wide for other projects.
        </p>
      </div>
    </div>
  );
};

export default ProjectLabelsPage;
