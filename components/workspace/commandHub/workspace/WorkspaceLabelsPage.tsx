// components/workspace/commandHub/LabelPage.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus, Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Skeleton } from "@/components/ui/skeleton";
import { LabelDialog } from "@/components/shared/labels/LabelDialog";

const WorkspaceLabelsPage = () => {
  const { currentWorkspace, deleteLabel, fetchLabels, isLoading } = useWorkspaceStore();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<any>(null);

  // Sync labels from API on mount
  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchLabels(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchLabels]);

  // Get labels from current workspace
  const labels = useMemo(
    () => currentWorkspace?.labels || [],
    [currentWorkspace]
  );

  const handleEditClick = (label: any) => {
    setEditingLabel(label);
    setIsModalOpen(true);
  };

  const handleDelete = async (labelId: string) => {
    if (!currentWorkspace?.id) return;
    if (window.confirm("Are you sure you want to delete this label?")) {
      await deleteLabel(currentWorkspace.id, labelId);
    }
  };

  const handleCreateClick = () => {
    setEditingLabel(null);
    setIsModalOpen(true);
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setEditingLabel(null);
  };

  return (
    <div className="w-full h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
            Labels
          </h2>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
            Create, edit, or organize labels used across this workspace.
          </p>
        </div>
        <Button
          onClick={handleCreateClick}
          className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 text-[12px] h-8"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Label
        </Button>
      </div>

      {/* Labels List */}
      <div className="space-y-2">
        {isLoading && labels.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))
        ) : (
          labels.map((label) => (
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
                    onClick={() => handleEditClick(label)}
                    className="text-[12px]"
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(label.id)}
                    className="text-red-600 focus:text-red-600 text-[12px]"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* Empty State */}
      {!isLoading && labels.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-[13px]">
            No labels yet. Create your first label to get started.
          </p>
        </div>
      )}

      {/* Shared Dialog */}
      {currentWorkspace?.id && (
        <LabelDialog
          open={isModalOpen}
          onClose={resetModal}
          editingLabel={editingLabel}
          workspaceId={currentWorkspace.id}
        />
      )}
    </div>
  );
};

export default WorkspaceLabelsPage;
