"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Ellipsis,
  Pin,
  PinOff,
  Link,
  Mail,
  ClipboardList,
  ListPlus,
  Trash2,
  Ban,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import type { DiscussionParticipant } from "@/types/discussions.types";
import { QuickTaskCreation } from "@/components/projects/QuickTaskCreation";
import { useProjectsStore } from "@/stores/projects-store";
import { useTasksStore } from "@/stores/tasks-store";
import { format } from "date-fns";
import ConfirmationModal from "@/components/ConfirmationModal";
import { toast } from "@/components/ui/sonner";

interface MoreMenuProps {
  commentId?: string;
  threadText?: string; // ADD THIS: Thread description for default task name
  entityType?: string;  // team | project | task | portfolio
  entityId?: string;
  projectId?: string;
  isPinned?: boolean;
  onTogglePin: (threadId: string, shouldPin: boolean) => void;
  onDelete?: (threadId: string) => void;
  participants?: DiscussionParticipant[];
}

export default function MoreMenu({
  commentId,
  threadText = "New task from comment", // Default fallback
  entityType = "project",  // Default fallback
  entityId,
  projectId,
  isPinned = false,
  onTogglePin,
  onDelete,
  participants,
}: MoreMenuProps) {
  const { user } = useAuthStore();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [subTaskModalOpen, setSubTaskModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Required for QuickTaskCreation
  const [selectedDate] = useState(new Date());
  const { projects } = useProjectsStore();
  const { addTask, addSubtask } = useTasksStore(); // ✅ Get task actions

  // If we are in a project discussion, resolve the projectId from either prop or entityId
  const resolvedProjectId = projectId || (entityType === "project" ? entityId : undefined);
  const resolvedTeamId = entityType === "team" ? entityId : undefined;

  const handleNewTask = () => {
    // ✅ Remove early return to allow project selection in Teams context
    setTaskModalOpen(true);
  };


  const handleCreateTask = async (taskData: any) => {
    console.log("Creating task:", taskData);
    try {
      if (taskData.projectId) {
        await addTask({
          ...taskData,
          projectId: taskData.projectId,
        });
        setTaskModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleNewSubtask = () => {
    setSubTaskModalOpen(true);
  };

  const handlePin = () => {
    if (commentId && onTogglePin) {
      onTogglePin(commentId, !isPinned);
    }
  };

  const handleUnfollow = () => {
    console.log("Unfollow clicked");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("threadId", commentId || "");
        navigator.clipboard.writeText(url.toString());
        toast("success", { title: "Thread link copied!" });
      } catch (err) {
        console.error("Failed to copy link:", err);
        toast("error", { title: "Failed to copy thread link" });
      }
    }
  };

  const handleSendEmail = () => {
    console.log("Send via Email clicked");
  };

  const handleDelete = async () => {
    if (commentId && onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(commentId);
        setDeleteModalOpen(false);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCloseTaskModal = () => {
    setTaskModalOpen(false);
  };

  const isParticipant = participants?.some((p) => p.userId === user?.id);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Ellipsis
            className="w-4 h-4 cursor-pointer"
            data-testid={`btn-more-menu-trigger-${commentId}`}
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-58 border-0 border-b-4 border-primary">
          {/* Pin / Unpin */}
          <DropdownMenuItem
            data-testid={`btn-${isPinned ? 'unpin' : 'pin'}-thread-${commentId}`}
            onClick={handlePin}
          >
            <span className="flex items-center gap-2">
              {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
              <span className="text-[0.85rem] font-light">
                {isPinned ? "Unpin Thread" : "Pin Thread"}
              </span>
            </span>
          </DropdownMenuItem>

          {/* Unfollow */}
          <DropdownMenuItem
            data-testid={`btn-unfollow-thread-${commentId}`}
            onClick={handleUnfollow}
          >
            <span className="flex items-center gap-2">
              <Ban style={{ fontSize: 16 }} />
              <span className="text-[0.85rem] font-light">Unfollow Thread</span>
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Copy Link */}
          <DropdownMenuItem
            data-testid={`btn-copy-thread-link-${commentId}`}
            onClick={handleCopyLink}
          >
            <span className="flex items-center gap-2">
              <Link size={16} />
              <span className="text-[0.85rem] font-light">Copy Thread Link</span>
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* New Task - Uses threadText as default */}
          {/* <DropdownMenuItem onClick={handleNewTask}>
            <span className="flex items-center gap-2">
              <ClipboardList size={16} />
              <span className="text-[0.85rem] font-light">New task from comment</span>
            </span>
          </DropdownMenuItem> */}

          <DropdownMenuItem
            // disabled={!resolvedProjectId}
            data-testid={`btn-new-task-from-comment-${commentId}`}
            onClick={handleNewTask}
          >
            <span className="flex items-center gap-2">
              <ClipboardList size={16} />
              <span className="text-[0.85rem] font-light">
                New task from comment
              </span>
            </span>
          </DropdownMenuItem>

          {/* New Subtask */}
          {/* <DropdownMenuItem onClick={handleNewSubtask}>
            <span className="flex items-center gap-2">
              <ListPlus size={16} />
              <span className="text-[0.85rem] font-light">New subtask from comment</span>
            </span>
          </DropdownMenuItem> */}

          <DropdownMenuSeparator />

          {/* Delete */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenuItem
                    disabled={!isParticipant}
                    data-testid={`btn-delete-thread-${commentId}`}
                    onClick={() => {
                      if (isParticipant) {
                        setDeleteModalOpen(true);
                      }
                    }}
                  >
                    <span
                      className={`flex items-center gap-2 ${isParticipant ? "text-destructive" : "text-muted-foreground"
                        }`}
                    >
                      <Trash2
                        size={16}
                        color={isParticipant ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
                      />
                      <span className="text-[0.85rem] font-light">Delete</span>
                    </span>
                  </DropdownMenuItem>
                </div>
              </TooltipTrigger>

              {!isParticipant && (
                <TooltipContent>
                  <p>Only participants can delete this thread</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* QuickTaskCreation - Pre-filled with thread description */}
      <QuickTaskCreation
        selectedDate={selectedDate}
        open={taskModalOpen}
        projectId={resolvedProjectId}
        teamId={resolvedTeamId}
        initialTaskName={threadText}
        onClose={handleCloseTaskModal}
        onCreateTask={handleCreateTask}
      />

      <ConfirmationModal
        data-testid={`modal-delete-confirm-${commentId}`}
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Are you sure you want to delete this thread?"
        description=""
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </>
  );
}
