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
import ConfirmationModal from "@/components/ConfirmationModal";

const WorkspaceLabelsPage = () => {
  const { currentWorkspace, deleteLabel, fetchLabels, isLoading } = useWorkspaceStore();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<any>(null);
  const [deleteLabelId, setDeleteLabelId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (labelId: string) => {
    setDeleteLabelId(labelId);
  };

  const handleDeleteConfirm = async () => {
    if (!currentWorkspace?.id || !deleteLabelId) return;
    setIsDeleting(true);
    try {
      await deleteLabel(currentWorkspace.id, deleteLabelId);
      setDeleteLabelId(null);
    } catch (error) {
      // Error already handled
    } finally {
      setIsDeleting(false);
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
          <h2 className="text-[16px] font-semibold text-foreground">
            Labels
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Create, edit, or organize labels used across this workspace.
          </p>
        </div>
        <Button
          onClick={handleCreateClick}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md flex items-center gap-1.5 text-[12px] h-8 cursor-pointer"
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
              className="flex items-center justify-between p-3 bg-card border border-border rounded-md hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-[13px] font-medium text-foreground">
                  {label.name}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors cursor-pointer">
                    <Ellipsis className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 bg-popover border border-border">
                  <DropdownMenuItem
                    onClick={() => handleEditClick(label)}
                    className="text-[12px] text-popover-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(label.id)}
                    className="text-red-600 focus:text-red-600 text-[12px] cursor-pointer"
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
          <p className="text-muted-foreground text-[13px]">
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

      <ConfirmationModal
        open={!!deleteLabelId}
        onClose={() => setDeleteLabelId(null)}
        onConfirm={handleDeleteConfirm}
        title="Are you sure want to delete this label?"
        description="This action is permanent and cannot be undone."
        confirmLabel="Delete Label"
        loadingLabel="Deleting..."
        loading={isDeleting}
      />
    </div>
  );
};

export default WorkspaceLabelsPage;
