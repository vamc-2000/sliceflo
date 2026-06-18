"use client";

import { useEffect } from "react";
import {
  Share2,
  Trash2,
  Ellipsis,
  Pen,
  Shield,
  Link2,
  Archive,
  Users,
  ShieldUser,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useParams } from "next/navigation";
import { useTasksStore } from "@/stores/tasks-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FileActionsDropdownProps {
  fileId: string;
  onDownload?: (id: string) => void;
  onShare?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function FileActionsDropdown({
  fileId,
  onDownload,
  onShare,
  onDelete,
}: FileActionsDropdownProps) {
  const params = useParams();
  const projectId = params?.id as string | undefined;

  const { tasks, fetchTasks } = useTasksStore();
  const { workspaceMembers } = useWorkspaceStore();

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId).catch((error) => {
        console.error("Failed to load tasks:", error);
      });
    }
  }, [projectId]);

  // Helper to get assignee profile details
  const getAssigneeDetails = (assigneeId?: string) => {
    if (!assigneeId) return null;

    const workspaceMember = workspaceMembers.find(
      (m) => m.userId === assigneeId,
    );

    const name = workspaceMember?.name || assigneeId;
    const avatar = workspaceMember?.profilePicture || workspaceMember?.avatar;

    let initials = name.substring(0, 2).toUpperCase();
    const names = name.split(" ");
    if (names.length >= 2) {
      initials = `${names[0][0]}${names[1][0]}`.toUpperCase();
    }

    return { name, avatar, initials };
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid={`file-actions-trigger-${fileId}`}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <Ellipsis className="h-4 w-4 text-primary-text" strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        data-testid={`file-actions-content-${fileId}`}
        align="end"
        className="w-58 border-0 border-b-[5px] border-b-primary text-foreground"
      >
        <DropdownMenuItem
          data-testid={`file-actions-download-${fileId}`}
          onClick={() => onDownload?.(fileId)}
        >
          <Download className="h-4 w-4 mr-2 text-primary-text" />
          Download
        </DropdownMenuItem>

        <DropdownMenuItem
          data-testid={`file-actions-rename-${fileId}`}
          onClick={() => console.log("Rename clicked")}
        >
          <Pen className="h-4 w-4 mr-2 text-primary-text" />
          Rename
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            data-testid={`file-actions-privacy-trigger-${fileId}`}
            className="text-foreground"
          >
            <Shield className="h-4 w-4 mr-2 text-primary-text" />
            Attachment Privacy
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="w-44 text-foreground border-0 border-b-[5px] border-b-primary">
            <DropdownMenuItem
              data-testid={`file-actions-privacy-only-me-${fileId}`}
              onClick={() => console.log("Private")}
            >
              <ShieldUser className="h-4 w-4 mr-2 text-primary-text" />
              Only me
            </DropdownMenuItem>

            <DropdownMenuItem
              data-testid={`file-actions-privacy-everyone-${fileId}`}
              onClick={() => console.log("Public")}
            >
              <Users className="h-4 w-4 mr-2 text-primary-text" />
              Everyone
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <Separator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            data-testid={`file-actions-attach-to-task-trigger-${fileId}`}
            className="text-foreground"
          >
            <Link2 className="h-4 w-4 mr-2 text-primary-text" />
            Attach to task
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="w-95 p-0 border-0 border-b-[5px] border-b-primary text-foreground">
            <div className="max-h-64 overflow-y-auto">
              {/* Header Section */}
              <div className="px-4 pt-3 pb-1 ">
                <p className="text-xs font-semibold">Attach to task</p>
                <p className="text-xs text-muted-foreground">
                  Select tasks to which you want to attach the attachment
                </p>
              </div>
              <div className="p-3">
                <div className="border rounded-md overflow-hidden">
                  <div className="divide-y">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_100px] items-center text-xs font-semibold border-b bg-muted">
                      <div className="px-4 py-2 flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-border accent-primary focus:ring-primary cursor-pointer bg-background"
                        />
                        Tasks
                      </div>
                      <div className="px-4 py-2 border-l text-center">
                        Owner
                      </div>
                    </div>

                    {/* Rows */}
                    {tasks.length > 0 ? (
                      tasks.map((task) => (
                        <div
                          key={task.id}
                          className="grid grid-cols-[1fr_100px] items-center hover:bg-accent cursor-pointer"
                        >
                          {/* Task Column */}
                          <div className="px-4 py-2 flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-border accent-primary focus:ring-primary cursor-pointer bg-background"
                            />
                            <span className="text-xs truncate">
                              {task.name}
                            </span>
                          </div>

                          {/* Owner Column */}
                          <div className="px-4 py-2 border-l flex justify-center">
                            {task.assignee ? (
                              (() => {
                                const details = getAssigneeDetails(
                                  task.assignee,
                                );
                                if (!details) return null;
                                return (
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={details.avatar || ""} />
                                    <AvatarFallback className="bg-blue-500 text-white text-[10px] font-medium">
                                      {details.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                );
                              })()
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-center text-xs text-muted-foreground">
                        No tasks found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <Separator />

        <DropdownMenuItem
          data-testid={`file-actions-archive-${fileId}`}
          onClick={() => onShare?.(fileId)}
        >
          <Archive className="h-4 w-4 mr-2 text-primary-text" />
          Archive Attachment
        </DropdownMenuItem>

        <DropdownMenuItem
          data-testid={`file-actions-delete-${fileId}`}
          className="focus:text-destructive text-destructive"
          onClick={() => onDelete?.(fileId)}
        >
          <Trash2 className="h-4 w-4 mr-2 text-destructive" />
          Delete Attachment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
