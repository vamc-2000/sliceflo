import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { CheckCheck, ChevronDown, User } from "lucide-react";

import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProjectsStore } from "@/stores/projects-store";

type AssigneeDropdownProps = {
  projectId: string;
  currentAssignee?: string;
  onAssigneeChange: (userId: string) => void;
};

const AssigneeDropdown: React.FC<AssigneeDropdownProps> = ({
  projectId,
  currentAssignee,
  onAssigneeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // stores
  const { projects } = useProjectsStore();
  const { workspaceMembers, currentWorkspace } = useWorkspaceStore();

  // project members from project store (userId + role)
//   const project = projects.find((p) => p.id === projectId);
  const projectMembers = projects
    .find((p) => p.id === projectId)
    ?.members || [];  // defaults to empty array if project not found

  // helper: find workspace member for a given userId
  const getWorkspaceMember = (userId: string) =>
    workspaceMembers.find((m) => m.userId === userId);

  // computed list of assignable members with joined data
  const availableMembers = useMemo(
    () =>
      projectMembers.map((pm) => {
        const wm = workspaceMembers.find((m) => m.userId === pm.userId);
        return {
          userId: pm.userId,
          role: pm.role,
          name: wm?.name || "Unknown User",
          profilePictureUrl: wm?.profilePicture || null,
        };
      }),
    [projectMembers, workspaceMembers]
  );

  // resolve current assignee display
  const currentAssigneeDetails = useMemo(() => {
    if (!currentAssignee) return null;
    const wm = getWorkspaceMember(currentAssignee);
    if (!wm)
      return {
        name: "Unknown User",
        profilePictureUrl: null,
      };
    return {
      name: wm.name,
      profilePictureUrl: wm.profilePicture || null,
    };
  }, [currentAssignee, workspaceMembers]);

  return (     
    //   <DropdownMenuContent align="start" className="w-64">
        <div className="p-2">
          

          {/* Member list */}
          <div className="max-h-64 overflow-y-auto">
            {availableMembers.map((member) => (
              <DropdownMenuItem
                key={member.userId}
                onClick={() => {
                  onAssigneeChange(member.userId);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 p-2 cursor-pointer text-xs"
              >
                {member.profilePictureUrl ? (
                  <Image
                    src={member.profilePictureUrl}
                    alt={member.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex flex-col">
                  <span className="text-xs font-medium">{member.name}</span>
                  <span className="text-xs text-muted-foreground">{member.role}</span>
                </div>

                {currentAssignee === member.userId && (
                  <CheckCheck className="h-4 w-4 ml-auto text-blue-600" />
                )}
              </DropdownMenuItem>
            ))}
          </div>

          {availableMembers.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No members available
            </div>
          )}
        </div>
    //   </DropdownMenuContent>
  );
};

export default AssigneeDropdown;
