'use client';

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, MoreHorizontal, PanelsTopLeft, Plus, Target } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import InviteTeamMembersDialog from "./InviteTeamMembersDialog";
import MemberDetailsModal from "./MemberDetailsModal";
import { useTeamStore } from "@/stores/teams-store";
import { useTasksStore } from "@/stores/tasks-store";
import { useProjectsStore } from "@/stores/projects-store";
import { QuickTaskCreation } from "@/components/projects/QuickTaskCreation";
// import { TeamMember } from "@/types/teams.types";
import { DataTable } from "../layout/DataTable";
import { teamsApi } from '@/lib/api/teams.api'
import ConfirmationModal from "@/components/ConfirmationModal";
import { DataTableForTeams } from "./DataTableForTeams";
import { toast } from "@/components/ui/sonner";
import { Loader } from "../Loader";

import { getAvatarColor, getInitials } from "@/utils/avatar-utils";

export default function TeamMembersPage({ teamMembers }: { teamMembers: any }) {
  const {
    teams,
    removeMember,
    fetchTeamById,
    loading: teamLoading
  } = useTeamStore();
  const { projects, fetchProjects, isLoading: projectsLoading } = useProjectsStore();
  const router = useRouter();

  const [openInvite, setOpenInvite] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { addTask } = useTasksStore();

  const teamId = teamMembers?.id

  const team = useTeamStore(state => state.teams.find(t => t.id === teamId) || null);
  const members = team?.teamMembers ?? [];

  const getTeamName = (team: any): string => {
    return team?.name || team?.teamName || "";
  };

  const tableMembers = React.useMemo(() => {
    const teamProjectIds = new Set(team?.projectIds || []);

    return members.map(m => {
      const userId = m.userId || m.id;
      // Find projects where this user is a member AND the project belongs to this team
      const userProjects = projects
        .filter(p => teamProjectIds.has(p.id!) && p.members?.some(pm => pm.userId === userId))
        .map(p => p.name);

      return {
        id: userId,
        name: m.name || "Unknown User",
        email: m.email || "",
        role: m.role || "Member",
        status: "Active",
        project: userProjects.length > 0 ? userProjects.join(", ") : "-",
        avatar: m.profilePictureUrl || m.avatar,
      };
    });
  }, [members, projects, team?.projectIds]);

  // Define columns for DataTable
  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Members",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar
              className="cursor-pointer"
              onClick={() => {
                setSelectedMember(member);
                setOpenModal(true);
              }}
            >
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback className={`${getAvatarColor(member.id)} text-white`}>
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium text-foreground text-sm">
                {member.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {member.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className="text-center">
            <span className={`text-sm ${status === 'Active'
              ? 'text-foreground font-medium'
              : 'text-muted-foreground'
              }`}>
              {status}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "project",
      header: () => <div className="text-center">Projects</div>,
      cell: ({ row }) => (
        <div className="text-center text-foreground text-sm">
          {row.getValue("project")}
        </div>
      ),
      filterFn: (row, id, value) => {
        if (!value) return true;
        const projectValue = row.getValue(id) as string;
        if (!projectValue) return false;
        return projectValue.toLowerCase().includes(String(value).toLowerCase());
      },
    },
    {
      accessorKey: "role",
      header: () => <div className="text-center">Role</div>,
      cell: ({ row }) => (
        <div className="text-center text-foreground text-sm">
          {row.getValue("role")}
        </div>
      ),
    },
    {
      id: "teams",
      header: () => <div className="text-center">Teams associated with</div>,
      cell: ({ row }) => (
        <div className="text-center text-muted-foreground text-sm">
          {/* Add teams data when available */}
          -
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex items-center justify-center cursor-pointer"
                >
                  <MoreHorizontal size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent align="end" className="border-0 border-b-[5px] border-primary rounded-lg bg-popover text-popover-foreground">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedMember(member);
                      setOpenModal(true);
                    }}
                  >
                    View Member Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={member.project === "-"}
                    onClick={() => {
                      const firstProject = team?.projects?.[0];
                      if (!firstProject) {
                        toast("warning", {
                          title: "No Project Found",
                          description: "Please create a project for this team before creating a task.",
                          primaryAction: {
                            label: "CREATE PROJECT",
                            onClick: () => router.push(`/teams/${teamId}/create-project`),
                          },
                          secondaryAction: {
                            label: "CLOSE",
                            onClick: () => { },
                          },
                        });

                        return;
                      }
                      setSelectedProjectId('');
                      setSelectedMember(member);
                      setIsQuickTaskOpen(true);
                    }}
                  >
                    Create a task
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      setMemberToRemove(member);
                      setConfirmOpen(true);
                    }}
                  >
                    Remove Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], []);

  const isInitialLoading = teamLoading || projectsLoading;

  if (isInitialLoading) {
    return (
      <div className="flex h-120 w-full items-center justify-center">
        <Loader message="Loading team members..." size="md" />
      </div>
    );
  }

  const handleConfirmRemove = async () => {
    if (!teamId || !memberToRemove || isRemoving) return;

    const removedMember = memberToRemove; // preserve before clearing modal state
    setIsRemoving(true);

    try {
      await removeMember(teamId, removedMember.id);

      setConfirmOpen(false);
      setMemberToRemove(null);

      toast("success", {
        title: "Member Removed",
        description: `${removedMember.email} has been removed successfully.`,
        primaryAction: {
          label: "UNDO",
          onClick: async () => {
            try {
              await useTeamStore.getState().addMember(
                teamId,
                [
                  {
                    userId: removedMember.id,
                    role: removedMember.role || "member",
                  },
                ],
                [
                  {
                    id: removedMember.id,
                    userId: removedMember.id,
                    name: removedMember.name,
                    email: removedMember.email,
                    role: removedMember.role || "member",
                    profilePicture: removedMember.avatar ?? null,
                    profilePictureUrl: removedMember.avatar ?? null,
                    avatar: removedMember.avatar,
                    initials: getInitials(removedMember.name),
                    username: removedMember.name
                      ? removedMember.name.split(" ")[0].toLowerCase()
                      : "",
                    selected: false,
                  },
                ]
              );

              toast("success", {
                title: "Member Restored",
                description: `${removedMember.email} has been added back.`,
              });
            } catch (error) {
              toast("error", {
                title: "Undo Failed",
                description: "Could not restore the member.",
              });
            }
          },
        },
        secondaryAction: {
          label: "CLOSE",
          onClick: () => { },
        },
      });
    } catch (error) {
      console.error("Failed to remove member:", error);

      toast("error", {
        title: "Failed to Remove Member",
        description: "Something went wrong. Please try again.",
        primaryAction: {
          label: "RETRY",
          onClick: handleConfirmRemove,
        },
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      await addTask({
        ...taskData,
        startDate: taskData.startDate.toISOString(),
      });

      toast("success", {
        title: "Task Created Successfully",
        description: `${taskData.title || "New task"} has been added.`,
        primaryAction: {
          label: "VIEW TASK",
          onClick: () => {
            console.log("Open task details");
          },
        },
        secondaryAction: {
          label: "CLOSE",
          onClick: () => { },
        },
      });

      setIsQuickTaskOpen(false);

    } catch (error) {
      console.error("Failed to create task:", error);

      toast("error", {
        title: "Failed to Create Task",
        description: "Something went wrong while creating the task.",
        primaryAction: {
          label: "RETRY",
          onClick: () => handleCreateTask(taskData),
        },
      });
    }
  };

  // const handleMembersUpdate = async () => {
  //   await fetchTeam(); // refresh members immediately after dialog success
  // };



  return (
    <div className="w-full h-full bg-background overflow-y-auto">
      {/* Main Content with DataTable */}
      <div className="px-3 py-2 mr-1">
        <DataTableForTeams
          columns={columns}
          data={tableMembers}
          searchPlaceholder="Search members..."
          enableGlobalFilter
          enableColumnFilter
          filterColumn="status"
          filterOptions={[
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
          ]}
          toolbarLeft={
            <Popover>
              <PopoverTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-0 py-2 rounded-md flex items-center text-sm cursor-pointer">
                  <Plus />
                  Create
                  <span className="h-4 w-px bg-white/30 ml-1" />
                  <ChevronDown size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-35 p-2 border-b-5 border-b-primary rounded-b-lg bg-popover text-popover-foreground" align="start">
                <button className="flex items-center gap-2 w-full text-left px-1 py-2 text-sm text-foreground hover:bg-muted rounded transition-colors cursor-pointer">
                  <LayoutDashboard className="h-4 w-4" />
                  Portfolio
                </button>

                <button
                  className="flex items-center gap-2 w-full text-left px-1 py-2 text-sm text-foreground hover:bg-muted rounded transition-colors cursor-pointer"
                  onClick={() => router.push(`/teams/${teamId}/create-project`)}
                >
                  <PanelsTopLeft className="h-4 w-4" />
                  Project
                </button>

                <button
                  className="flex items-center gap-2 w-full text-left px-1 py-2 text-foreground text-sm hover:bg-muted rounded transition-colors cursor-pointer"
                  onClick={() => router.push(`/teams/${teamId}/create-goal`)}
                >
                  <Target className="h-4 w-4" />
                  Goals
                </button>
              </PopoverContent>
            </Popover>
          }
          toolbarActions={
            <Button
              onClick={() => setOpenInvite(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              <span className="text-lg mr-2">+</span>
              Add Member
            </Button>
          }
        />
      </div>

      <InviteTeamMembersDialog
        open={openInvite}
        onClose={() => setOpenInvite(false)}
        teamName={getTeamName(team) || 'Team'}
        teamID={teamId}
        existingMembers={members}
      />

      <MemberDetailsModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        member={selectedMember}
      />

      <ConfirmationModal
        open={confirmOpen}
        onClose={() => {
          if (isRemoving) return;
          setConfirmOpen(false);
          setMemberToRemove(null);
        }}
        title={
          memberToRemove
            // ? `Are you sure you want to remove ${memberToRemove.name} (${memberToRemove.email})?`
            ? `Are you sure you want to remove ${memberToRemove.email}?`
            : 'Are you sure you want to remove this member?'
        }
        // confirmLabel={isRemoving ? "Removing..." : "Delete member"}
        confirmLabel="Remove member"
        description={
          memberToRemove?.email
            ? `${memberToRemove.email} will be removed from this team and its projects. To remove their access to the entire sliceflo.com organization, contact your admin.`
            : 'This member will be removed from this team and its projects.'
        }
        onConfirm={handleConfirmRemove}
        loading={isRemoving}
      />

      {isQuickTaskOpen && (
        <QuickTaskCreation
          open={isQuickTaskOpen}
          onClose={() => setIsQuickTaskOpen(false)}
          projectId={selectedProjectId}
          teamId={teamId}
          projectName={team?.projects?.find(p => p.id === selectedProjectId)?.name || "Project"}
          selectedDate={new Date()}
          initialAssigneeId={selectedMember?.id}
          onCreateTask={handleCreateTask}
        />
      )}
    </div>
  );
}
