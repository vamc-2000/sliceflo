"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, MoreHorizontal, ArrowUpDown, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { DataTable } from "@/components/layout/DataTable";
import { Input } from "@/components/ui/input";
import InviteMembersModal from "@/components/workspace/InviteMemberModal";
import BulkInviteDialog from "@/components/BulkInviteDialog";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useAuthStore } from "@/stores/auth-store";
import {
  getWorkspaceMembers,
  inviteWorkspaceMembers,
  removeWorkspaceMember
} from "@/lib/api/workspace-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Member {
  userId: string;
  name: string;
  email: string;
  role: "owner" | "member";
  profilePicture: string | null;
  status?: string;
  joinedAt?: string;
  invitedBy?: string;
}

export default function UserManagementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openBulkInviteDialog, setOpenBulkInviteDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get workspace and auth from Zustand stores
  const { currentWorkspace } = useWorkspaceStore();
  const { token } = useAuthStore();

  // FETCH MEMBERS - Using API function
  const fetchMembers = useCallback(async () => {
    if (!currentWorkspace?.id) {
      console.log("No current workspace available");
      return;
    }

    console.log("Fetching members for workspace:", currentWorkspace.id);
    setLoading(true);

    try {
      const data = await getWorkspaceMembers(currentWorkspace.id);

      console.log(" Response data:", data);
      const fetchedMembers = data.members || [];
      console.log(" Number of members:", fetchedMembers.length);

      setMembers(fetchedMembers);

      if (fetchedMembers.length === 0) {
        toast("success", { title: "Success", description: "No members found in this workspace" });
      } else {
        toast("success", { title: "Success", description: `Loaded ${fetchedMembers.length} members` });
      }
    } catch (error: any) {
      console.error(" Error fetching members:", error);
      toast("error", { title: "Error", description: `Failed to fetch members: ${error.response?.data?.message || error.message}` });
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  // Fetch members when workspace changes
  useEffect(() => {
    if (currentWorkspace?.id && token) {
      console.log(" Triggering fetchMembers");
      fetchMembers();
    }
  }, [currentWorkspace?.id, token, fetchMembers]);

  const handleSendInvite = async (
    data: { members: { email: string; role: string }[]; message?: string }
  ) => {
    console.log("Invite triggered with data:", data);

    if (!currentWorkspace?.id) {
      console.error("No current workspace available");
      toast("error", { title: "Error", description: "No workspace selected" });
      return;
    }

    try {
      if (!data.members.length) {
        toast("error", { title: "Error", description: "Please add at least one member to invite" });
        return;
      }

      const emails = data.members.map(m => m.email);
      console.log("Sending invites to:", emails);

      await inviteWorkspaceMembers(currentWorkspace.id, emails);

      console.log(" Invite successful");
      toast("success", { title: "Success", description: `Invitation${emails.length > 1 ? "s" : ""} sent successfully` });
      setOpenInviteDialog(false);

      await fetchMembers();
    } catch (error: any) {
      console.error(" Error sending invite:", error);
      toast("error", { title: "Error", description: `Failed to send invitation: ${error.response?.data?.message || error.message}` });
    }
  };

  const handleBulkInvite = async (
    inviteData: Array<{ email: string; name?: string; role?: string }>
  ) => {
    console.log("Bulk invite triggered with data:", inviteData);

    if (!currentWorkspace?.id) {
      console.error(" No current workspace available");
      toast("error", { title: "Error", description: "No workspace selected" });
      throw new Error("No workspace selected");
    }

    try {
      const emails = inviteData.map((item) => item.email);
      console.log(" Bulk sending invites to:", emails);

      await inviteWorkspaceMembers(currentWorkspace.id, emails);

      console.log(" Bulk invite successful");
      toast("success", { title: "Success", description: `${emails.length} invitation(s) sent successfully` });
      setOpenBulkInviteDialog(false);

      await fetchMembers();
    } catch (error: any) {
      console.error(" Error in bulk invite:", error);
      toast("error", { title: "Error", description: `Failed to send bulk invitations: ${error.response?.data?.message || error.message}` });
      throw error;
    }
  };

  const handleDeleteUser = async () => {
    if (!currentUserId || !currentWorkspace?.id) {
      console.error(" Missing userId or workspaceId");
      return;
    }

    console.log(
      "Deleting user:",
      currentUserId,
      "from workspace:",
      currentWorkspace.id
    );

    try {

      await removeWorkspaceMember(currentWorkspace.id, [currentUserId]);

      console.log(" Member deleted successfully");
      setMembers(members.filter((member) => member.userId !== currentUserId));
      toast("success", { title: "Success", description: "Member removed successfully" });
    } catch (error: any) {
      console.error(" Error deleting member:", error);
      toast("error", { title: "Error", description: `Failed to remove member: ${error.response?.data?.message || error.message}` });
    } finally {
      setOpenDeleteDialog(false);
    }
  };


  // User actions menu component
  const UserActionsMenu = ({ member }: { member: Member }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => toast("success", { title: "Success", description: "Activation email sent" })}>
          Send activation email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast("info", { title: "Info", description: "Edit email functionality coming soon" })}>
          Edit email
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setMembers(
              members.map((m) =>
                m.userId === member.userId
                  ? { ...m, status: "inactive" as "active" | "inactive" }
                  : m
              )
            );
            toast("success", { title: "Success", description: "User deactivated" });
          }}
        >
          Deactivate User
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive font-medium"
          onClick={() => {
            setCurrentUserId(member.userId);
            setOpenDeleteDialog(true);
          }}
        >
          Delete user
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => toast("success", { title: "Success", description: "2FA reset" })}>
          Reset two-factor Authentication
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Define columns
  const columns: ColumnDef<Member>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) =>
            table.toggleAllPageRowsSelected(!!e.target.checked)
          }
          className="h-4 w-4 rounded border-border"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="h-4 w-4 rounded border-border"
          disabled={row.original.role === "owner"}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.profilePicture ? (
            <img
              src={row.original.profilePicture}
              alt={row.original.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground">
                {(row.original.name || row.original.email || "?").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = (row.getValue("role") as string) || "member";
        return (
          <Badge
            variant={role === "owner" ? "default" : "secondary"}
            className={
              role === "owner"
                ? "bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none"
                : "bg-muted text-muted-foreground border-none shadow-none"
            }
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "Joined";
        const isInvited = status.toLowerCase() === "invited";
        return (
          <Badge
            variant="outline"
            className={
              isInvited
                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-none"
                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "joinedAt",
      header: "Joined",
      cell: ({ row }) => {
        const date = row.original.joinedAt;
        if (!date) return <span className="text-muted-foreground">-</span>;
        try {
          return (
            <span className="text-muted-foreground text-[13px]">
              {format(new Date(date), "MMM dd, yyyy")}
            </span>
          );
        } catch (e) {
          return <span className="text-muted-foreground text-[13px]">{date}</span>;
        }
      },
    },
    {
      accessorKey: "invitedBy",
      header: "Invited By",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-[13px]">
          {row.original.invitedBy || "System"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "+",
      cell: ({ row }) => <UserActionsMenu member={row.original} />,
    },
  ];

  const filteredMembers = members.filter(
    (member) =>
      (member.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (member.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  // Show message if no workspace is selected
  if (!currentWorkspace) {
    return (
      <div className="w-full p-4">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <p className="text-yellow-800">
            No workspace selected. Please select a workspace first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Workspace Members
        </h2>
        <p className="text-xs text-muted-foreground">
          Manage members for workspace: <strong>{currentWorkspace.name}</strong>
        </p>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredMembers}
        searchPlaceholder="Search by name or email"
        enableGlobalFilter={true}
        onRowSelectionChange={setSelectedMembers}
        emptyMessage={loading ? "Loading members..." : "No members found."}
        leftActions={
          <div className="flex items-center pl-2 border-l border-border h-4 ml-2">
            <p className="text-[12px] font-medium text-muted-foreground whitespace-nowrap">
              Showing: <span className="text-foreground font-semibold">{filteredMembers.length}</span> members
            </p>
          </div>
        }
        toolbarActions={
          <>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 h-8 text-primary-foreground"
              onClick={() => setOpenInviteDialog(true)}
            >
              Invite
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-border text-foreground hover:bg-muted"
              onClick={() => setOpenBulkInviteDialog(true)}
            >
              Bulk Invite
            </Button>
          </>
        }
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        title="Delete User"
        description="Are you sure you want to remove this user? Deleting user's account will lose all user's data, progress, files and team projects."
        confirmLabel="Delete User"
        onConfirm={handleDeleteUser}
        loading={loading}
        loadingLabel="Deleting..."
        confirmClassName="bg-logout-button hover:bg-logout-button/90 border-none shadow-none text-white font-semibold"
      />

      {/* Invite Dialog */}
      <InviteMembersModal
        open={openInviteDialog}
        onClose={() => setOpenInviteDialog(false)}
        onInviteData={handleSendInvite}
        existingMembers={[]}
      />

      {/* Bulk Invite Dialog */}
      <BulkInviteDialog
        open={openBulkInviteDialog}
        onClose={() => setOpenBulkInviteDialog(false)}
        onBulkInvite={handleBulkInvite}
      />
    </div>
  );
}
